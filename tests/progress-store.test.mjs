import test from "node:test";
import assert from "node:assert/strict";
import { loadProgress, recordTutorialSeen } from "../js/progress-store.js";

const installStorage=()=>{const values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test("旧セーブデータを壊さず初回チュートリアル状態を補完する",()=>{
  installStorage();localStorage.setItem("shah-sieg-progress-v1",JSON.stringify({routes:{shaa:{unlockedStage:2,cleared:false}},stills:[]}));const progress=loadProgress();assert.deepEqual(progress.opponents,[]);assert.equal(progress.routes.shaa.unlockedStage,2);assert.equal(progress.routes.sharia.unlockedStage,1);
  assert.deepEqual(progress.tutorialSeen,{shaa:false,sharia:false});
});

test("初回チュートリアルの表示済み状態はルートごとに保存される",()=>{
  installStorage();let progress=loadProgress();progress=recordTutorialSeen(progress,"shaa");assert.equal(progress.tutorialSeen.shaa,true);assert.equal(progress.tutorialSeen.sharia,false);assert.equal(loadProgress().tutorialSeen.shaa,true);
});
