"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { SessionEntryView, SessionView } from "../lib/session-types";

const ANDROID_APK_PATH = "/downloads/CoFate-Android-Beta-v0.1.1.apk";

type View = "home" | "create" | "match" | "room";

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
    const params = new URLSearchParams(window.location.search);
    const code = params.get("world")?.trim().toUpperCase();
    if (!code) return;
    const timer = window.setTimeout(() => openRoom(code), 0);
    return () => window.clearTimeout(timer);
  }, [openRoom]);

  useEffect(() => {
    if (view !== "room" || !roomCode) return;
    const timer = window.setInterval(() => void loadSession(roomCode, playerToken, true), 2200);
    return () => window.clearInterval(timer);
  }, [loadSession, playerToken, roomCode, view]);

  useEffect(() => {
    document.getElementById("story-end")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [session?.entries.length, session?.status]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !roomCode) return "";
    return `${window.location.origin}/app?world=${roomCode}`;
  }, [roomCode]);

  const meChosen = Boolean(session?.members.find((member) => member.id === session.me?.id)?.hasChosen);
  const choicesCount = session?.members.filter((member) => member.hasChosen).length ?? 0;

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
        body: JSON.stringify({ name, title, theme, maxPlayers }),
      });
      const data = (await response.json()) as { code?: string; playerToken?: string; error?: string };
      if (!response.ok || !data.code || !data.playerToken) throw new Error(data.error || "入口创建失败");
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
        body: JSON.stringify({ name, theme }),
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
        body: JSON.stringify({ action: "join", name }),
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

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setError("邀请链接已复制");
      window.setTimeout(() => setError(""), 1600);
    } catch {
      setError("请长按二维码，或复制浏览器地址分享");
    }
  }

  if (view === "create" || view === "match") {
    const matching = view === "match";
    return (
      <main className="form-page">
        <Header onBack={() => setView("home")} label={matching ? "寻找搭子" : "发起一局"} />
        <section className="form-layout">
          <div className="form-copy">
            <p className="eyebrow">{matching ? "FIND ANOTHER SIGNAL" : "CREATE A SHARED WORLD"}</p>
            <h1>{matching ? <>一个人来，<br />也不必一个人走。</> : <>写下一句话，<br />让世界从这里长出来。</>}</h1>
            <p>{matching ? "因果会为两位此刻在线的人建立一条共同主线。你遇见的是真人，AI 只负责世界与命运。" : "邀请朋友扫同一个二维码。等所有人到场后，DeepSeek 会按人数生成彼此牵连的身份与规则。"}</p>
          </div>
          <form className="world-form" onSubmit={matching ? startMatching : createPrivate}>
            <label>你的称呼<input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} placeholder="例如：小煜" autoFocus /></label>
            {!matching && <label>这一局的名字<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={32} /></label>}
            <label>给 AI 一点灵感<textarea value={theme} onChange={(event) => setTheme(event.target.value)} maxLength={300} rows={4} placeholder="地点、氛围，或者一句奇怪的规则……" /></label>
            {!matching && (
              <fieldset>
                <legend>最多几个人</legend>
                <div className="count-picker">
                  {[2, 3, 4, 5, 6, 8].map((count) => <button type="button" className={maxPlayers === count ? "selected" : ""} onClick={() => setMaxPlayers(count)} key={count}>{count}</button>)}
                </div>
              </fieldset>
            )}
            <button className="primary-button" disabled={busy}>{busy ? (matching ? "正在发出信号…" : "正在建立入口…") : (matching ? "开始匹配" : "生成邀请入口")}</button>
            <p className="privacy-note">不需要注册 · 隐藏身份只在你的设备上显示</p>
            {error && <p className="form-error">{error}</p>}
          </form>
        </section>
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
        onSubmit={sendChoice}
        onBack={goHome}
        onInvite={() => setInviteOpen(true)}
        onCloseInvite={() => setInviteOpen(false)}
        onCopy={copyInvite}
      />
    );
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <Brand />
        <div className="app-home-actions">
          <Link href="/">官网</Link>
          <a className="app-install-button" href={ANDROID_APK_PATH} download>下载 APK</a>
        </div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">REAL PEOPLE · GENERATED WORLD</p>
          <h1>不是和 AI 聊天。<br /><em>是和真人一起，</em><br />掉进同一个故事。</h1>
          <p className="lead">扫同一个二维码，获得只属于你的身份与规则。每个人的选择交叉成世界主线——适合聚会，也适合一个人寻找此刻在线的搭子。</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => { setError(""); setView("create"); }}>发起一局 <span>↗</span></button>
            <button className="match-button" onClick={() => { setError(""); setTheme("两个陌生人在深夜收到同一份规则"); setView("match"); }}><i /> 一个人，去匹配</button>
          </div>
          <form className="code-entry" onSubmit={(event) => { event.preventDefault(); if (joinCode.trim()) openRoom(joinCode); }}>
            <span>#</span><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} maxLength={6} placeholder="输入六位邀请码" /><button>进入</button>
          </form>
          {error && <p className="form-error">{error}</p>}
        </div>
        <WorldSignal />
      </section>
      <section className="manifesto">
        <div><span>01</span><h2>一个入口</h2><p>二维码或邀请码，把在场和远方的人带进同一段情境。</p></div>
        <div><span>02</span><h2>每人一个秘密</h2><p>AI 按参与者生成身份、规则和目标，但秘密只对本人可见。</p></div>
        <div><span>03</span><h2>一条共同主线</h2><p>所有选择汇合后世界才继续，没有旁观者，每个人都是变量。</p></div>
      </section>
      <footer className="home-footer"><Brand /><p>AI 生成世界，真人建立关系。</p><span>YUZERO · 2026</span></footer>
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
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
  onInvite: () => void;
  onCloseInvite: () => void;
  onCopy: () => void;
}) {
  const { session } = props;
  if (!session) return <main className="room-page"><Header onBack={props.onBack} label="正在连接" /><div className="loading-state"><span>因</span><p>正在寻找这个世界的入口…</p>{props.error && <small>{props.error}</small>}</div></main>;
  const waiting = session.status === "waiting";
  const generating = session.status === "generating";
  const active = session.status === "active" || session.status === "resolving" || session.status === "ended";
  return (
    <main className="room-page">
      <header className="room-header">
        <button className="round-button" onClick={props.onBack} aria-label="返回">←</button>
        <div><strong>{session.title}</strong><span>#{session.code} · {statusText(session.status)}</span></div>
        {session.mode === "private" ? <button className="invite-button" onClick={props.onInvite}>邀请</button> : <span className="match-tag">匹配局</span>}
      </header>
      <div className="room-layout">
        <aside className="room-sidebar">
          <p className="eyebrow">PEOPLE IN THIS WORLD</p>
          <div className="member-list">
            {session.members.map((member) => <div className="member" key={member.id}><b>{playerMark(member.name)}</b><span>{member.name}<small>{member.isHost ? "发起人" : member.hasChosen ? "已做选择" : "已进入"}</small></span>{member.hasChosen && <i>✓</i>}</div>)}
          </div>
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
            <Lobby session={session} busy={props.busy} error={props.error} onStart={props.onStart} onInvite={props.onInvite} />
          ) : generating ? (
            <div className="generating-state"><div className="signal-rings"><i /><i /><span>因</span></div><p>DeepSeek 正在读取所有人的名字</p><h2>世界正在生成</h2><small>它会分别写下身份、秘密规则和彼此交叉的命运。</small></div>
          ) : active ? (
            <>
              {session.world && <WorldBrief session={session} />}
              <div className="timeline">
                {session.entries.map((entry) => <StoryEntry entry={entry} meId={session.me?.id || ""} key={entry.id} />)}
                {session.status === "resolving" && <div className="director-thinking"><i /><span>因果正在汇合所有人的选择…</span></div>}
                <div id="story-end" />
              </div>
              {session.status !== "ended" && <form className="choice-dock" onSubmit={props.onSubmit}>
                <div className="choice-status"><span>第 {session.turn} 回合</span><small>{props.meChosen ? `已提交 · ${props.choicesCount}/${session.members.length} 人完成` : session.world?.nextPrompt}</small></div>
                {!props.meChosen && session.world?.suggestedChoices?.length ? <div className="suggestions">{session.world.suggestedChoices.map((item) => <button type="button" onClick={() => props.onChoice(item)} key={item}>{item}</button>)}</div> : null}
                <div className="choice-line"><textarea value={props.choice} onChange={(event) => props.onChoice(event.target.value)} disabled={props.meChosen || props.busy || session.status === "resolving"} maxLength={360} rows={2} placeholder={props.meChosen ? "等待其他人的选择…" : "写下你真正想做的事，也可以先和身边的人讨论"} /><button disabled={props.meChosen || props.busy || !props.choice.trim() || session.status === "resolving"}>{props.busy ? "…" : "提交"}</button></div>
                {props.error && <small className="error-text">{props.error}</small>}
              </form>}
              {session.status === "ended" && <div className="ending-card"><span>THE END</span><h2>这一条因果已经闭合。</h2><button onClick={props.onBack}>回到入口</button></div>}
            </>
          ) : (
            <div className="error-state"><span>世界停在了门外</span><p>{session.errorMessage || props.error || "生成过程中发生了意外。"}</p>{session.me.isHost && <button className="primary-button" onClick={props.onStart} disabled={props.busy}>{props.busy ? "正在重试…" : "重新生成世界"}</button>}</div>
          )}
        </section>
      </div>
      {props.inviteOpen && <InviteModal code={props.roomCode} url={props.inviteUrl} onClose={props.onCloseInvite} onCopy={props.onCopy} />}
    </main>
  );
}

