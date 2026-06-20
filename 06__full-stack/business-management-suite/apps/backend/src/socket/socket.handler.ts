import type { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.utils';

export function setupSocketHandlers(io: Server) {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    const user = verifyToken(token);
    if (!user) return next(new Error('Unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user._id}`);

    // Join user's personal room
    socket.join(`user:${user._id}`);
    // Join role room
    socket.join(`role:${user.role}`);

    // Attendance events
    socket.on('attendance:checkin', (data) => {
      io.to('role:manager').emit('attendance:update', { ...data, userId: user._id });
    });

    // Inventory alerts
    socket.on('inventory:update', (data) => {
      io.to('role:admin').emit('inventory:changed', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user._id}`);
    });
  });
}

// Helper to emit to specific user from routes
export const emitToUser = (io: Server, userId: string, event: string, data: unknown) => {
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToRole = (io: Server, role: string, event: string, data: unknown) => {
  io.to(`role:${role}`).emit(event, data);
};
