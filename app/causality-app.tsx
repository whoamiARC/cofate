"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { PlayerProfile, SessionEntryView, SessionView } from "../lib/session-types";
import { getScriptCover, getScriptCoverThumbnail, getScriptMechanics, SCRIPT_CATALOG, SCRIPT_CATEGORIES, type ScriptCatalogItem } from "../lib/script-catalog";

const ANDROID_APK_PATH = "/downloads/CoFate-Android-Beta-v0.1.4.apk";

type View = "home" | "create" | "join" | "match" | "discover" | "profile" | "room";

type QuotaView = { day: string; used: number; remaining: number; limit: number };
type PaywallItem = { title: string; description: string };

function tokenKey(code: string) {
  return `cofate-player:${code}`;
}

function legacyTokenKey(code: string) {
  return `causality-player:${code}`;
}

function timeLabel(value: number | string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function playerMark(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "人";
}

export function CausalityApp() {
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<SessionView | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerToken, setPlayerToken] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("今晚不要回头");
  const [theme, setTheme] = useState("朋友聚会结束后，所有人发现门外不是来时的走廊");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [runtimeMode, setRuntimeMode] = useState<"checking" | "native" | "web">("checking");
  const [deviceId, setDeviceId] = useState("");
  const [quota, setQuota] = useState<QuotaView>({ day: "", used: 0, remaining: 3, limit: 3 });
  const [creationKind, setCreationKind] = useState<"custom" | "catalog">("custom");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [paywall, setPaywall] = useState<PaywallItem | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const isNativeApp = runtimeMode === "native";

  const loadSession = useCallback(async (code: string, token = "", quiet = false) => {
    if (!code) return;
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(code)}`, {
        headers: token ? { "x-player-token": token } : {},
        cache: "no-store",
      });
      const data = (await response.json()) as SessionView & { error?: string };
      if (!response.ok) throw new Error(data.error || "世界暂时无法打开");
      setSession(data);
      if (!quiet && data.errorMessage) setError(data.errorMessage);
      else if (!quiet) setError("");
    } catch (loadError) {
      if (!quiet) setError(loadError instanceof Error ? loadError.message : "世界暂时无法打开");
    }
  }, []);

  const openRoom = useCallback((code: string, token = "") => {
    const normalized = code.trim().toUpperCase();
    const savedToken =
      token ||
      window.localStorage.getItem(tokenKey(normalized)) ||
      window.localStorage.getItem(legacyTokenKey(normalized)) ||
      "";
    setRoomCode(normalized);
    setPlayerToken(savedToken);
    setSession(null);
    setView("room");
    setError("");
    window.history.replaceState({}, "", `/app?world=${normalized}`);
    void loadSession(normalized, savedToken);
  }, [loadSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const localPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname) && params.get("preview") === "app";
      setRuntimeMode(/CoFateAndroid/i.test(window.navigator.userAgent) || localPreview ? "native" : "web");
      const savedName = window.localStorage.getItem("cofate-display-name");
      if (savedName) setName(savedName);
      const savedDeviceId = window.localStorage.getItem("cofate-device-id") || crypto.randomUUID();
      window.localStorage.setItem("cofate-device-id", savedDeviceId);
      setDeviceId(savedDeviceId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (name.trim()) window.localStorage.setItem("cofate-display-name", name.trim().slice(0, 16));
  }, [name]);

  const loadQuota = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/quota?deviceId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = (await response.json()) as QuotaView & { error?: string };
      if (response.ok) setQuota(data);
    } catch {
      // Quota will refresh after the next successful custom creation.
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const timer = window.setTimeout(() => void loadQuota(deviceId), 0);
    return () => window.clearTimeout(timer);
  }, [deviceId, loadQuota]);

  useEffect(() => {
    if (!deviceId) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/profile?deviceId=${encodeURIComponent(deviceId)}`, { cache: "no-store" });
        if (response.ok) setProfile(await response.json() as PlayerProfile);
      } catch {
        // The profile will refresh after a completed story.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [deviceId, session?.status]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("world")?.trim().toUpperCase();
    if (!code) return;
    const timer = window.setTimeout(() => openRoom(code), 0);
    return () => window.clearTimeout(timer);
  }, [openRoom]);

  useEffect(() => {
    if (view !== "room" || !roomCode) return;
    const fastStatus = session?.status === "generating" || session?.status === "resolving";
    const timer = window.setInterval(() => void loadSession(roomCode, playerToken, true), fastStatus ? 700 : 1600);
    return () => window.clearInterval(timer);
  }, [loadSession, playerToken, roomCode, session?.status, view]);

  useEffect(() => {
    document.getElementById("story-end")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [session?.entries.length, session?.status]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !roomCode) return "";
    return `${window.location.origin}/app?world=${roomCode}`;
  }, [roomCode]);

  const meChosen = Boolean(session?.members.find((member) => member.id === session.me?.id)?.hasChosen);
  const choicesCount = session?.members.filter((member) => member.hasChosen).length ?? 0;
  const filteredScripts = activeCategory === "全部"
    ? SCRIPT_CATALOG
    : SCRIPT_CATALOG.filter((script) => script.category === activeCategory);

  function openScript(script: ScriptCatalogItem) {
    if (script.price > 0) {
      setPaywall({ title: script.title, description: `精品剧本 · ${script.players} · ${script.duration}` });
      return;
    }
    setCreationKind("catalog");
    setSelectedScriptId(script.id);
    setTitle(script.title);
    setTheme(script.theme);
    if (script.playerCount) setMaxPlayers(script.playerCount);
    setError("");
    setView("create");
  }

  function openCustomWorld() {
    if (quota.remaining <= 0) {
      setPaywall({ title: "自定义世界", description: "今天的 3 次免费额度已经用完" });
      return;
    }
    setCreationKind("custom");
    setSelectedScriptId("");
    setTitle("今晚不要回头");
    setTheme("朋友聚会结束后，所有人发现门外不是来时的走廊");
    setError("");
    setView("create");
  }

  function goHome() {
    setView("home");
    setSession(null);
    setRoomCode("");
    setError("");
    setInviteOpen(false);
    window.history.replaceState({}, "", "/app");
  }

  async function createPrivate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("请先留下你的称呼");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, theme, maxPlayers, creationKind, scriptId: selectedScriptId, deviceId }),
      });
      const data = (await response.json()) as { code?: string; playerToken?: string; quota?: QuotaView; error?: string; paymentRequired?: boolean; item?: string };
      if (data.paymentRequired) {
        setPaywall({ title: data.item || "自定义世界", description: data.error || "需要解锁后继续" });
      }
      if (!response.ok || !data.code || !data.playerToken) throw new Error(data.error || "入口创建失败");
      if (data.quota) setQuota(data.quota);
      window.localStorage.setItem(tokenKey(data.code), data.playerToken);
      openRoom(data.code, data.playerToken);
      setInviteOpen(true);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "入口创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function startMatching(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("请先留下你的称呼");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, theme, deviceId }),
      });
      const data = (await response.json()) as { code?: string; playerToken?: string; error?: string };
      if (!response.ok || !data.code || !data.playerToken) throw new Error(data.error || "匹配暂时不可用");
      window.localStorage.setItem(tokenKey(data.code), data.playerToken);
      openRoom(data.code, data.playerToken);
      if (data.error) setError(data.error);
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "匹配暂时不可用");
    } finally {
      setBusy(false);
    }
  }

  async function joinSession(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("输入一个大家认得出的称呼");
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", name, deviceId }),
      });
      const data = (await response.json()) as { playerToken?: string; error?: string };
      if (!response.ok || !data.playerToken) throw new Error(data.error || "进入失败");
      window.localStorage.setItem(tokenKey(roomCode), data.playerToken);
      setPlayerToken(data.playerToken);
      await loadSession(roomCode, data.playerToken);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "进入失败");
    } finally {
      setBusy(false);
    }
  }

  async function startWorld() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-player-token": playerToken },
        body: JSON.stringify({ action: "start" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "世界生成失败");
      await loadSession(roomCode, playerToken);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "世界生成失败");
      await loadSession(roomCode, playerToken, true);
    } finally {
      setBusy(false);
    }
  }

  async function selectRole(roleId: string) {
    if (!playerToken || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-player-token": playerToken },
        body: JSON.stringify({ action: "select_role", roleId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "角色选择失败");
      await loadSession(roomCode, playerToken);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "角色选择失败");
    } finally {
      setBusy(false);
    }
  }

  async function sendChoice(event: FormEvent) {
    event.preventDefault();
    const content = choice.trim();
    if (!content || !playerToken || meChosen) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-player-token": playerToken },
        body: JSON.stringify({ action: "choice", content }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "选择提交失败");
      setChoice("");
      await loadSession(roomCode, playerToken, true);
    } catch (choiceError) {
      setError(choiceError instanceof Error ? choiceError.message : "选择提交失败");
    } finally {
      setBusy(false);
    }
  }

  async function sendWhisperMessage(targetMemberId: string, content: string) {
    if (!playerToken || !targetMemberId || !content.trim() || busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-player-token": playerToken },
        body: JSON.stringify({ action: "whisper", targetMemberId, content }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "密语发送失败");
      await loadSession(roomCode, playerToken, true);
      return true;
    } catch (whisperError) {
      setError(whisperError instanceof Error ? whisperError.message : "密语发送失败");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setError("邀请链接已复制");
      window.setTimeout(() => setError(""), 1600);
    } catch {
      setError("请长按二维码，或复制浏览器地址分享");
    }
  }

  if (runtimeMode === "checking") return <AppSplash />;

  if (view === "create" || view === "match") {
    const matching = view === "match";
    const selectedScript = SCRIPT_CATALOG.find((script) => script.id === selectedScriptId);
    return (
      <main className={`app-shell app-flow-page ${isNativeApp ? "is-native" : ""}`}>
        <AppHeader onBack={() => setView("home")} label={matching ? "寻找搭子" : creationKind === "catalog" ? "剧本设置" : "自定义世界"} />
        <section className="app-flow">
          <div className="app-flow-intro">
            <p className="eyebrow">{matching ? "FIND ANOTHER SIGNAL" : creationKind === "catalog" ? "SELECTED SCRIPT" : "CREATE A SHARED WORLD"}</p>
            <h1>{matching ? <>此刻，找一个<br />愿意回应的人。</> : creationKind === "catalog" ? <>{selectedScript?.title}<br /><em>等待你们进入。</em></> : <>用一句话，<br />打开一个世界。</>}</h1>
            <p>{matching ? "匹配到真人后，AI 会立刻为你们生成共同情境。" : creationKind === "catalog" ? selectedScript?.tagline : `今天还可以免费自定义 ${quota.remaining} 次。`}</p>
          </div>
          <form className="world-form app-world-form" onSubmit={matching ? startMatching : createPrivate}>
            <label>你的称呼<input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} placeholder="例如：小煜" autoFocus /></label>
            {!matching && creationKind === "custom" && <label>这一局的名字<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={32} /></label>}
            {!matching && creationKind === "custom" && <fieldset><legend>快速灵感</legend><div className="preset-row">{SCRIPT_CATALOG.filter((script) => script.price === 0).slice(0, 5).map((script) => <button type="button" className={theme === script.theme ? "selected" : ""} onClick={() => { setTheme(script.theme); setTitle(script.title); }} key={script.id}>{script.mark} · {script.title}</button>)}</div></fieldset>}
            <label>{creationKind === "catalog" && !matching ? "本局设定" : "世界灵感"}<textarea value={theme} onChange={(event) => setTheme(event.target.value)} readOnly={creationKind === "catalog" && !matching} maxLength={300} rows={3} placeholder="地点、氛围，或者一句奇怪的规则……" /></label>
            {!matching && selectedScript?.playerCount ? (
              <div className="fixed-player-count"><span>固定人数本</span><strong>{selectedScript.playerCount} 人</strong><p>所有角色到齐并完成选角后才能开局</p></div>
            ) : !matching && (
              <fieldset>
                <legend>参与人数</legend>
                <div className="count-picker">
                  {[1, 2, 3, 4, 5, 6, 8].map((count) => <button type="button" className={maxPlayers === count ? "selected" : ""} onClick={() => setMaxPlayers(count)} key={count}>{count === 1 ? "单人" : count}</button>)}
                </div>
              </fieldset>
            )}
            <button className="primary-button" disabled={busy}>{busy ? (matching ? "正在发出信号…" : "正在建立入口…") : (matching ? "开始匹配" : creationKind === "catalog" ? "开始这个剧本" : `免费自定义 · 剩余 ${quota.remaining} 次`)}</button>
            <p className="privacy-note">隐藏身份只对本人可见 · 房主邀请后开局</p>
            {error && <p className="form-error">{error}</p>}
          </form>
        </section>
        {paywall && <PurchaseSheet item={paywall} onClose={() => setPaywall(null)} />}
      </main>
    );
  }

  if (view === "join") {
    return (
      <main className={`app-shell app-flow-page ${isNativeApp ? "is-native" : ""}`}>
        <AppHeader onBack={() => setView("home")} label="进入世界" />
        <section className="join-screen">
          <div className="join-glyph">#</div>
          <p className="eyebrow">INVITATION CODE</p>
          <h1>输入朋友给你的<br />六位邀请码</h1>
          <form onSubmit={(event) => { event.preventDefault(); if (joinCode.trim()) openRoom(joinCode); }}>
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={6} placeholder="ABC123" autoFocus />
            <button className="primary-button" disabled={joinCode.length !== 6}>进入这个世界 <span>→</span></button>
          </form>
          <small>也可以直接扫描朋友分享的二维码</small>
        </section>
      </main>
    );
  }

  if (view === "discover") {
    return (
      <main className={`app-shell script-store-shell ${isNativeApp ? "is-native" : ""}`}>
        <AppTopBar isNativeApp={isNativeApp} quota={quota} />
        <section className="script-library app-screen-scroll">
          <p className="eyebrow">ALL COFATE STORIES</p>
          <h1>{SCRIPT_CATALOG.length} 个剧本</h1>
          <div className="category-tabs">{["全部", ...SCRIPT_CATEGORIES].map((category) => <button className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div>
          <div className="script-card-grid">
            {filteredScripts.map((script) => <ScriptCard script={script} onOpen={openScript} key={script.id} />)}
          </div>
        </section>
        <AppNav current="discover" onNavigate={setView} />
        {paywall && <PurchaseSheet item={paywall} onClose={() => setPaywall(null)} />}
      </main>
    );
  }

  if (view === "profile") {
    const currentProfile = profile ?? { displayName: name || "新玩家", xp: 0, points: 0, level: 1, nextLevelXp: 120, gamesPlayed: 0, goalsCompleted: 0, wins: 0 };
    const levelStartXp = (currentProfile.level - 1) * (currentProfile.level - 1) * 120;
    const levelProgress = Math.max(0, Math.min(100, ((currentProfile.xp - levelStartXp) / Math.max(1, currentProfile.nextLevelXp - levelStartXp)) * 100));
    return (
      <main className={`app-shell ${isNativeApp ? "is-native" : ""}`}>
        <AppTopBar isNativeApp={isNativeApp} quota={quota} />
        <section className="profile-screen">
          <div className="profile-mark">{playerMark(name || "我")}</div>
          <p className="eyebrow">MY SIGNAL</p>
          <h1>{name || "还没有称呼"}</h1>
          <div className="profile-level"><span>LV.{currentProfile.level}</span><div><i style={{ width: `${levelProgress}%` }} /></div><small>{currentProfile.xp} / {currentProfile.nextLevelXp} XP</small></div>
          <label>默认称呼<input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} placeholder="输入你的称呼" /></label>
          <div className="profile-list"><span>因果积分 <b>{currentProfile.points}</b></span><span>完成局数 <b>{currentProfile.gamesPlayed}</b></span><span>私人目标 <b>{currentProfile.goalsCompleted} 次达成</b></span><span>生还 / 胜利 <b>{currentProfile.wins} 次</b></span><span>今日自定义 <b>剩余 {quota.remaining} / {quota.limit} 次</b></span><span>档案状态 <b>绑定当前设备</b></span>{!isNativeApp && <Link href="/">访问 CoFate 官网 →</Link>}</div>
        </section>
        <AppNav current="profile" onNavigate={setView} />
      </main>
    );
  }

  if (view === "room") {
    return (
      <Room
        session={session}
        error={error}
        busy={busy}
        choice={choice}
        choicesCount={choicesCount}
        meChosen={meChosen}
        inviteOpen={inviteOpen}
        inviteUrl={inviteUrl}
        roomCode={roomCode}
        name={name}
        onName={setName}
        onChoice={setChoice}
        onJoin={joinSession}
        onStart={startWorld}
        onSelectRole={selectRole}
        onWhisper={sendWhisperMessage}
        onSubmit={sendChoice}
        onBack={goHome}
        onInvite={() => setInviteOpen(true)}
        onCloseInvite={() => setInviteOpen(false)}
        onCopy={copyInvite}
      />
    );
  }

  return (
    <main className={`app-shell script-store-shell ${isNativeApp ? "is-native" : ""}`}>
      <AppTopBar isNativeApp={isNativeApp} quota={quota} />
      <section className="store-home app-screen-scroll">
        <div className="store-heading"><p className="eyebrow">STORIES FOR REAL PEOPLE</p><h1>选择今晚的<br /><em>共同经历。</em></h1><p>每个剧本都有独立身份、规则与分支。AI 负责世界，朋友负责选择。</p></div>
        <div className="store-quick-actions"><button className="custom-world-card" onClick={openCustomWorld}><span>AI 自定义</span><strong>写一句话，生成你的剧本</strong><p>今日免费额度 <b>{quota.remaining} / {quota.limit}</b></p><i>＋</i></button><button className="invite-entry-card" onClick={() => { setError(""); setView("join"); }}><span>#</span><strong>输入邀请码</strong><p>进入朋友的世界</p></button></div>
        <div className="store-section-title"><div><p className="eyebrow">FEATURED TONIGHT</p><h2>今晚精选</h2></div><button onClick={() => setView("discover")}>查看全部 →</button></div>
        <div className="featured-script-row">{SCRIPT_CATALOG.filter((script) => script.featured).map((script, index) => <ScriptCard script={script} onOpen={openScript} featured priority={index < 2} key={script.id} />)}</div>
        <div className="store-section-title solo-section-title"><div><p className="eyebrow">PLAY ALONE · NEVER EMPTY</p><h2>一个人，也能进入世界</h2></div></div>
        <div className="script-card-grid solo-script-grid">{SCRIPT_CATALOG.filter((script) => script.playerCount === 1).map((script) => <ScriptCard script={script} onOpen={openScript} key={script.id} />)}</div>
        <div className="store-section-title"><div><p className="eyebrow">FREE TO PLAY</p><h2>免费开局</h2></div></div>
        <div className="script-card-grid compact">{SCRIPT_CATALOG.filter((script) => script.price === 0).slice(0, 6).map((script) => <ScriptCard script={script} onOpen={openScript} key={script.id} />)}</div>
        <button className="match-strip" onClick={() => { setError(""); setTheme("两个陌生人在深夜收到同一份规则"); setView("match"); }}><i /> <span><small>一个人也可以</small><strong>匹配此刻在线的真人</strong></span><b>→</b></button>
        {error && <p className="form-error">{error}</p>}
      </section>
      <AppNav current="home" onNavigate={setView} />
      {paywall && <PurchaseSheet item={paywall} onClose={() => setPaywall(null)} />}
    </main>
  );
}

