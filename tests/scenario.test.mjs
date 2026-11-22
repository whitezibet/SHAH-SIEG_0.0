import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { ROUTES, ROUTE_DIALOGUE, CHARACTERS, expressionLayer } from "../js/scenario-data.js";

test("公開用2ルートは既存ステージ1の相手との1戦だけで完結する",()=>{
  assert.deepEqual(ROUTES.shaa.stages.map(stage=>stage.opponentId),["28"]);
  assert.deepEqual(ROUTES.sharia.stages.map(stage=>stage.opponentId),["cha"]);
  assert.equal(ROUTES.shaa.hero,"シロウズ");
  assert.equal(ROUTES.shaa.stages[0].opponent.name,"シャリア･ブル");
  assert.equal(ROUTES.sharia.stages[0].opponent.name,"シロウズ");
  assert.equal(ROUTES.shaa.stages[0].label,"STAGE 1 / 1");
  assert.equal(ROUTES.sharia.stages[0].label,"STAGE 1 / 1");
  assert.equal(ROUTES.shaa.clearStill,"asset/stills/clear-01.webp");
  assert.equal(ROUTES.sharia.clearStill,"asset/stills/clear-02.webp");
});

test("全ステージに4種類の会話と3表情素材がある",()=>{
  for(const route of Object.values(ROUTES))for(const stage of route.stages){
    for(const key of ["preBattleScene","battleIntro","battleOutroWin","battleOutroLose"])assert(stage.scenes[key].length>0);
    for(const expression of ["n","ase","nge"])assert(stage.opponent.sprites[expression].split("?")[0].endsWith(`_${expression}.webp`));
    assert(expressionLayer(stage.opponent,"ase","battle").src.includes("_ase.webp"));
  }
});

test("対局前後とクリア会話はルート別の独立データを使用する",()=>{
  for(const key of ["preBattleScene","battleIntro","battleOutroWin","battleOutroLose","clearScene"]){
    assert.notStrictEqual(ROUTE_DIALOGUE.shaa[key],ROUTE_DIALOGUE.sharia[key]);
    assert.notDeepEqual(ROUTE_DIALOGUE.shaa[key],ROUTE_DIALOGUE.sharia[key]);
  }
  assert.equal(ROUTES.shaa.stages[0].scenes.preBattleScene[0].speaker,"シャリア･ブル");
  assert.equal(ROUTES.sharia.stages[0].scenes.preBattleScene[0].speaker,"シロウズ");
});

test("両ルートとも既存ステージ1背景を使用する",()=>{
  assert.deepEqual(ROUTES.shaa.stages.map(stage=>stage.background.src),["asset/backgrounds/background-01.webp"]);
  assert.deepEqual(ROUTES.sharia.stages.map(stage=>stage.background.src),["asset/backgrounds/background-01.webp"]);
});

test("シャリアルートの対戦相手はsiroの立ち絵を使用する",()=>{
  const stage=ROUTES.sharia.stages[0];
  assert.equal(stage.opponentId,"cha");
  assert.equal(stage.opponentSpriteId,"siro");
  for(const expression of ["n","ase","nge"])assert(stage.opponent.sprites[expression].includes(`/spr_siro_${expression}.webp?v=`));
});

test("両ルートにクリアスチル会話がある",()=>{
  assert.equal(ROUTES.shaa.protagonistId,"siro");assert.equal(ROUTES.sharia.protagonistId,"28");
  for(const route of Object.values(ROUTES)){assert(route.titlePortrait.includes(".webp?v="));assert(route.clearScene.length>=2);assert(route.clearScene.every(line=>line.speaker&&line.text));}
  assert(ROUTES.shaa.clearScene.some(line=>line.speaker==="シャリア･ブル"));
  assert(ROUTES.sharia.clearScene.some(line=>line.speaker==="シロウズ"));
});

test("公開版で使用する全立ち絵が存在し更新識別子を共有する",()=>{
  for(const id of ["28","siro"])for(const expression of ["n","ase","nge"]){
    const path=new URL(`../asset/sprites/spr_${id}_${expression}.webp`,import.meta.url);
    assert(existsSync(path),`${id} ${expression} がありません`);
    assert(CHARACTERS[id].sprites[expression].includes("?v="));
  }
  assert.equal(ROUTES.shaa.titlePortrait,CHARACTERS.siro.sprites.n);
  assert.equal(ROUTES.sharia.titlePortrait,CHARACTERS["28"].sprites.n);
});
