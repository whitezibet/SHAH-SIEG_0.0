export const SIDES = Object.freeze({ WHITE: "white", BLACK: "black" });
export const TYPES = Object.freeze({
  UAV: "uav", WRK: "wrk", HEAVY_CRUISER: "heavyCruiser", FFH: "ffh",
  BM: "bm", SDOG: "sdog", LIGHT_CRUISER: "lightCruiser", CARRIER: "carrier",
  KING: "king", COMMANDER: "commander", BATTLESHIP: "battleship", ARMORED: "armored"
});

export const TYPE_NAMES = Object.freeze({
  uav: "UAV", wrk: "WRK", heavyCruiser: "重巡", ffh: "FFh", bm: "BM",
  sdog: "S-Dog", lightCruiser: "軽巡", carrier: "空母", king: "王督",
  commander: "司令", battleship: "戦艦", armored: "装甲艦"
});

export const END_REASONS = Object.freeze({
  KING_CAPTURE: "king_capture",
  CHECKMATE: "checkmate",
  IMMOBILIZATION: "immobilization",
  STALEMATE: "stalemate",
  MOVE_LIMIT: "move_limit",
  RESIGNATION: "resignation",
  DEBUG_VICTORY: "debug_forced_victory",
  DEBUG_DEFEAT: "debug_forced_defeat"
});

export const ROW_LABELS = Object.freeze(["0", "9", "8", "7", "6", "5", "4", "3", "2", "1"]);
export const COL_LABELS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);

const PROMOTIONS = Object.freeze({
  [TYPES.HEAVY_CRUISER]: TYPES.BATTLESHIP,
  [TYPES.FFH]: TYPES.ARMORED,
  [TYPES.SDOG]: TYPES.CARRIER,
  [TYPES.LIGHT_CRUISER]: TYPES.CARRIER
});
const UAV_PROMOTION_EXCLUSIONS = new Set([TYPES.UAV,TYPES.KING,TYPES.BATTLESHIP,TYPES.ARMORED]);
const UAV_PROMOTIONS = Object.freeze(Object.values(TYPES).filter(type => !UAV_PROMOTION_EXCLUSIONS.has(type)));
const WRK_TARGETS = new Set([TYPES.UAV, TYPES.COMMANDER, TYPES.SDOG, TYPES.BM]);

export function promotionTargetsForType(type) {
  if (type === TYPES.UAV) return [...UAV_PROMOTIONS];
  return PROMOTIONS[type] ? [PROMOTIONS[type]] : [];
}

const inside = (row, col) => row >= 0 && row < 10 && col >= 0 && col < 10;
const other = side => side === SIDES.WHITE ? SIDES.BLACK : SIDES.WHITE;
const forward = side => side === SIDES.WHITE ? -1 : 1;
const farRank = side => side === SIDES.WHITE ? 0 : 9;
const homePawnRank = side => side === SIDES.WHITE ? 7 : 2;
const clone = value => typeof structuredClone === "function"
  ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export function displayToIndex(coord) {
  const normalized = String(coord).trim().toUpperCase();
  const col = COL_LABELS.indexOf(normalized[0]);
  const row = ROW_LABELS.indexOf(normalized.slice(1));
  if (!inside(row, col)) throw new Error(`不正な表示座標です: ${coord}`);
  return { row, col };
}

export function indexToDisplay(row, col) {
  if (!inside(row, col)) throw new Error(`不正な内部座標です: ${row},${col}`);
  return `${COL_LABELS[col]}${ROW_LABELS[row]}`;
}

function makePiece(type, side, id, extra = {}) {
  return { id, type, baseType: extra.baseType ?? type, side, promoted: extra.promoted ?? false,
    obstacle: extra.obstacle ?? false, moved: extra.moved ?? false };
}

