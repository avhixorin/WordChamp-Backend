import { Server, Socket } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { Express } from 'express';
import roomHandlerInstance from "../SocketHandlers/handleAllRooms";
import { Difficulty, HostRoomRequest, JoinRoomRequest, Message, MessageRequest, OnlineUser, RegisterData, ScoreData, SoloGameRequest, StartGameRequest, UpdateScoreRequest, UserData } from '../../types/Types';
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
      origin: '*',
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

    socket.on(SOCKET_EVENTS.HOST_ROOM, (request: HostRoomRequest) => {
      if (request.room && request.room.roomId && request.room.roomPassword && request.user) {
        console.log("The request to host the room is received");
        console.log("The room details are:", request.room);
        console.log("The user details are:", request.user);
        console.log("The maxGameParticipants are:", request.maxRoomPlayers);
        const response = roomHandlerInstance.hostRoom(request.room, request.user, request.maxRoomPlayers, socket);

        if (response && response.statusCode === 200) {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, response);
          console.log(`Room ${request.room.roomId} created and user ${request.user.username} joined.`);
        } else {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, new ApiError(500, "Error while hosting the room"));
        }

      } else {
        socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, new ApiError(500, "Incomplete data received"));
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({room, user}: JoinRoomRequest) => {
      
      if (room && room.roomId && room.roomPassword && user) {
        console.log("The request to join the room is received");
        console.log("The room details are:", room);
        console.log("The user details are:", user);
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

    socket.on(SOCKET_EVENTS.START_GAME, (request: StartGameRequest) => {
      console.log("The request to start the game is received");
      if (!request) {
        console.log("No request data received.");
        return;
      }
      console.log("The received request is:", request);
      if (!request.gameData) {
        
        console.log("No gameData received in the request.");
        return;
      }
      console.log("The received gameData is:", request.gameData);
      if (!request.gameData.room) {
        console.log("No room data received in gameData.");
        return;
      }
      console.log("The received room is:", request.gameData.room);
      if (!request.gameData.room.roomId) {
        console.log("No roomId received in room data.");
        return;
      }
      console.log("The received roomId is:", request.gameData.room.roomId);
      if (!request.gameData.room.roomPassword) {
        console.log("No roomPassword received in room data.");
        return;
      }
      console.log("The received roomId is:", request.gameData.room.roomPassword);
      if (!request.gameData.players) {
        console.log("No players data received in gameData.");
        return;
      }
      console.log("The received players are:", request.gameData.players);
      console.log("The received no players received are:", request.gameData.players.length);
      console.log("The received maxPlayers are:", request.gameData.maxRoomPlayers);
      if (request.gameData.players.length !== request.gameData.maxRoomPlayers) {
        console.log("Number of players does not match maxRoomPlayers.");
        return;
      }
      console.log("The request to start the game is received");
      console.log("The room details are:", request.gameData.room);
      console.log("The gameData details are:", request.gameData);
      const response = roomHandlerInstance.startGame(request.gameData);
      console.log("The startGame response is: ", response);
      if (response.statusCode === 200) {
        console.log(`Game started in room ${request.gameData.room.roomId}.`);
      } else {
        console.log("Error while starting the game");
      }
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (request: MessageRequest) => {
      if(!request){
        console.log("No message request received");
        return;
      }
      console.log("The message request received is: ", request);
      if(!request.roomId){
        console.log("No roomId received in the message request");
        return;
      }
      console.log("The roomId received is: ", request.roomId);
      if(!request.sender){
        console.log("No sender received in the message request");
        return;
      }
      console.log("The sender received is: ", request.sender);
      if(!request.content){
        console.log("No content received in the message request");
        return;
      }
      console.log("The content received is: ", request.content);
      const response = roomHandlerInstance.broadcastMessage(request.roomId, request.sender, request.content, socket);
      console.log("The broadcastMessage response is: ", response);

      if(response){
        console.log("Message broadcasted successfully");
      }else{
        console.log("Error while broadcasting the message");
      }
      
    });

    socket.on(SOCKET_EVENTS.UPDATE_SCORE, (data: UpdateScoreRequest) => {
      if(data){
        console.log("The update score request received is: ", data);
        const response = roomHandlerInstance.updateScore(data,socket);
        console.log("The updateScore response is: ", response);
      }
    });

    socket.on(SOCKET_EVENTS.START_SOLO_GAME, (data: SoloGameRequest) => {
      if (data) {
        console.log("The solo game string request received is: ", data);
        const gameString = getCurrentGameString(data.difficulty);
        console.log("The soloGameString is: ", gameString);
        data.gameString = gameString;
        socket.emit(SOCKET_EVENTS.SOLO_GAME_START_RESPONSE, new ApiResponse(200,"Game started successfully", data));
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
