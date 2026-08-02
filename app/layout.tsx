import type { Metadata } from "next";
import { headers } from "next/headers";
import { PwaRegister } from "./pwa-register";
import { UiSounds } from "./ui-sounds";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "CoFate 因果｜和真人一起，进入 AI 生成的世界";
  const description =
    "一个二维码，把在场和远方的人送进同一个 AI 文字世界。每个人拥有秘密身份与规则，所有选择共同改变故事。";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    applicationName: "CoFate 因果",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "CoFate",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CoFate 因果",
      locale: "zh_CN",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <PwaRegister />
        <UiSounds />
        {children}
      </body>
    </html>
  );
}
