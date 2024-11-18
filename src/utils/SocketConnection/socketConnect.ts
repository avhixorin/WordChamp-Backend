import { Server, Socket } from 'socket.io';
import http, { request } from 'http';
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
      origin: process.env.ORIGIN,
    },
  });
  roomHandlerInstance.setIo(io);
  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {

    socket.on(SOCKET_EVENTS.REGISTER, (data: RegisterData) => {
      if (data.user) {
        users.push({ userData: data.user, socketId: socket.id });
        socket.emit(SOCKET_EVENTS.REGISTRATION_RESPONSE, { data: "Registered Successfully" });
      }
    });

    socket.on(SOCKET_EVENTS.HOST_ROOM, (request: HostRoomRequest) => {
      if (request.room && request.room.roomId && request.room.roomPassword && request.user) {
        const response = roomHandlerInstance.hostRoom(request.room, request.user, request.maxRoomPlayers, socket);

        if (response && response.statusCode === 200) {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, response);
          
        } else {
          socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, new ApiError(500, "Error while hosting the room"));
        }

      } else {
        socket.emit(SOCKET_EVENTS.HOSTING_RESPONSE, new ApiError(500, "Incomplete data received"));
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({room, user}: JoinRoomRequest) => {
      
      if (room && room.roomId && room.roomPassword && user) {
        const response = roomHandlerInstance.joinRoom(room.roomId, room.roomPassword, user, socket);
        if (response.statusCode === 200) {
          socket.emit(SOCKET_EVENTS.JOINING_RESPONSE, response);
        } else {
          socket.emit(SOCKET_EVENTS.JOINING_RESPONSE, response);
        }
      }
    });

    socket.on(SOCKET_EVENTS.START_GAME, (request: StartGameRequest) => {
      if (!request) {
        return;
      }
      if (!request.gameData) {
        return;
      }
      if (!request.gameData.room) {
        return;
      }
      if (!request.gameData.room.roomId) {
        return;
      }
      if (!request.gameData.room.roomPassword) {
        return;
      }
      if (!request.gameData.players) {
        return;
      }
      if (request.gameData.players.length !== request.gameData.maxRoomPlayers) {
        return;
      }
      const response = roomHandlerInstance.startGame(request.gameData);
      
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (request: MessageRequest) => {
      if(!request){
        return;
      }
      if(!request.roomId){
        return;
      }
      if(!request.sender){
        return;
      }
      if(!request.content){
        return;
      }
      const response = roomHandlerInstance.broadcastMessage(request.roomId, request.sender, request.content, socket);

    });

    socket.on(SOCKET_EVENTS.UPDATE_SCORE, (data: UpdateScoreRequest) => {
      if(data){
        const response = roomHandlerInstance.updateScore(data,socket);
      }
    });

    socket.on(SOCKET_EVENTS.START_SOLO_GAME, (request: SoloGameRequest) => {
      if(request){
        const response = roomHandlerInstance.startSoloGame(request);
        if(response.statusCode === 200){
          socket.emit(SOCKET_EVENTS.START_SOLO_GAME_RESPONSE, response);
        }
      }

    })
    

    socket.on("disconnect", (reason) => {
      const response = roomHandlerInstance.removeUserFromRoom(socket.id);
    });    
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

export default connectSocket;