function Room(props: {
  session: SessionView | null;
  error: string;
  busy: boolean;
  choice: string;
  choicesCount: number;
  meChosen: boolean;
  inviteOpen: boolean;
  inviteUrl: string;
  roomCode: string;
  name: string;
  onName: (value: string) => void;
  onChoice: (value: string) => void;
  onJoin: (event: FormEvent) => void;
  onStart: () => void;
  onSelectRole: (roleId: string) => void;
  onWhisper: (targetMemberId: string, content: string) => Promise<boolean>;
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
  onInvite: () => void;
  onCloseInvite: () => void;
  onCopy: () => void;
}) {
  const { session } = props;
  const [roomTab, setRoomTab] = useState<"story" | "role" | "people">("story");
  const [whisperTarget, setWhisperTarget] = useState("");
  const [whisperText, setWhisperText] = useState("");
  if (!session) return <main className="room-page"><Header onBack={props.onBack} label="正在连接" /><div className="loading-state"><span>因</span><p>正在寻找这个世界的入口…</p>{props.error && <small>{props.error}</small>}</div></main>;
  const waiting = session.status === "waiting";
  const generating = session.status === "generating";
  const active = session.status === "active" || session.status === "resolving" || session.status === "ended";
  const otherMembers = session.members.filter((member) => member.id !== session.me?.id);
  return (
    <main className="room-page">
      <header className="room-header">
        <button className="round-button" onClick={props.onBack} aria-label="返回">←</button>
        <div><strong>{session.title}</strong><span>#{session.code} · {statusText(session.status)}</span></div>
        {session.mode === "private" && session.requiredPlayers !== 1 ? <button className="invite-button" onClick={props.onInvite}>邀请</button> : session.requiredPlayers === 1 ? <span className="match-tag">独行局</span> : <span className="match-tag">匹配局</span>}
      </header>
      <div className={`room-layout mobile-tab-${roomTab}`}>
        <aside className="room-sidebar">
          <div className="member-zone">
            <p className="eyebrow">PEOPLE IN THIS WORLD</p>
            <div className="member-list">
              {session.members.map((member) => <div className="member" key={member.id}><b>{playerMark(member.name)}</b><span>{member.name}{member.isHost ? " · 房主" : ""}<small>{waiting ? member.roleName || "尚未选择角色" : member.hasChosen ? "已提交私密行动" : member.roleName || "已进入"}</small></span>{member.hasChosen && <i>✓</i>}</div>)}
            </div>
          </div>
          {active && session.status !== "ended" && otherMembers.length > 0 && <form className="whisper-composer" onSubmit={async (event) => { event.preventDefault(); const sent = await props.onWhisper(whisperTarget, whisperText); if (sent) setWhisperText(""); }}><span>匿名密语</span><p>只有你和对方能看到，AI 会感知这次交流。</p><select value={whisperTarget} onChange={(event) => setWhisperTarget(event.target.value)} aria-label="选择密语对象"><option value="">选择一个人</option>{otherMembers.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.roleName || "未知角色"}</option>)}</select><textarea value={whisperText} onChange={(event) => setWhisperText(event.target.value)} maxLength={180} rows={3} placeholder="结盟、试探、交换线索，或者说一个假消息……" /><button disabled={props.busy || !whisperTarget || !whisperText.trim()}>发送密语</button></form>}
          {active && session.me?.role && <RoleCard role={session.me.role} />}
        </aside>
        <section className="story-panel">
          {!session.me ? (
            <div className="guest-entry">
              <p className="eyebrow">INVITATION #{session.code}</p>
              <h1>{session.title}</h1>
              <p>{session.theme}</p>
              <form onSubmit={props.onJoin}><input value={props.name} onChange={(event) => props.onName(event.target.value)} placeholder="输入你的称呼" maxLength={16} autoFocus /><button disabled={props.busy}>进入这个世界</button></form>
              {props.error && <small className="error-text">{props.error}</small>}
            </div>
          ) : waiting ? (
            <Lobby session={session} busy={props.busy} error={props.error} onStart={props.onStart} onInvite={props.onInvite} onSelectRole={props.onSelectRole} />
          ) : generating ? (
            <div className="generating-state"><div className="signal-rings"><i /><i /><span>因</span></div><p>DeepSeek 正在读取{session.requiredPlayers === 1 ? "你的角色" : "所有人的名字"}</p><h2>世界正在生成</h2><small>{session.requiredPlayers === 1 ? "它会唤醒会回应你的剧情角色，并写下独属于你的目标。" : "它会分别写下身份、秘密规则和彼此交叉的命运。"}</small></div>
          ) : active ? (
            <>
              {session.world && <WorldBrief session={session} />}
              <div className="timeline">
                {session.entries.map((entry) => <StoryEntry entry={entry} meId={session.me?.id || ""} key={entry.id} />)}
                {session.status === "resolving" && <div className="director-thinking"><i /><span>因果正在汇合所有人的选择…</span></div>}
                <div id="story-end" />
              </div>
              {session.status !== "ended" && <form className="choice-dock" onSubmit={props.onSubmit}>
                <div className="private-action-note">🔒 私密行动 · 其他玩家看不到你提交的原文</div>
                <div className="choice-status"><span>第 {session.turn}{session.world?.maxTurns ? ` / ${session.world.maxTurns}` : ""} 回合{session.world?.stageTitle ? ` · ${session.world.stageTitle}` : ""}</span><small>{props.meChosen ? `已提交 · ${props.choicesCount}/${session.members.length} 人完成` : session.world?.nextPrompt}</small></div>
                {!props.meChosen && session.world?.suggestedChoices?.length ? <div className="suggestions">{session.world.suggestedChoices.map((item) => <button type="button" onClick={() => props.onChoice(item)} key={item}>{item}</button>)}</div> : null}
                <div className="choice-line"><textarea value={props.choice} onChange={(event) => props.onChoice(event.target.value)} disabled={props.meChosen || props.busy || session.status === "resolving"} maxLength={360} rows={2} placeholder={props.meChosen ? "等待其他人的私密行动…" : "写下你的真实行动；公开讨论和最终行动可以不同"} /><button disabled={props.meChosen || props.busy || !props.choice.trim() || session.status === "resolving"}>{props.busy ? "…" : "秘密提交"}</button></div>
                {props.error && <small className="error-text">{props.error}</small>}
              </form>}
              {session.status === "ended" && <EndingCard session={session} onBack={props.onBack} />}
            </>
          ) : (
            <div className="error-state"><span>世界停在了门外</span><p>{session.errorMessage || props.error || "生成过程中发生了意外。"}</p>{session.me.isHost && <button className="primary-button" onClick={props.onStart} disabled={props.busy}>{props.busy ? "正在重试…" : "重新生成世界"}</button>}</div>
          )}
        </section>
      </div>
      {active && session.me && <nav className="room-bottom-nav" aria-label="房间导航"><button className={roomTab === "story" ? "selected" : ""} onClick={() => setRoomTab("story")}><span>⌁</span>剧情</button><button className={roomTab === "role" ? "selected" : ""} onClick={() => setRoomTab("role")}><span>◇</span>身份</button><button className={roomTab === "people" ? "selected" : ""} onClick={() => setRoomTab("people")}><span>◌</span>成员</button></nav>}
      {props.inviteOpen && <InviteModal code={props.roomCode} url={props.inviteUrl} onClose={props.onCloseInvite} onCopy={props.onCopy} />}
    </main>
  );
}

