import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { AUDIO_CONFIG, BATTLE_ANIMATION_CONFIG, CPU_CONFIG, CUTIN_CONFIG, GAME_UI_CONFIG, HELP_GUIDE_CONFIG, IMPACT_SHAKE_CONFIG, OBSTACLE_VISUAL_CONFIG, SWEAT_EFFECT_CONFIG, TEXT_WINDOW_CONFIG, TITLE_ANIMATION_CONFIG, TUTORIAL_CONFIG } from "../js/game-config.js";

test("開戦・王手カットインは独立した画像設定を持つ", () => {
  assert.notEqual(CUTIN_CONFIG.opening.image, CUTIN_CONFIG.check.image);
  for (const key of ["opening", "check"]) {
    const image = CUTIN_CONFIG[key].image;
    assert.equal(typeof image.src, "string");
    assert.equal(image.fit, "contain");
    assert.equal(image.scale, 1);
  }
});

test("石化専用画像を陣営別に設定できる", () => {
  assert.equal(typeof OBSTACLE_VISUAL_CONFIG.imageSrcBySide.white, "string");
  assert.equal(typeof OBSTACLE_VISUAL_CONFIG.imageSrcBySide.black, "string");
});

test("ステージ1〜3が初級・中級・上級へ対応する",()=>{
  assert.deepEqual(GAME_UI_CONFIG.stages.map(stage=>stage.cpuDifficulty),["beginner","intermediate","advanced"]);
  assert.equal(CPU_CONFIG.defaultMode,"cpu");
});

test("移動・捕獲・障害物撤去の演出設定が独立している",()=>{
  assert(BATTLE_ANIMATION_CONFIG.moveDurationMs>=200&&BATTLE_ANIMATION_CONFIG.moveDurationMs<=300);
  assert.notEqual(BATTLE_ANIMATION_CONFIG.capture,BATTLE_ANIMATION_CONFIG.obstacleRemoval);
  assert.equal(typeof BATTLE_ANIMATION_CONFIG.capture.image.src,"string");
  assert.equal(typeof BATTLE_ANIMATION_CONFIG.obstacleRemoval.image.src,"string");
});

test("CPU思考中の点滅は表示ラベルだけに限定される",()=>{
  const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
  assert(css.includes("#cpu-thinking{color:"));
  assert(!css.includes(".cpu-thinking{color:"));
});

test("敗北シェイクと共通テキストウィンドウを設定できる",()=>{
  assert(IMPACT_SHAKE_CONFIG.durationMs>=250&&IMPACT_SHAKE_CONFIG.durationMs<=400);
  assert.equal(typeof IMPACT_SHAKE_CONFIG.strength,"number");
  assert.equal(TEXT_WINDOW_CONFIG.imageSrc,"");
  assert.deepEqual(Object.keys(TEXT_WINDOW_CONFIG.modes),["novel","battle","still"]);
  const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
  assert(css.includes(".game-shell.impact-shake{--impact-duration:"));
  assert(!css.includes('.game-shell.impact-shake>:not(.title-screen)'));
});

test("未登録音源の設定を安全に保持する",()=>{
  assert.deepEqual(Object.keys(AUDIO_CONFIG.bgm),["title","novel","battle","result"]);
  assert.deepEqual(Object.keys(AUDIO_CONFIG.se),["button","move","capture","obstacleRemoval","check","decision"]);
  assert(Object.values(AUDIO_CONFIG.bgm).every(src=>src===""));assert(Object.values(AUDIO_CONFIG.se).every(src=>src===""));
});

test("遊び方ガイドは複数ページ画像へ拡張できる",()=>{
  assert(Array.isArray(HELP_GUIDE_CONFIG.pages));assert(HELP_GUIDE_CONFIG.pages.length>=1);assert.equal(HELP_GUIDE_CONFIG.pages[0].imageSrc,"asset/Rule.png");assert(existsSync(new URL(`../${HELP_GUIDE_CONFIG.pages[0].imageSrc}`,import.meta.url)));
});

test("初回チュートリアルのループ速度とUAV移動先を設定できる",()=>{
  assert(TUTORIAL_CONFIG.loopDurationMs>=1000);assert.notDeepEqual(TUTORIAL_CONFIG.pieceStart,TUTORIAL_CONFIG.pieceEnd);
});

test("タイトルの主人公登場時間は指定範囲内で調整できる",()=>{
  assert(TITLE_ANIMATION_CONFIG.characterSlideMs>=400&&TITLE_ANIMATION_CONFIG.characterSlideMs<=650);
});

test("焦り状態の汗はキャラクター別位置と低頻度の再生間隔を設定できる",()=>{
  assert(SWEAT_EFFECT_CONFIG.durationMs>=600&&SWEAT_EFFECT_CONFIG.durationMs<=900);
  assert(SWEAT_EFFECT_CONFIG.repeatMinMs<SWEAT_EFFECT_CONFIG.repeatMaxMs);
  assert.equal(SWEAT_EFFECT_CONFIG.minDrops,1);assert.equal(SWEAT_EFFECT_CONFIG.maxDrops,3);
  for(const id of ["28","cha"]){const setting=SWEAT_EFFECT_CONFIG.characters[id];assert.equal(typeof setting.positionX,"number");assert.equal(typeof setting.positionY,"number");assert([-1,1].includes(setting.directionX));}
});

test("Gothamは実在する通常・太字ファイルを英数字だけへ適用する",()=>{
  const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
  assert(existsSync(new URL("../asset/fonts/Gotham-Book.otf",import.meta.url)));
  assert(existsSync(new URL("../asset/fonts/Gotham-Bold.otf",import.meta.url)));
  assert(css.includes('url("asset/fonts/Gotham-Book.otf")'));
  assert(css.includes('url("asset/fonts/Gotham-Bold.otf")'));
  assert(css.includes("unicode-range:U+0030-0039,U+0041-005A,U+0061-007A"));
});
