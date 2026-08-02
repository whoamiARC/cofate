import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("contains the complete CoFate AI social product", async () => {
  const [app, marketing, layout, deepseek, sessionRoute, manifest, requestGuard, scriptCatalog, scriptTruths, sessionService, schema] = await Promise.all([
    readFile(new URL("../app/causality-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/marketing-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/deepseek.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/sessions/[code]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../lib/request-guard.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/script-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/script-truths.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/session-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /CoFate 因果/);
  assert.match(app, /选择今晚的/);
  assert.match(app, /匹配此刻在线的真人/);
  assert.match(app, /剧情/);
  assert.match(app, /SCRIPT_CATALOG/);
  assert.match(app, /今日免费额度/);
  assert.match(app, /邀请二维码/);
  assert.match(app, /QRCodeSVG/);
  assert.match(marketing, /一个二维码/);
  assert.match(marketing, /下载安卓版/);
  assert.match(marketing, /Android 公测 APK/);
  assert.match(marketing, /进入网页版世界/);
  assert.match(marketing, /下载安卓版/);
  assert.match(marketing, /安装苹果版/);
  assert.doesNotMatch(app, /AppOnlyGate/);
  assert.match(manifest, /"display": "standalone"/);
  assert.doesNotMatch(app, /api\.qrserver\.com/);
  assert.match(deepseek, /deepseek-v4-flash/);
  assert.match(deepseek, /thinking: \{ type: "disabled" \}/);
  assert.match(deepseek, /mustEnd/);
  assert.match(scriptCatalog, /endingCondition/);
  assert.match(scriptCatalog, /第7回合强制结束晚宴/);
  assert.equal((scriptCatalog.match(/\bcategory: "(?:单人|聚会|双人|都市|校园|轻悬疑|推理|科幻|奇幻|古风|末日|情感|喜剧|冒险)"/g) ?? []).length, 38);
  assert.match(scriptCatalog, /category: "单人"/);
  assert.match(scriptCatalog, /只向明天亮起的灯塔/);
  assert.match(scriptCatalog, /category: "科幻"/);
  assert.match(scriptCatalog, /category: "奇幻"/);
  assert.match(scriptCatalog, /category: "古风"/);
  assert.match(scriptCatalog, /category: "末日"/);
  assert.match(scriptCatalog, /category: "情感"/);
  assert.match(scriptCatalog, /category: "喜剧"/);
  assert.match(scriptCatalog, /category: "推理"/);
  assert.match(scriptCatalog, /category: "冒险"/);
  assert.match(deepseek, /不要把非悬疑题材强行写成恐怖或规则怪谈/);
  assert.match(deepseek, /completedTasks/);
  assert.match(deepseek, /truthReveal/);
  assert.match(deepseek, /fallbackTurn/);
  assert.match(deepseek, /底层真相/);
  assert.match(app, /TRUTH REVEALED/);
  assert.match(app, /全员身份与私人任务/);
  assert.match(app, /真实身份规则/);
  assert.match(sessionService, /endingPlayers/);
  assert.match(sessionService, /nextWorld\.truthReveal/);
  assert.doesNotMatch(app, /script-truths/);
  const catalogIds = [...scriptCatalog.matchAll(/\{\s*id:\s*"([a-z0-9-]+)",\s*mark:/g)].map((match) => match[1]).sort();
  const truthIds = [...scriptTruths.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{/gm)].map((match) => match[1]).sort();
  assert.equal(truthIds.length, 38);
  assert.deepEqual(truthIds, catalogIds);
  assert.match(scriptCatalog, /零号避难所/);
  assert.match(scriptCatalog, /固定 4 人/);
  assert.match(app, /私密行动/);
  assert.match(app, /选择你要成为谁/);
  assert.match(app, /匿名密语/);
  assert.match(app, /getScriptCoverThumbnail/);
  assert.match(app, /loading=\{priority \? "eager" : "lazy"\}/);
  assert.match(app, /fetchPriority=\{priority \? "high" : "auto"\}/);
  assert.match(app, /timeline-heading/);
  assert.match(app, /choice-dock-head/);
  assert.match(app, /choice-dock-mobile-bar/);
  assert.match(app, /展开选择/);
  assert.match(app, /public-rules/);
  assert.match(app, /script-card/);
  assert.match(sessionService, /entry\.kind === "choice"/);
  assert.match(sessionService, /const duplicate = Boolean\(existing\)/);
  assert.match(sessionService, /recoverReadyTurn/);
  assert.match(sessionRoute, /retry_turn/);
  assert.match(app, /AmbientMusicToggle/);
  assert.match(app, /cofate-night-loop\.mp3/);
  assert.match(app, /立即重新演算/);
  assert.match(schema, /session_choice_unique/);
  assert.match(schema, /where\(sql`\$\{table\.kind\} = 'choice'`\)/);
  assert.match(sessionService, /sessionResults/);
  assert.match(schema, /player_profiles/);
  assert.match(sessionRoute, /waitUntil\(generateSessionWorld/);
  assert.match(sessionRoute, /x-player-token/);
  assert.match(requestGuard, /request_limits/);
  assert.match(requestGuard, /status: 429/);
  const covers = (await readdir(new URL("../public/covers/", import.meta.url))).filter((file) => file.endsWith(".webp"));
  assert.equal(covers.length, 38);
  const coverThumbnails = (await readdir(new URL("../public/covers/small/", import.meta.url))).filter((file) => file.endsWith(".webp"));
  assert.equal(coverThumbnails.length, 38);
  assert.doesNotMatch(`${app}\n${layout}`, /codex-preview|react-loading-skeleton/i);
  await access(new URL("public/downloads/CoFate-Android-Beta-v0.1.4.apk", templateRoot));
  await access(new URL("public/audio/cofate-night-loop.mp3", templateRoot));
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
