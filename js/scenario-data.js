// 同名の立ち絵を差し替えた際、公開環境のブラウザキャッシュを更新する識別子。
export const CHARACTER_ASSET_VERSION="20261121-142338";
const versioned=path=>`${path}?v=${CHARACTER_ASSET_VERSION}`;
const sprite=(id,expression)=>versioned(`asset/sprites/spr_${id}_${expression}.webp`);
const layer=(src,{fit="contain",positionX=50,positionY=100,offsetX=0,offsetY=0,scale=1}={})=>({src,fit,positionX,positionY,offsetX,offsetY,scale});
const CHARACTER_NAMES=Object.freeze({cha:"シロウズ","28":"シャリア･ブル"});

export const CHARACTERS=Object.freeze(Object.fromEntries(["28","34","26","cha","siro","qwa"].map(id=>[id,Object.freeze({
  id,name:CHARACTER_NAMES[id]??id,
  sprites:Object.freeze({n:sprite(id,"n"),ase:sprite(id,"ase"),nge:sprite(id,"nge")}),
  novel:Object.freeze({positionX:50,positionY:100,offsetX:0,offsetY:0,scale:1}),
  battle:Object.freeze({positionX:50,positionY:80,offsetX:0,offsetY:0,scale:1.2})
})])));

// speaker は "hero" または "opponent" を指定すると、各ルートの表示名へ自動変換されます。
export const ROUTE_DIALOGUE=Object.freeze({
  shaa:Object.freeze({
    preBattleScene:Object.freeze([
      {speaker:"opponent",text:"おや、シロウズくんではないですか。今日はいったいどうされたので？",expression:"n"},
      {speaker:"hero",text:"面白いものを拾ってな。きみと遊ぼうと思って。",expression:"n"},
      {speaker:"opponent",text:"ははあ、艦棋ですか。大佐とは戦時中随分嗜みましたが……シロウズくんとは初めて指しますね。",expression:"n"},
      {speaker:"hero",text:"私も艦棋は久方ぶりだが……手加減無用だ。いいな？",expression:"n"},
      {speaker:"opponent",text:"おやおや、お気づきですか。悪い顔をしていらっしゃいます。何をさせられるやら。",expression:"n"}
    ]),
    battleIntro:Object.freeze([
      {speaker:"opponent",text:"いつでも始められますよ。",expression:"n"},
      {speaker:"hero",text:"艦隊前進。先攻は私で構わないな？",expression:"n"}
    ]),
    battleOutroWin:Object.freeze([
      {speaker:"opponent",text:"は、あ……どうなってるんです、これ……",expression:"nge"},
      {speaker:"hero",text:"すまない、シャリア･ブル。私の勝ちだ。",expression:"nge"}
    ]),
    battleOutroLose:Object.freeze([
      {speaker:"opponent",text:"……あの、大丈夫ですか？",expression:"n"},
      {speaker:"hero",text:"私は、弱い…………",expression:"ase"}
    ]),
    clearScene:Object.freeze([
      {speaker:"opponent",text:"熱い……もしやそういうオモチャですか、これ……"},
      {speaker:"hero",text:"ああ、仕組みは分からんが劣勢になるほどいたずらに性感を刺激される、そういうオトナのオモチャのようだ"},
      {speaker:"opponent",text:"ふふ、全く低俗極まりない。それで、シロウズくんは私を負かせてどうなさるおつもりで……？"},
      {speaker:"hero",text:"無論、敗者は勝者が美味しく頂かせてもらうさ、"},
      {speaker:"opponent",text:"いいですよ、負けは負けですから。お好きになさってください……♡"},

    ])
  }),
  sharia:Object.freeze({
    preBattleScene:Object.freeze([
      {speaker:"opponent",text:"ゲームをしよう、シャリア。いいものを拾った。",expression:"n"},
      {speaker:"hero",text:"艦棋ですか、これはまた懐かしい。大佐とは随分遊びましたね。",expression:"n"},
      {speaker:"opponent",text:"何、ただの艦棋じゃあないさ。まあ遊んでみてのお楽しみだな。",expression:"n"},
      {speaker:"hero",text:"良からぬことを企まれているお顔です。さて、どんな仕掛けが施されているやら……",expression:"n"}
    ]),
    battleIntro:Object.freeze([
      {speaker:"opponent",text:"いつでも始められるぞ。",expression:"n"},
      {speaker:"hero",text:"ひと勝負と行きましょうか",expression:"n"}
    ]),
    battleOutroWin:Object.freeze([
      {speaker:"opponent",text:"はぁっ、見事だ……君の勝ちだな。",expression:"nge"},
      {speaker:"hero",text:"シロウズくん？ 顔色がよくないようですが……",expression:"nge"}
    ]),
    battleOutroLose:Object.freeze([
      {speaker:"opponent",text:"ふう。私の勝ちだな！ ……今の気分はどうだ？",expression:"n"},
      {speaker:"hero",text:"なん、ですかこれ……、体が熱い………",expression:"ase"}
    ]),
    clearScene:Object.freeze([
      {speaker:"hero",text:"シロウズくん？"},
      {speaker:"opponent",text:"ふふ、負かされてしまうとは……君は強いな。"},
      {speaker:"hero",text:"一体、どうされたので？ あの艦棋は何です。"},
      {speaker:"opponent",text:"つまらない仕掛けさ、負けが込むといたずらに性感を刺激される。"},
      {speaker:"hero",text:"ははあ、なんと低俗な…………つまり、貴方はそういう類の悪戯を仕掛けたと。私に黙って。"},
      {speaker:"opponent",text:"すまなかった。詫びと言ってはなんだが……この身はきみの好きにしてもいいぞ……♡"},
      {speaker:"hero",text:"全く、勝っても負けても貴方得ではないですか。"}
    ])
  })
});

