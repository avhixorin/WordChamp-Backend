import { Server, Socket } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { Express } from 'express';
import roomHandlerInstance from "../SocketHandlers/handleAllRooms";
import { Difficulty, HostRoomData, JoinRoomData, Message, OnlineUser, RegisterData, ScoreData, StartGameData, UserData } from '../../types/Types';
import { SOCKET_EVENTS } from '../../constants/ServerSocketEvents';
import ApiError from '../ApiError/ApiError';
import getCurrentGameString from '../GetWords/getsWords';
import ApiResponse from '../ApiResponse/ApiResponse';

dotenv.config();

const PORT = process.env.PORT || 5000;

let users: OnlineUser[] = [];

const connectSocket = (app: Express) => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || '*',
    },
  });
  roomHandlerInstance.setIo(io);
  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    console.log('A user connected:', socket.id);

    socket.on(SOCKET_EVENTS.REGISTER, (data: RegisterData) => {
      if (data.user) {
        users.push({ userData: data.user, socketId: socket.id });
        console.log(`User registered: ${data.user.username} with socket ID ${socket.id}`);
        socket.emit(SOCKET_EVENTS.REGISTRATION_RESPONSE, { data: "Registered Successfully" });
      }
    });

    socket.on(SOCKET_EVENTS.HOST_ROOM, ({ room, user, maxGameParticipants }: HostRoomData) => {
      if (room.roomId && room.roomPassword && user) {
        console.log("The request to host the room is received");
        console.log("The room details are:", room);
        console.log("The user details are:", user);
        console.log("The maxGameParticipants are:", maxGameParticipants);
        const response = roomHandlerInstance.hostRoom(room, user, maxGameParticipants, socket);

        if (response && response.statusCode === 200) {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, response);
          console.log(`Room ${room.roomId} created and user ${user.username} joined.`);
        } else {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, new ApiError(500, "Error while hosting the room"));
        }
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ room, user }: JoinRoomData) => {
      
      if (room.roomId && room.roomPassword && user) {
        console.log("The request to join the room is received");
        // console.log("The room details are:", room);
        // console.log("The user details are:", user);
        const response = roomHandlerInstance.joinRoom(room.roomId, room.roomPassword, user, socket);
        console.log("The joinRoom response is: ", response);
        if (response.statusCode === 200) {
          socket.emit(SOCKET_EVENTS.JOINING_RESPONSE, response);
          console.log(`User ${user.username} joined room ${room.roomId}.`);
        } else {
          console.log("Error while joining the room");
          socket.emit(SOCKET_EVENTS.JOINING_RESPONSE, response);
        }
      }
    });

    socket.on(SOCKET_EVENTS.START_GAME, (data:StartGameData) => {
      if (data.roomId) {
        console.log("The request to start the game is received");
        console.log("The room details are:", data.roomId);
        console.log("The gameData details are:", data);
        const response = roomHandlerInstance.startGame(data.roomId, data.gameData);
        console.log("The startGame response is: ", response);
        if (response.statusCode === 200) {
          console.log(`Game started in room ${data.roomId}.`);
        } else {
          console.log("Error while starting the game");
        }
      }
    })


    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data: Message) => {
      if (data.message && data.sender && data.roomId) {
        console.log("The message received is: ", data.message);
        console.log("The message is received from the user: ", data.sender.username);
        console.log("The message is received in the room: ", data.roomId);
        const res = roomHandlerInstance.broadcastMessage(data.roomId, data.sender, data.message, socket);

        if(res){
          console.log("Message broadcasted successfully");
          console.log("The boradcastResponse is: ", res);
        }
      }else{
        console.log("No message received");
      }
    });

    socket.on(SOCKET_EVENTS.UPDATE_SCORE, (data: ScoreData) => {
      console.log("The score data received is: ", data);
      if (data.playerId && data.roomId && data.score) {
        const res = roomHandlerInstance.updateScore(data.playerId, data.roomId, data.guessedWord, data.score, socket);
        console.log("The updateScore response is: ", res);
        if(res){
          console.log("Score updated successfully");
          console.log("The updateScoreResponse is: ", res);
        }else{
          console.log("Error while updating the score");
        }
      }else{
        console.log("No score data received");
      }
    });

    socket.on(SOCKET_EVENTS.GET_SOLO_GAME_STRING, (data: Difficulty) => {
      console.log("The solo game string request received is: ", data);
      if (data) {
        console.log("The solo game string request received is: ", data);
        const gameString = getCurrentGameString(data);
        console.log("The soloGameString is: ", gameString);
        socket.emit(SOCKET_EVENTS.SOLO_GAME_STRING_RESPONSE, new ApiResponse(200,"Game started successfully", {gameString}));
      }else{
        console.log("No solo game string request received");
      }
    });

    socket.on("disconnect", (reason) => {
      const response = roomHandlerInstance.removeUserFromRoom(socket.id);

      console.log(`User with socket ID ${socket.id} disconnected due to: ${reason}`);
    });    
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

export default connectSocket;