function Lobby({ session, busy, error, onStart, onInvite }: { session: SessionView; busy: boolean; error: string; onStart: () => void; onInvite: () => void }) {
  const isMatch = session.mode === "match";
  return <div className="lobby-state"><div className="lobby-orbit"><span>{session.members.length}</span><i /></div><p className="eyebrow">{isMatch ? "MATCHING SIGNAL" : "WAITING ROOM"}</p><h1>{isMatch ? "正在寻找另一个此刻仍醒着的人" : "入口已经打开"}</h1><p>{isMatch ? "可以把页面放在这里。有人回应后，因果会自动生成你们的共同世界。" : `已有 ${session.members.length} 人到场，最多 ${session.maxPlayers} 人。把二维码递给身边的人。`}</p>{!isMatch && <button className="secondary-button" onClick={onInvite}>打开邀请二维码</button>}{session.me?.isHost && !isMatch && <button className="primary-button" disabled={busy || session.members.length < 2} onClick={onStart}>{busy ? "世界生成中…" : session.members.length < 2 ? "至少再等一个人" : "所有人到齐，开启世界"}</button>}{error && <small className="error-text">{error}</small>}</div>;
}

function WorldBrief({ session }: { session: SessionView }) {
  const world = session.world!;
  return <div className="world-brief"><p className="eyebrow">CURRENT WORLD · TURN {session.turn}</p><h1>{world.title}</h1><p className="premise">{world.premise}</p><details open><summary>当前公开规则 · {world.publicRules.length}</summary><ol>{world.publicRules.map((rule, index) => <li key={`${rule}-${index}`}>{rule}</li>)}</ol></details>{world.clues.length > 0 && <div className="clue-line"><span>已知线索</span><p>{world.clues.join(" · ")}</p></div>}</div>;
}

