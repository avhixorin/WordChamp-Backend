import { Server, Socket } from "socket.io";
import Room from "../../rooms/room";
import ApiResponse from "../ApiResponse/ApiResponse";
import { SOCKET_EVENTS } from "../../constants/ServerSocketEvents";
import {
  MultiPlayerRoomData,
  SoloGameRequest,
  UpdateScoreRequest,
  UserData,
} from "../../types/Types";
import getCurrentGameString, {
  getDifficultySettings,
} from "../GetWords/getsWords";

class RoomHandler {
  private static instance: RoomHandler;
  private rooms: Room[] = [];
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): RoomHandler {
    if (!RoomHandler.instance) {
      RoomHandler.instance = new RoomHandler();
    }
    return RoomHandler.instance;
  }

  public setIo(io: Server): void {
    this.io = io;
  }

  public addRoom(room: Room): ApiResponse {
    this.rooms.push(room);
    return new ApiResponse(200, "Room created successfully");
  }

  public hostRoom(
    room: Room,
    user: UserData,
    maxRoomPlayers: number,
    socket: Socket
  ): ApiResponse {
    const newRoom = new Room(room.roomId, room.roomPassword, maxRoomPlayers);
    newRoom.addUser(user, socket);
    this.addRoom(newRoom);

    if (this.io) {
      this.io.to(newRoom.roomId).emit(SOCKET_EVENTS.NO_OF_USERS, {
        userCount: newRoom.users.length,
      });
    }

    return new ApiResponse(200, "Room hosted successfully", {
      userCount: newRoom.users.length,
    });
  }

  public joinRoom(
    roomId: string,
    roomPassword: string,
    user: UserData,
    socket: Socket
  ): ApiResponse {
    const room = this.rooms.find((r) => r.roomId === roomId);
    if (!room) return new ApiResponse(404, "Room not found");
    if (!room.validatePassword(roomPassword))
      return new ApiResponse(401, "Incorrect password");
    if (room.users.length >= 3) return new ApiResponse(403, "Room is full");

    const addRes: ApiResponse = room.addUser(user, socket);
    if (addRes.statusCode !== 200) {
      return addRes;
    }

    if (this.io) {
      this.io.to(roomId).emit(SOCKET_EVENTS.NO_OF_USERS, {
        userCount: room.users.length,
      });

      socket.broadcast.to(roomId).emit(
        SOCKET_EVENTS.NEW_USER,
        new ApiResponse(200, `${user.username} has joined the game.`, {
          user: user,
        })
      );
    }

    return new ApiResponse(200, "Joined room successfully", {
      maxRoomPlayers: room.maxRoomPlayers,
      players: room.getAllUsers(),
    });
  }

  public getRoomById(roomId: string): Room | undefined {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  public removeUserFromRoom(socketId: string): ApiResponse {
    let roomIndex: number = -1;
    let leavingUser: UserData | undefined;

    const room = this.rooms.find((r, index) => {
      const user = r.users.find((u) => u.socketId === socketId);
      if (user) {
        roomIndex = index;
        leavingUser = user.user;
        return true;
      }
      return false;
    });

    if (room && leavingUser) {
      room.users = room.users.filter((u) => u.socketId !== socketId);

      if (this.io) {
        this.io
          .to(room.roomId)
          .emit(
            SOCKET_EVENTS.LEAVE_ROOM,
            new ApiResponse(200, `${leavingUser.username} has left the room`, {
              user: leavingUser,
            })
          );

        if (room.users.length > 0) {
          this.io.to(room.roomId).emit(SOCKET_EVENTS.NO_OF_USERS, {
            userCount: room.users.length,
          });
        } else {
          this.rooms.splice(roomIndex, 1);
        }
      }

      return new ApiResponse(200, "User removed successfully", {
        userCount: room.users.length,
      });
    } else {
      return new ApiResponse(404, "User not found in any room");
    }
  }

  public startGame(gameData: MultiPlayerRoomData): ApiResponse {
    const room = this.getRoomById(gameData.room.roomId);
    if (!room) return new ApiResponse(404, "Room not found");
    const gameString = getCurrentGameString(gameData.roomDifficulty);
    gameData.gameString = gameString;

    if (this.io) {
      this.io
        .to(gameData.room.roomId)
        .emit(
          SOCKET_EVENTS.START_GAME_RESPONSE,
          new ApiResponse(200, "Game started successfully", { gameData })
        );
    }

    return new ApiResponse(200, "Game started successfully", { gameData });
  }

  public updateScore(data: UpdateScoreRequest, socket: Socket): ApiResponse {
    const room = this.getRoomById(data.roomData.room.roomId);
    if (!room) return new ApiResponse(404, "Room not found");

    const user = room.users.find((u) => u.user.id === data.player.id);
    if (!user) return new ApiResponse(404, "User not found in room");
    let message = ""
    if(data.guessedWord.awardedPoints > 0) {
      message = `${data.player.username} answered ${data.guessedWord.word} and got + ${data.guessedWord.awardedPoints}`
    }else{
      message = `${data.player.username} answered ${data.guessedWord.word} and got - ${data.guessedWord.awardedPoints}`
    }

    if (this.io) {
      room.users.forEach((userInRoom) => {
        if (userInRoom.user.id !== data.player.id) {
          if(this.io) this.io
            .to(userInRoom.socketId)
            .emit(
              SOCKET_EVENTS.UPDATE_SCORE_RESPONSE,
              new ApiResponse(
                200,
                message,
                { player: data.player, guessedWord: data.guessedWord }
              )
            );
        }
      });
    }

    return new ApiResponse(200, "Score updated successfully", data.roomData);
  }

  public broadcastMessage(
    roomId: string,
    sender: UserData,
    message: string,
    socket: Socket
  ): ApiResponse {
    const room = this.getRoomById(roomId);
    if (!room) return new ApiResponse(404, "Room not found");
    if (!room.isUserInRoom(sender.id))
      return new ApiResponse(403, "Sender is not a member of the room");

    if (this.io) {
      socket.broadcast
        .to(roomId)
        .emit(
          SOCKET_EVENTS.NEW_MESSAGE_RESPONSE,
          new ApiResponse(200, "Message sent successfully", {
            content: message,
            sender,
          })
        );
    }

    return new ApiResponse(200, "Message sent successfully");
  }

  public startSoloGame(data: SoloGameRequest): ApiResponse {
    const gameString = getCurrentGameString(data.difficulty);
    const difficultySettings = getDifficultySettings(data.difficulty);

    data.gameString = gameString;

    return new ApiResponse(200, "Game started successfully", data);
  }
}

export default RoomHandler.getInstance();
