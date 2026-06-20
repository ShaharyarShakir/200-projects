import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { tokens } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_API_URL, {
        auth: { token: tokens.accessToken },
        transports: ['websocket'],
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, [tokens]);

  return socketRef.current;
}

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