function Lobby({ session, busy, error, onStart, onInvite, onSelectRole }: { session: SessionView; busy: boolean; error: string; onStart: () => void; onInvite: () => void; onSelectRole: (roleId: string) => void }) {
  const isMatch = session.mode === "match";
  const myMember = session.members.find((member) => member.id === session.me?.id);
  const allRolesSelected = session.members.every((member) => Boolean(member.selectedRoleId));
  const enoughPlayers = session.requiredPlayers ? session.members.length === session.requiredPlayers : session.members.length >= 2;
  const ready = enoughPlayers && allRolesSelected;
  const startLabel = busy
    ? "世界生成中…"
    : !enoughPlayers
      ? session.requiredPlayers ? `等待 ${session.requiredPlayers} 名角色到齐` : "至少再等一个人"
      : !allRolesSelected
        ? "等待所有人选择角色"
        : "角色就位，开启世界";
  const solo = session.requiredPlayers === 1;
  return <div className="lobby-state role-lobby"><div className="lobby-orbit"><span>{session.members.length}</span><i /></div><p className="eyebrow">{isMatch ? "MATCHING SIGNAL" : solo ? "SOLO ROLE" : "CHOOSE YOUR ROLE"}</p><h1>{isMatch ? "正在寻找另一个此刻仍醒着的人" : solo ? "选择你要独自成为的人" : "先选择你要成为谁"}</h1><p>{isMatch ? "可以把页面放在这里。有人回应后，因果会自动生成你们的共同世界。" : solo ? "这是单人沉浸本。AI 剧情角色会主动回应你，但所有决定都由你自己做出。" : session.requiredPlayers ? `这是固定 ${session.requiredPlayers} 人本。角色名称公开，秘密目标和任务仅本人可见。` : `已有 ${session.members.length} 人到场，最多 ${session.maxPlayers} 人。每个人先选择不同角色。`}</p>{!isMatch && <div className="role-option-grid">{session.roleOptions.map((role) => { const mine = myMember?.selectedRoleId === role.id; const unavailable = Boolean(role.claimedBy && !mine); return <button type="button" className={mine ? "selected" : ""} disabled={busy || unavailable} onClick={() => onSelectRole(role.id)} key={role.id}><span>{mine ? "你的角色" : role.claimedBy ? `${role.claimedBy} 已选择` : "可选择"}</span><strong>{role.title}</strong><p>{role.teaser}</p></button>; })}</div>}{!isMatch && !solo && <button className="secondary-button" onClick={onInvite}>打开邀请二维码 · 邀请其他角色</button>}{session.me?.isHost && !isMatch && <button className="primary-button" disabled={busy || !ready} onClick={onStart}>{startLabel}</button>}{error && <small className="error-text">{error}</small>}</div>;
}

