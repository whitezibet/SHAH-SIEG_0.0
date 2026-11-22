import { SIDES, TYPE_NAMES, indexToDisplay, promotionChoicesForMove } from "./engine.js";

const sideLabel = side => side === SIDES.WHITE ? "白" : "黒";

export function createMoveRecord(before, after, move, promotionChoice = undefined) {
  const isDrop = move.kind === "drop";
  const movingBefore = isDrop
    ? before.hands[before.turn][move.handIndex]
    : before.board[move.from.row][move.from.col];
  const captureRow = move.enPassant ? move.from.row : move.to.row;
  const captured = before.board[captureRow]?.[move.to.col] ?? null;
  const movingAfter = after.board[move.to.row][move.to.col];
  const promoted = Boolean(movingAfter?.promoted && movingAfter.type !== movingBefore?.type);
  const promotionDecision=promotionChoicesForMove(before,move).length>0;
  const record = {
    number: after.plyCount,
    side: before.turn,
    pieceType: movingBefore?.type ?? move.pieceType,
    from: isDrop ? null : indexToDisplay(move.from.row, move.from.col),
    to: indexToDisplay(move.to.row, move.to.col),
    capturedType: captured?.type ?? null,
    promoted,
    promotionType: promoted ? movingAfter.type : promotionChoice,
    promotionDeclined: promotionDecision && promotionChoice===null,
    drop: isDrop,
    enPassant: Boolean(move.enPassant),
    wrkRemoval: Boolean(move.removal)
  };
  record.notation = formatMoveRecord(record);
  return record;
}

export function formatMoveRecord(record) {
  const piece = TYPE_NAMES[record.pieceType] ?? record.pieceType;
  const action = record.drop
    ? `${piece} 打 ${record.to}`
    : `${piece} ${record.from}${record.capturedType ? "×" : "→"}${record.to}`;
  const details = [];
  if (record.capturedType) details.push(`捕獲:${TYPE_NAMES[record.capturedType] ?? record.capturedType}`);
  if (record.promoted) details.push(`昇格:${TYPE_NAMES[record.promotionType] ?? record.promotionType}`);
  if (record.promotionDeclined) details.push("成らず");
  if (record.enPassant) details.push("アンパッサン");
  if (record.wrkRemoval) details.push("WRK障害物撤去");
  return `${record.number}. ${sideLabel(record.side)} ${action}${details.length ? `（${details.join(" / ")}）` : ""}`;
}

export class MoveHistory {
  constructor() { this.records = []; }
  add(record) { this.records.push(record); return record; }
  undo() { return this.records.pop() ?? null; }
  reset() { this.records.length = 0; }
  toText() { return this.records.length ? this.records.map(record => record.notation).join("\n") : "着手履歴はありません。"; }
}