export function createInitialState() {
  const board = Array.from({ length: 10 }, () => Array(10).fill(null));
  let sequence = 1;
  const place = (coord, type, side) => {
    const { row, col } = displayToIndex(coord);
    board[row][col] = makePiece(type, side, `${side[0]}-${type}-${sequence++}`);
  };
  const whiteSetup = [
    ..."ABCDEFGHI".split("").map(file => [`${file}3`, TYPES.UAV]),
    ["J3", TYPES.WRK], ["C2", TYPES.HEAVY_CRUISER], ["H2", TYPES.FFH],
    ["A1", TYPES.BM], ["J1", TYPES.BM], ["B1", TYPES.SDOG], ["I1", TYPES.SDOG],
    ["C1", TYPES.LIGHT_CRUISER], ["H1", TYPES.LIGHT_CRUISER],
    ["D1", TYPES.CARRIER], ["G1", TYPES.CARRIER], ["E1", TYPES.KING], ["F1", TYPES.COMMANDER]
  ];
  for (const [coord, type] of whiteSetup) place(coord, type, SIDES.WHITE);
  for (const [coord, type] of whiteSetup) {
    const { row, col } = displayToIndex(coord);
    board[9 - row][9 - col] = makePiece(type, SIDES.BLACK, `b-${type}-${sequence++}`);
  }
  return {
    board, hands: { white: [], black: [] }, turn: SIDES.WHITE, enPassant: null,
    plyCount: 0, status: { kind: "playing", winner: null, reason: null, inCheck: false, legalMoveCount: null, message: "白軍の手番です" }
  };
}

function addStep(state, moves, piece, from, row, col, options = {}) {
  if (!inside(row, col)) return;
  const target = state.board[row][col];
  if (!target) {
    if (!options.captureOnly) moves.push({ kind: "move", from, to: { row, col } });
    return;
  }
  if (piece.type === TYPES.WRK) {
    const removableObstacle = target.obstacle && target.type === TYPES.UAV;
    const capturable = !target.obstacle && target.side !== piece.side && WRK_TARGETS.has(target.type);
    if (removableObstacle || capturable) moves.push({ kind: "move", from, to: { row, col }, capture: true, removal: removableObstacle });
  } else if (!target.obstacle && target.side !== piece.side) {
    moves.push({ kind: "move", from, to: { row, col }, capture: true });
  }
}

function addRay(state, moves, piece, from, dr, dc) {
  let row = from.row + dr, col = from.col + dc;
  while (inside(row, col)) {
    const target = state.board[row][col];
    if (!target) moves.push({ kind: "move", from, to: { row, col } });
    else {
      if (!target.obstacle && target.side !== piece.side) moves.push({ kind: "move", from, to: { row, col }, capture: true });
      break;
    }
    row += dr; col += dc;
  }
}

