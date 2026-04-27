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
    io.to(`program-${programId}`).emit('attendance-update', attendanceData);
    io.to('admin-dashboard').emit('attendance-update', attendanceData);
    io.to('staff-monitor').emit('attendance-update', attendanceData);

    console.log(`Emitted attendance update to program-${programId}, admin-dashboard, staff-monitor:`, attendanceData);
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