function WorldBrief({ session }: { session: SessionView }) {
  const world = session.world!;
  return <div className="world-brief"><p className="eyebrow">CURRENT WORLD · TURN {session.turn}{world.maxTurns ? ` / ${world.maxTurns}` : ""}</p><h1>{world.title}</h1>{world.format && <span className={`story-format format-${world.format}`}>{world.format}本</span>}<p className="premise">{world.premise}</p>{world.mechanics?.length ? <div className="world-mechanics">{world.mechanics.map((mechanic) => <span key={mechanic}>{mechanic}</span>)}</div> : null}{world.victoryRule && <div className="victory-rule"><span>胜负规则</span><p>{world.victoryRule}</p></div>}{world.stageTask && <div className="stage-objective"><span>{world.stageTitle || "当前任务"}</span><p>{world.stageTask}</p></div>}<details open><summary>当前公开规则 · {world.publicRules.length}</summary><ol>{world.publicRules.map((rule, index) => <li key={`${rule}-${index}`}>{rule}</li>)}</ol></details>{world.clues.length > 0 && <div className="clue-line"><span>已知线索</span><p>{world.clues.join(" · ")}</p></div>}{world.endingCondition && <details className="ending-condition"><summary>本局终止条件</summary><p>{world.endingCondition}</p></details>}</div>;
}