function pseudoMoves(state, row, col) {
  const piece = state.board[row][col];
  if (!piece || piece.obstacle) return [];
  const moves = [], from = { row, col }, f = forward(piece.side);
  const steps = (vectors, captureOnly = false) => vectors.forEach(([dr, dc]) => addStep(state, moves, piece, from, row + dr, col + dc, { captureOnly }));
  if (piece.type === TYPES.UAV) {
    if (!state.board[row + f]?.[col]) {
      moves.push({ kind: "move", from, to: { row: row + f, col } });
      if (row === homePawnRank(piece.side) && !state.board[row + 2 * f]?.[col])
        moves.push({ kind: "move", from, to: { row: row + 2 * f, col }, doubleStep: true });
    }
    for (const dc of [-1, 1]) {
      const tr = row + f, tc = col + dc, target = state.board[tr]?.[tc];
      if (target && !target.obstacle && target.side !== piece.side)
        moves.push({ kind: "move", from, to: { row: tr, col: tc }, capture: true });
      if (state.enPassant && state.enPassant.row === tr && state.enPassant.col === tc && state.enPassant.side !== piece.side)
        moves.push({ kind: "move", from, to: { row: tr, col: tc }, capture: true, enPassant: true });
    }
  } else if (piece.type === TYPES.KING) steps([-1,0,1].flatMap(dr => [-1,0,1].map(dc => [dr,dc])).filter(([dr,dc]) => dr || dc));
  else if (piece.type === TYPES.COMMANDER) steps([[-1,0],[1,0],[0,-1],[0,1]]);
  else if (piece.type === TYPES.HEAVY_CRUISER) [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(v => addRay(state,moves,piece,from,...v));
  else if (piece.type === TYPES.FFH) [[-1,0],[1,0],[0,-1],[0,1]].forEach(v => addRay(state,moves,piece,from,...v));
  else if (piece.type === TYPES.BATTLESHIP) {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(v => addRay(state,moves,piece,from,...v));
    steps([[-1,0],[1,0],[0,-1],[0,1]]);
  }
  else if (piece.type === TYPES.ARMORED) {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(v => addRay(state,moves,piece,from,...v));
    steps([[-1,-1],[-1,1],[1,-1],[1,1]]);
  } else if (piece.type === TYPES.SDOG) steps([[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]);
  else if (piece.type === TYPES.BM) {
    addRay(state,moves,piece,from,f,0); steps([[0,-1],[0,1]]);
  } else if (piece.type === TYPES.LIGHT_CRUISER) steps([[f,-1],[f,0],[f,1],[-f,-1],[-f,1]]);
  else if (piece.type === TYPES.CARRIER) steps([[f,-1],[f,0],[f,1],[0,-1],[0,1],[-f,0]]);
  else if (piece.type === TYPES.WRK) {
    steps([[f,0],[-f,0],[0,-1],[0,1]]);
    const middle = state.board[row + f]?.[col];
    if (!middle) addStep(state,moves,piece,from,row + 2*f,col);
  }
  return moves.filter(m => inside(m.to.row, m.to.col));
}

function findKing(state, side) {
  for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) {
    const p = state.board[row][col]; if (p && p.side === side && p.type === TYPES.KING) return { row, col };
  }
  return null;
}

export function isSquareAttacked(state, row, col, bySide) {
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const p = state.board[r][c];
    if (!p || p.side !== bySide || p.obstacle || p.type === TYPES.WRK) continue;
    if (p.type === TYPES.UAV) {
      const f = forward(bySide);
      if (r + f === row && Math.abs(c - col) === 1) return true;
    } else if (pseudoMoves(state, r, c).some(m => m.to.row === row && m.to.col === col)) return true;
  }
  return false;
}

export function isInCheck(state, side) {
  const king = findKing(state, side);
  return king ? isSquareAttacked(state, king.row, king.col, other(side)) : true;
}

export function hasCommander(state, side) {
  return state.board.some(row => row.some(p => p && !p.obstacle && p.side === side && p.type === TYPES.COMMANDER));
}

function syncUavsWithCommander(state, side) {
  const active = hasCommander(state, side);
  state.board.forEach(row => row.forEach(p => {
    if (p && p.side === side && p.type === TYPES.UAV && !p.promoted) p.obstacle = !active;
  }));
}

// 既存テスト・デバッグ互換用。現在は石化だけでなく司令復帰時の再稼働も同期する。
function obstructUavsWithoutCommander(state, side) { syncUavsWithCommander(state, side); }

function promotionOptions(piece, toRow) {
  if (!piece || piece.promoted || toRow !== farRank(piece.side)) return [];
  const targets=promotionTargetsForType(piece.type);
  if (piece.type === TYPES.UAV) return targets;
  return targets.length?[null,...targets]:[];
}

export function promotionChoicesForMove(state,move) {
  if (move.kind !== "move") return [];
  return promotionOptions(state.board[move.from.row]?.[move.from.col],move.to.row);
}

function promote(piece, toRow, choice) {
  const choices=promotionOptions(piece,toRow);
  if (!choices.length||choice===null||choice===undefined) return;
  if (!choices.includes(choice)) throw new Error("選択できない成り先です");
  piece.type = choice; piece.promoted = true;
}

