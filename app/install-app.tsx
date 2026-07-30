"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallAppButtonProps = {
  children?: ReactNode;
  className?: string;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallAppButton({
  children = "安装 CoFate",
  className = "",
}: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setInstalled(isStandalone()));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setGuideOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installed) {
      window.location.href = "/app";
      return;
    }
    if (!installPrompt) {
      setGuideOpen(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <>
      <button className={className} type="button" onClick={install}>
        {installed ? "打开 CoFate" : children}
      </button>
      {guideOpen && (
        <div className="install-backdrop" role="presentation" onClick={() => setGuideOpen(false)}>
          <section
            className="install-guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-close" onClick={() => setGuideOpen(false)} aria-label="关闭安装说明">
              ×
            </button>
            <p className="eyebrow">INSTALL COFATE</p>
            <h2 id="install-title">把世界入口，放到桌面。</h2>
            <div className="install-steps">
              <article>
                <span>iPhone / iPad</span>
                <p>请用 Safari 打开本页，点击底部“分享”，再选择“添加到主屏幕”。</p>
              </article>
              <article>
                <span>Android</span>
                <p>请用 Chrome 打开本页，点击右上角菜单，选择“安装应用”。</p>
              </article>
              <article>
                <span>电脑</span>
                <p>使用 Chrome 或 Edge，点击地址栏右侧的安装图标。</p>
              </article>
            </div>
            <Link className="primary-button" href="/app">
              先打开网页版 <span>↗</span>
            </Link>
            <small>公测版无需应用商店，安装后可像普通软件一样打开。</small>
          </section>
        </div>
      )}
    </>
  );
}
