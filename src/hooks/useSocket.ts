import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

export const useSocket = (url: string) => {
  const [socketState, setSocketState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    error: null,
  });

  useEffect(() => {
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Conectado al servidor');
      setSocketState({
        socket,
        isConnected: true,
        error: null,
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      setSocketState((prev) => ({
        ...prev,
        error: error.message,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [url]);

  return socketState;
};


