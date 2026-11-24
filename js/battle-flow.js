import { END_REASONS } from "./engine.js";

export const END_REASON_LABELS = Object.freeze({
  [END_REASONS.KING_CAPTURE]: "王督捕獲",
  [END_REASONS.CHECKMATE]: "詰み",
  [END_REASONS.IMMOBILIZATION]: "行動不能による敗北",
  [END_REASONS.RESIGNATION]: "投了",
  [END_REASONS.STALEMATE]: "ステイルメイト",
  [END_REASONS.MOVE_LIMIT]: "200手による引き分け",
  [END_REASONS.DEBUG_VICTORY]: "デバッグ強制勝利",
  [END_REASONS.DEBUG_DEFEAT]: "デバッグ強制敗北"
});

export function terminalSequence(status) {
  if (status.kind === "playing") return status.inCheck ? ["check_cutin"] : [];
  if (status.kind === "win" && status.reason === END_REASONS.CHECKMATE) return ["check_cutin", "result"];
  return ["result"];
}

export function reasonLabel(reason) { return END_REASON_LABELS[reason] ?? reason ?? "—"; }
