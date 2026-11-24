import test from "node:test";
import assert from "node:assert/strict";
import { ShahSiegGame, SIDES, TYPES, createInitialState, displayToIndex, isInCheck, __testing } from "../js/engine.js";
import { CPU_DIFFICULTIES, CpuExpressionTracker, applyCandidate, chooseCpuMove, evaluatePosition, expandLegalCandidates, sameCandidate } from "../js/cpu.js";

const emptyState=()=>({board:Array.from({length:10},()=>Array(10).fill(null)),hands:{white:[],black:[]},turn:SIDES.BLACK,enPassant:null,plyCount:0,status:{kind:"playing",winner:null,message:""}});
const put=(state,coord,type,side,extra={})=>{const {row,col}=displayToIndex(coord);state.board[row][col]=__testing.makePiece(type,side,`${side}-${type}-${coord}`,extra);};

test("3難易度が異なる探索設定を持つ",()=>{
  assert.equal(CPU_DIFFICULTIES.beginner.maxDepth,1);
  assert.equal(CPU_DIFFICULTIES.beginner.randomness,.82);
  assert.equal(CPU_DIFFICULTIES.beginner.advantageousMoveChance,.20);
  assert.equal(CPU_DIFFICULTIES.beginner.capturePriority,.30);
  assert.equal(CPU_DIFFICULTIES.beginner.checkPriority,.18);
  assert.deepEqual({maxDepth:CPU_DIFFICULTIES.intermediate.maxDepth,timeLimitMs:CPU_DIFFICULTIES.intermediate.timeLimitMs,maxCandidates:CPU_DIFFICULTIES.intermediate.maxCandidates,randomness:CPU_DIFFICULTIES.intermediate.randomness},{maxDepth:2,timeLimitMs:700,maxCandidates:16,randomness:.08});
  assert.deepEqual({maxDepth:CPU_DIFFICULTIES.advanced.maxDepth,timeLimitMs:CPU_DIFFICULTIES.advanced.timeLimitMs,maxCandidates:CPU_DIFFICULTIES.advanced.maxCandidates,randomness:CPU_DIFFICULTIES.advanced.randomness},{maxDepth:3,timeLimitMs:1400,maxCandidates:8,randomness:0});
  assert(CPU_DIFFICULTIES.intermediate.maxDepth>CPU_DIFFICULTIES.beginner.maxDepth);
  assert(CPU_DIFFICULTIES.advanced.maxDepth>CPU_DIFFICULTIES.intermediate.maxDepth);
  assert(CPU_DIFFICULTIES.advanced.timeLimitMs>CPU_DIFFICULTIES.intermediate.timeLimitMs);
});

test("上級探索は応答時間内に深度3へ到達できる",()=>{
  const state=createInitialState();state.turn=SIDES.BLACK;
  const result=chooseCpuMove(state,"advanced",{timeLimitMs:1000,maxCandidates:6});
  assert.equal(result.depth,3);assert(result.elapsedMs<=1100);
});

test("CPUは既存エンジンで適用可能な合法手を返す",()=>{
  const state=createInitialState();state.turn=SIDES.BLACK;
  for(const difficulty of ["beginner","intermediate","advanced"]){
    const result=chooseCpuMove(state,difficulty,{timeLimitMs:Math.min(250,CPU_DIFFICULTIES[difficulty].timeLimitMs)});
    assert(result.candidate);assert.doesNotThrow(()=>applyCandidate(state,result.candidate));
  }
});

test("候補生成は持ち駒再配置とUAV昇格先を含む",()=>{
  const state=emptyState();put(state,"E1",TYPES.KING,SIDES.WHITE);put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"F0",TYPES.COMMANDER,SIDES.BLACK);put(state,"A2",TYPES.UAV,SIDES.BLACK);state.hands.black.push(__testing.makePiece(TYPES.BM,SIDES.BLACK,"hand"));
  const candidates=expandLegalCandidates(state);
  assert(candidates.some(c=>c.move.kind==="drop"));
  const promotions=candidates.filter(c=>c.move.kind==="move"&&c.move.from.row===displayToIndex("A2").row&&c.move.to.row===displayToIndex("A1").row);
  const excluded=new Set([TYPES.UAV,TYPES.KING,TYPES.BATTLESHIP,TYPES.ARMORED]);
  assert.deepEqual(new Set(promotions.map(c=>c.promotionChoice)),new Set(Object.values(TYPES).filter(type=>!excluded.has(type))));
  assert(!promotions.some(candidate=>candidate.promotionChoice===null));
});

test("CPUは司令喪失後もUAV以外を再配置でき、UAVは再配置しない",()=>{
  const state=emptyState();put(state,"E1",TYPES.KING,SIDES.WHITE);put(state,"E0",TYPES.KING,SIDES.BLACK);state.hands.black.push(__testing.makePiece(TYPES.UAV,SIDES.BLACK,"hand-uav"),__testing.makePiece(TYPES.BM,SIDES.BLACK,"hand-bm"));
  const drops=expandLegalCandidates(state).filter(candidate=>candidate.move.kind==="drop");
  assert(drops.some(candidate=>candidate.move.pieceType===TYPES.BM));assert(!drops.some(candidate=>candidate.move.pieceType===TYPES.UAV));
});

