import { SIDES, TYPES, TYPE_NAMES, indexToDisplay, isInCheck } from "./engine.js";

export const CPU_DIALOGUE = Object.freeze({
  common:Object.freeze({
    anxious:Object.freeze([]),
    underCheck:Object.freeze([])
  }),
  characters:Object.freeze({
    "28":Object.freeze({anxious:Object.freeze(["ご容赦を"]),underCheck:Object.freeze(["そうなりますか…","おやおや……","だめですよ","通せませんね"])}),
    cha:Object.freeze({anxious:Object.freeze(["やるな、君…"]),underCheck:Object.freeze(["冗談ではない…","そうはさせん","しつこい男だ","まだ終わらんよ"])}),
    siro:Object.freeze({anxious:Object.freeze([]),underCheck:Object.freeze([])}),
    qwa:Object.freeze({anxious:Object.freeze([]),underCheck:Object.freeze([])})
  })
});

const linesFor=(opponentId,key)=>{
  const characterLines=CPU_DIALOGUE.characters[opponentId]?.[key];
  return characterLines?.length?characterLines:CPU_DIALOGUE.common[key];
};
const pick=(lines,random)=>lines[Math.min(lines.length-1,Math.floor(random()*lines.length))];
const movingPiece=(state,move)=>move.kind==="drop"?state.hands[state.turn][move.handIndex]:state.board[move.from.row]?.[move.from.col];
const capturedPiece=(state,move)=>{
  if(move.kind!=="move")return null;
  const row=move.enPassant?move.from.row:move.to.row;
  return state.board[row]?.[move.to.col]??null;
};

// 「前へ」は陣営の前進方向へ行番号が進んだ移動。斜め前進も含み、横移動・後退・持ち駒配置は含めない。
export function isForwardMove(move,side){
  if(move.kind!=="move")return false;
  const delta=move.to.row-move.from.row;
  return side===SIDES.BLACK?delta>0:delta<0;
}

export function selectCpuMoveDialogue({before,move,opponentId,anxiousPending=false,random=Math.random}){
  const piece=movingPiece(before,move),pieceName=TYPE_NAMES[piece?.type]??"駒",destination=indexToDisplay(move.to.row,move.to.col);
  if(capturedPiece(before,move)?.type===TYPES.COMMANDER)return{kind:"commanderCapture",text:`${pieceName}、${destination}、司令を破壊`,consumedAnxious:false};
  if(before.turn===SIDES.BLACK&&isInCheck(before,SIDES.BLACK))return{kind:"underCheck",text:pick(linesFor(opponentId,"underCheck"),random),consumedAnxious:false};
  if(anxiousPending)return{kind:"anxious",text:pick(linesFor(opponentId,"anxious"),random),consumedAnxious:true};
  if(isForwardMove(move,SIDES.BLACK)&&random()<.5)return{kind:"forward",text:`${pieceName}、前へ`,consumedAnxious:false};
  return{kind:"move",text:`${pieceName}、${destination}`,consumedAnxious:false};
}
