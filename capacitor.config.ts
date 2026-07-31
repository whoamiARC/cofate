import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yuzero.cofate",
  appName: "CoFate 因果",
  webDir: "native-shell",
  appendUserAgent: " CoFateAndroid/0.1.1",
  backgroundColor: "#f0eee6",
  server: {
    url: "https://cofate.yuzero-tech.workers.dev/app",
    cleartext: false,
    allowNavigation: [
      "cofate.yuzero-tech.workers.dev",
      "cofate.com",
      "www.cofate.com",
    ],
  },
  android: {
    backgroundColor: "#f0eee6",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