function RoleCard({ role }: { role: NonNullable<SessionView["me"]>["role"] }) {
  if (!role) return null;
  return <div className="role-card"><span>仅你可见</span><h3>{role.identity}</h3><p>{role.publicDescription}</p><dl><div><dt>秘密规则</dt><dd>{role.secretRule}</dd></div><div><dt>私人目标</dt><dd>{role.privateGoal}</dd></div>{role.survivalCondition && <div><dt>胜利 / 生还条件</dt><dd>{role.survivalCondition}</dd></div>}{role.privateTasks?.length ? <div><dt>私人任务</dt><dd><ol>{role.privateTasks.map((task) => <li key={task}>{task}</li>)}</ol></dd></div> : null}</dl></div>;
}

function EndingCard({ session, onBack }: { session: SessionView; onBack: () => void }) {
  const result = session.me?.result;
  return <div className="ending-card personal-ending"><span>PERSONAL RESULT · {session.turn} 回合</span><h2>{result ? result.survived ? "你活到了结局。" : result.goalCompleted ? "你没有生还，但完成了使命。" : "这一次，你没有赢。" : "这一条因果已经闭合。"}</h2>{session.world?.endingCondition && <p>{session.world.endingCondition}</p>}{result ? <><div className="ending-verdict"><b className={result.goalCompleted ? "success" : "failed"}>{result.goalCompleted ? "私人目标达成" : "私人目标未达成"}</b><p>{result.summary}</p></div><div className="ending-task-list">{result.completedTasks.map((task) => <span className="done" key={`done-${task}`}>✓ {task}</span>)}{result.failedTasks.map((task) => <span className="missed" key={`missed-${task}`}>× {task}</span>)}</div><div className="ending-rewards"><span><small>本局经验</small><b>+{result.xpEarned} XP</b></span><span><small>因果积分</small><b>+{result.pointsEarned}</b></span><span><small>账号等级</small><b>LV.{result.levelAfter}</b></span></div>{result.levelAfter > result.levelBefore && <strong className="level-up">LEVEL UP · LV.{result.levelAfter}</strong>}</> : <div className="ending-verdict"><p>个人任务正在结算，请稍候刷新。</p></div>}<button onClick={onBack}>回到入口</button></div>;
}

