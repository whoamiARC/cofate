export type SessionMode = "private" | "match";
export type SessionStatus =
  | "waiting"
  | "generating"
  | "active"
  | "resolving"
  | "ended"
  | "error";

export type RoleCard = {
  roleId?: string;
  identity: string;
  publicDescription: string;
  secretRule: string;
  privateGoal: string;
  privateTasks?: string[];
  survivalCondition?: string;
};

export type RoleOptionView = {
  id: string;
  title: string;
  teaser: string;
  claimedBy: string | null;
};

export type PlayerEndingResult = {
  summary: string;
  survived: boolean;
  goalCompleted: boolean;
  completedTasks: string[];
  failedTasks: string[];
  xpEarned: number;
  pointsEarned: number;
  levelBefore: number;
  levelAfter: number;
};

export type PlayerProfile = {
  displayName: string;
  xp: number;
  points: number;
  level: number;
  nextLevelXp: number;
  gamesPlayed: number;
  goalsCompleted: number;
  wins: number;
};

export type WorldState = {
  title: string;
  premise: string;
  atmosphere: string;
  scriptId?: string | null;
  stageTitle?: string;
  stageTask?: string;
  endingCondition?: string;
  maxTurns?: number;
  format?: "独行" | "合作" | "阵营" | "竞争";
  victoryRule?: string;
  mechanics?: string[];
  publicRules: string[];
  clues: string[];
  memory: string[];
  nextPrompt: string;
  suggestedChoices: string[];
};

export type SessionMemberView = {
  id: string;
  name: string;
  isHost: boolean;
  hasChosen: boolean;
  selectedRoleId: string | null;
  roleName: string | null;
};

export type SessionEntryView = {
  id: string;
  memberId: string | null;
  turn: number;
  kind: "system" | "arrival" | "choice" | "narration" | "private";
  author: string;
  content: string;
  createdAt: number | string | Date;
};

export type SessionView = {
  code: string;
  title: string;
  theme: string;
  mode: SessionMode;
  status: SessionStatus;
  maxPlayers: number;
  requiredPlayers: number | null;
  turn: number;
  errorMessage: string | null;
  members: SessionMemberView[];
  me: ({ id: string; name: string; isHost: boolean; role: RoleCard | null; result: PlayerEndingResult | null; profile: PlayerProfile | null } | null);
  roleOptions: RoleOptionView[];
  world: WorldState | null;
  entries: SessionEntryView[];
};
