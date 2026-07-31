export type ScriptCatalogItem = {
  id: string;
  mark: string;
  title: string;
  tagline: string;
  theme: string;
  category: "聚会" | "双人" | "都市" | "校园" | "轻悬疑";
  players: string;
  duration: string;
  price: 0 | 1;
  tone: "acid" | "violet" | "amber" | "blue" | "rose" | "mint";
  featured?: boolean;
};

export const SCRIPT_CATALOG: ScriptCatalogItem[] = [
  { id: "last-train", mark: "夜", title: "末班之后", tagline: "终点站之后，还有一站。", theme: "午夜末班车越过终点站后，车厢广播开始念出乘客从未说过的秘密", category: "都市", players: "3—6 人", duration: "25 分钟", price: 0, tone: "acid", featured: true },
  { id: "absent-guest", mark: "宴", title: "缺席者的晚宴", tagline: "多出来的餐具，属于谁？", theme: "朋友聚会多出一套餐具，所有合照里都站着一个没人认识的人", category: "聚会", players: "4—8 人", duration: "30 分钟", price: 1, tone: "violet", featured: true },
  { id: "floor-thirteen", mark: "楼", title: "不存在的十三层", tagline: "电梯停下时，别第一个出去。", theme: "深夜电梯停在不存在的楼层，走廊尽头贴着一份每天都会改写的规则", category: "都市", players: "2—5 人", duration: "25 分钟", price: 0, tone: "blue", featured: true },
  { id: "tidal-promise", mark: "岛", title: "潮汐失约", tagline: "退潮以后，门从海里出现。", theme: "海岛民宿被大雾封住，退潮后沙滩上出现了写着每个人名字的房门", category: "轻悬疑", players: "3—6 人", duration: "35 分钟", price: 1, tone: "mint" },
  { id: "class-photo", mark: "照", title: "毕业照第九排", tagline: "照片里的人，比当年多一个。", theme: "同学聚会翻出毕业照，照片第九排出现了一个所有人都声称认识、却叫不出名字的人", category: "校园", players: "4—8 人", duration: "30 分钟", price: 0, tone: "rose" },
  { id: "silent-library", mark: "书", title: "闭馆后的借阅者", tagline: "归还一本从未借出的书。", theme: "大学图书馆闭馆后，借阅系统显示在场每个人都借过一本记录自己未来的书", category: "校园", players: "2—6 人", duration: "25 分钟", price: 1, tone: "amber" },
  { id: "truth-store", mark: "真", title: "凌晨便利店", tagline: "这里不收钱，只收一句真话。", theme: "凌晨便利店的收银台没有价格，顾客必须用一句从未说出口的真话换取离开的线索", category: "双人", players: "2 人", duration: "20 分钟", price: 0, tone: "amber" },
  { id: "parallel-call", mark: "电", title: "来自另一条线的电话", tagline: "电话那头，是五分钟后的你。", theme: "两个人同时接到来自彼此号码的电话，电话中的声音却提前说出了五分钟后发生的事", category: "双人", players: "2 人", duration: "20 分钟", price: 1, tone: "violet" },
  { id: "museum-night", mark: "藏", title: "博物馆失窃之夜", tagline: "丢失的展品，从未被展出。", theme: "私人博物馆停电后，所有人收到通知：一件不存在于目录中的展品被盗了", category: "聚会", players: "4—8 人", duration: "35 分钟", price: 1, tone: "blue" },
  { id: "memory-vote", mark: "票", title: "记忆表决会", tagline: "多数人的记忆，就一定是真的吗？", theme: "聚会开始前，每个人都收到一张选票，必须投票删除今晚某个人的一段共同记忆", category: "聚会", players: "3—8 人", duration: "30 分钟", price: 0, tone: "rose" },
  { id: "rain-station", mark: "雨", title: "永不停雨的车站", tagline: "雨停之前，不要说出目的地。", theme: "所有人在暴雨中躲进同一座废弃车站，时刻表上却依次出现了每个人最想逃离的地方", category: "轻悬疑", players: "2—6 人", duration: "25 分钟", price: 0, tone: "mint" },
  { id: "mirror-shift", mark: "镜", title: "镜面夜班", tagline: "镜子里的同事，早你一步下班。", theme: "写字楼夜班期间，镜子里的所有人开始比现实快一步行动，门禁记录却显示无人加班", category: "都市", players: "3—6 人", duration: "30 分钟", price: 1, tone: "acid" },
  { id: "radio-zero", mark: "零", title: "零点广播", tagline: "听见名字的人，不要回答。", theme: "校园广播在零点自动响起，主持人逐一念出仍在校园里的名字，并宣布一条只对那个人生效的规则", category: "校园", players: "3—7 人", duration: "30 分钟", price: 0, tone: "blue" },
  { id: "empty-room", mark: "空", title: "多出来的房间", tagline: "这间房，记得你们所有人。", theme: "民宿平面图突然多出一个房间，房内摆放着每位住客童年时丢失的一件东西", category: "聚会", players: "3—8 人", duration: "35 分钟", price: 1, tone: "amber" },
  { id: "voice-note", mark: "声", title: "未发送的语音", tagline: "它来自一个不存在的群聊。", theme: "两个人的手机同时出现一条未发送语音，内容是他们十分钟后的一段争吵", category: "双人", players: "2 人", duration: "18 分钟", price: 0, tone: "rose" },
  { id: "night-exam", mark: "考", title: "无人参加的补考", tagline: "答错的人，会忘记一道真实经历。", theme: "深夜教学楼亮起一间考场，试卷上的每一道题都来自参与者共同经历却没人承认的往事", category: "校园", players: "3—6 人", duration: "30 分钟", price: 1, tone: "violet" },
];

export function findScript(scriptId: string) {
  return SCRIPT_CATALOG.find((script) => script.id === scriptId);
}
