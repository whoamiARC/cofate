import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("contains the complete CoFate AI social product", async () => {
  const [app, marketing, layout, deepseek, sessionRoute, manifest, requestGuard] = await Promise.all([
    readFile(new URL("../app/causality-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/marketing-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/deepseek.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/sessions/[code]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../lib/request-guard.ts", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /CoFate 因果/);
  assert.match(app, /你想进入哪一种因果/);
  assert.match(app, /匹配此刻在线的人/);
  assert.match(app, /剧情/);
  assert.match(app, /WORLD_PRESETS/);
  assert.match(app, /邀请二维码/);
  assert.match(app, /QRCodeSVG/);
  assert.match(marketing, /一个二维码/);
  assert.match(marketing, /下载 Android APK/);
  assert.match(marketing, /Android 公测 APK/);
  assert.match(manifest, /"display": "standalone"/);
  assert.doesNotMatch(app, /api\.qrserver\.com/);
  assert.match(deepseek, /deepseek-v4-flash/);
  assert.match(deepseek, /thinking: \{ type: "disabled" \}/);
  assert.match(sessionRoute, /waitUntil\(generateSessionWorld/);
  assert.match(sessionRoute, /x-player-token/);
  assert.match(requestGuard, /request_limits/);
  assert.match(requestGuard, /status: 429/);
  assert.doesNotMatch(`${app}\n${layout}`, /codex-preview|react-loading-skeleton/i);
  await access(new URL("public/downloads/CoFate-Android-Beta-v0.1.3.apk", templateRoot));
});

test("removes the temporary starter preview", async () => {
  const [page, appPage, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /MarketingHome/);
  assert.match(appPage, /CausalityApp/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
