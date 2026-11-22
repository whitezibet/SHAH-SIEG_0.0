const KEY="shah-sieg-progress-v1";
const fresh=()=>({routes:{shaa:{unlockedStage:1,cleared:false},sharia:{unlockedStage:1,cleared:false}},stills:[],opponents:[],tutorialSeen:{shaa:false,sharia:false}});
const migrate=saved=>{const base=fresh();if(!saved?.routes||!Array.isArray(saved.stills))return base;return {...saved,routes:{...base.routes,...saved.routes},stills:[...new Set(saved.stills)],opponents:Array.isArray(saved.opponents)?[...new Set(saved.opponents)]:[],tutorialSeen:{...base.tutorialSeen,...saved.tutorialSeen}};};
export function loadProgress(){try{return migrate(JSON.parse(localStorage.getItem(KEY)));}catch{return fresh();}}
export function saveProgress(progress){localStorage.setItem(KEY,JSON.stringify(progress));return progress;}
export function recordTutorialSeen(progress,routeId){const next=migrate(structuredClone(progress));next.tutorialSeen[routeId]=true;return saveProgress(next);}
export const PROGRESS_STORAGE_KEY=KEY;
