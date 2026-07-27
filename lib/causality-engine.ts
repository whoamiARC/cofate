export const VIBES = {
  gathering: {
    label: "朋友聚会",
    accent: "把熟悉的人，重新认识一次",
    openings: [
      "今晚没有主持人。先看向现场最久没见的人，说出你对TA最近生活的一个猜测。",
      "每个人选一个此刻最想分享、但平时不会主动说起的话题。",
      "如果这个房间是一部电影，现在的片名会是什么？",
    ],
  },
  campus: {
    label: "校园相遇",
    accent: "让同一所学校的人真正相遇",
    openings: [
      "在不说专业的情况下，用三句话介绍你最近真正着迷的事。",
      "如果能在校园里增加一个不存在的空间，你希望它是什么？",
      "找到与你作息最不同的人，交换一次最近的深夜想法。",
    ],
  },
  stranger: {
    label: "初次见面",
    accent: "让陌生不再等于尴尬",
    openings: [
      "先别介绍履历。每个人说一件最近让自己开心的小事。",
      "从‘我最近改变了一个看法’开始认识彼此。",
      "选择一个你愿意被陌生人记住的关键词。",
    ],
  },
  night: {
    label: "深夜频道",
    accent: "给说不出口的话一个共同场景",
    openings: [
      "今晚可以慢一点。说出最近一次你感到被理解的瞬间。",
      "如果能把一个念头留在今晚，你想留下什么？",
      "不用给建议，只需要认真听完彼此最近的一次失落。",
    ],
  },
} as const;

export type VibeKey = keyof typeof VIBES;

const identities = [
  "温度捕手",
  "问题收藏家",
  "沉默翻译者",
  "气氛守望者",
  "故事连接者",
  "细节观察员",
];

const emojis = ["◌", "△", "◇", "◎", "□", "∿"];

const followups: Record<VibeKey, string[]> = {
  gathering: [
    "因果发现了一条共同记忆：请一位成员讲出第一次认识现场某个人时的印象。",
    "把手机暂时扣下30秒。抬头观察，谁今天和平时最不一样？",
  ],
  campus: [
    "你们出现了一个交集：选出一个想在毕业前共同完成的小计划。",
    "交换一个只有校园里的人才能理解的瞬间。",
  ],
  stranger: [
    "关系正在形成。每个人可以向刚才最意外的人追问一个问题。",
    "找到一句你想对现场某个人说的真实反馈，不需要客套。",
  ],
  night: [
    "现在不急着回答。先用一个词回应上一位成员的感受。",
    "因果把话题调暗了一格：什么事情正在消耗你，但别人很少知道？",
  ],
};

export function createWorldSeed(vibe: VibeKey) {
  const source = VIBES[vibe] ?? VIBES.gathering;
  return source.openings[Math.floor(Math.random() * source.openings.length)];
}

export function assignIdentity(position: number) {
  return {
    identity: identities[position % identities.length],
    emoji: emojis[position % emojis.length],
  };
}

export function nextSocialPrompt(vibe: VibeKey, messageCount: number) {
  const source = followups[vibe] ?? followups.gathering;
  return source[Math.floor(messageCount / 3) % source.length];
}
