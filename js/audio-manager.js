const STORAGE_KEY="shah-sieg-audio-v1";
const DEFAULTS=Object.freeze({bgmVolume:70,seVolume:80,muted:false});

export class AudioManager{
  constructor(config){this.config=config;this.settings=this.load();this.unlocked=false;window.addEventListener("pointerdown",()=>{this.unlocked=true;},{once:true,capture:true});}
  load(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE_KEY))};}catch{return {...DEFAULTS};}}
  save(next){this.settings={...this.settings,...next};localStorage.setItem(STORAGE_KEY,JSON.stringify(this.settings));return this.settings;}
  setVolume(channel,value){const key=channel==="bgm"?"bgmVolume":"seVolume";return this.save({[key]:Math.max(0,Math.min(100,Number(value)))});}
  setMuted(muted){return this.save({muted:Boolean(muted)});}
  playBgm(key){return this.play("bgm",key,true);}
  playSe(key){return this.play("se",key,false);}
  play(channel,key,loop){const src=this.config?.[channel]?.[key];if(!src||!this.unlocked||this.settings.muted)return null;const audio=new Audio(src);audio.loop=loop;audio.volume=(channel==="bgm"?this.settings.bgmVolume:this.settings.seVolume)/100;audio.play().catch(()=>{});return audio;}
}

export { STORAGE_KEY as AUDIO_STORAGE_KEY, DEFAULTS as AUDIO_DEFAULTS };
