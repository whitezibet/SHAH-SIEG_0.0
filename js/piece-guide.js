import { TYPES, TYPE_NAMES, promotionTargetsForType } from "./engine.js";

const UI_PIECE_ROOT="asset/ui/ui-pieces/";
const image=file=>`${UI_PIECE_ROOT}${file}`;
const step=(dr,dc,kind="move")=>Object.freeze({dr,dc,kind});
const orthogonal=Object.freeze([[-1,0],[1,0],[0,-1],[0,1]]);
const diagonal=Object.freeze([[-1,-1],[-1,1],[1,-1],[1,1]]);
const adjacent=Object.freeze([...orthogonal,...diagonal]);
const knight=Object.freeze([[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]);

const rawEntries=[
  {type:TYPES.WRK,image:"WKR-白ベタ.png",steps:[step(-1,0),step(-2,0,"conditional"),step(1,0),step(0,-1),step(0,1)],note:"前方2マスは飛び越え不可。UAV・司令・S-Dog・BMを捕獲し、石化UAVを除去できる。"},
  {type:TYPES.UAV,image:"UAV-白.png",steps:[step(-1,0),step(-2,0,"conditional"),step(-1,-1,"capture"),step(-1,1,"capture")],note:"前進のみ。初回は2マス可、捕獲は斜め前。司令不在で石化し、司令復帰で再稼働する。"},
  {type:TYPES.KING,image:"王督-白ベタ.png",steps:adjacent.map(([dr,dc])=>step(dr,dc)),note:"攻撃されるマスへは移動できない。"},
  {type:TYPES.HEAVY_CRUISER,image:"重巡-白ベタ.png",rays:diagonal,note:"斜め4方向へ、ほかの駒に遮られるまで進む。"},
  {type:TYPES.FFH,image:"FFh-白ベタ.png",rays:orthogonal,note:"縦横4方向へ、ほかの駒に遮られるまで進む。"},
  {type:TYPES.COMMANDER,image:"司令-白ベタ.png",steps:orthogonal.map(([dr,dc])=>step(dr,dc)),note:"上下左右へ1マス。盤上へ戻ると残存する石化UAVが再稼働する。"},
  {type:TYPES.SDOG,image:"S-Dog-白ベタ.png",steps:knight.map(([dr,dc])=>step(dr,dc,"jump")),note:"L字型に移動し、途中の駒を飛び越える。"},
  {type:TYPES.BM,image:"BM-白ベタ.png",rays:[[-1,0]],steps:[step(0,-1),step(0,1)],note:"前方へ直進し、左右へは1マス。前方の駒は飛び越えられない。"},
  {type:TYPES.LIGHT_CRUISER,image:"軽巡-白ベタ.png",steps:[step(-1,-1),step(-1,0),step(-1,1),step(1,-1),step(1,1)],note:"前3方向と斜め後ろへ1マス。"},
  {type:TYPES.CARRIER,image:"空母-白ベタ.png",steps:[step(-1,-1),step(-1,0),step(-1,1),step(0,-1),step(0,1),step(1,0)],note:"前3方向・左右・真後ろへ1マス。"},
  {type:TYPES.BATTLESHIP,image:"戦艦-白ベタ.png",rays:diagonal,steps:orthogonal.map(([dr,dc])=>step(dr,dc)),note:"斜め4方向へ直進し、上下左右へ1マス。"},
  {type:TYPES.ARMORED,image:"FFhA-白ベタ.png",rays:orthogonal,steps:diagonal.map(([dr,dc])=>step(dr,dc)),note:"縦横4方向へ直進し、斜めへ1マス。"}
];

export const PIECE_GUIDE_ENTRIES=Object.freeze(rawEntries.map(entry=>Object.freeze({
  ...entry,
  name:TYPE_NAMES[entry.type],
  image:image(entry.image),
  promotions:Object.freeze(promotionTargetsForType(entry.type))
})));

const key=(row,col)=>`${row},${col}`;
export function createMovementDiagram(entry){
  const diagram=document.createElement("div");diagram.className="piece-guide-diagram";diagram.setAttribute("aria-label",`${entry.name}の移動範囲`);
  const cells=new Map();
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){const cell=document.createElement("span");cell.className="piece-guide-cell";diagram.append(cell);cells.set(key(row,col),cell);}
  const mark=(dr,dc,kind="move",end=false)=>{const cell=cells.get(key(2+dr,2+dc));if(!cell)return;cell.classList.add(kind);if(end){cell.classList.add("ray-end");cell.dataset.dr=String(dr);cell.dataset.dc=String(dc);}};
  entry.steps?.forEach(({dr,dc,kind})=>mark(dr,dc,kind));
  entry.rays?.forEach(([dr,dc])=>{mark(dr,dc,"move");mark(dr*2,dc*2,"move",true);});
  const center=cells.get(key(2,2));center.classList.add("piece-origin");const piece=document.createElement("img");piece.src=entry.image;piece.alt="";piece.setAttribute("aria-hidden","true");center.append(piece);
  return diagram;
}

