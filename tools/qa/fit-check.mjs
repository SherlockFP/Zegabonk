import { chromium } from "playwright";

const sizes = [
  { name: "1080p", w: 1920, h: 1080 },
  { name: "1080p-chrome", w: 1920, h: 940 },
  { name: "1366", w: 1366, h: 768 },
  { name: "1280", w: 1280, h: 720 },
];

function overflowReport() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const check = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const r = el.getBoundingClientRect();
    const clipped = r.bottom > vh + 2 || r.right > vw + 2 || r.top < -2 || r.left < -2;
    return {
      sel,
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      clipped,
      overflowY: r.bottom - vh,
    };
  };
  return {
    vw, vh,
    start: check("#startScreen"),
    shell: check(".startShell"),
    brand: check(".brandBlock"),
    layout: check(".startMenuLayout"),
    brief: check(".runBrief"),
    footer: check(".menuFooter"),
    play: check("#playBtn"),
    lobby: check("#lobbyScreen"),
    lobbyPanel: check(".lobbyPanel"),
    hud: check("#hud"),
    clock: check("#hudClockStack"),
    radar: check("#radarWrap"),
    xp: check("#xpBarBottom"),
    kill: check("#topRightHud"),
  };
}

const browser = await chromium.launch();
for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#startScreen", { timeout: 30000 });
  await page.waitForTimeout(900);
  const menu = await page.evaluate(overflowReport);
  await page.screenshot({ path: `tests/artifacts/fit-menu-${s.name}.png` });
  console.log("\n=== MENU", s.name, menu.vw + "x" + menu.vh, "===");
  for (const [k, v] of Object.entries(menu)) {
    if (typeof v === "object" && v && v.clipped) console.log("CLIP", k, v);
  }
  console.log("play", menu.play, "footer", menu.footer, "brief", menu.brief, "brand", menu.brand);

  await page.click("#playBtn");
  await page.waitForSelector("#lobbyScreen:not(.hidden)", { timeout: 15000 });
  await page.waitForTimeout(500);
  const lobby = await page.evaluate(overflowReport);
  await page.screenshot({ path: `tests/artifacts/fit-lobby-${s.name}.png` });
  console.log("=== LOBBY", s.name, "===");
  for (const [k, v] of Object.entries(lobby)) {
    if (typeof v === "object" && v && v.clipped) console.log("CLIP", k, v);
  }
  console.log("lobbyPanel", lobby.lobbyPanel);

  if (s.name === "1080p" || s.name === "1366") {
    await page.click("#lobbyStartBtn");
    await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
    await page.waitForTimeout(1200);
    const hud = await page.evaluate(overflowReport);
    await page.screenshot({ path: `tests/artifacts/fit-hud-${s.name}.png` });
    console.log("=== HUD", s.name, "===");
    for (const [k, v] of Object.entries(hud)) {
      if (typeof v === "object" && v && v.clipped) console.log("CLIP", k, v);
    }
    console.log("clock", hud.clock, "radar", hud.radar, "xp", hud.xp, "kill", hud.kill);
  }
  await page.close();
}
await browser.close();