function StoryEntry({ entry, meId }: { entry: SessionEntryView; meId: string }) {
  if (entry.kind === "system" || entry.kind === "arrival") return <div className="system-entry"><span>因</span><p>{entry.content}</p></div>;
  if (entry.kind === "narration") return <article className="narration-entry"><header><span>因果 · 第 {entry.turn} 回合</span><time>{timeLabel(entry.createdAt)}</time></header><p>{entry.content}</p></article>;
  if (entry.kind === "private") return <article className="private-entry"><span>{entry.author.includes("密语") ? entry.author : "只有你听见"}</span><p>{entry.content}</p></article>;
  return <div className={`choice-entry ${entry.memberId === meId ? "mine" : ""}`}><span>{entry.author} 的选择 · {timeLabel(entry.createdAt)}</span><p>{entry.content}</p></div>;
}

function InviteModal({ code, url, onClose, onCopy }: { code: string; url: string; onClose: () => void; onCopy: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="invite-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><p className="eyebrow">SCAN TO ENTER</p><h2>让他们扫一下，<br />进入同一个世界。</h2><div className="qr-frame"><QRCodeSVG value={url} size={420} level="M" marginSize={2} role="img" aria-label={`进入世界 ${code} 的二维码`} /><span>COFATE · {code}</span></div><div className="invite-code"><small>六位邀请码</small><b>{code}</b></div><button className="primary-button" onClick={onCopy}>复制邀请链接</button><p className="privacy-note">二维码不包含你的身份凭证</p></section></div>;
}

function AppSplash() {
  return <main className="app-splash"><span>因</span><strong>CoFate</strong><small>世界正在打开</small></main>;
}

function ScriptCard({ script, onOpen, featured = false, priority = false }: { script: ScriptCatalogItem; onOpen: (script: ScriptCatalogItem) => void; featured?: boolean; priority?: boolean }) {
  const mechanics = getScriptMechanics(script.id).slice(0, 2);
  // The app ships pre-sized WebP variants, so a native image keeps lazy loading predictable in the remote Android shell.
  // eslint-disable-next-line @next/next/no-img-element
  return <button className={`script-card tone-${script.tone} ${featured ? "featured" : ""}`} onClick={() => onOpen(script)} aria-label={`${script.title}，${script.format ?? "合作"}本，${script.price ? "1元精品剧本" : "免费剧本"}`}><div className="script-art"><img src={getScriptCoverThumbnail(script.id)} srcSet={`${getScriptCoverThumbnail(script.id)} 480w, ${getScriptCover(script.id)} 960w`} sizes={featured ? "(max-width: 720px) 83vw, 69vw" : "(max-width: 720px) 48vw, 50vw"} alt={`${script.title}剧本封面`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" /><span className="cover-mode">{script.playerCount === 1 ? "SOLO" : script.format ?? "合作"}</span></div><div className="script-card-copy"><div className="script-meta"><span>{script.category} · {script.players}</span><b className={script.price ? "paid" : "free"}>{script.price ? "¥1" : "免费"}</b></div><strong>{script.title}</strong><p>{script.tagline}</p><div className="mechanic-tags">{mechanics.map((mechanic) => <span key={mechanic}>{mechanic}</span>)}</div><small>{script.format ?? "合作"} · {script.duration} · {script.plan.maxTurns} 回合 <i>→</i></small></div></button>;
}

function PurchaseSheet({ item, onClose }: { item: PaywallItem; onClose: () => void }) {
  return <div className="purchase-backdrop" onClick={onClose}><section className="purchase-sheet" onClick={(event) => event.stopPropagation()}><button className="purchase-close" onClick={onClose}>×</button><div className="purchase-mark">¥1</div><p className="eyebrow">UNLOCK THIS STORY</p><h2>{item.title}</h2><p>{item.description}</p><ul><li>一次解锁，完成本局全部剧情</li><li>所有参与者无需重复购买</li><li>AI 身份、分支与结局完整开放</li></ul><button className="primary-button" disabled>微信支付接入中</button><small>支付能力需要微信商户号，当前先展示正式定价。</small></section></div>;
}

function AppTopBar({ isNativeApp, quota }: { isNativeApp: boolean; quota: QuotaView }) {
  return <header className="app-topbar"><Brand /><div className="app-topbar-actions">{!isNativeApp && <><Link href="/">官网</Link><a href={ANDROID_APK_PATH} download>下载 APK</a></>}<span className="quota-pill"><small>今日自定义</small><b>{quota.remaining}/{quota.limit}</b></span></div></header>;
}

function AppHeader({ onBack, label }: { onBack: () => void; label: string }) {
  return <header className="app-flow-header"><button onClick={onBack} aria-label="返回">←</button><Brand /><span>{label}</span></header>;
}

function AppNav({ current, onNavigate }: { current: "home" | "discover" | "profile"; onNavigate: (view: View) => void }) {
  return <nav className="app-bottom-nav" aria-label="应用导航"><button className={current === "home" ? "selected" : ""} onClick={() => onNavigate("home")}><span>⌂</span>精选</button><button className={current === "discover" ? "selected" : ""} onClick={() => onNavigate("discover")}><span>◈</span>剧本</button><button className={current === "profile" ? "selected" : ""} onClick={() => onNavigate("profile")}><span>○</span>我的</button></nav>;
}

function Brand() {
  return <div className="brand"><span>因</span><strong>因果<small>COFATE</small></strong></div>;
}

function Header({ onBack, label }: { onBack: () => void; label: string }) {
  return <header className="sub-header"><button className="round-button" onClick={onBack}>←</button><Brand /><span>{label}</span></header>;
}

function statusText(status: SessionView["status"]) {
  return { waiting: "等待到场", generating: "世界生成中", active: "世界进行中", resolving: "因果演算中", ended: "因果已闭合", error: "需要重试" }[status];
}
