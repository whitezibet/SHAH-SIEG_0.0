import { ShahSiegGame } from "./engine.js";
import { GameUI } from "./ui.js?v=20261123-sweat";

const game = new ShahSiegGame();
const ui = new GameUI(game);
window.shahSieg = { game, ui };
