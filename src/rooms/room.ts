import { Socket } from "socket.io";
import { UserData } from "../types/Types";
import ApiResponse from "../utils/ApiResponse/ApiResponse";

class Room {
  public users: { user: UserData; socketId: string }[] = [];

  constructor(public roomId: string, public roomPassword: string, public maxGameParticipants:number) {}

  addUser(user: UserData, socket: Socket): ApiResponse {
    if (this.users.length >= this.maxGameParticipants) return new ApiResponse(403, "Room is full");

    this.users.push({ user, socketId: socket.id });
    socket.join(this.roomId);

    return new ApiResponse(200, "User added to room", { userCount: this.users.length });
  }

  removeUser(socketId: string): string {
    const initialLength = this.users.length;
    this.users = this.users.filter((u) => u.socketId !== socketId);

    return initialLength === this.users.length ? "User not found" : "User removed from room";
  }

  isUserInRoom(userId: string): boolean {
    return this.users.some(({ user }) => user.Id === userId);
  }

  validatePassword(password: string): boolean {
    return this.roomPassword === password;
  }

  // New method to get all users in the room
  getAllUsers(): UserData[] {
    return this.users.map(({ user }) => user);
  }
}

export default Room;
