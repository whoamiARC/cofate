import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yuzero.cofate",
  appName: "CoFate 因果",
  webDir: "native-shell",
  appendUserAgent: " CoFateAndroid/0.1.0",
  backgroundColor: "#f0eee6",
  server: {
    url: "https://yuzero-causality.yuzero-tech.workers.dev/app",
    cleartext: false,
    allowNavigation: [
      "yuzero-causality.yuzero-tech.workers.dev",
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
