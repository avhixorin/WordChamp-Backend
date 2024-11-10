import Room from "../rooms/room";

export enum Theme {
  LIGHT = "light",
  DARK = "dark"
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  GOD = "god"
}

export enum GameMode {
  SOLO = "solo",
  MULTIPLAYER = "multiplayer"
}

export type UserData = {
  Id: string;
  username: string;
  avatar: string;
  theme: Theme;
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

export type JoinRoomData = {
  room: {
    roomId: string;
    roomPassword: string;
  };
  user: UserData;
};

export type Message = {
  message: string;
  sender: UserData;
  roomId: string;
};
export type SharedGameData = {
  maxGameParticipants: number;
  currentGameString: string;
  difficulty: Difficulty;
};
export type StartGameData = {
  roomId: string;
  gameData: SharedGameData;
};

export type ScoreData = {
  playerId: string;
  score: number;
  roomId: string;
  guessedWord?: string;
}
export type UpdateScoreResponse = {
  statusCode: number;
  message: string;
  data: {
    user: UserData;
    score: number;
  };
};