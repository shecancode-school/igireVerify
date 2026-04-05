'use client';

import { ReactNode, useEffect } from 'react';
import { useSocket, joinProgramRoom } from '@/lib/socket';

interface SocketProviderProps {
  children: ReactNode;
  programId?: string;
  userId?: string;
}

export default function SocketProvider({ children, programId, userId }: SocketProviderProps) {
  const socket = useSocket();

  useEffect(() => {
    if (socket && programId) {
      joinProgramRoom(programId);
    }
  }, [socket, programId]);

  useEffect(() => {
    if (socket && userId) {
    }
  }, [socket, userId]);

  return <>{children}</>;
}