function applyUnchecked(state, move, promotionChoice = null) {
  const next = clone(state); next.status = { kind: "playing", winner: null, reason: null, inCheck: false, legalMoveCount: null, message: "" };
  let captured = null, moving;
  if (move.kind === "drop") {
    const [handPiece] = next.hands[move.side].splice(move.handIndex, 1);
    moving = { ...handPiece, side: move.side, moved: true, obstacle: false };
    next.board[move.to.row][move.to.col] = moving;
  } else {
    moving = next.board[move.from.row][move.from.col];
    if (!moving) throw new Error("移動元に駒がありません");
    if (move.enPassant) {
      const captureRow = move.to.row - forward(moving.side);
      captured = next.board[captureRow][move.to.col]; next.board[captureRow][move.to.col] = null;
    } else captured = next.board[move.to.row][move.to.col];
    next.board[move.from.row][move.from.col] = null;
    next.board[move.to.row][move.to.col] = moving;
    moving.moved = true;
    if (move.removal && captured?.obstacle) {
      if (hasCommander(next, moving.side)) next.hands[moving.side].push(makePiece(TYPES.UAV, moving.side, captured.id));
    } else if (captured && captured.type !== TYPES.KING) {
      const base = captured.baseType ?? captured.type;
      next.hands[moving.side].push(makePiece(base, moving.side, captured.id, { baseType: base }));
    }
    promote(moving, move.to.row, promotionChoice);
  }
  next.enPassant = null;
  if (move.doubleStep) next.enPassant = { row: (move.from.row + move.to.row) / 2, col: move.to.col, side: moving.side };
  syncUavsWithCommander(next, SIDES.WHITE); syncUavsWithCommander(next, SIDES.BLACK);
  next.plyCount += 1; next.turn = other(next.turn);
  if (captured?.type === TYPES.KING) next.status = { kind: "win", winner: moving.side, reason: END_REASONS.KING_CAPTURE, inCheck: false, legalMoveCount: 0, message: `${moving.side === SIDES.WHITE ? "白軍" : "黒軍"}が王督を捕獲しました` };
  return next;
}

function leavesKingSafe(state, move) {
  const available=promotionChoicesForMove(state,move);
  const choices = available.length ? available : [null];
  return choices.some(choice => !isInCheck(applyUnchecked(state, move, choice), state.turn));
}

export function legalMovesFrom(state, row, col) {
  const p = state.board[row]?.[col];
  if (!p || p.side !== state.turn || state.status.kind !== "playing") return [];
  return pseudoMoves(state, row, col).filter(move => leavesKingSafe(state, move));
}

// UIの参考表示用。実際の手番を変更せず、指定駒の陣営を手番とした
// 既存の合法手生成（王督の安全制約を含む）を再利用する。
export function referenceMovesFrom(state, row, col) {
  const piece = state.board[row]?.[col];
  if (!piece || piece.obstacle || state.status.kind !== "playing") return [];
  const referenceState = clone(state);
  referenceState.turn = piece.side;
  referenceState.status = { kind:"playing", winner:null, reason:null, inCheck:false, legalMoveCount:null, message:"" };
  const moves = legalMovesFrom(referenceState, row, col);
  if (piece.type !== TYPES.UAV) return moves;
  const attackRow = row + forward(piece.side);
  for (const dc of [-1,1]) {
    const attackCol = col + dc;
    if (!inside(attackRow,attackCol) || referenceState.board[attackRow][attackCol]) continue;
    const simulated = clone(referenceState);
    simulated.board[attackRow][attackCol] = makePiece(TYPES.BM,other(piece.side),"reference-target");
    if (legalMovesFrom(simulated,row,col).some(move=>move.to.row===attackRow&&move.to.col===attackCol))
      moves.push({kind:"referenceAttack",from:{row,col},to:{row:attackRow,col:attackCol},capture:true,referenceOnly:true});
  }
  return moves;
}

