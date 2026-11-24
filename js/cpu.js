import { ShahSiegGame, SIDES, TYPES, allLegalMoves, hasCommander, isInCheck, indexToDisplay, promotionChoicesForMove } from "./engine.js";

export const CPU_DIFFICULTIES = Object.freeze({
  beginner: Object.freeze({ id:"beginner", label:"入門", maxDepth:1, timeLimitMs:140, maxCandidates:24, randomness:0.82, advantageousMoveChance:0.20, capturePriority:0.30, checkPriority:0.18 }),
  intermediate: Object.freeze({ id:"intermediate", label:"中級", maxDepth:2, timeLimitMs:700, maxCandidates:16, randomness:0.08 }),
  advanced: Object.freeze({ id:"advanced", label:"上級", maxDepth:3, timeLimitMs:1400, maxCandidates:8, randomness:0 })
});

export const PIECE_VALUES = Object.freeze({
  [TYPES.UAV]:110, [TYPES.WRK]:285, [TYPES.COMMANDER]:420, [TYPES.BM]:390,
  [TYPES.SDOG]:430, [TYPES.LIGHT_CRUISER]:500, [TYPES.CARRIER]:540,
  [TYPES.HEAVY_CRUISER]:575, [TYPES.FFH]:620, [TYPES.BATTLESHIP]:760,
  [TYPES.ARMORED]:850, [TYPES.KING]:100000
});

const other = side => side === SIDES.WHITE ? SIDES.BLACK : SIDES.WHITE;
export function expandLegalCandidates(state) {
  const candidates=allLegalMoves(state).flatMap(move => {
    const choices=promotionChoicesForMove(state,move);
    return choices.length
      ? choices.map(promotionChoice=>({move,promotionChoice,promotionDecision:true}))
      : [{move,promotionChoice:null,promotionDecision:false}];
  });
  return candidates.filter(candidate=>{if(!candidate.promotionDecision)return true;try{applyCandidate(state,candidate);return true;}catch{return false;}});
}

export function applyCandidate(state, candidate) {
  const game = new ShahSiegGame(state);
  game.play(candidate.move, candidate.promotionChoice);
  return game.state;
}

const MOBILITY_WEIGHT=Object.freeze({uav:2,wrk:4,heavyCruiser:7,ffh:8,bm:5,sdog:6,lightCruiser:5,carrier:6,king:4,commander:4,battleship:9,armored:10});
function sideMobility(state,side){let score=0;for(let row=0;row<10;row++)for(let col=0;col<10;col++){const piece=state.board[row][col];if(piece?.side!==side||piece.obstacle)continue;score+=MOBILITY_WEIGHT[piece.type]??3;for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){const target=state.board[row+dr]?.[col+dc];if(!target||target.side!==side)score+=.5;}}const commanderPresent=hasCommander(state,side),usableHandCount=state.hands[side].filter(piece=>piece.type!==TYPES.UAV||commanderPresent).length;return score+usableHandCount*2;}

function kingShelter(state, side) {
  let king = null;
  for (let row=0;row<10;row++) for (let col=0;col<10;col++) {
    const piece=state.board[row][col]; if (piece?.side===side && piece.type===TYPES.KING) king={row,col};
  }
  if (!king) return -100000;
  let shelter=0;
  for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
    if (!dr&&!dc) continue;
    const piece=state.board[king.row+dr]?.[king.col+dc];
    if (piece?.side===side && !piece.obstacle) shelter+=18;
  }
  return shelter-(isInCheck(state,side)?700:0);
}

function wrkPotential(state, side) {
  let score=0;
  for (let row=0;row<10;row++) for (let col=0;col<10;col++) {
    const piece=state.board[row][col]; if (piece?.side!==side || piece.type!==TYPES.WRK || piece.obstacle) continue;
    score+=70;
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) if (state.board[row+dr]?.[col+dc]?.obstacle) score+=45;
  }
  return score;
}

