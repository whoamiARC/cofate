export type ScriptStage = {
  fromTurn: number;
  toTurn: number;
  title: string;
  task: string;
};

export type ScriptPlan = {
  maxTurns: number;
  endingCondition: string;
  stages: [ScriptStage, ScriptStage, ScriptStage];
};

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
  plan: ScriptPlan;
  featured?: boolean;
};

function storyPlan(maxTurns: number, discovery: string, crossing: string, finale: string, endingCondition: string): ScriptPlan {
  const finalFrom = maxTurns - 1;
  return {
    maxTurns,
    endingCondition,
    stages: [
      { fromTurn: 1, toTurn: 2, title: "发现异常", task: discovery },
      { fromTurn: 3, toTurn: finalFrom - 1, title: "因果交叉", task: crossing },
      { fromTurn: finalFrom, toTurn: maxTurns, title: "最终选择", task: finale },
    ],
  };
}

export const GENERIC_STORY_PLAN = storyPlan(
  8,
  "探索环境、确认公开规则，并让每个人获得第一条有效线索。",
  "让身份秘密发生交叉，验证规则真假，并形成必须共同处理的核心冲突。",
  "揭示核心真相，让所有人完成最后一次不可撤回的共同选择。",
  "核心冲突得到处理且所有人完成最终选择；第8回合无条件生成结局。",
);

