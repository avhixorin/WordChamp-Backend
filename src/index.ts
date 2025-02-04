import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import wordRouter from './routes/words.routes';
import connectSocket from './utils/SocketConnection/socketConnect';

dotenv.config();

export const app = express();

const corsOptions = {
  origin: process.env.ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/words', wordRouter);
connectSocket(app);