const resolveDialogue=(lines,hero,opponent)=>Object.freeze(lines.map(line=>Object.freeze({...line,speaker:line.speaker==="hero"?hero:line.speaker==="opponent"?opponent.name:line.speaker})));
const makeScenes=(routeId,hero,opponent)=>Object.freeze(Object.fromEntries(["preBattleScene","battleIntro","battleOutroWin","battleOutroLose"].map(key=>[key,resolveDialogue(ROUTE_DIALOGUE[routeId][key],hero,opponent)])));

const route=(id,name,hero,protagonistId,opponents,clearStill,opponentSpriteIds={})=>{
const clearOpponent=CHARACTERS[opponents[0]];
return Object.freeze({id,name,hero,protagonistId,titlePortrait:CHARACTERS[protagonistId].sprites.n,clearStill,clearScene:resolveDialogue(ROUTE_DIALOGUE[id].clearScene,hero,clearOpponent),stages:Object.freeze(opponents.map((opponentId,index)=>{const baseOpponent=CHARACTERS[opponentId],opponentSpriteId=opponentSpriteIds[opponentId]??opponentId,opponent=opponentSpriteId===opponentId?baseOpponent:Object.freeze({...baseOpponent,sprites:CHARACTERS[opponentSpriteId].sprites});return Object.freeze({
  id:index+1,label:"STAGE 1 / 1",opponentId,opponentSpriteId,opponent,
  background:layer(`asset/backgrounds/background-0${index+1}.webp`,{fit:"cover",positionY:50}),
  novelBackgroundPosition:{x:50,y:50},battleBackgroundPosition:{x:50,y:50},
  scenes:makeScenes(id,hero,opponent)
});}))});
};

export const ROUTES=Object.freeze({
  shaa:route("shaa","シャアルート","シロウズ","siro",["28"],"asset/stills/clear-01.webp"),
  sharia:route("sharia","シャリアルート","シャリア","28",["cha"],"asset/stills/clear-02.webp",{cha:"siro"})
});

export const DEFAULT_ROUTE_ID="shaa";
export const expressionLayer=(character,expression="n",mode="battle")=>layer(character.sprites[expression]??character.sprites.n,{...(character[mode]??{})});