export const SCRIPT_CATALOG: ScriptCatalogItem[] = [
  { id: "last-train", mark: "夜", title: "末班之后", tagline: "终点站之后，还有一站。", theme: "午夜末班车越过终点站后，车厢广播开始念出乘客从未说过的秘密", category: "都市", players: "3—6 人", duration: "25 分钟", price: 0, tone: "acid", featured: true, plan: storyPlan(6, "调查异常广播、车厢与乘客秘密，确认列车为何越过终点。", "找出虚假站名、不能下车的人，以及广播隐瞒的真实终点。", "所有人决定在隐藏终点下车、留在车上，或付出代价让列车返程。", "列车抵达真实终点，且所有人完成最后的下车选择；第6回合强制收束。") },
  { id: "absent-guest", mark: "宴", title: "缺席者的晚宴", tagline: "多出来的餐具，属于谁？", theme: "朋友聚会多出一套餐具，所有合照里都站着一个没人认识的人", category: "聚会", players: "4—8 人", duration: "30 分钟", price: 1, tone: "violet", featured: true, plan: storyPlan(7, "调查多出的餐具、座位和合照，收集关于缺席者的矛盾记忆。", "拼出缺席者与每个人的关系，并确认是谁主动删除了这段记忆。", "共同表决让缺席者回来、彻底遗忘，或由一人替代其席位。", "最后一次席位表决完成，空椅接受结果；第7回合强制结束晚宴。") },
  { id: "floor-thirteen", mark: "楼", title: "不存在的十三层", tagline: "电梯停下时，别第一个出去。", theme: "深夜电梯停在不存在的楼层，走廊尽头贴着一份每天都会改写的规则", category: "都市", players: "2—5 人", duration: "25 分钟", price: 0, tone: "blue", featured: true, plan: storyPlan(6, "探索十三层并验证至少两条走廊规则，找到规则被改写的痕迹。", "判断哪条规则是出口、哪条规则在选择住户，并找出属于十三层的人。", "选择电梯、楼梯或留在十三层，并决定是否带走被选中的人。", "所有人离开或明确选择留下；第6回合十三层将自行封闭。") },
  { id: "tidal-promise", mark: "岛", title: "潮汐失约", tagline: "退潮以后，门从海里出现。", theme: "海岛民宿被大雾封住，退潮后沙滩上出现了写着每个人名字的房门", category: "轻悬疑", players: "3—6 人", duration: "35 分钟", price: 1, tone: "mint", plan: storyPlan(7, "调查写有名字的房门，发现每扇门对应的一次失约。", "让玩家面对、交换或隐瞒自己的旧承诺，拼出海岛封锁的原因。", "决定打开、封闭或交换房门，并共同处理最早的那次失约。", "潮水重新覆盖所有房门，且众人完成选择；第7回合必然涨潮。") },
  { id: "class-photo", mark: "照", title: "毕业照第九排", tagline: "照片里的人，比当年多一个。", theme: "同学聚会翻出毕业照，照片第九排出现了一个所有人都声称认识、却叫不出名字的人", category: "校园", players: "4—8 人", duration: "30 分钟", price: 0, tone: "rose", plan: storyPlan(6, "对比照片、座位和毕业记忆，收集关于第九排人物的描述。", "找出多出来的人与被删除事件之间的关系，确认谁的记忆最不可靠。", "共同决定恢复、改写或永久删除这段班级记忆。", "众人确认照片最终应有的人数并接受代价；第6回合照片定格。") },
  { id: "silent-library", mark: "书", title: "闭馆后的借阅者", tagline: "归还一本从未借出的书。", theme: "大学图书馆闭馆后，借阅系统显示在场每个人都借过一本记录自己未来的书", category: "校园", players: "2—6 人", duration: "25 分钟", price: 1, tone: "amber", plan: storyPlan(6, "找到各自的未来之书，确认书中预言与现实的对应关系。", "交换部分未来、验证管理员规则，并找出那本没有借阅者的书。", "决定归还、交换、改写或销毁未来之书。", "所有书籍得到处置且借阅系统结算；第6回合图书馆强制闭馆。") },
  { id: "truth-store", mark: "真", title: "凌晨便利店", tagline: "这里不收钱，只收一句真话。", theme: "凌晨便利店的收银台没有价格，顾客必须用一句从未说出口的真话换取离开的线索", category: "双人", players: "2 人", duration: "20 分钟", price: 0, tone: "amber", plan: storyPlan(5, "两人分别支付第一句真话，换取关于出口的不同线索。", "真话产生关系冲突，两人判断哪些话仍被便利店标记为谎言。", "各自说出最后一件不愿承认的事，并选择一起或分别离开。", "两人都完成最终真话并选择离开方式；第5回合收银台结账。") },
  { id: "parallel-call", mark: "电", title: "来自另一条线的电话", tagline: "电话那头，是五分钟后的你。", theme: "两个人同时接到来自彼此号码的电话，电话中的声音却提前说出了五分钟后发生的事", category: "双人", players: "2 人", duration: "20 分钟", price: 1, tone: "violet", plan: storyPlan(5, "验证电话中的三个未来细节，区分预言与诱导。", "找出时间循环由谁触发，以及哪一次行动会让另一人消失。", "两人同时执行或拒绝最后一条电话指令。", "五分钟时间差闭合，两人完成同步选择；第5回合强制断线。") },
  { id: "museum-night", mark: "藏", title: "博物馆失窃之夜", tagline: "丢失的展品，从未被展出。", theme: "私人博物馆停电后，所有人收到通知：一件不存在于目录中的展品被盗了", category: "聚会", players: "4—8 人", duration: "35 分钟", price: 1, tone: "blue", plan: storyPlan(7, "搜查展厅、目录与停电记录，确认不存在展品留下的痕迹。", "找出偷窃者、动机与伪造目录的人，让角色利益公开冲突。", "公开指认、帮助隐藏展品，或承认展品本就是某个人。", "最终指认完成且停电结束；第7回合保安系统自动封馆。") },
  { id: "memory-vote", mark: "票", title: "记忆表决会", tagline: "多数人的记忆，就一定是真的吗？", theme: "聚会开始前，每个人都收到一张选票，必须投票删除今晚某个人的一段共同记忆", category: "聚会", players: "3—8 人", duration: "30 分钟", price: 0, tone: "rose", plan: storyPlan(6, "展示每个人不同版本的共同记忆，收集第一轮投票理由。", "揭示删除每段记忆的代价，并让联盟、隐瞒与反对票发生交叉。", "完成删除、保留或交换记忆的最终表决。", "所有有效选票提交并执行结果；第6回合记忆系统强制计票。") },
  { id: "rain-station", mark: "雨", title: "永不停雨的车站", tagline: "雨停之前，不要说出目的地。", theme: "所有人在暴雨中躲进同一座废弃车站，时刻表上却依次出现了每个人最想逃离的地方", category: "轻悬疑", players: "2—6 人", duration: "25 分钟", price: 0, tone: "mint", plan: storyPlan(6, "调查时刻表、废弃站台与禁止说出目的地的规则。", "让每个人面对真正想逃离的地方，判断哪班车会夺走一段记忆。", "选择登车、留下，或冒险说出真正目的地让雨停下。", "雨停、列车离站或所有人明确留下；第6回合最后一班车到达。") },
  { id: "mirror-shift", mark: "镜", title: "镜面夜班", tagline: "镜子里的同事，早你一步下班。", theme: "写字楼夜班期间，镜子里的所有人开始比现实快一步行动，门禁记录却显示无人加班", category: "都市", players: "3—6 人", duration: "30 分钟", price: 1, tone: "acid", plan: storyPlan(7, "记录镜像与现实的时间差，确认至少三处提前发生的动作。", "找出谁已被镜像替换，以及门禁记录中消失的真实时间。", "决定打碎、交换或同步镜面世界，并选择保留哪一个版本。", "现实与镜像只剩一个稳定版本；第7回合镜面完成替换。") },
  { id: "radio-zero", mark: "零", title: "零点广播", tagline: "听见名字的人，不要回答。", theme: "校园广播在零点自动响起，主持人逐一念出仍在校园里的名字，并宣布一条只对那个人生效的规则", category: "校园", players: "3—7 人", duration: "30 分钟", price: 0, tone: "blue", plan: storyPlan(6, "遵守点名规则并追踪广播来源，记录每个名字后的异常。", "判断主持人的身份，交换个人规则并找出能关闭广播的共同频率。", "选择回应、关闭或接管广播，处理最后一个被念出的名字。", "最后一个名字处理完毕且广播归于沉默；第6回合强制播出终场。") },
  { id: "empty-room", mark: "空", title: "多出来的房间", tagline: "这间房，记得你们所有人。", theme: "民宿平面图突然多出一个房间，房内摆放着每位住客童年时丢失的一件东西", category: "聚会", players: "3—8 人", duration: "35 分钟", price: 1, tone: "amber", plan: storyPlan(7, "调查房间、遗失物与平面图，确认物品为何认识现在的主人。", "揭示物品交换造成的记忆缺口，找出房间真正想留下的人。", "取回、交换或放弃遗失物，并决定封闭还是保留房间。", "每件遗失物得到归属且房门接受决定；第7回合房间从平面图消失。") },
  { id: "voice-note", mark: "声", title: "未发送的语音", tagline: "它来自一个不存在的群聊。", theme: "两个人的手机同时出现一条未发送语音，内容是他们十分钟后的一段争吵", category: "双人", players: "2 人", duration: "18 分钟", price: 0, tone: "rose", plan: storyPlan(5, "拆解未来争吵中的关键词，确认两部手机缺失的信息。", "通过选择推动或改变争吵，找出真正没有说出口的那句话。", "两人决定发送、删除或共同重录这段语音。", "未来语音被发送、删除或成功改写；第5回合十分钟倒计时结束。") },
  { id: "night-exam", mark: "考", title: "无人参加的补考", tagline: "答错的人，会忘记一道真实经历。", theme: "深夜教学楼亮起一间考场，试卷上的每一道题都来自参与者共同经历却没人承认的往事", category: "校园", players: "3—6 人", duration: "30 分钟", price: 1, tone: "violet", plan: storyPlan(6, "回答个人经历题目，比较不同答案并记录被扣除的记忆。", "找出被集体遗忘的共同事件，以及出题者希望众人否认的真相。", "共同提交最终答案，或选择由一人承担全部遗忘。", "交卷并完成记忆代价判定；第6回合铃响后强制收卷。") },
];

export function findScript(scriptId: string) {
  return SCRIPT_CATALOG.find((script) => script.id === scriptId);
}

export function findScriptByTheme(theme: string) {
  return SCRIPT_CATALOG.find((script) => script.theme === theme);
}

export function getScriptPlan(scriptId?: string | null) {
  return (scriptId ? findScript(scriptId)?.plan : undefined) ?? GENERIC_STORY_PLAN;
}

export function getScriptStage(scriptId: string | null | undefined, turn: number) {
  const plan = getScriptPlan(scriptId);
  return plan.stages.find((stage) => turn >= stage.fromTurn && turn <= stage.toTurn) ?? plan.stages.at(-1)!;
}
