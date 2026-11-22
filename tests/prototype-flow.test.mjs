import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const ui=readFileSync(new URL("../js/ui.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const config=readFileSync(new URL("../js/game-config.js",import.meta.url),"utf8");

test("公開用タイトルにはステージ選択とアルバムを表示しない",()=>{
  assert(!html.includes('id="title-stage-select"'));
  assert(!html.includes('id="open-album"'));
  assert(!html.includes('id="album-dialog"'));
  assert(html.includes('id="start-game"'));
  assert(html.includes('id="open-audio-settings"'));
});

test("勝利はスチル会話後のGAME CLEARへ進み次ステージへ進まない",()=>{
  assert(ui.includes('showVictoryEnding()'));
  assert(ui.includes('this.resultMode="ending"'));
  assert(ui.includes('textContent="GAME CLEAR"'));
  assert(!ui.includes('this.stageIndex+=1'));
  assert(!html.includes('id="next-stage-from-board"'));
});

test("勝利表示は勝ち！だけを残し全画面クリックで一度だけ進む",()=>{
  assert(!html.includes("PLAYER WIN"));
  assert(html.includes('id="victory-burst"'));
  assert(ui.includes('isDefeat?"GAMEOVER":"勝ち！"'));
  assert(ui.includes("handleVictoryPointer(event)"));
  assert(ui.includes("performance.now()+500"));
  assert(ui.includes("this.victoryTransitioning=true"));
  assert(ui.includes('if(this.resultMode==="ending")this.dialogueLocked=false'));
  assert(css.includes(".battle-result.victory-celebration{background:transparent"));
  assert(css.includes(".victory-celebration .result-actions"));
  assert(css.includes("@keyframes victory-confetti"));
});

test("敗北は専用スチルを使わず盤面上GAMEOVERと再戦操作を表示する",()=>{
  assert(ui.includes('textContent=isDraw?"DRAW":isDefeat?"GAMEOVER":"勝ち！"'));
  assert(ui.includes('isDefeat?"勝てなかった…"'));
  assert(!ui.includes("route.defeatStill"));
  assert(html.includes('id="retry-stage"'));
  assert(html.includes('id="result-action"'));
});

test("リトライは会話を再生せず初期局面と開戦演出から再開する",()=>{
  const retry=ui.slice(ui.indexOf("async retryBattle()"),ui.indexOf("returnToTitle()",ui.indexOf("async retryBattle()")));
  assert(retry.includes("this.resetBattle(false)"));
  assert(retry.includes('this.playCutin("opening")'));
  assert(!retry.includes("preBattleScene"));
  assert(!retry.includes("battleIntro"));
});

test("公開用勝敗処理は進行・スチル収集を記録しない",()=>{
  assert(!ui.includes("recordVictory"));
  assert(!ui.includes("recordDefeatStill"));
});

test("デバッグ勝敗は開発中に表示され通常の勝敗処理へ接続する",()=>{
  assert(config.includes("export const DEBUG_MODE = true"));
  assert(html.includes('id="debug-win"'));
  assert(html.includes('id="debug-lose"'));
  assert(ui.includes("forceWinAndAdvance()"));
  assert(ui.includes("forceDefeat()"));
  assert(ui.includes('reason:END_REASONS.DEBUG_DEFEAT,outcome:"defeat"'));
});

test("焦り汗エフェクトは独立レイヤーとデバッグ操作を持つ",()=>{
  assert(html.includes('id="sweat-effect"'));
  assert(html.includes('id="debug-sweat"'));
  assert(ui.includes("previewSweatEffect()"));
  assert(ui.includes("stopSweatEffect()"));
  assert(css.includes("@keyframes sweat-burst"));
});

test("成りダイアログは駒画像と昇格しない候補を動的に表示する",()=>{
  assert(html.includes('id="promotion-options"'));
  assert(ui.includes('button.textContent="昇格しない"'));
  assert(ui.includes('PIECE_IMAGES[choice][1]'));
  assert(ui.includes('`${TYPE_NAMES[choice]}へ昇格`'));
  assert(ui.includes('this.promotion.addEventListener("cancel",event=>event.preventDefault())'));
});
