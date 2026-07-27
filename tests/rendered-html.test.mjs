import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

test("contains the complete Causality social MVP entry experience", async () => {
  const [app, layout] = await Promise.all([
    readFile(new URL("../app/causality-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /因果 Causality｜AI原生情境社交平台/);
  assert.match(app, /不是和AI聊天/);
  assert.match(app, /创建一个世界/);
  assert.match(app, /输入邀请码/);
  assert.match(app, /生成世界二维码/);
  assert.doesNotMatch(`${app}\n${layout}`, /codex-preview|react-loading-skeleton/i);
});

test("removes the temporary starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /CausalityApp/);
  assert.match(layout, /因果 Causality/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
