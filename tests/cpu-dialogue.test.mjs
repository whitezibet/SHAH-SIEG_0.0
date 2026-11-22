import test from "node:test";
import assert from "node:assert/strict";
import { SIDES, TYPES, __testing, displayToIndex } from "../js/engine.js";
import { isForwardMove, selectCpuMoveDialogue } from "../js/cpu-dialogue.js";

const emptyState=()=>({board:Array.from({length:10},()=>Array(10).fill(null)),hands:{white:[],black:[]},turn:SIDES.BLACK,enPassant:null,plyCount:0,status:{kind:"playing",winner:null,message:""}});
const put=(state,coord,type,side)=>{const {row,col}=displayToIndex(coord);state.board[row][col]=__testing.makePiece(type,side,`${side}-${type}-${coord}`);};
const move=(from,to)=>({kind:"move",from:displayToIndex(from),to:displayToIndex(to),capture:false,enPassant:false});

test("CPU通常移動は駒名と移動先座標を表示する",()=>{
  const state=emptyState();put(state,"E8",TYPES.LIGHT_CRUISER,SIDES.BLACK);
  const line=selectCpuMoveDialogue({before:state,move:move("E8","F8"),opponentId:"cha",random:()=>.9});
  assert.deepEqual(line,{kind:"move",text:"軽巡、F8",consumedAnxious:false});
});

test("CPUから見た前進は斜めも含み、後退と横移動を含まない",()=>{
  assert.equal(isForwardMove(move("E8","E7"),SIDES.BLACK),true);
  assert.equal(isForwardMove(move("E8","F7"),SIDES.BLACK),true);
  assert.equal(isForwardMove(move("E8","F8"),SIDES.BLACK),false);
  assert.equal(isForwardMove(move("E8","E9"),SIDES.BLACK),false);
  const state=emptyState();put(state,"E8",TYPES.LIGHT_CRUISER,SIDES.BLACK);
  assert.equal(selectCpuMoveDialogue({before:state,move:move("E8","E7"),opponentId:"cha",random:()=>0}).text,"軽巡、前へ");
});

test("司令破壊台詞は王手対応と焦り台詞より優先される",()=>{
  const state=emptyState();put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"E5",TYPES.FFH,SIDES.WHITE);put(state,"D5",TYPES.SDOG,SIDES.BLACK);put(state,"D6",TYPES.COMMANDER,SIDES.WHITE);
  const line=selectCpuMoveDialogue({before:state,move:move("D5","D6"),opponentId:"cha",anxiousPending:true,random:()=>0});
  assert.deepEqual(line,{kind:"commanderCapture",text:"S-Dog、D6、司令を破壊",consumedAnxious:false});
});

test("王手対応台詞は焦り台詞より優先される",()=>{
  const state=emptyState();put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"E5",TYPES.FFH,SIDES.WHITE);put(state,"D0",TYPES.COMMANDER,SIDES.BLACK);
  const line=selectCpuMoveDialogue({before:state,move:move("D0","D1"),opponentId:"siro",anxiousPending:true,random:()=>0});
  assert.deepEqual(line,{kind:"underCheck",text:"冗談ではない…",consumedAnxious:false});
});

test("未設定キャラクターの焦り台詞は共通台詞へフォールバックする",()=>{
  const state=emptyState();put(state,"D5",TYPES.SDOG,SIDES.BLACK);
  const line=selectCpuMoveDialogue({before:state,move:move("D5","F6"),opponentId:"28",anxiousPending:true,random:()=>0});
  assert.deepEqual(line,{kind:"anxious",text:"やるな、君…",consumedAnxious:true});
});