export function evaluatePosition(state) {
  if (state.status.kind === "win") return state.status.winner===SIDES.BLACK ? 10000000-state.plyCount : -10000000+state.plyCount;
  if (state.status.kind === "draw") return 0;
  let score=0;
  const sign=side=>side===SIDES.BLACK?1:-1;
  for (const row of state.board) for (const piece of row) if (piece) {
    const s=sign(piece.side),base=PIECE_VALUES[piece.type]??100;
    if (piece.obstacle) score-=s*75;
    else score+=s*(base+(piece.promoted?95:0));
    if (piece.type===TYPES.COMMANDER&&!piece.obstacle) score+=s*330;
    if (piece.type===TYPES.UAV&&!piece.obstacle) score+=s*35;
  }
  for (const side of [SIDES.BLACK,SIDES.WHITE]) for (const piece of state.hands[side]) score+=sign(side)*(PIECE_VALUES[piece.type]??100)*.76;
  score+=kingShelter(state,SIDES.BLACK)-kingShelter(state,SIDES.WHITE);
  score+=(sideMobility(state,SIDES.BLACK)-sideMobility(state,SIDES.WHITE))*3;
  score+=wrkPotential(state,SIDES.BLACK)-wrkPotential(state,SIDES.WHITE);
  return Math.round(score);
}

function movePriority(state, candidate) {
  const {move,promotionChoice}=candidate;
  let score=promotionChoice ? 900+(PIECE_VALUES[promotionChoice]??0) : 0;
  if (move.capture) {
    const target=move.enPassant ? state.board[move.from.row]?.[move.to.col] : state.board[move.to.row]?.[move.to.col];
    score+=1200+(PIECE_VALUES[target?.type]??100);
  }
  if (move.removal) score+=500;
  if (move.kind==="drop") score+=(PIECE_VALUES[move.pieceType]??100)*.15;
  return score;
}

function orderedCandidates(state, limit) {
  return expandLegalCandidates(state).sort((a,b)=>movePriority(state,b)-movePriority(state,a)).slice(0,limit);
}

function chooseBeginnerCandidate(state, settings, context) {
  const random=typeof settings.randomSource==="function"?settings.randomSource:Math.random;
  const legal=expandLegalCandidates(state);
  if(!legal.length)return null;
  const shuffled=legal.map(candidate=>({candidate,key:random()})).sort((a,b)=>a.key-b.key).slice(0,settings.maxCandidates).map(item=>item.candidate);
  const ranked=shuffled.map(candidate=>{const next=applyCandidate(state,candidate),positionScore=evaluatePosition(next),advantage=state.turn===SIDES.BLACK?positionScore:-positionScore,givesCheck=next.status.kind==="win"||isInCheck(next,next.turn);let tactical=0;if(candidate.move.capture)tactical+=settings.capturePriority;if(givesCheck)tactical+=settings.checkPriority;if(candidate.promotionChoice)tactical+=0.12;return{candidate,score:positionScore,advantage,tactical};});
  context.nodes+=ranked.length;
  ranked.sort((a,b)=>(b.advantage+b.tactical*500)-(a.advantage+a.tactical*500));
  if(random()<settings.advantageousMoveChance)return ranked[0];
  const floor=Math.min(...ranked.map(item=>item.advantage)),randomness=Math.max(0,Math.min(1,settings.randomness));
  const weighted=ranked.map(item=>({item,weight:1+(1-randomness)*Math.max(0,(item.advantage-floor)/180)+item.tactical*(1-randomness)*2}));
  const total=weighted.reduce((sum,entry)=>sum+entry.weight,0);let roll=random()*total;
  for(const entry of weighted){roll-=entry.weight;if(roll<=0)return entry.item;}
  return weighted.at(-1).item;
}

