const emptyLayer = (fit, positionY) => ({
  src: "",
  fit,
  positionX: 50,
  positionY,
  offsetX: 0,
  offsetY: 0,
  scale: 1
});

const emptyCutinImage = () => ({
  src: "",
  fit: "contain",
  positionX: 50,
  positionY: 50,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  alt: ""
});

// 開発中は true。リリース前に false へ戻すとデバッグボタンがすべて非表示になる。
// false の場合でも、確認用URLへ ?debug=1 を付ければ一時的に表示できる。
export const DEBUG_MODE = false;

export const CUTIN_CONFIG = Object.freeze({
  opening: {
    text: "王に勝利を",
    ruby: "サージーク",
    theme: "opening",
    direction: "left",
    durationMs: 1800,
    image: { ...emptyCutinImage(), src:"asset/cutins/opening.webp", alt:"開戦カットイン" },
    sound: null
  },
  check: {
    text: "王に死を",
    ruby: "サーマット",
    theme: "check",
    direction: "right",
    durationMs: 1250,
    resultDelayMs: 180,
    image: { ...emptyCutinImage(), src:"asset/cutins/check.webp", alt:"王手カットイン" },
    sound: null
  }
});

// 将来、石化専用画像を用意した場合は陣営別にパスを設定する。
// 空文字の場合は、既存のUAV画像へCSSの石化効果を適用する。
export const OBSTACLE_VISUAL_CONFIG = Object.freeze({
  imageSrcBySide: Object.freeze({ white: "asset/pieces/UAV_stone.png", black: "asset/pieces/UAV_stone.png" })
});

export const CPU_CONFIG = Object.freeze({
  defaultMode: "cpu",
  thinkDelayMs: 260,
  workerUrl: "js/cpu-worker.js",
  stages: Object.freeze(["beginner", "intermediate", "advanced"]),
  expression: Object.freeze({ enterDisadvantaged: -650, exitDisadvantaged: -300 })
});

// CPU焦り状態の汗エフェクト。positionは立ち絵エリア内の%、directionXは左右方向です。
export const SWEAT_EFFECT_CONFIG = Object.freeze({
  durationMs:760,
  repeatMinMs:3800,
  repeatMaxMs:6800,
  minDrops:1,
  maxDrops:3,
  characters:Object.freeze({
    "28":Object.freeze({positionX:66,positionY:24,directionX:1,scale:1}),
    cha:Object.freeze({positionX:35,positionY:22,directionX:-1,scale:1}),
    siro:Object.freeze({positionX:35,positionY:22,directionX:-1,scale:1}),
    qwa:Object.freeze({positionX:64,positionY:24,directionX:1,scale:1}),
    default:Object.freeze({positionX:62,positionY:24,directionX:1,scale:1})
  })
});

const emptyEffectImage = () => ({
  src: "",
  fit: "contain",
  scale: 1,
  alt: ""
});

export const BATTLE_ANIMATION_CONFIG = Object.freeze({
  moveDurationMs: 250,
  reducedMoveDurationMs: 70,
  capture: Object.freeze({ durationMs: 340, image: emptyEffectImage(), sound: null }),
  obstacleRemoval: Object.freeze({ durationMs: 400, image: emptyEffectImage(), sound: null })
});

export const IMPACT_SHAKE_CONFIG = Object.freeze({ durationMs:340, strength:1, reducedMotion:false });

// 空文字の項目は無音のまま安全に動作する。素材追加時はここへパスを設定する。
export const AUDIO_CONFIG = Object.freeze({
  bgm:Object.freeze({title:"",novel:"",battle:"",result:""}),
  se:Object.freeze({button:"",move:"",capture:"",obstacleRemoval:"",check:"",decision:""})
});

// imageSrcへ説明画像を追加すると、遊び方を複数ページで表示できる。
export const HELP_GUIDE_CONFIG = Object.freeze({
  pages:Object.freeze([Object.freeze({imageSrc:"asset/Rule.png",alt:"艦棋の操作説明"})])
});

// STAGE 1初回チュートリアルの表示速度とミニ盤面上の配置。
export const TUTORIAL_CONFIG = Object.freeze({
  loopDurationMs:4200,
  pieceStart:Object.freeze({row:2,col:1}),
  pieceEnd:Object.freeze({row:1,col:1})
});

export const TITLE_ANIMATION_CONFIG = Object.freeze({characterSlideMs:560});

// imageSrcへ透過WebPを設定すると、全会話画面で同じ装飾画像を使用する。
// 各modeの位置・寸法とspeaker/textはCSS値として個別調整できる。
export const TEXT_WINDOW_CONFIG = Object.freeze({
  imageSrc:"", imageFit:"contain",
  modes:Object.freeze({
    novel:Object.freeze({left:"6%",top:"72%",width:"88%",height:"24%",padding:"5.5% 4.5% 3.2%"}),
    battle:Object.freeze({left:"15.2%",top:"82.3%",width:"77.5%",height:"17.1%",padding:"0.1% 3.6% 2%"}),
    still:Object.freeze({left:"6%",top:"72%",width:"88%",height:"24%",padding:"5.5% 4.5% 3.2%"})
  }),
  speaker:Object.freeze({left:"3%",top:"-12%",width:"28%",height:"18%",fontSize:"clamp(11px,1.25vmin,15px)"}),
  text:Object.freeze({paddingTop:"0.1%",fontSize:"clamp(18px,1.55vmin,18px)",lineHeight:"1.5"})
});

export const GAME_UI_CONFIG = Object.freeze({
  debug: {
    enabledByDefault: DEBUG_MODE,
    queryParameter: "debug"
  },
  stages: [1, 2, 3].map(number => ({
    id: number,
    label: `STAGE ${number} / 3`,
    protagonistName: "主人公",
    opponentName: "対戦相手",
    cpuDifficulty: CPU_CONFIG.stages[number - 1],
    expressionThresholds: { ...CPU_CONFIG.expression },
    character: {
      background: { ...emptyLayer("cover", 50), src: "asset/testbuck.png" },
      portrait: { ...emptyLayer("contain", 100), src: "asset/testman.png" }
    }
  }))
});