function RoleCard({ role }: { role: NonNullable<SessionView["me"]>["role"] }) {
  if (!role) return null;
  return <div className="role-card"><span>仅你可见</span><h3>{role.identity}</h3><p>{role.publicDescription}</p><dl><div><dt>秘密规则</dt><dd>{role.secretRule}</dd></div><div><dt>私人目标</dt><dd>{role.privateGoal}</dd></div></dl></div>;
}

function StoryEntry({ entry, meId }: { entry: SessionEntryView; meId: string }) {
  if (entry.kind === "system" || entry.kind === "arrival") return <div className="system-entry"><span>因</span><p>{entry.content}</p></div>;
  if (entry.kind === "narration") return <article className="narration-entry"><header><span>因果 · 第 {entry.turn} 回合</span><time>{timeLabel(entry.createdAt)}</time></header><p>{entry.content}</p></article>;
  if (entry.kind === "private") return <article className="private-entry"><span>只有你听见</span><p>{entry.content}</p></article>;
  return <div className={`choice-entry ${entry.memberId === meId ? "mine" : ""}`}><span>{entry.author} 的选择 · {timeLabel(entry.createdAt)}</span><p>{entry.content}</p></div>;
}

function InviteModal({ code, url, onClose, onCopy }: { code: string; url: string; onClose: () => void; onCopy: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="invite-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><p className="eyebrow">SCAN TO ENTER</p><h2>让他们扫一下，<br />进入同一个世界。</h2><div className="qr-frame"><QRCodeSVG value={url} size={420} level="M" marginSize={2} role="img" aria-label={`进入世界 ${code} 的二维码`} /><span>COFATE · {code}</span></div><div className="invite-code"><small>六位邀请码</small><b>{code}</b></div><button className="primary-button" onClick={onCopy}>复制邀请链接</button><p className="privacy-note">二维码不包含你的身份凭证</p></section></div>;
}

function WorldSignal() {
  return <div className="world-signal" aria-hidden="true"><div className="signal-grid" /><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="signal-core"><span>因果</span><small>WORLD 00:13</small></div><div className="signal-person person-a"><b>林</b><span>不要相信镜子</span></div><div className="signal-person person-b"><b>周</b><span>正在做出选择</span></div><div className="signal-person person-c"><b>你</b><span>秘密尚未公开</span></div><p>3 个真人 · 1 条共同主线</p></div>;
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