const TIMEOUT = Symbol("cpu-timeout");
function search(state, depth, alpha, beta, context) {
  if (performance.now()>=context.deadline) throw TIMEOUT;
  context.nodes+=1;
  if (depth<=0 || state.status.kind!=="playing") return evaluatePosition(state);
  const candidates=orderedCandidates(state,context.maxCandidates);
  if (!candidates.length) return evaluatePosition(state);
  if (state.turn===SIDES.BLACK) {
    let best=-Infinity;
    for (const candidate of candidates) { best=Math.max(best,search(applyCandidate(state,candidate),depth-1,alpha,beta,context));alpha=Math.max(alpha,best);if(beta<=alpha)break; }
    return best;
  }
  let best=Infinity;
  for (const candidate of candidates) { best=Math.min(best,search(applyCandidate(state,candidate),depth-1,alpha,beta,context));beta=Math.min(beta,best);if(beta<=alpha)break; }
  return best;
}

function searchRoot(state, depth, context) {
  const candidates=orderedCandidates(state,context.maxCandidates);
  let best=null,bestScore=state.turn===SIDES.BLACK?-Infinity:Infinity;
  for (const candidate of candidates) {
    if (performance.now()>=context.deadline) throw TIMEOUT;
    const score=search(applyCandidate(state,candidate),depth-1,-Infinity,Infinity,context);
    if ((state.turn===SIDES.BLACK&&score>bestScore)||(state.turn===SIDES.WHITE&&score<bestScore)){best=candidate;bestScore=score;}
  }
  return {candidate:best,score:bestScore};
}

export function chooseCpuMove(state, difficulty="beginner", overrides={}) {
  const base=CPU_DIFFICULTIES[difficulty]??CPU_DIFFICULTIES.beginner,settings={...base,...overrides};
  const started=performance.now(),context={deadline:started+settings.timeLimitMs,nodes:0,maxCandidates:settings.maxCandidates};
  const all=difficulty==="beginner"?expandLegalCandidates(state):orderedCandidates(state,settings.maxCandidates);
  if (!all.length) return {candidate:null,score:evaluatePosition(state),nodes:0,elapsedMs:performance.now()-started,depth:0,difficulty:settings.id};
  let completed={candidate:all[0],score:evaluatePosition(applyCandidate(state,all[0]))},completedDepth=0;
  try {
    if (difficulty==="beginner") {
      completed=chooseBeginnerCandidate(state,settings,context);completedDepth=1;
    } else {
      for (let depth=1;depth<=settings.maxDepth;depth++){const result=searchRoot(state,depth,context);if(result.candidate){completed=result;completedDepth=depth;}}
    }
  } catch (error) { if (error!==TIMEOUT) throw error; }
  return {candidate:completed.candidate,score:completed.score,nodes:context.nodes,elapsedMs:performance.now()-started,depth:completedDepth,difficulty:settings.id};
}

export function formatCandidate(candidate) {
  if (!candidate) return "着手なし";
  const {move,promotionChoice}=candidate;
  const body=move.kind==="drop" ? `持ち駒→${indexToDisplay(move.to.row,move.to.col)}` : `${indexToDisplay(move.from.row,move.from.col)}→${indexToDisplay(move.to.row,move.to.col)}`;
  return `${body}${promotionChoice?` 昇格:${promotionChoice}`:candidate.promotionDecision?" 不成":""}${move.enPassant?" EP":""}${move.removal?" 撤去":""}`;
}

export function sameCandidate(a,b) {
  if (!a||!b||a.promotionChoice!==b.promotionChoice||a.move.kind!==b.move.kind) return false;
  if (a.move.to.row!==b.move.to.row||a.move.to.col!==b.move.to.col) return false;
  return a.move.kind==="drop" ? a.move.handIndex===b.move.handIndex : a.move.from.row===b.move.from.row&&a.move.from.col===b.move.from.col;
}

export class CpuExpressionTracker {
  constructor({enter=-650,exit=-300}={}){this.enter=enter;this.exit=exit;this.state="normal";}
  update(score){if(this.state==="normal"&&score<=this.enter)this.state="disadvantaged";else if(this.state==="disadvantaged"&&score>=this.exit)this.state="normal";return this.state;}
  reset(){this.state="normal";return this.state;}
}
