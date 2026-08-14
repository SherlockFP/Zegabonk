import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "./styles.css";
import { GameApp } from "./app/GameApp";

const canvas = document.querySelector<HTMLCanvasElement>("#world");
const root = document.querySelector<HTMLElement>("#app");

if (!canvas || !root) throw new Error("ZEGABONK V2 root elements are missing.");

const game = new GameApp(canvas, root);
game.start();
