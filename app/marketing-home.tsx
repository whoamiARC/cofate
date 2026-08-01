"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { InstallAppButton } from "./install-app";

const ANDROID_APK_PATH = "/downloads/CoFate-Android-Beta-v0.1.4.apk";

const worldCards = [
  {
    code: "WORLD 01",
    title: "末班地铁没有终点",
    meta: "规则怪谈 · 4—6 人",
    clue: "第三次报站后，不要看向窗外。",
  },
  {
    code: "WORLD 02",
    title: "第七码头的来信",
    meta: "身份谜局 · 3—5 人",
    clue: "寄信人就在你们之中。",
  },
  {
    code: "WORLD 03",
    title: "凌晨两点的校友会",
    meta: "聚会限定 · 2—8 人",
    clue: "有人记得一件从未发生的事。",
  },
];

export function MarketingHome() {
  const [appUrl, setAppUrl] = useState("/app");
  const [downloadUrl, setDownloadUrl] = useState(ANDROID_APK_PATH);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const world = params.get("world");
    if (world) {
      window.location.replace(`/app?world=${encodeURIComponent(world)}`);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setAppUrl(`${window.location.origin}/app`);
      setDownloadUrl(`${window.location.origin}${ANDROID_APK_PATH}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="site-page">
      <div className="site-grain" aria-hidden="true" />
      <header className="site-nav">
        <a className="site-brand" href="#" aria-label="CoFate 因果首页">
          <span className="brand-seal">因</span>
          <span>
            <strong>CoFate</strong>
            <small>因果</small>
          </span>
        </a>
        <nav aria-label="官网导航">
          <a href="#how">它如何发生</a>
          <a href="#worlds">世界样本</a>
          <a href="#creators">成为创作者</a>
        </nav>
        <a className="nav-app-link" href="/app">进入世界 <span>↗</span></a>
      </header>

      <section className="site-hero" id="top">
        <div className="hero-status">
          <span><i /> PUBLIC BETA · 公开测试中</span>
          <span>YUZERO TECHNOLOGY · BEIJING</span>
        </div>
        <div className="site-hero-grid">
          <div className="site-hero-copy">
            <p className="site-kicker">REAL PEOPLE · GENERATED WORLD</p>
            <h1>
              一个二维码，
              <br />
              <em>把在场的人</em>
              <br />
              送进同一个世界。
            </h1>
            <p className="site-lead">
              每个人获得只有自己知道的身份、规则与目标。AI 让世界持续生长，真人的每一次选择，让彼此产生因果。
            </p>
            <div className="site-hero-actions">
              <a className="platform-download-button android-download" href={ANDROID_APK_PATH} download>
                <small>ANDROID</small><strong>下载安卓版</strong><span>↓</span>
              </a>
              <InstallAppButton className="platform-download-button iphone-download">
                <small>IPHONE</small><strong>安装苹果版</strong><span>↗</span>
              </InstallAppButton>
            </div>
            <a className="site-text-link hero-web-entry" href="/app">无需下载，直接进入网页版世界 <span>↗</span></a>
            <div className="site-platforms">
              <span>Android 7+</span><i /> <span>公测版 v0.1.4</span><i /> <span>约 5 MB</span><i /> <span>iPhone · Safari 安装</span>
            </div>
          </div>
          <WorldPortal />
        </div>
        <a className="scroll-cue" href="#how"><span>向下进入</span><i /></a>
      </section>

      <section className="site-proof" aria-label="产品特点">
        <div><strong>01</strong><span>扫码获得邀请码<br />APP 或网页均可进入</span></div>
        <div><strong>02</strong><span>每人一张<br />仅自己可见的身份卡</span></div>
        <div><strong>03</strong><span>所有选择<br />汇成一条共同主线</span></div>
        <div><strong>∞</strong><span>同一个主题<br />永远不会发生两次</span></div>
      </section>

      <section className="site-how" id="how">
        <div className="section-heading">
          <p className="site-kicker">HOW A WORLD BEGINS</p>
          <h2>三十秒，离开现实。</h2>
          <p>AI 不代替朋友。它只负责制造一个足够奇怪的世界，让真正的人有话可说、有事可做、有秘密可以共同经历。</p>
        </div>
        <div className="act-list">
          <article>
            <div className="act-number">ACT. 01</div>
            <div className="act-visual invite-visual" aria-hidden="true">
              <div className="mini-qr"><QRCodeSVG value={appUrl} size={140} level="M" marginSize={1} /></div>
              <span className="scan-line" />
            </div>
            <h3>创建入口</h3>
            <p>写下一句话，AI 将它扩展成一个世界。把二维码递给身边的人，或者发给远方的朋友。</p>
          </article>
          <article>
            <div className="act-number">ACT. 02</div>
            <div className="act-visual identity-visual" aria-hidden="true">
              <div className="identity-card identity-back">PRIVATE</div>
              <div className="identity-card identity-front">
                <small>仅你可见</small>
                <strong>最后的乘客</strong>
                <span>你知道列车真正的终点。</span>
              </div>
            </div>
            <h3>领取身份</h3>
            <p>每个人都会得到不同的身份、秘密规则和私人目标。你们彼此需要，也可能彼此隐瞒。</p>
          </article>
          <article>
            <div className="act-number">ACT. 03</div>
            <div className="act-visual choice-visual" aria-hidden="true">
              <span>林：我选择敲门。</span>
              <span>周：我关掉所有灯。</span>
              <span>你：我想起那条被忘记的规则。</span>
              <b>因果正在汇合…</b>
            </div>
            <h3>共同选择</h3>
            <p>只有所有人完成选择，世界才会继续。没有预设结局，你们共同成为下一段故事的原因。</p>
          </article>
        </div>
      </section>

      <section className="site-statement">
        <div className="statement-orbit" aria-hidden="true"><i /><i /><i /><span>AI</span></div>
        <p>NOT AN AI COMPANION</p>
        <h2>不是和 AI 聊天。<br />是让 AI 帮助我们聊天。</h2>
        <div className="statement-foot">
          <span>AI 生成世界</span>
          <i />
          <span>真人建立关系</span>
        </div>
      </section>

      <section className="world-showcase" id="worlds">
        <div className="section-heading horizontal">
          <div>
            <p className="site-kicker">WORLDS ARE HAPPENING</p>
            <h2>今晚，去哪里？</h2>
          </div>
          <p>世界可以来自一句怪谈、一次聚会、一个陌生人的信号，也可以来自未来每一位创作者的想象。</p>
        </div>
        <div className="world-card-grid">
          {worldCards.map((world, index) => (
            <article className={`showcase-card showcase-${index + 1}`} key={world.code}>
              <header><span>{world.code}</span><i>0{index + 3} 人在线</i></header>
              <div className="showcase-sigil"><span>{["门", "信", "夜"][index]}</span></div>
              <div>
                <p>{world.meta}</p>
                <h3>{world.title}</h3>
                <small>{world.clue}</small>
              </div>
            </article>
          ))}
        </div>
        <div className="occasion-line">
          <span>朋友聚会</span><i>×</i><span>异地夜聊</span><i>×</i><span>双人匹配</span><i>×</i><span>社团破冰</span>
        </div>
      </section>

      <section className="creator-section" id="creators">
        <div className="creator-console" aria-hidden="true">
          <header><span>COFATE WORLD STUDIO</span><i>● LIVE</i></header>
          <div className="console-grid">
            <div className="console-nav"><b>世界设定</b><span>角色关系</span><span>公开规则</span><span>生成边界</span></div>
            <div className="console-editor">
              <small>世界的第一条规则</small>
              <p>午夜之后，如果有人叫出你的真名——</p>
              <div><span>保持沉默</span><span>观察说话的人</span><span>创建新规则 ＋</span></div>
            </div>
          </div>
          <footer><span>AI VALIDATION PASSED</span><button>发布这个世界 ↗</button></footer>
        </div>
        <div className="creator-copy">
          <p className="site-kicker">FOR THE NEXT WORLD-BUILDERS</p>
          <h2>以后，世界不只由我们创造。</h2>
          <p>CoFate 将开放世界编辑器。写作者、导演、桌游设计师和每一个想讲故事的人，都能把想象变成可被真人共同经历的世界。</p>
          <ul>
            <li><span>01</span>发布自己的角色与规则系统</li>
            <li><span>02</span>根据完成局数与口碑获得收益</li>
            <li><span>03</span>让一个世界跨越城市持续发生</li>
          </ul>
          <a href="mailto:hello@cofate.com">申请成为首批世界创作者 <span>↗</span></a>
        </div>
      </section>

      <section className="download-section" id="download">
        <div className="download-copy">
          <p className="site-kicker">YOUR NEXT STORY IS WAITING</p>
          <h2>下一段因果，<br />从你发出邀请开始。</h2>
          <p>Android 安装包和 iPhone 桌面公测版现已同时开放。iPhone 使用 Safari 添加到主屏幕后，可像普通 APP 一样全屏打开。</p>
          <div className="download-platform-grid">
            <a className="platform-download-button android-download" href={ANDROID_APK_PATH} download>
              <small>ANDROID 7+</small><strong>下载安卓版</strong><span>↓</span>
            </a>
            <InstallAppButton className="platform-download-button iphone-download">
              <small>IPHONE / IPAD</small><strong>安装苹果版</strong><span>↗</span>
            </InstallAppButton>
          </div>
          <a className="download-web-entry" href="/app">直接使用网页版 →</a>
        </div>
        <div className="download-qr">
          <div><QRCodeSVG value={downloadUrl} size={220} level="M" marginSize={2} /></div>
          <p>手机扫码<br /><span>下载 CoFate Android 公测 APK</span></p>
        </div>
      </section>

      <footer className="site-footer">
        <a className="site-brand footer-brand" href="#top">
          <span className="brand-seal">因</span>
          <span><strong>CoFate</strong><small>因果</small></span>
        </a>
        <p>AI 生成世界，真人建立关系。</p>
        <div>
          <a href="mailto:hello@cofate.com">CONTACT</a>
          <span>© 2026 煜零科技 YUZERO</span>
        </div>
      </footer>
    </main>
  );
}

function WorldPortal() {
  return (
    <div className="portal-stage" aria-label="三位参与者的选择正在汇入同一个世界">
      <div className="portal-grid" />
      <div className="portal-ring ring-one" />
      <div className="portal-ring ring-two" />
      <div className="portal-ring ring-three" />
      <div className="portal-axis axis-one" />
      <div className="portal-axis axis-two" />
      <div className="portal-axis axis-three" />
      <div className="portal-core">
        <span>因果</span>
        <small>WORLD IS LISTENING</small>
      </div>
      <div className="portal-person portal-person-a"><b>林</b><span><i />身份已确认</span></div>
      <div className="portal-person portal-person-b"><b>周</b><span><i />正在做出选择</span></div>
      <div className="portal-person portal-person-c"><b>你</b><span><i />秘密尚未公开</span></div>
      <div className="portal-message message-a">不要相信镜子里的第四个人</div>
      <div className="portal-message message-b">所有人完成选择后，世界继续</div>
      <div className="portal-coordinate">39.9042° N · 116.4074° E<br />SIGNAL STABLE</div>
    </div>
  );
}
