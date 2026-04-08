// src/lib/socket-server.ts
import { Server as ServerIO } from 'socket.io';

let io: ServerIO | null = null;

export const setSocketServer = (socketServer: ServerIO) => {
  io = socketServer;
};

export type AttendanceUpdatePayload = {
  type: 'checkin' | 'checkout';
  userId: string;
  programId: string;
  userName: string;
  programName: string;
  status?: string;
  withinCheckOutWindow?: boolean;
  timestamp: string;
};

export const emitAttendanceUpdate = (programId: string, attendanceData: AttendanceUpdatePayload) => {
  if (io) {
    // Emit to specific program room (for staff monitoring that program)
    io.to(`program-${programId}`).emit('attendance-update', attendanceData);
    
    // Emit to admin room (for global admin overview)
    io.to('admin-dashboard').emit('attendance-update', attendanceData);
    
    console.log(`Emitted attendance update to program-${programId} and admin-dashboard:`, attendanceData);
  } else {
    console.warn('Socket.io server not initialized');
  }
};

export const emitToUser = (userId: string, event: string, data: Record<string, unknown>) => {
  if (io) {
    io.to(`dashboard-${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}:`, data);
  } else {
    console.warn('Socket.io server not initialized');
  }
};