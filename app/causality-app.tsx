"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VIBES, type VibeKey } from "../lib/causality-engine";

type World = {
  id: string;
  code: string;
  name: string;
  vibe: VibeKey;
  prompt: string;
  createdAt: number | string;
};

type Participant = {
  id: string;
  name: string;
  emoji: string;
  identity: string;
};

type Message = {
  id: string;
  participantId: string | null;
  author: string;
  kind: "message" | "guide" | "arrival";
  content: string;
  createdAt: number | string;
};

type RoomData = {
  world: World;
  participants: Participant[];
  messages: Message[];
};

const sampleWorlds = [
  {
    mark: "01",
    title: "毕业前的最后一个夏天",
    detail: "校园相遇 · 18人正在连接",
    tone: "mint",
  },
  {
    mark: "02",
    title: "今晚不要谈工作",
    detail: "朋友聚会 · 7人刚刚进入",
    tone: "violet",
  },
  {
    mark: "03",
    title: "凌晨两点的陌生人",
    detail: "深夜频道 · 42段真实回答",
    tone: "amber",
  },
];

function storageKey(code: string) {
  return `causality-participant:${code}`;
}

function timeLabel(value: number | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function CausalityApp() {
  const [view, setView] = useState<"home" | "create" | "room">("home");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [name, setName] = useState("");
  const [worldName, setWorldName] = useState("今晚的共同世界");
  const [vibe, setVibe] = useState<VibeKey>("gathering");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const messageEnd = useRef<HTMLDivElement>(null);

  const loadRoom = useCallback(async (code: string, quiet = false) => {
    if (!code) return;
    try {
      const response = await fetch(`/api/worlds/${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomData & { error?: string };
      if (!response.ok) throw new Error(data.error || "世界暂时无法打开");
      setRoom(data);
      if (!quiet) setError("");
    } catch (loadError) {
      if (!quiet) {
        setError(loadError instanceof Error ? loadError.message : "世界暂时无法打开");
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room")?.trim().toUpperCase();
    if (!code) return;
    setRoomCode(code);
    setParticipantId(window.localStorage.getItem(storageKey(code)) || "");
    setView("room");
    void loadRoom(code);
  }, [loadRoom]);

  useEffect(() => {
    if (view !== "room" || !roomCode) return;
    const timer = window.setInterval(() => void loadRoom(roomCode, true), 3000);
    return () => window.clearInterval(timer);
  }, [loadRoom, roomCode, view]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [room?.messages.length]);

  const me = useMemo(
    () => room?.participants.find((person) => person.id === participantId),
    [participantId, room?.participants]
  );

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !roomCode) return "";
    return `${window.location.origin}/?room=${roomCode}`;
  }, [roomCode]);

  function openRoom(code: string, id = "") {
    const normalized = code.toUpperCase();
    setRoomCode(normalized);
    setParticipantId(id || window.localStorage.getItem(storageKey(normalized)) || "");
    setView("room");
    setError("");
    window.history.replaceState({}, "", `/?room=${normalized}`);
    void loadRoom(normalized);
  }

  async function createWorld(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("先告诉这个世界该怎么称呼你");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/worlds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: worldName, vibe, hostName: name }),
      });
      const data = (await response.json()) as {
        code?: string;
        participantId?: string;
        error?: string;
      };
      if (!response.ok || !data.code || !data.participantId) {
        throw new Error(data.error || "创建失败，请稍后再试");
      }
      window.localStorage.setItem(storageKey(data.code), data.participantId);
      openRoom(data.code, data.participantId);
      setInviteOpen(true);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function joinWorld(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("输入一个现场的人能认出你的名字");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/worlds/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", name }),
      });
      const data = (await response.json()) as { participantId?: string; error?: string };
      if (!response.ok || !data.participantId) {
        throw new Error(data.error || "进入失败");
      }
      window.localStorage.setItem(storageKey(roomCode), data.participantId);
      setParticipantId(data.participantId);
      await loadRoom(roomCode);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "进入失败");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content || !participantId) return;
    setMessage("");
    try {
      const response = await fetch(`/api/worlds/${encodeURIComponent(roomCode)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", participantId, content }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "发送失败");
      await loadRoom(roomCode, true);
    } catch (sendError) {
      setMessage(content);
      setError(sendError instanceof Error ? sendError.message : "发送失败");
    }
  }

  function returnHome() {
    setView("home");
    setRoom(null);
    setRoomCode("");
    setError("");
    setInviteOpen(false);
    window.history.replaceState({}, "", "/");
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setError("邀请链接已复制");
      window.setTimeout(() => setError(""), 1600);
    } catch {
      setError("长按二维码或复制浏览器地址分享");
    }
  }

  if (view === "create") {
    return (
      <main className="app-shell create-shell">
        <header className="topbar compact">
          <button className="icon-button" onClick={() => setView("home")} aria-label="返回首页">
            ←
          </button>
          <Brand />
          <span className="step-label">建立世界</span>
        </header>

        <section className="create-layout">
          <div className="create-intro">
            <p className="eyebrow">CREATE A SHARED CONTEXT</p>
            <h1>先决定，今晚的人们<br />因为什么相遇。</h1>
            <p>你只需要选择氛围。因果会生成开场、关系线索和接下来的互动节奏。</p>
          </div>

          <form className="create-card" onSubmit={createWorld}>
            <label>
              世界名称
              <input
                value={worldName}
                onChange={(event) => setWorldName(event.target.value)}
                maxLength={24}
                placeholder="例如：毕业前的最后一晚"
              />
            </label>

            <fieldset>
              <legend>这里的人是什么关系？</legend>
              <div className="vibe-grid">
                {(Object.entries(VIBES) as [VibeKey, (typeof VIBES)[VibeKey]][]).map(
                  ([key, item]) => (
                    <button
                      type="button"
                      className={`vibe-option ${vibe === key ? "selected" : ""}`}
                      key={key}
                      onClick={() => setVibe(key)}
                    >
                      <span>{item.label}</span>
                      <small>{item.accent}</small>
                    </button>
                  )
                )}
              </div>
            </fieldset>

            <label>
              怎么称呼你？
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={12}
                placeholder="输入昵称"
              />
            </label>

            {error && <p className="form-error">{error}</p>}
            <button className="primary-button full" type="submit" disabled={busy}>
              {busy ? "正在生成世界…" : "生成世界二维码"}
              <span>↗</span>
            </button>
            <p className="form-note">MVP体验无需注册 · 世界通过邀请码连接</p>
          </form>
        </section>
      </main>
    );
  }

  if (view === "room") {
    return (
      <main className="room-shell">
        <header className="room-header">
          <button className="icon-button" onClick={returnHome} aria-label="退出世界">←</button>
          <div className="room-heading">
            <span>{room?.world.name || "正在进入世界"}</span>
            <small>{roomCode} · {room?.participants.length || 0}人在线</small>
          </div>
          <button className="invite-button" onClick={() => setInviteOpen(true)}>邀请</button>
        </header>

        {!room && !error && <RoomLoading />}

        {room && (
          <div className="room-body">
            <section className="presence-strip" aria-label="世界成员">
              <div className="presence-copy">
                <span className="live-dot" />
                关系正在发生
              </div>
              <div className="people-row">
                {room.participants.map((person) => (
                  <div className="person-chip" key={person.id} title={person.identity}>
                    <b>{person.emoji}</b>
                    <span>{person.name}</span>
                  </div>
                ))}
                <button className="add-person" onClick={() => setInviteOpen(true)} aria-label="邀请成员">＋</button>
              </div>
            </section>

            <section className="conversation" aria-live="polite">
              <div className="world-context">
                <p>{VIBES[room.world.vibe]?.label || "共同世界"}</p>
                <h2>{room.world.prompt}</h2>
                <span>因果引擎正在根据现场互动调整话题</span>
              </div>

              {room.messages.map((item) =>
                item.kind === "message" ? (
                  <article
                    className={`message-row ${item.participantId === participantId ? "mine" : ""}`}
                    key={item.id}
                  >
                    <div className="message-meta">
                      <span>{item.author}</span>
                      <time>{timeLabel(item.createdAt)}</time>
                    </div>
                    <p>{item.content}</p>
                  </article>
                ) : (
                  <article className={`causality-note ${item.kind}`} key={item.id}>
                    <div className="engine-mark">因</div>
                    <div>
                      <span>{item.kind === "arrival" ? "关系更新" : "因果正在发生"}</span>
                      <p>{item.content}</p>
                    </div>
                  </article>
                )
              )}
              <div ref={messageEnd} />
            </section>

            {!participantId || !me ? (
              <form className="join-dock" onSubmit={joinWorld}>
                <div>
                  <span>你已抵达这个世界</span>
                  <small>输入现场的人能认出你的名字</small>
                </div>
                <div className="join-line">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="你的名字"
                    maxLength={12}
                    aria-label="你的名字"
                  />
                  <button type="submit" disabled={busy}>{busy ? "进入中" : "进入"}</button>
                </div>
                {error && <p className="form-error">{error}</p>}
              </form>
            ) : (
              <form className="message-dock" onSubmit={sendMessage}>
                <div className="identity-pill">
                  <span>{me.emoji}</span>
                  <small>你的身份</small>
                  <b>{me.identity}</b>
                </div>
                <div className="message-input-row">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={280}
                    placeholder="说点真实的…"
                    aria-label="发送消息"
                  />
                  <button type="submit" disabled={!message.trim()} aria-label="发送">↑</button>
                </div>
                {error && <p className="room-error">{error}</p>}
              </form>
            )}
          </div>
        )}

        {error && !room && (
          <div className="empty-state">
            <span>世界信号中断</span>
            <p>{error}</p>
            <button onClick={returnHome}>返回首页</button>
          </div>
        )}

        {inviteOpen && room && (
          <div className="modal-backdrop" onClick={() => setInviteOpen(false)}>
            <section className="invite-modal" onClick={(event) => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setInviteOpen(false)} aria-label="关闭">×</button>
              <p className="eyebrow">SCAN TO ENTER</p>
              <h2>扫码进入<br />「{room.world.name}」</h2>
              <div className="qr-frame">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(inviteUrl)}`}
                  alt={`进入世界 ${roomCode} 的二维码`}
                />
                <span>因果相连</span>
              </div>
              <div className="invite-code">
                <small>邀请码</small>
                <b>{roomCode}</b>
              </div>
              <button className="primary-button full" onClick={copyInvite}>复制邀请链接</button>
              <p className="form-note">无需下载 · 微信与浏览器均可打开</p>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />
        <nav aria-label="主要导航">
          <button className="active">此刻</button>
          <button onClick={() => setView("create")}>创造</button>
          <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>关于</button>
        </nav>
        <button className="mini-create" onClick={() => setView("create")}>＋ 建立世界</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="status-line"><span /> AI原生情境社交平台 · MVP</div>
          <h1>不是和AI聊天。<br /><em>是让AI帮助我们聊天。</em></h1>
          <p>
            扫码进入同一个世界。因果根据现场的人与关系，生成话题、身份和共同经历。
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setView("create")}>
              创建一个世界 <span>↗</span>
            </button>
            <form
              className="code-entry"
              onSubmit={(event) => {
                event.preventDefault();
                if (joinCode.trim()) openRoom(joinCode.trim());
              }}
            >
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                maxLength={6}
                placeholder="输入邀请码"
                aria-label="输入邀请码"
              />
              <button type="submit" aria-label="进入世界">→</button>
            </form>
          </div>
          <div className="trust-row">
            <span>无需下载</span><i />
            <span>扫码即用</span><i />
            <span>真人优先</span>
          </div>
        </div>

        <div className="relation-canvas" aria-label="多人关系在因果中形成连接的示意图">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="relation-node node-a"><b>林</b><span>发起了一个话题</span></div>
          <div className="relation-node node-b"><b>周</b><span>发现共同经历</span></div>
          <div className="relation-node node-c"><b>陈</b><span>正在认真倾听</span></div>
          <div className="causality-core"><span>因</span><small>正在连接</small></div>
          <div className="pulse p1" />
          <div className="pulse p2" />
          <div className="canvas-caption">
            <span>LIVE CONTEXT</span>
            <b>3个人 · 7条关系线索</b>
          </div>
        </div>
      </section>

      <section className="worlds-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WORLDS HAPPENING NOW</p>
            <h2>此刻正在发生</h2>
          </div>
          <button onClick={() => setView("create")}>创造你的场景 →</button>
        </div>
        <div className="world-grid">
          {sampleWorlds.map((world) => (
            <article className={`world-card ${world.tone}`} key={world.mark}>
              <div className="world-card-top"><span>{world.mark}</span><i>LIVE</i></div>
              <div className="world-threads"><span /><span /><span /></div>
              <h3>{world.title}</h3>
              <p>{world.detail}</p>
              <button onClick={() => setView("create")}>以此为灵感创建 <span>↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="belief-section" id="about">
        <p className="eyebrow">OUR BELIEF</p>
        <blockquote>
          “下一代社交产品，不应该制造更多内容，<br />而应该制造更多<strong>人与人的共同经历</strong>。”
        </blockquote>
        <div className="belief-footer">
          <span>因果 Causality</span>
          <span>煜零科技 YuZero · 北京</span>
        </div>
      </section>

      <footer className="mobile-nav">
        <button className="active"><span>◉</span>此刻</button>
        <button onClick={() => setView("create")}><span>＋</span>创造</button>
        <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}><span>◎</span>关于</button>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <button className="brand" onClick={() => window.location.assign("/")} aria-label="因果首页">
      <span className="brand-mark">因</span>
      <span><b>因果</b><small>CAUSALITY</small></span>
    </button>
  );
}

function RoomLoading() {
  return (
    <div className="room-loading">
      <span>因</span>
      <p>正在读取这个世界的关系…</p>
    </div>
  );
}
