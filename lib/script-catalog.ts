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

export const SCRIPT_CATEGORIES = [
  "聚会",
  "双人",
  "都市",
  "校园",
  "轻悬疑",
  "推理",
  "科幻",
  "奇幻",
  "古风",
  "末日",
  "情感",
  "喜剧",
  "冒险",
] as const;

export type ScriptCategory = (typeof SCRIPT_CATEGORIES)[number];

export type ScriptCatalogItem = {
  id: string;
  mark: string;
  title: string;
  tagline: string;
  theme: string;
  category: ScriptCategory;
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
  { id: "starship-dawn", mark: "星", title: "星舟黎明回声", tagline: "三种未来，只够点亮一种。", theme: "深空移民船在抵达前意外唤醒所有人，主控系统要求临时议会从三种互相冲突的人类未来中选出唯一航向", category: "科幻", players: "3—6 人", duration: "30 分钟", price: 0, tone: "blue", featured: true, plan: storyPlan(7, "调查休眠舱、动力模块与三份航行档案，确认飞船为何提前唤醒众人。", "比对被删改的地球记忆，找出三种未来各自隐瞒的代价与受益者。", "完成最终航向表决，并决定保留、共享或清除主控系统的记忆。", "新航向完成点火且所有人提交最终表决；第7回合飞船必须离开漂移轨道。") },
  { id: "mars-late-letter", mark: "火", title: "火星迟到的来信", tagline: "它比发出时间早了十七分钟。", theme: "火星科考站收到一封尚未写出的求救邮件，寄件人正是在场的某个人，而信中声称基地将在十七分钟后被永久放弃", category: "科幻", players: "2—5 人", duration: "25 分钟", price: 1, tone: "acid", plan: storyPlan(6, "验证邮件中的未来细节，检查基地日志、通信延迟和缺失的氧气记录。", "找出是谁主动制造时间差，以及求救信试图改变的真正事件。", "决定发送、改写或删除这封邮件，并选择撤离还是留下完成任务。", "邮件时间闭环得到处理且基地命运被确定；第6回合通信窗口永久关闭。") },
  { id: "gravity-festival", mark: "云", title: "云上城失重节", tagline: "今晚，重力属于出价最高的人。", theme: "漂浮城市一年一度的失重节突然失控，每个人醒来都拥有一种不同方向的重力，城市核心却被当作节日奖品拍卖", category: "奇幻", players: "3—8 人", duration: "25 分钟", price: 0, tone: "mint", plan: storyPlan(6, "测试各自的重力方向，探索倒置街道并收集修复城市核心的三枚节庆徽章。", "在竞拍、交换与合作中找出失控原因，确认谁希望城市永远不再落地。", "共同决定让云上城返航、继续漂流或分裂成数座小城。", "城市核心获得新主人且重力重新稳定；第6回合失重节烟火强制点燃。") },
  { id: "dragon-alibi", mark: "龙", title: "巨龙没有绑架公主", tagline: "失踪者留下了一份旅行计划。", theme: "王国准备讨伐巨龙时，众人发现公主是主动离开王宫的，巨龙、骑士与邻国使者却都拿着不同版本的和平协议", category: "奇幻", players: "4—8 人", duration: "35 分钟", price: 1, tone: "violet", plan: storyPlan(7, "搜集旅行计划、龙巢账本与三份和平协议，确认公主真正的去向。", "揭示各阵营希望战争发生或停止的理由，让角色公开谈判并交换筹码。", "找到公主、公布一个能被王国接受的真相，并重新签署或撕毁和平协议。", "公主去向得到确认且战争或和平被正式决定；第7回合王国军抵达龙巢。") },
  { id: "lantern-shadow", mark: "灯", title: "上元灯影局", tagline: "灯谜答对了，影子却答错了。", theme: "上元灯会最盛时，河面花灯映出的影子开始替主人回答灯谜，其中一盏无主灯声称今晚会有人偷走全城的名字", category: "古风", players: "3—6 人", duration: "30 分钟", price: 0, tone: "amber", plan: storyPlan(7, "破解三组灯谜，对照主人与影子的答案，找到那盏无主灯的来历。", "追踪被交换的姓名与身份，判断偷名者是在复仇、救人还是掩护某个秘密。", "决定焚灯、放灯或让一人继承无主灯，并归还所有人的名字。", "姓名完成归还且无主灯得到处置；第7回合灯会闭市、河灯远去。") },
  { id: "ascension-list", mark: "仙", title: "飞升候补名单", tagline: "天门只开一次，名单却有七份。", theme: "修行界公布本年度唯一飞升名额，在场每个人都拿到一份写着自己名字的真名单，而负责审核的仙鹤坚称自己今天第一天上班", category: "古风", players: "3—7 人", duration: "30 分钟", price: 1, tone: "rose", plan: storyPlan(6, "检验七份名单、功德记录与天门印章，完成第一轮候补陈述。", "揭示每个人飞升或留下的真实理由，查清名额制度为何同时选择所有人。", "推选一人、集体拒绝或改写飞升规则，并承担天门给出的代价。", "飞升名额得到最终处理且天门接受结果；第6回合天门无条件关闭。") },
  { id: "seed-harbor", mark: "种", title: "第七码头播种计划", tagline: "最后一艘船，装不下所有春天。", theme: "全球风暴抵达前，众人在第七码头守护最后一座种子库，但撤离船只能带走一半种子与一半设备", category: "末日", players: "3—6 人", duration: "30 分钟", price: 0, tone: "mint", plan: storyPlan(7, "清点种子、设备和撤离空间，修复码头通信并确认风暴抵达时间。", "比较不同重建方案，让生存、生态与个人牵挂发生冲突，找出被隐藏的备用舱。", "决定装船清单、留守人员与下一座家园，并启动最后的播种信标。", "撤离船离港或众人决定留守，且播种方案完成；第7回合风暴抵达码头。") },
  { id: "empty-sunrise", mark: "晨", title: "日出后的无人城市", tagline: "预言失败了，人却都不见了。", theme: "所有人躲过预言中的末日后走出避难所，城市完好无损却空无一人，公共屏幕正在直播他们昨天没有做出的选择", category: "末日", players: "2—6 人", duration: "30 分钟", price: 1, tone: "blue", plan: storyPlan(6, "探索完整却无人的街区，核对避难记录与公共屏幕上的另一条时间线。", "找出居民消失与众人昨日选择的关系，确认哪座广播塔能联系另一条城市。", "选择召回居民、进入另一条时间线或让两座城市交换幸存者。", "城市人口归属得到决定且广播塔完成一次传输；第6回合两条时间线分离。") },
  { id: "tomorrow-depot", mark: "寄", title: "明天寄存处", tagline: "可以寄存遗憾，不能寄存答案。", theme: "街角出现一家只营业到日出的寄存处，每个人可以存下一件不敢带进明天的事，也能取走陌生人留下的一句鼓励", category: "情感", players: "2—5 人", duration: "20 分钟", price: 0, tone: "rose", plan: storyPlan(5, "查看寄存柜与匿名留言，为自己选择一件想放下或带走的心事。", "交换留言、倾听彼此的理由，并发现有一只寄存柜属于所有人共同的明天。", "完成最终寄存或取回，给下一位来客留下一句话。", "每个人完成一次真诚选择且共同寄存柜关闭；第5回合日出后店铺消失。") },
  { id: "unmailed-invitation", mark: "笺", title: "没有寄出的婚礼请柬", tagline: "每一张，都通向不同的以后。", theme: "搬家时众人发现一盒从未寄出的婚礼请柬，每张请柬上的新人、日期和宾客关系都不同，像是几种没有发生的人生", category: "情感", players: "2—6 人", duration: "25 分钟", price: 1, tone: "violet", plan: storyPlan(6, "阅读不同请柬，找出它们对应的关键选择与被遗漏的共同回忆。", "让每个人面对一条可能的人生，交换想挽回、祝福或彻底放下的理由。", "保留一张、烧掉全部或共同写出新的请柬，并决定它应寄给谁。", "所有请柬得到处理且众人接受选定的未来；第6回合搬家车辆到达。") },
  { id: "wedding-table-nine", mark: "席", title: "婚礼第九桌", tagline: "没人坐错，只是全员认错。", theme: "婚礼开席前，第九桌宾客发现座位卡全都写错了身份，为了不让仪式中断，每个人只能先假装成座位卡上的那个人", category: "喜剧", players: "4—10 人", duration: "25 分钟", price: 0, tone: "amber", featured: true, plan: storyPlan(6, "领取错误身份并应付第一轮寒暄，收集座位卡被调换的线索。", "在敬酒、致辞和临时节目中维持误会，同时找出真正调整座位的人。", "选择公开真相、完成一场完美假戏或重新安排全场座位。", "新人完成致辞且第九桌身份得到处理；第6回合司仪无条件宣布合影。") },
  { id: "boss-group-chat", mark: "群", title: "全员误入老板群", tagline: "撤回失败，汇报还有五分钟。", theme: "项目组吐槽群突然与老板群合并，所有历史消息都变成了待办事项，而真正的汇报文件却被系统拆成碎片发给每个人", category: "喜剧", players: "3—8 人", duration: "20 分钟", price: 1, tone: "acid", plan: storyPlan(5, "认领聊天记录与文件碎片，判断哪些消息必须解释、撤回或将错就错。", "拼出真正的汇报方案，在误会升级时分配临时职位并说服关键成员。", "完成五分钟汇报，选择坦白群聊事故或把它包装成团队创新。", "汇报完成且老板给出最终回复；第5回合会议室自动接通。") },
  { id: "midnight-snack-case", mark: "吃", title: "午夜零食失窃案", tagline: "冰箱空了，证词却很满。", theme: "合宿的最后一晚，大家共同珍藏的午夜零食全部消失，每个人都有完美不在场证明，也都偷偷补放过不同的食物", category: "推理", players: "3—8 人", duration: "20 分钟", price: 0, tone: "mint", plan: storyPlan(5, "检查冰箱、包装与群聊时间，提交各自的不在场证明和第一名嫌疑人。", "交叉验证证词，区分偷吃、补货与恶作剧，找出被所有人忽略的时间差。", "完成最终指认，并决定惩罚、共享新零食或公开每个人的小秘密。", "失窃过程被完整还原且众人完成处理；第5回合外卖员按响门铃。") },
  { id: "snow-manor-switch", mark: "画", title: "雪山庄园无伤案", tagline: "没有受害者，人人都有动机。", theme: "暴雪封住庄园后，主人宣布名画被替换成赝品，奇怪的是每个人都承认自己曾在同一晚偷偷保护过那幅画", category: "推理", players: "4—8 人", duration: "30 分钟", price: 1, tone: "blue", plan: storyPlan(7, "搜查画室、壁炉与运输记录，建立每个人接触名画的时间线。", "拆解互相重叠的保护计划，找出真画、赝品与第三幅练习稿的流转顺序。", "公开完整推理，决定将真画归还、捐赠或继续隐藏。", "画作去向和替换链条得到一致解释；第7回合山路恢复通行。") },
  { id: "moving-treasure-map", mark: "图", title: "会移动的藏宝图", tagline: "目的地会听见你们的争论。", theme: "探险队得到一张会根据队伍关系改变路线的藏宝图，每次有人隐瞒真实目的，岛屿上的道路就会重新移动", category: "冒险", players: "3—6 人", duration: "30 分钟", price: 0, tone: "acid", plan: storyPlan(7, "探索第一段移动路线，确认地图响应承诺、谎言还是队伍投票。", "穿越三处地形并公开部分真实目的，找出宝藏与失踪探险队之间的关系。", "抵达核心遗迹，决定带走宝藏、救回前队伍或让地图继续寻找新主人。", "队伍完成最终取舍并离开核心遗迹；第7回合岛屿重新沉入迷雾。") },
  { id: "seven-seas-library", mark: "舟", title: "七海漂流图书馆", tagline: "每读完一本书，就靠近一座岛。", theme: "一座漂流图书馆在七片海之间寻找不存在于地图上的故乡，船员必须用亲历的故事为书页补全航线", category: "冒险", players: "2—6 人", duration: "30 分钟", price: 1, tone: "violet", plan: storyPlan(7, "探索书舱与空白航海志，每个人选择一本愿意补写的故事。", "用不同故事开启岛屿航线，处理互相矛盾的地图，并找到图书馆最初的读者。", "共同写完最后一页，决定靠岸、继续漂流或把图书馆交给下一批船员。", "最后一页完成且图书馆选定下一段航程；第7回合潮汐将航线定格。") },
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
