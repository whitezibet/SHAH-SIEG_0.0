export function createAnimationPlan(state, move) {
  if (move.kind === "drop") return { kind:"drop", from:null, to:{...move.to}, effect:null };
  const captureSquare = move.enPassant ? { row:move.from.row, col:move.to.col } : { ...move.to };
  const captured = state.board[captureSquare.row]?.[captureSquare.col] ?? null;
  return {
    kind:"move",
    from:{...move.from},
    to:{...move.to},
    captureSquare,
    captured:Boolean(captured),
    effect:move.removal ? "obstacleRemoval" : captured ? "capture" : null
  };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export class BattleAnimationController {
  constructor(board, config) { this.board=board; this.config=config; this.epoch=0; this.activeAnimations=new Set(); this.nodes=new Set(); }
  square({row,col}) { return this.board.children[row*10+col] ?? null; }
  cancel() {
    this.epoch+=1;
    for (const animation of this.activeAnimations) animation.cancel();
    this.activeAnimations.clear();
    for (const node of this.nodes) node.remove();
    this.nodes.clear();
    this.board.querySelectorAll(".animation-hidden").forEach(node=>node.classList.remove("animation-hidden"));
  }
  async play(plan) {
    if (!plan) return true;
    if (plan.kind==="drop") return this.playDrop(plan);
    const sourceSquare=this.square(plan.from),targetSquare=this.square(plan.to),sourceVisual=sourceSquare?.querySelector("img,.piece-fallback");
    if (!sourceSquare||!targetSquare||!sourceVisual) return true;
    const epoch=++this.epoch,reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const moving=sourceVisual.cloneNode(true);moving.classList.add("moving-piece");
    Object.assign(moving.style,{left:`${sourceSquare.offsetLeft}px`,top:`${sourceSquare.offsetTop}px`,width:`${sourceSquare.offsetWidth}px`,height:`${sourceSquare.offsetHeight}px`});
    this.board.append(moving);this.nodes.add(moving);sourceVisual.classList.add("animation-hidden");
    const dx=targetSquare.offsetLeft-sourceSquare.offsetLeft,dy=targetSquare.offsetTop-sourceSquare.offsetTop,duration=reduced?this.config.reducedMoveDurationMs:this.config.moveDurationMs;
    const animation=moving.animate([{transform:"translate(0,0)"},{transform:`translate(${dx}px,${dy}px)`}],{duration,easing:"cubic-bezier(.22,.72,.25,1)",fill:"forwards"});
    this.activeAnimations.add(animation);try{await animation.finished;}catch{return false;}finally{this.activeAnimations.delete(animation);}
    if(epoch!==this.epoch)return false;
    if(plan.effect){const capturedVisual=this.square(plan.captureSquare)?.querySelector("img,.piece-fallback");capturedVisual?.classList.add("animation-hidden");await this.playEffect(plan.effect,plan.captureSquare,epoch,reduced);}
    if(epoch!==this.epoch)return false;
    moving.remove();this.nodes.delete(moving);sourceVisual.classList.remove("animation-hidden");return true;
  }
  async playDrop(plan) {
    const square=this.square(plan.to),visual=square?.querySelector("img,.piece-fallback");if(!visual)return true;
    const epoch=++this.epoch,reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,duration=reduced?this.config.reducedMoveDurationMs:this.config.moveDurationMs;
    const animation=visual.animate([{opacity:0,transform:"scale(.45)"},{opacity:1,transform:"scale(1)"}],{duration,easing:"cubic-bezier(.2,.8,.25,1)",fill:"both"});
    this.activeAnimations.add(animation);try{await animation.finished;}catch{return false;}finally{this.activeAnimations.delete(animation);}return epoch===this.epoch;
  }
  async playEffect(type, squarePosition, epoch, reduced) {
    const settings=this.config[type],square=this.square(squarePosition);if(!settings||!square)return;
    const effect=document.createElement("span");effect.className=`board-effect effect-${type}`;
    Object.assign(effect.style,{left:`${square.offsetLeft}px`,top:`${square.offsetTop}px`,width:`${square.offsetWidth}px`,height:`${square.offsetHeight}px`,"--effect-duration":`${reduced?100:settings.durationMs}ms`});
    if(settings.image?.src){const image=document.createElement("img");image.alt=settings.image.alt??"";image.src=settings.image.src;image.style.objectFit=settings.image.fit??"contain";image.style.transform=`scale(${settings.image.scale??1})`;image.addEventListener("load",()=>effect.classList.add("has-image"));image.addEventListener("error",()=>image.remove());effect.append(image);}
    this.board.append(effect);this.nodes.add(effect);await delay(reduced?100:settings.durationMs);if(epoch===this.epoch){effect.remove();this.nodes.delete(effect);}
  }
}
