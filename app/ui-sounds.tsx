"use client";

import { useEffect } from "react";

const TAP_SOUND = "/audio/cofate-ui-tap.wav";
const CONFIRM_SOUND = "/audio/cofate-ui-confirm.wav";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>('button, a[href], [role="button"]');
  if (!element || element.matches(":disabled") || element.getAttribute("aria-disabled") === "true") return null;
  return element;
}

function isConfirmAction(element: HTMLElement) {
  return (
    element.matches('button[type="submit"], .primary-button, .secret-submit, .match-strip, .custom-world-card, .script-card') ||
    /提交|进入|开启|创建|加入|匹配|发送|确认|下载|安装/.test(element.textContent || "")
  );
}

export function UiSounds() {
  useEffect(() => {
    const tap = new Audio(TAP_SOUND);
    const confirm = new Audio(CONFIRM_SOUND);
    tap.preload = "auto";
    confirm.preload = "auto";
    tap.load();
    confirm.load();

    const play = (source: HTMLAudioElement, volume: number) => {
      const sound = source.cloneNode(true) as HTMLAudioElement;
      sound.volume = volume;
      void sound.play().catch(() => undefined);
    };

    const trigger = (target: EventTarget | null) => {
      const element = isInteractiveTarget(target);
      if (!element) return;
      const confirmAction = isConfirmAction(element);
      play(confirmAction ? confirm : tap, confirmAction ? 0.3 : 0.22);
    };

    const onPointerDown = (event: PointerEvent) => trigger(event.target);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      trigger(event.target);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  return null;
}
