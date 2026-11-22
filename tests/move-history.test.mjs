import test from "node:test";
import assert from "node:assert/strict";
import { SIDES, TYPES, createInitialState, displayToIndex, __testing } from "../js/engine.js";
import { MoveHistory, createMoveRecord } from "../js/move-history.js";

test("通常移動を棋譜へ記録しUndoで巻き戻せる", () => {
  const before = createInitialState();
  const from = displayToIndex("A3"), to = displayToIndex("A4");
  const move = { kind: "move", from, to };
  const after = structuredClone(before);
  after.board[to.row][to.col] = after.board[from.row][from.col]; after.board[from.row][from.col] = null; after.plyCount = 1;
  const history = new MoveHistory();
  const record = history.add(createMoveRecord(before, after, move));
  assert.equal(record.notation, "1. 白 UAV A3→A4");
  assert.equal(history.records.length, 1); history.undo(); assert.equal(history.records.length, 0);
});

test("持ち駒の再配置を打として記録する", () => {
  const before = createInitialState();
  before.hands.white.push(__testing.makePiece(TYPES.BM, SIDES.WHITE, "hand"));
  const to = displayToIndex("A4"), move = { kind: "drop", side: SIDES.WHITE, handIndex: 0, to, pieceType: TYPES.BM };
  const after = structuredClone(before); after.board[to.row][to.col] = after.hands.white.shift(); after.plyCount = 1;
  const record = createMoveRecord(before, after, move);
  assert.equal(record.drop, true); assert.match(record.notation, /BM 打 A4/);
});

test("アンパッサン・昇格・WRK撤去の種別を記録できる", () => {
  const before = createInitialState();
  const uavFrom = displayToIndex("A3"), uavTo = displayToIndex("A4");
  const after = structuredClone(before);
  after.board[uavTo.row][uavTo.col] = after.board[uavFrom.row][uavFrom.col];
  after.board[uavFrom.row][uavFrom.col] = null; after.plyCount = 1;
  const special = createMoveRecord(before, after, { kind: "move", from: uavFrom, to: uavTo, enPassant: true, removal: true });
  assert.equal(special.enPassant, true); assert.equal(special.wrkRemoval, true);

  const promotedBefore = createInitialState(), promotedAfter = structuredClone(promotedBefore);
  const from = displayToIndex("A3"), to = displayToIndex("A0");
  promotedAfter.board[to.row][to.col] = { ...promotedAfter.board[from.row][from.col], type: TYPES.COMMANDER, promoted: true };
  promotedAfter.board[from.row][from.col] = null; promotedAfter.plyCount = 1;
  const promoted = createMoveRecord(promotedBefore, promotedAfter, { kind: "move", from, to }, TYPES.COMMANDER);
  assert.equal(promoted.promoted, true); assert.equal(promoted.promotionType, TYPES.COMMANDER);
  const declinedAfter=structuredClone(promotedBefore);declinedAfter.board[to.row][to.col]=declinedAfter.board[from.row][from.col];declinedAfter.board[from.row][from.col]=null;declinedAfter.plyCount=1;
  const declined=createMoveRecord(promotedBefore,declinedAfter,{kind:"move",from,to},null);assert.equal(declined.promotionDeclined,true);assert.match(declined.notation,/成らず/);
});
