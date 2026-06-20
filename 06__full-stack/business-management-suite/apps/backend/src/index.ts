import { serve } from '@hono/node-server';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { setupSocketHandlers } from './socket/socket.handler';

const server = createServer(serve({ fetch: app.fetch }));

// Socket.io attached to same HTTP server
export const io = new SocketServer(server, {
  cors: {
    origin: env.CLIENT_URLS,
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

const start = async () => {
  await connectDB();
  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
};

start().catch(console.error);
