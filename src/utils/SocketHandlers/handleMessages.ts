import RoomsHandler from "./handleAllRooms";
import { User } from "../../types/Types";
import ApiResponse from "../ApiResponse/ApiResponse";

class Message {
  private roomsHandler = RoomsHandler;

  constructor(
    public sender: User,
    public messageContent: string,
    public roomId: string,
    
  ) {}

  sendMessage(): ApiResponse {
    const room = this.roomsHandler.getRoomById(this.roomId);

    if (!room) return new ApiResponse(404, "Room not found");
    if (!room.isUserInRoom(this.sender.id)) return new ApiResponse(403, "User not in the room");

    room.getUsers().forEach((user:User) => {
      if (user.id !== this.sender.id) {
        console.log(`Message to ${user.username}: "${this.messageContent}" from ${this.sender.username}`);
      }
    });

    return new ApiResponse(200, "Message sent successfully");
  }
}

export default Message;