test("CPU探索内でも司令再配置により石化UAVが再稼働する",()=>{
  const state=emptyState();put(state,"E1",TYPES.KING,SIDES.WHITE);put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"A8",TYPES.UAV,SIDES.BLACK,{obstacle:true,moved:true});state.hands.black.push(__testing.makePiece(TYPES.COMMANDER,SIDES.BLACK,"hand-commander"));
  const candidate=expandLegalCandidates(state).find(item=>item.move.kind==="drop"&&item.move.pieceType===TYPES.COMMANDER);assert(candidate);const next=applyCandidate(state,candidate),uav=next.board[displayToIndex("A8").row][displayToIndex("A8").col];assert.equal(uav.obstacle,false);assert.equal(uav.moved,true);
});

test("CPU候補は軽巡の空母成りと不成を別々に評価する",()=>{const state=emptyState();put(state,"A0",TYPES.KING,SIDES.WHITE);put(state,"J1",TYPES.KING,SIDES.BLACK);put(state,"E2",TYPES.LIGHT_CRUISER,SIDES.BLACK);const from=displayToIndex("E2"),to=displayToIndex("E1"),candidates=expandLegalCandidates(state).filter(c=>c.move.kind==="move"&&c.move.from.row===from.row&&c.move.from.col===from.col&&c.move.to.row===to.row&&c.move.to.col===to.col);assert.deepEqual(new Set(candidates.map(c=>c.promotionChoice)),new Set([null,TYPES.CARRIER]));const promoted=applyCandidate(state,candidates.find(c=>c.promotionChoice===TYPES.CARRIER)).board[to.row][to.col];const declined=applyCandidate(state,candidates.find(c=>c.promotionChoice===null)).board[to.row][to.col];assert.equal(promoted.type,TYPES.CARRIER);assert.equal(declined.type,TYPES.LIGHT_CRUISER);});
test("CPU候補のS-Dogは空母成りと不成を含み重巡成りを含まない",()=>{const state=emptyState();put(state,"A0",TYPES.KING,SIDES.WHITE);put(state,"J1",TYPES.KING,SIDES.BLACK);put(state,"E2",TYPES.SDOG,SIDES.BLACK);const from=displayToIndex("E2"),to=displayToIndex("E1"),choices=expandLegalCandidates(state).filter(c=>c.move.from?.row===from.row&&c.move.to.row===to.row).map(c=>c.promotionChoice);assert.deepEqual(new Set(choices),new Set([null,TYPES.CARRIER]));assert(!choices.includes(TYPES.HEAVY_CRUISER));});

test("局面評価は黒軍視点で駒得を正に評価する",()=>{
  const even=createInitialState(),blackBetter=structuredClone(even);const whiteCarrier=displayToIndex("D1");blackBetter.board[whiteCarrier.row][whiteCarrier.col]=null;
  assert(evaluatePosition(blackBetter)>evaluatePosition(even));
});

test("CPUは王手中も王督を安全にする合法手を選ぶ",()=>{
  const state=emptyState();put(state,"A1",TYPES.KING,SIDES.WHITE);put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"E5",TYPES.FFH,SIDES.WHITE);
  assert.equal(isInCheck(state,SIDES.BLACK),true);
  const result=chooseCpuMove(state,"intermediate",{timeLimitMs:180,maxCandidates:10});
  assert(result.candidate);assert.equal(isInCheck(applyCandidate(state,result.candidate),SIDES.BLACK),false);
});

test("表情判定はヒステリシスで境界付近の往復を防ぐ",()=>{
  const tracker=new CpuExpressionTracker({enter:-600,exit:-250});
  assert.equal(tracker.update(-601),"disadvantaged");assert.equal(tracker.update(-400),"disadvantaged");assert.equal(tracker.update(-249),"normal");
});

test("CPU同士の2局が違法手や例外なく終局する",{timeout:30000},()=>{
  for(let gameIndex=0;gameIndex<2;gameIndex++){
    const game=new ShahSiegGame();
    while(game.state.status.kind==="playing"&&game.state.plyCount<200){
      const result=chooseCpuMove(game.state,"beginner",{timeLimitMs:10,maxCandidates:4,randomness:.4});
      assert(result.candidate);const legal=expandLegalCandidates(game.state);assert(legal.some(candidate=>sameCandidate(candidate,result.candidate)));
      assert.doesNotThrow(()=>game.play(result.candidate.move,result.candidate.promotionChoice));
    }
    assert.notEqual(game.state.status.kind,"playing");assert(game.state.plyCount<=200);
  }
});