function dropAllowedRow(side, row) {
  return side === SIDES.WHITE ? row >= 3 : row <= 6;
}

export function legalDropsFor(state, handIndex) {
  const side = state.turn, piece = state.hands[side][handIndex];
  if (!piece || state.status.kind !== "playing") return [];
  if (piece.type === TYPES.UAV && !hasCommander(state, side)) return [];
  const drops = [];
  for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) {
    if (!state.board[row][col] && dropAllowedRow(side, row)) {
      const move = { kind: "drop", side, handIndex, to: { row, col }, pieceType: piece.type };
      if (leavesKingSafe(state, move)) drops.push(move);
    }
  }
  return drops;
}

export function allLegalMoves(state) {
  if (state.status.kind !== "playing") return [];
  const moves = [];
  for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) moves.push(...legalMovesFrom(state,row,col));
  state.hands[state.turn].forEach((_, i) => moves.push(...legalDropsFor(state, i)));
  return moves;
}

function finalizeStatus(state) {
  if (state.status.kind === "win") return state;
  const inCheck = isInCheck(state, state.turn);
  const moves = allLegalMoves(state);
  if (state.plyCount >= 200) {
    state.status = { kind: "draw", winner: null, reason: END_REASONS.MOVE_LIMIT, inCheck, legalMoveCount: moves.length, message: "200手に達したため引き分けです" }; return state;
  }
  if (!moves.length) state.status = inCheck
    ? { kind: "win", winner: other(state.turn), reason: END_REASONS.CHECKMATE, inCheck: true, legalMoveCount: 0, message: "詰みです" }
    : { kind: "win", winner: other(state.turn), reason: END_REASONS.IMMOBILIZATION, inCheck: false, legalMoveCount: 0, message: "行動可能な手がないため敗北です" };
  else state.status = { kind: "playing", winner: null, reason: null, inCheck, legalMoveCount: moves.length, message: inCheck ? "王手です" : `${state.turn === SIDES.WHITE ? "白軍" : "黒軍"}の手番です` };
  return state;
}

function sameMove(a, b) {
  return a.kind === b.kind && a.to.row === b.to.row && a.to.col === b.to.col &&
    (a.kind === "drop" ? a.handIndex === b.handIndex : a.from.row === b.from.row && a.from.col === b.from.col);
}

export class ShahSiegGame {
  constructor(initialState = createInitialState()) { this.initial = clone(initialState); this.state = clone(initialState); this.history = []; }
  getLegalMoves(row, col) { return legalMovesFrom(this.state, row, col); }
  getLegalDrops(handIndex) { return legalDropsFor(this.state, handIndex); }
  getAllLegalMoves() { return allLegalMoves(this.state); }
  play(request, promotionChoice = undefined) {
    const legal = request.kind === "drop" ? legalDropsFor(this.state, request.handIndex) : legalMovesFrom(this.state, request.from.row, request.from.col);
    const move = legal.find(candidate => sameMove(candidate, request));
    if (!move) throw new Error("その着手はできません");
    const choices=promotionChoicesForMove(this.state,move);
    if (choices.length&&promotionChoice===undefined) return { needsPromotion:true,move,promotionChoices:choices };
    if (choices.length&&!choices.includes(promotionChoice)) throw new Error("成り方を選択してください");
    if (isInCheck(applyUnchecked(this.state,move,promotionChoice??null),this.state.turn)) throw new Error("王手を放置する着手はできません");
    this.history.push(clone(this.state)); this.state = finalizeStatus(applyUnchecked(this.state, move, promotionChoice));
    return { needsPromotion: false, state: this.state };
  }
  undo() { if (!this.history.length) return false; this.state = this.history.pop(); return true; }
  restart() { this.state = clone(this.initial); this.history = []; }
}

export const __testing = { makePiece, applyUnchecked, obstructUavsWithoutCommander, syncUavsWithCommander, hasCommander };
