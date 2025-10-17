import { connectDB } from "./config/db";
import { PORT } from "./config/env";
import app from "./app";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

connectDB();

const allowedOrigins = [
  "https://carekeep.vercel.app",
  "http://localhost:5173"
];

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST"]
  }
});

(global as any).io = io;

io.on('connection', (socket) => {
  // Expect JWT in query: ?token=...
  const token = socket.handshake.query.token as string | undefined;
  let hospitalId: string | null = null;
  if (token) {
    try {
      // Use same JWT_SECRET as backend
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('./config/env');
      const decoded = jwt.verify(token, JWT_SECRET);
      hospitalId = decoded.id;
      if (hospitalId) {
        socket.join(hospitalId);
        console.log(`🔌 Socket ${socket.id} joined room ${hospitalId}`);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.warn('Socket auth failed:', e.message);
      } else {
        console.warn('Socket auth failed:', e);
      }
    }
  }
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

(global as any).emitActivityToHospital = (hospitalId: string, payload: any) => {
  io.to(hospitalId).emit('activity_update', payload);
};

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
