import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { setSocketServer } from '@/lib/socket-server';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.io server...');

    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Set the socket server for server-side emitting
    setSocketServer(io);

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-dashboard', (userId: string) => {
        socket.join(`dashboard-${userId}`);
        console.log(`User ${userId} joined dashboard room`);
      });

      socket.on('join-program', (programId: string) => {
        socket.join(`program-${programId}`);
        console.log(`User joined program room: ${programId}`);
      });

      socket.on('join-admin', () => {
        socket.join('admin-dashboard');
        console.log('Admin joined global dashboard room');
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server already running');
  }
  res.end();
};

export default ioHandler;