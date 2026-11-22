import test from "node:test";
import assert from "node:assert/strict";
import { SIDES, TYPES, createInitialState, displayToIndex, __testing } from "../js/engine.js";
import { createAnimationPlan } from "../js/battle-animation.js";

test("通常移動は移動元と移動先を保持する",()=>{
  const state=createInitialState(),from=displayToIndex("A3"),to=displayToIndex("A4");
  assert.deepEqual(createAnimationPlan(state,{kind:"move",from,to}),{kind:"move",from,to,captureSquare:to,captured:false,effect:null});
});

test("捕獲と障害物撤去は別エフェクトへ分類される",()=>{
  const state=createInitialState(),from=displayToIndex("A3"),to=displayToIndex("B4");
  state.board[to.row][to.col]=__testing.makePiece(TYPES.UAV,SIDES.BLACK,"target");
  assert.equal(createAnimationPlan(state,{kind:"move",from,to,capture:true}).effect,"capture");
  state.board[to.row][to.col].obstacle=true;
  assert.equal(createAnimationPlan(state,{kind:"move",from,to,capture:true,removal:true}).effect,"obstacleRemoval");
});

test("アンパッサンは実際に消える駒のマスを使う",()=>{
  const state=createInitialState(),from=displayToIndex("A5"),to=displayToIndex("B6");
  state.board[from.row][from.col]=__testing.makePiece(TYPES.UAV,SIDES.WHITE,"moving");
  state.board[to.row][to.col]=null;state.board[from.row][to.col]=__testing.makePiece(TYPES.UAV,SIDES.BLACK,"target");
  const plan=createAnimationPlan(state,{kind:"move",from,to,capture:true,enPassant:true});
  assert.deepEqual(plan.captureSquare,{row:from.row,col:to.col});assert.equal(plan.effect,"capture");
});
