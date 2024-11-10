import { Server, Socket } from "socket.io";
import Room from "../../rooms/room";
import ApiResponse from "../ApiResponse/ApiResponse";
import { SOCKET_EVENTS } from "../../constants/ServerSocketEvents";
import { SharedGameData, UserData } from "../../types/Types";
import getCurrentGameString, { getDifficultySettings } from "../GetWords/getsWords";

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

  public hostRoom(room: Room, user: UserData, maxGameParticipants:number, socket: Socket): ApiResponse {
    const newRoom = new Room(room.roomId, room.roomPassword, maxGameParticipants);
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

      // Announce that a new user has joined the room, excluding the new user
      socket.broadcast.to(roomId).emit(SOCKET_EVENTS.NEW_USER, {
        message: `${user.username} has joined the game.`,
        user: user,
      });
    }

    return new ApiResponse(200, "Joined room successfully", {
      userCount: room.users.length,
      allUsers: room.getAllUsers(),
      maxGameParticipants: room.maxGameParticipants
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
        this.io.to(room.roomId).emit(SOCKET_EVENTS.LEAVE_ROOM, {
          message: `${leavingUser.username} has left the game.`,
          userId: leavingUser.Id,
        });

        if (room.users.length > 0) {
          this.io.to(room.roomId).emit(SOCKET_EVENTS.NO_OF_USERS, {
            userCount: room.users.length,
          });
        } else {
          this.rooms.splice(roomIndex, 1); // Remove empty room
        }
      }

      return new ApiResponse(200, "User removed successfully", {
        userCount: room.users.length,
      });
    } else {
      return new ApiResponse(404, "User not found in any room");
    }
  }

  public startGame(roomId: string, gameData: SharedGameData): ApiResponse {
    const room = this.getRoomById(roomId);
    if (!room) return new ApiResponse(404, "Room not found");

    const gameString = getCurrentGameString(gameData.difficulty);
    gameData.currentGameString = gameString;
    const { timer } = getDifficultySettings(gameData.difficulty);

    if (this.io) {
      // Emit to all users in the room, including the requester
      this.io.to(roomId).emit(SOCKET_EVENTS.START_GAME_RESPONSE, new ApiResponse(200, "Game started successfully", { gameData }));
    }

    if (this.io) {
      // Emit to all users in the room, including the requester
      this.io.to(roomId).emit(SOCKET_EVENTS.TIMER, new ApiResponse(200, "Game started successfully", { timer }));
    }

    return new ApiResponse(200, "Game started successfully", { gameData });
  }

  // New updateScore function
  public updateScore(
    userId: string,
    roomId: string,
    guessedWord: string | undefined,
    score: number,
    socket: Socket
  ): ApiResponse {
    const room = this.getRoomById(roomId);
    if (!room) return new ApiResponse(404, "Room not found");
    console.log("Inside updateScore function", userId, roomId, guessedWord, score);
    const user = room.users.find((u) => u.user.username === userId);
    if (!user) return new ApiResponse(404, "User not found in room");
  
    // Emit updated score to all users except the requester
    if (this.io) {
      // Emit to all users except the sender (requester)
      socket.broadcast.to(roomId).emit(SOCKET_EVENTS.UPDATE_SCORE_RESPONSE, new ApiResponse(200, `${user.user.username} guessed the word ${guessedWord} and got + ${score}`, { user, score, guessedWord }));
    }
  
    return new ApiResponse(200, "Score updated successfully", {
      userId: userId,
      score: score,
    });
  }
  

  public broadcastMessage(
    roomId: string,
    sender: UserData,
    message: string,
    socket: Socket
  ): ApiResponse {
    const room = this.getRoomById(roomId);
    if (!room) return new ApiResponse(404, "Room not found");
    if (!room.isUserInRoom(sender.Id))
      return new ApiResponse(403, "Sender is not a member of the room");

    if (this.io) {
      socket.broadcast.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE_RESPONSE, {
        message,
        sender,
      });
    }

    return new ApiResponse(200, "Message sent successfully");
  }
}

export default RoomHandler.getInstance();
