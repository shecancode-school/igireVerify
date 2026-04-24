'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

declare global {
  interface Window {
    __programSocket?: Socket;
    __userSocket?: Socket;
  }
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useLayoutEffect(() => {
    if (!socketRef.current) {
      const client = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });
      socketRef.current = client;
      
      setTimeout(() => setSocket(client), 0);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socket;
};

export const joinProgramRoom = (programId: string, socket?: Socket | null) => {
  const targetSocket = socket || (typeof window !== 'undefined' ? window.__programSocket : null);
  if (targetSocket) {
    targetSocket.emit('join-program', programId);
  }
};

export const joinDashboardRoom = (userId: string, socket?: Socket | null) => {
  const targetSocket = socket || (typeof window !== 'undefined' ? window.__userSocket : null);
  if (targetSocket) {
    targetSocket.emit('join-dashboard', userId);
  }
};

export const joinAdminRoom = (socket?: Socket | null) => {
  const targetSocket = socket || (typeof window !== 'undefined' ? (window.__programSocket || window.__userSocket) : null);
  if (targetSocket) {
    targetSocket.emit('join-admin');
  }
};

export const joinStaffMonitorRoom = (socket?: Socket | null) => {
  const targetSocket = socket || (typeof window !== 'undefined' ? (window.__programSocket || window.__userSocket) : null);
  if (targetSocket) {
    targetSocket.emit('join-staff-monitor');
  }
};