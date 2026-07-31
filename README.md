# CoFate 因果

> 不是和 AI 聊天，是和真人一起掉进同一个 AI 世界。

CoFate 是煜零科技正在开发的 AI 原生多人叙事社交软件。用户通过二维码或邀请码进入同一个临时世界，DeepSeek 根据参与者和主题生成规则怪谈、隐藏身份、私人目标与共同主线。

AI 负责世界，真人负责关系。

## 产品结构

- `/`：CoFate 官方网站、产品介绍与 Android APK 下载入口
- `/app`：无需下载即可使用的 CoFate 网页版
- `/app?world=XXXXXX`：扫码直接进入指定世界
- `/downloads/CoFate-Android-Beta-v0.1.2.apk`：Android 7+ 公测安装包
- `/api`：多人房间、匹配和 AI 世界生成服务

## 当前能力

- 创建私人世界并描述主题
- 自动生成邀请链接和可扫码二维码
- 手机、电脑跨网络进入同一个房间
- DeepSeek 为每位参与者生成仅本人可见的身份、规则与目标
- 所有参与者提交选择后，共同推进世界主线
- 一个人进入在线双人匹配
- 持久化成员、回合、公开规则与私人回声
- 提供可下载到 Android 手机的独立 APK
- 网页版仍支持 iPhone、Android、Windows 和 macOS 浏览器

## Android 公测版

Android 工程位于 `android/`，使用 Capacitor 将 CoFate 云端应用封装为手机软件：

- 应用名称：`CoFate 因果`
- 应用包名：`com.yuzero.cofate`
- 当前版本：`0.1.2`
- 最低系统：Android 7（API 24）
- 云端入口：`https://www.cofate.com/app`

本机构建需要 JDK 21 和 Android SDK 36：

```bash
npm run android:sync
cd android
gradlew.bat assembleDebug
```

生成的 APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`。公测阶段可以直接安装；正式上架应用商店前，需要使用长期保存的正式签名密钥构建 release/AAB。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看官网，或打开 `http://localhost:3000/app` 使用软件。

DeepSeek 密钥只应配置在服务端环境中：

```text
DEEPSEEK_API_KEY=你的密钥
```

可选设置 `DEEPSEEK_MODEL` 切换模型。不要把任何 API 密钥写入前端代码或提交到 Git。

## 产品原则

1. AI 不替代真人关系。
2. 世界是社交场景，不是预设答案的游戏。
3. 用户离开时，应当带走一段与他人共同经历的记忆。
4. 扫码和受邀参与者始终应保持低门槛。

## 团队

煜零科技 YuZero · 北京
