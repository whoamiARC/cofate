import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("contains the complete CoFate AI social product", async () => {
  const [app, layout, deepseek, sessionRoute] = await Promise.all([
    readFile(new URL("../app/causality-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/deepseek.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/sessions/[code]/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /因果 CoFate/);
  assert.match(app, /不是和 AI 聊天/);
  assert.match(app, /一个人，去匹配/);
  assert.match(app, /邀请二维码/);
  assert.match(app, /QRCodeSVG/);
  assert.doesNotMatch(app, /api\.qrserver\.com/);
  assert.match(deepseek, /deepseek-v4-flash/);
  assert.match(sessionRoute, /x-player-token/);
  assert.doesNotMatch(`${app}\n${layout}`, /codex-preview|react-loading-skeleton/i);
});

test("removes the temporary starter preview", async () => {
  const [page, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /CausalityApp/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
