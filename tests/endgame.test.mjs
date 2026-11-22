import test from "node:test";
import assert from "node:assert/strict";
import { END_REASONS, ShahSiegGame, SIDES, TYPES, displayToIndex, __testing } from "../js/engine.js";
import { terminalSequence } from "../js/battle-flow.js";

const emptyState=(turn=SIDES.WHITE)=>({board:Array.from({length:10},()=>Array(10).fill(null)),hands:{white:[],black:[]},turn,enPassant:null,plyCount:0,status:{kind:"playing",winner:null,reason:null,inCheck:false,legalMoveCount:null,message:""}});
const put=(state,coord,type,side)=>{const {row,col}=displayToIndex(coord);state.board[row][col]=__testing.makePiece(type,side,`${side}-${type}-${coord}`);};
const play=(game,from,to)=>game.play({kind:"move",from:displayToIndex(from),to:displayToIndex(to)});

test("通常の王手は終局せず王手カットインだけを要求する",()=>{
  const state=emptyState();put(state,"A0",TYPES.KING,SIDES.BLACK);put(state,"B8",TYPES.KING,SIDES.WHITE);put(state,"C9",TYPES.FFH,SIDES.WHITE);
  const game=new ShahSiegGame(state);play(game,"C9","A9");
  assert.equal(game.state.status.kind,"playing");assert.equal(game.state.status.inCheck,true);assert(game.state.status.legalMoveCount>0);assert.deepEqual(terminalSequence(game.state.status),["check_cutin"]);
});

test("一手詰みは王手カットイン後に勝利結果を要求する",()=>{
  const state=emptyState();put(state,"A0",TYPES.KING,SIDES.BLACK);put(state,"B8",TYPES.KING,SIDES.WHITE);put(state,"C0",TYPES.FFH,SIDES.WHITE);put(state,"C9",TYPES.FFH,SIDES.WHITE);
  const game=new ShahSiegGame(state);play(game,"C9","A9");
  assert.equal(game.state.status.kind,"win");assert.equal(game.state.status.reason,END_REASONS.CHECKMATE);assert.equal(game.state.status.inCheck,true);assert.equal(game.state.status.legalMoveCount,0);assert.deepEqual(terminalSequence(game.state.status),["check_cutin","result"]);
});

test("王督の直接捕獲は王手演出なしで終局する",()=>{
  const state=emptyState();put(state,"A0",TYPES.KING,SIDES.BLACK);put(state,"J1",TYPES.KING,SIDES.WHITE);put(state,"A9",TYPES.FFH,SIDES.WHITE);
  const game=new ShahSiegGame(state);game.play({kind:"move",from:displayToIndex("A9"),to:displayToIndex("A0")},null);
  assert.equal(game.state.status.reason,END_REASONS.KING_CAPTURE);assert.equal(game.state.status.inCheck,false);assert.deepEqual(terminalSequence(game.state.status),["result"]);
});

test("CPU側の着手による王手も同じ演出要求になる",()=>{
  const state=emptyState(SIDES.BLACK);put(state,"A1",TYPES.KING,SIDES.WHITE);put(state,"E0",TYPES.KING,SIDES.BLACK);put(state,"B2",TYPES.FFH,SIDES.BLACK);
  const game=new ShahSiegGame(state);play(game,"B2","A2");
  assert.equal(game.state.status.kind,"playing");assert.equal(game.state.status.inCheck,true);assert.deepEqual(terminalSequence(game.state.status),["check_cutin"]);
});

test("合法手なしで王手でなければステイルメイト",()=>{
  const state=emptyState();put(state,"A0",TYPES.KING,SIDES.BLACK);put(state,"B8",TYPES.KING,SIDES.WHITE);put(state,"C9",TYPES.HEAVY_CRUISER,SIDES.WHITE);put(state,"J1",TYPES.COMMANDER,SIDES.WHITE);
  const game=new ShahSiegGame(state);play(game,"J1","I1");
  assert.equal(game.state.status.kind,"draw");assert.equal(game.state.status.reason,END_REASONS.STALEMATE);assert.equal(game.state.status.inCheck,false);assert.equal(game.state.status.legalMoveCount,0);assert.deepEqual(terminalSequence(game.state.status),["result"]);
});
