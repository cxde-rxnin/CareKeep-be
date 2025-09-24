import { connectDB } from "./config/db";
import { PORT } from "./config/env";
import app from "./app";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

connectDB();

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://carekeep.vercel.app",
    methods: ["GET", "POST"]
  }
});

(global as any).io = io;

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
