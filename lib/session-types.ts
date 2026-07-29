export type SessionMode = "private" | "match";
export type SessionStatus =
  | "waiting"
  | "generating"
  | "active"
  | "resolving"
  | "ended"
  | "error";

export type RoleCard = {
  identity: string;
  publicDescription: string;
  secretRule: string;
  privateGoal: string;
};

export type WorldState = {
  title: string;
  premise: string;
  atmosphere: string;
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
  turn: number;
  errorMessage: string | null;
  members: SessionMemberView[];
  me: ({ id: string; name: string; isHost: boolean; role: RoleCard | null } | null);
  world: WorldState | null;
  entries: SessionEntryView[];
};
