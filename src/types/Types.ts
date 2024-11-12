import Room from "../rooms/room";

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  GOD = "god",
}

export enum GameMode {
  SOLO = "solo",
  MULTIPLAYER = "multiplayer",
}

export type OnlineUser = {
  userData: UserData;
  socketId: string;
};

export type RegisterData = {
  user: UserData;
};

export type HostRoomData = {
  room: Room;
  user: UserData;
  maxGameParticipants: number;
};

export type MessageRequest = {
  roomId: string;
  sender: UserData;
  content: string;
};

export type Message = {
  content: string;
  sender: UserData;
};

// Message Response
export type MessageResponse = {
  statusCode: number;
  message: string;
  data: Message;
};
export type SharedGameData = {
  maxGameParticipants: number;
  currentGameString: string;
  difficulty: Difficulty;
};

export type StartGameRequest = {
  gameData: MultiPlayerRoomData;
};

export type StartGameResponse = {
  statusCode: number;
  message: string;
  data: {
    gameData: MultiPlayerRoomData;
  };
};

export type ScoreData = {
  playerId: string;
  score: number;
  roomId: string;
  guessedWord?: string;
};
export type UpdateScoreRequest = {
  roomData: MultiPlayerRoomData;
  player: UserData;
  guessedWord: Answer;
};

// Score Update Response
export type UpdateScoreResponse = {
  statusCode: number;
  message: string;
  data: {
    player: UserData;
    guessedWord: Answer;
  };
};

// PowerUp Type
export type PowerUp = {
  name: string;
  description: string;
  count: number;
};
// Verdict Enum
export enum Verdict {
  CORRECT = "correct",
  INCORRECT = "incorrect",
  PROFANE = "profane",
}
// Answer Type
export type Answer = {
  word: string;
  verdict: Verdict;
  awardedPoints: number;
};

// SoloPlayer Type
export type SoloPlayer = {
  id: string;
  username: string;
  avatar: string;
  difficulty: Difficulty;
  gameMode: GameMode;
  score: number;
  powerUps: PowerUp[];
  gameString: string;
  guessWords: string[];
  answers: Answer[];
  theme: Theme;
};
export enum RoomAction {
  HOSTING = "hosting",
  JOINING = "joining",
  IDLE = "idle",
}
// MultiplayerUser Type
export type UserData = {
  id: string;
  username: string;
  avatar: string;
  theme: Theme;
  powerUps: PowerUp[];
  answers: Answer[];
  score: number;
  roomAction: RoomAction;
};

export type SoloGameRequest = {
  id: string;
  username: string;
  avatar: string;
  difficulty: Difficulty;
  gameMode: GameMode;
  score: number;
  powerUps: PowerUp[];
  gameString: string;
  guessedWords: string[];
  answers: Answer[];
  theme: Theme;
};

// MultiPlayerRoomData Type
export type MultiPlayerRoomData = {
  room: Room;
  maxRoomPlayers: number;
  gameString: string;
  roomDifficulty: Difficulty;
  players: UserData[];
  guessedWords: string[];
};

// Request & Response Types

// Room Hosting Request
export type HostRoomRequest = {
  room: Room;
  maxRoomPlayers: number;
  user: UserData;
};

// Room Hosting Response
export type HostRoomResponse = {
  statusCode: number;
  message: string;
  data: {
    roomId: string;
    maxRoomPlayers: number;
    participants: number;
  };
};

// Room Joining Request
export type JoinRoomRequest = {
  room: Room;
  user: UserData;
};

// Room Joining Response
export type JoinRoomResponse = {
  statusCode: number;
  message: string;
  data: {
    roomId: string;
    maxRoomPlayers: number;
    participants: number;
    players: UserData[];
  };
};
