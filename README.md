# 艦棋 サージーク SHAH-SIE_0.0

公開用の1戦完結プロトタイプです。主人公は `siro`（シャアルート）と `28`（シャリアルート）から選択でき、既存ステージ1の相手と対局します。

## 起動方法

ES Modulesを使用するため、ローカルHTTPサーバー経由で表示します。

```sh
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。静的ファイルのみで構成されているため、そのままGitHub Pagesへ配置できます。

## テスト

Node.js 18以降で実行します。

```sh
npm test
```

## 公開版の進行

- シャアルート：主人公 `siro` 対 `28`
- シャリアルート：主人公 `28` 対 `cha`
- 勝利：対局後会話 → PLAYER WIN → クリアスチル上の会話 → GAME CLEAR
- 敗北：対局後会話 → 盤面上のGAMEOVER
- GAME CLEAR／GAMEOVERの「リトライ」は、対局前会話を省略して同じ対局を初期局面から再開します。
- ステージ選択、次ステージ進行、アルバム、スチル収集処理、敗北スチル画面は使用しません。既存素材は将来の差し替え用として残しています。

## 主な編集場所

- `js/scenario-data.js`：主人公、対戦相手、ステージ1会話、エンディング会話、クリアスチル
- `js/game-config.js`：カットイン、音声、対局演出、テキストウィンドウ、チュートリアル
- `styles.css`：タイトル・対局・結果画面の位置と外観
- `js/ui.js`：タイトル、会話、勝敗、リトライ、画面遷移
- `js/cpu-dialogue.js`：対戦相手別の焦り・王手対応台詞と、CPU着手台詞の優先順位
- `js/engine.js`：盤面状態、合法手、特殊ルール、勝敗、Undo
- `js/cpu.js`／`js/cpu-worker.js`：CPU思考

クリアスチルは `asset/stills/clear-01.webp` と `clear-02.webp`、背景は `asset/backgrounds/background-01.webp`、立ち絵は `asset/sprites/` 以下を差し替えます。会話ウィンドウ素材は `js/game-config.js` の `TEXT_WINDOW_CONFIG.imageSrc`、音源は `AUDIO_CONFIG` へ設定します。

## 開発メニュー

現在は `js/game-config.js` の `DEBUG_MODE = true` により、強制勝利・強制敗北・対局リセット・カットイン・チュートリアル・CPU設定を通常URLでも確認できます。リリース前に `DEBUG_MODE = false` へ変更するとデバッグボタンは非表示になります。非表示中でもURLへ `?debug=1` を付ければ一時的に表示できます。デバッグ勝敗でも収集・進行記録は行いません。
