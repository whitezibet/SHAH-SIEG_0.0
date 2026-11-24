import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { TYPES } from "../js/engine.js";
import { PIECE_GUIDE_ENTRIES } from "../js/piece-guide.js";

test("早見表は12駒を重複なく収録し全画像が存在する",()=>{
  assert.equal(PIECE_GUIDE_ENTRIES.length,12);
  assert.equal(new Set(PIECE_GUIDE_ENTRIES.map(entry=>entry.type)).size,12);
  for(const entry of PIECE_GUIDE_ENTRIES)assert(existsSync(new URL(`../${entry.image}`,import.meta.url)),`${entry.name}: ${entry.image}`);
});

test("特殊移動と成り先が現行エンジン定義に同期する",()=>{
  const byType=Object.fromEntries(PIECE_GUIDE_ENTRIES.map(entry=>[entry.type,entry]));
  assert(byType[TYPES.UAV].steps.some(step=>step.dr===-2&&step.kind==="conditional"));
  assert.equal(byType[TYPES.UAV].steps.filter(step=>step.kind==="capture").length,2);
  assert.equal(byType[TYPES.SDOG].steps.filter(step=>step.kind==="jump").length,8);
  assert.deepEqual(byType[TYPES.SDOG].promotions,[TYPES.CARRIER]);
  assert.deepEqual(byType[TYPES.LIGHT_CRUISER].promotions,[TYPES.CARRIER]);
  assert.deepEqual(byType[TYPES.CARRIER].promotions,[]);
  assert.deepEqual(byType[TYPES.HEAVY_CRUISER].promotions,[TYPES.BATTLESHIP]);
  assert.deepEqual(byType[TYPES.FFH].promotions,[TYPES.ARMORED]);
});
