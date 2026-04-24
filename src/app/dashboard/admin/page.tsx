'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import {
  Users,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Activity,
  TrendingUp,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  XCircle,
  BookOpen
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import AdminTopBar from '@/components/dashboard/AdminTopBar';
import { useSocket, joinAdminRoom } from '@/lib/socket';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatInTimeZone } from 'date-fns-tz';

interface Stats {
  totalPrograms: number;
  totalUsers: number;
  totalAttendanceRecords: number;
  activeProgramsToday: number;
  presentToday: number;
  lateToday: number;
  incompleteToday: number;
  absentToday: number;
  checkinsLastHour: number;
  mostActiveProgram: string;
  lateThisMonth: number;
  avgAttendanceRate: number;
}

interface ChartData {
  date: string;
  present: number;
  late: number;
  total: number;
}

interface ActivityRecord {
  id: string;
  userName: string;
  type: string;
  status: string;
  programName: string;
  time: string;
}

interface Program {
  _id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  programId?: string;
  programName?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

interface AttendanceRecord {
  _id: string;
  userId: string;
  programId?: string;
  userName: string;
  userEmail: string;
  profilePhotoUrl?: string;
  programName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  location?: string;
  createdAt: string;
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
}

type TabType = 'overview' | 'programs' | 'users' | 'attendance' | 'reports' | 'settings';

function getProgramTimezone(record: any) {
  return record.programTimeZone || 'Africa/Kigali';
}

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam && ['overview', 'programs', 'users', 'attendance', 'reports', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/dashboard/admin?tab=${tab}`);
  };
  const [stats, setStats] = useState<Stats>({
    totalPrograms: 0,
    totalUsers: 0,
    totalAttendanceRecords: 0,
    activeProgramsToday: 0,
    presentToday: 0,
    lateToday: 0,
    incompleteToday: 0,
    absentToday: 0,
    checkinsLastHour: 0,
    mostActiveProgram: 'N/A',
    lateThisMonth: 0,
    avgAttendanceRate: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("Loading...");

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    joinAdminRoom(socket);

    const handleUpdate = () => {
      console.log("Admin Dashboard: Real-time update received");
      fetchInitialData();
    };

    socket.on('attendance-update', handleUpdate);
    return () => { socket.off('attendance-update', handleUpdate); };
  }, [socket]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveDate(format(now, 'EEEE, d MMMM yyyy'));
      setLiveTime(format(now, 'HH:mm:ss'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    fetchInitialData();

    return () => clearInterval(timer);
  }, []);
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('admin');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    checkInStatus: 'on-time',
    checkOutStatus: '',
    notes: ''
  });

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const defaultSchedule = {
    checkInStart: '08:00',
    checkInEnd: '08:30',
    classStart: '09:00',
    checkOutStart: '17:00',
    checkOutEnd: '17:30',
    lateAfter: '08:15',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  };
  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    schedule: { ...defaultSchedule }
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'program' | 'user';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'program',
    id: '',
    name: ''
  });

  const [reportStartDate, setReportStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportEndDate, setReportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportProgramId, setReportProgramId] = useState('');
  const [attendanceProgramFilter, setAttendanceProgramFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [selectedDate, activeTab, attendanceProgramFilter]);

  const fetchInitialData = async () => {
    try {
      fetch('/api/attendance/maintenance/absentees').catch(err => console.error("Maintenance failed:", err));

      const [userRes, statsRes, programsRes, chartRes, activityRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/stats'),
        fetch('/api/programs'),
        fetch('/api/admin/chart'),
        fetch('/api/admin/activity')
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.userName || userData.name || 'Admin User');
        setUserRole(userData.role || 'admin');
        setProfilePhotoUrl(userData.profilePhotoUrl || null);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPrograms(programsData);
      }

      if (chartRes.ok) {
        const cData = await chartRes.json();
        setChartData(cData.data || []);
      }

      if (activityRes.ok) {
        const aData = await activityRes.json();
        setActivity(aData.activity || []);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      let url = `/api/admin/attendance?date=${selectedDate}`;
      if (attendanceProgramFilter) {
        url += `&programId=${attendanceProgramFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.records);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const method = editingProgram ? 'PUT' : 'POST';
      const idStr = editingProgram?._id?.toString() || editingProgram?._id;

      if (editingProgram && (!idStr || idStr.length < 24)) {
        setFormError("Critical Error: Program ID is invalid. Please refresh the page.");
        return;
      }

      const url = editingProgram ? `/api/programs/${idStr}` : '/api/programs';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programForm),
      });

      if (response.ok) {
        setShowProgramModal(false);
        setEditingProgram(null);
        setProgramForm({ name: '', code: '', description: '', startDate: '', endDate: '', schedule: { ...defaultSchedule } });
        const programsRes = await fetch('/api/programs');
        if (programsRes.ok) {
          setPrograms(await programsRes.json());
        }
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to save program');
      }
    } catch (error) {
      console.error('Failed to save program:', error);
      setFormError('Network error. Please try again.');
    }
  };

  const handleDeleteProgram = (programId: string, programName: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'program',
      id: programId,
      name: programName
    });
  };

  const confirmDeleteProgram = async (programId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const idToDelete = programId.toString();
        setPrograms(programs.filter(p => p._id.toString() !== idToDelete));
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

  const handleUserProgramUpdate = async (userId: string, programId: string | null) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user program:', error);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'user',
      id: userId,
      name: userName
    });
  };

  const confirmDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const executeDelete = async () => {
    if (deleteDialog.type === 'program') {
      await confirmDeleteProgram(deleteDialog.id);
    } else {
      await confirmDeleteUser(deleteDialog.id);
    }
    setDeleteDialog({ ...deleteDialog, isOpen: false });
  };

  const handleDownloadReport = async (formatType: 'excel' | 'word' | 'pdf' = 'word') => {
    try {
      let url = `/api/admin/reports?startDate=${reportStartDate}&endDate=${reportEndDate}&format=json`;
      if (reportProgramId) {
        url += `&programId=${reportProgramId}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch report data');
      const resData = await response.json();
      const records = resData.data || [];

      const fileNameStr = `Attendance-Report-${reportStartDate}-to-${reportEndDate}`;

      const summary = resData.summary || {};
      const totalParticipants = summary.totalRecords ?? records.length;
      const present = summary.present ?? records.filter((r: any) => r.status === 'Present').length;
      const late = summary.late ?? records.filter((r: any) => r.status === 'Late').length;
      const absent = summary.absent ?? records.filter((r: any) => r.status === 'Absent').length;
      const incomplete = summary.incomplete ?? records.filter((r: any) => r.status === 'Checked In').length;
      const attendanceRate =
        summary.attendanceRate ??
        (totalParticipants > 0 ? Math.round((present / totalParticipants) * 100) : 0);

      const tableHeaders = ['Date', 'Participant Name', 'Program', 'Check-in Time', 'Check-out Time', 'Status', 'Status Explanation', 'Late By', 'Location', 'Photo'];
      const tableRows = records.map((r: any) => [
        r.date,
        r.name,
        r.program,
        r.checkIn,
        r.checkOut,
        r.status,
        r.statusExplanation || '-',
        r.lateBy,
        r.location || 'Unknown',
        r.photo && r.photo !== '-' ? 'View' : '-'
      ]);

      if (formatType === 'pdf') {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 125, 50); // #2E7D32
        doc.text('Igire Verify', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Admin Panel', 14, 28);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Attendance Report' + (reportProgramId ? ' - Specific Program' : ' - All Programs'), 14, 40);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date Range: ${reportStartDate} to ${reportEndDate}`, 14, 47);
        doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy \\a\\t hh:mm a')} by ${userName}`, 14, 53);

        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 60, pageWidth - 28, 25, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        const summaryY = 70;
        doc.text(`Total Records: ${totalParticipants}`, 20, summaryY);

        doc.setTextColor(46, 125, 50); // Green
        doc.text(`Present: ${present}`, 60, summaryY);

        doc.setTextColor(245, 158, 11); // Orange
        doc.text(`Late: ${late}`, 95, summaryY);

        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Absent: ${absent}`, 125, summaryY);
        doc.setTextColor(37, 99, 235); // Blue
        doc.text(`Checked In Only: ${incomplete}`, 20, summaryY + 8);

        doc.setTextColor(0, 0, 0);
        doc.text(`Rate: ${attendanceRate}%`, 160, summaryY);

        autoTable(doc, {
          head: [tableHeaders],
          body: tableRows,
          startY: 95,
          theme: 'grid',
          headStyles: { fillColor: [46, 125, 50], fontSize: 10, halign: 'center' },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 5) {
              const statusStr = hookData.cell.raw as string;
              if (statusStr === 'Present') hookData.cell.styles.textColor = [46, 125, 50];
              if (statusStr === 'Late') hookData.cell.styles.textColor = [245, 158, 11];
              if (statusStr === 'Absent') hookData.cell.styles.textColor = [220, 38, 38];
              if (statusStr === 'Checked In') hookData.cell.styles.textColor = [37, 99, 235];
              hookData.cell.styles.fontStyle = 'bold';
            }
          },

          didDrawPage: (hookData) => {

            doc.setTextColor(200, 200, 200);
            doc.setFontSize(40);
            doc.saveGraphicsState();

            // @ts-ignore - GState constructor is available at runtime but missing from types
            doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
            doc.text('Confidential - Igire Verify', 40, 150, { angle: 45 });
            doc.restoreGraphicsState();


            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            const footerY = pageHeight - 10;
            doc.text(`Generated by Igire Verify Admin System`, 14, footerY);
            doc.text(`Page ${hookData.pageNumber}`, pageWidth - 30, footerY);
            doc.text(`Total Records: ${totalParticipants}`, pageWidth / 2, footerY, { align: 'center' });
          }
        });

        doc.save(`${fileNameStr}.pdf`);
      } else if (formatType === 'excel') {
        const worksheetData = [
          ['Igire Verify - Admin Panel'],
          [`Attendance Report (${reportProgramId ? 'Specific Program' : 'All Programs'})`],
          [`Date Range: ${reportStartDate} to ${reportEndDate}`],
          [`Generated on: ${format(new Date(), 'MMMM dd, yyyy \\a\\t hh:mm a')} by ${userName}`],
          [],
          ['Summary Statistics'],
          ['Total Records', 'Present', 'Late', 'Absent', 'Checked In Only', 'Attendance Rate'],
          [totalParticipants, present, late, absent, incomplete, `${attendanceRate}%`],
          [],
          tableHeaders,
          ...tableRows,
          [],
          ['Total Records', totalParticipants],
          ['Generated by Igire Verify Admin System']
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const tableStartRow = 9;
        worksheet['!autofilter'] = { ref: `A${tableStartRow + 1}:J${tableStartRow + 1 + totalParticipants}` };

        worksheet['!cols'] = [
          { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 10 }, { wch: 30 }, { wch: 8 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
        XLSX.writeFile(workbook, `${fileNameStr}.xlsx`);
      } else {
        // Generate Word Document (HTML markup with .doc extension, opens natively in Word and Google Docs)
        const wordHtml = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>Attendance Report</title>
            <style>
              body { font-family: 'Arial', sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; font-size: 11pt; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24pt; font-weight: bold; color: #2E7D32; }
              .subtitle { font-size: 14pt; color: #555555; }
              .summary { width: 50%; margin: 20px 0; border: none; }
              .summary td { border: none; padding: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Igire Verify - Admin Panel</div>
              <div class="subtitle">Attendance Report (${reportProgramId ? 'Specific Program' : 'All Programs'})</div>
              <div>Date Range: ${reportStartDate} to ${reportEndDate}</div>
              <div>Generated on: ${format(new Date(), 'MMMM dd, yyyy')} by ${userName}</div>
            </div>

            <h3>Summary Statistics</h3>
            <table class="summary">
              <tr><td><b>Total Records:</b></td><td>${totalParticipants}</td></tr>
              <tr><td><b>Present:</b></td><td style="color: #2E7D32;">${present}</td></tr>
              <tr><td><b>Late:</b></td><td style="color: #d97706;">${late}</td></tr>
              <tr><td><b>Absent:</b></td><td style="color: #dc2626;">${absent}</td></tr>
              <tr><td><b>Checked In Only:</b></td><td style="color: #2563eb;">${incomplete}</td></tr>
              <tr><td><b>Attendance Rate:</b></td><td><b>${attendanceRate}%</b></td></tr>
            </table>

            <h3>Detailed Attendance Logs</h3>
            <table>
              <thead>
                <tr>
                  ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows.map((row: any) => `
                  <tr>
                    ${row.map((cell: any) => `<td>${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob(['\\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `${fileNameStr}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objUrl);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: BarChart3 },
    { id: 'attendance' as TabType, name: 'Attendance', icon: UserCheck },
    { id: 'programs' as TabType, name: 'Programs', icon: BookOpen },
    { id: 'users' as TabType, name: 'Users', icon: Users },
    { id: 'reports' as TabType, name: 'Reports', icon: FileText },
    { id: 'settings' as TabType, name: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col-reverse lg:flex-row min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar
            userName={userName}
            userRole={userRole}
            profilePhotoUrl={profilePhotoUrl}
            sessionDate={liveDate}
            currentTime={liveTime}
          />
          <div className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!selectedAttendanceRecord || !manualForm.notes.trim()) {
      setManualError('A reason / communication note is required.');
      return;
    }

    // Resolve userId — always a plain string from the API now
    const userId = String(selectedAttendanceRecord.userId);

    // Resolve programId: try from the record first, then look up from the programs list by name
    let programId = String((selectedAttendanceRecord as any).programId || '');
    if (!programId || programId.length !== 24) {
      const matched = programs.find(
        p => p.name === selectedAttendanceRecord.programName
      );
      programId = matched?._id?.toString() || '';
    }

    if (!programId || programId.length !== 24) {
      setManualError('Could not resolve the program for this participant. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        userId,
        programId,
        date: selectedDate,
        checkInStatus: manualForm.checkInStatus,
        checkOutStatus: manualForm.checkOutStatus || undefined,
        notes: manualForm.notes
      };

      const response = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowManualModal(false);
        setManualError(null);
        fetchAttendanceData();
        fetchInitialData();
      } else {
        const err = await response.json();
        setManualError(err.error || 'Failed to save adjustment. Please try again.');
      }
    } catch (error) {
      console.error('Manual adjustment error:', error);
      setManualError('A connection error occurred. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-col lg:flex-row h-screen bg-gray-100 w-full overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <AdminTopBar
          userName={userName}
          userRole={userRole}
          profilePhotoUrl={profilePhotoUrl}
          sessionDate={liveDate}
          currentTime={liveTime}
        />

        <div className="flex-1 overflow-y-auto pb-24 sm:pb-0">
          {/* Tab Navigation - Responsive */}
          <div className="bg-white border-b border-gray-200 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 overflow-x-auto">
            <nav className="flex space-x-2 sm:space-x-4 md:space-x-6 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-2 sm:px-3 md:px-4 py-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${activeTab === tab.id
                        ? 'border-[#2E7D32] text-[#2E7D32]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-2 sm:p-4 md:p-6 w-full min-w-0">
            {/* Overview Tab flex structure */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500">
                {/* Header Welcome Box - Responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 truncate">Welcome back, {userName} 👋</h1>
                    <p className="text-gray-500 text-xs sm:text-sm font-medium">Here's an overview of your platforms performance and activity.</p>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right bg-gray-50 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 whitespace-nowrap">
                    <p className="text-sm sm:text-md font-bold text-gray-900">{liveDate}</p>
                    <p className="text-[#2E7D32] text-xs sm:text-sm font-bold flex items-center justify-end gap-1 mt-1"><Clock className="w-3 h-3 sm:w-4 sm:h-4" /> {liveTime}</p>
                  </div>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4">
                    <div className="bg-[#DDF1E2] w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-[#1B5E20]" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.totalPrograms < 10 ? `0${stats.totalPrograms}` : stats.totalPrograms}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Programs</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4">
                    <div className="bg-[#DDF1E2] w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <Users className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-[#1B5E20]" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.totalUsers < 10 ? `0${stats.totalUsers}` : stats.totalUsers}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Users</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4">
                    <div className="bg-gray-100 w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <FileText className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-gray-600" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.totalAttendanceRecords < 10 ? `0${stats.totalAttendanceRecords}` : stats.totalAttendanceRecords}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Records</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4 border-b-4 border-b-green-500">
                    <div className="bg-green-50 w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <CheckSquare className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-green-600" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.presentToday < 10 ? `0${stats.presentToday}` : stats.presentToday}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-green-600 uppercase tracking-wider">Present</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4 border-b-4 border-b-orange-400">
                    <div className="bg-orange-50 w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <Clock className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-orange-500" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.lateToday < 10 ? `0${stats.lateToday}` : stats.lateToday}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-orange-500 uppercase tracking-wider">Late</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center sm:items-start gap-2 sm:gap-4 border-b-4 border-b-red-500">
                    <div className="bg-red-50 w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-red-500" />
                    </div>
                    <div className="flex flex-col text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] leading-none mb-1">
                        {stats.absentToday < 10 ? `0${stats.absentToday}` : stats.absentToday}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-wider">Absent</div>
                    </div>
                  </div>
                </div>

                {/* Big Grid Layout - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left Column (Charts and Quick Stats) */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-2xl border border-gray-200 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <Activity className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500 mb-2" />
                        <p className="text-gray-500 text-[10px] sm:text-xs font-medium tracking-wide uppercase">Most Active Program</p>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-full text-center">{stats.mostActiveProgram}</h3>
                      </div>
                      <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-2xl border border-gray-200 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-green-500 mb-2" />
                        <p className="text-gray-500 text-[10px] sm:text-xs font-medium tracking-wide uppercase">Avg Weekly Rate</p>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{stats.avgAttendanceRate}%</h3>
                      </div>
                      <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-2xl border border-gray-200 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <AlertCircle className="w-5 sm:w-6 h-5 sm:h-6 text-orange-500 mb-2" />
                        <p className="text-gray-500 text-[10px] sm:text-xs font-medium tracking-wide uppercase">Late This Month</p>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{stats.lateThisMonth}</h3>
                      </div>
                    </div>

                    {/* Chart Box - Responsive */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-200 h-64 sm:h-80 md:h-96">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-6">Daily Attendance Trend</h2>
                      <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="present" name="Present" fill="#2E7D32" radius={[4, 4, 4, 4]} barSize={25} />
                          <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[4, 4, 4, 4]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column (Activity & Calendar) */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Mini Calendar Preview */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Calendar</h2>
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="text-center font-semibold text-gray-800 mb-4">{format(new Date(), 'MMMM yyyy')}</div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                        {(() => {
                          const today = new Date();
                          const monthStart = startOfMonth(today);
                          const monthEnd = endOfMonth(monthStart);
                          const startDate = startOfWeek(monthStart);
                          const endDate = endOfWeek(monthEnd);

                          const dateFormat = "d";
                          const rows = [];
                          let days = [];
                          let day = startDate;
                          let formattedDate = "";

                          while (day <= endDate) {
                            for (let i = 0; i < 7; i++) {
                              formattedDate = format(day, dateFormat);
                              const isToday = isSameDay(day, today);
                              const isCurrentMonth = isSameMonth(day, monthStart);

                              days.push(
                                <div
                                  key={day.toString()}
                                  className={`p-2 rounded-lg ${isToday
                                      ? 'bg-[#2E7D32] text-white shadow-md font-bold cursor-pointer'
                                      : isCurrentMonth
                                        ? 'hover:bg-gray-50 cursor-pointer text-gray-700'
                                        : 'text-gray-300'
                                    }`}
                                >
                                  {formattedDate}
                                </div>
                              );
                              day = addDays(day, 1);
                            }
                            rows.push(...days);
                            days = [];
                          }
                          return rows;
                        })()}
                        <div className="col-span-7 w-full mt-2">
                          <button onClick={() => handleTabChange('attendance')} className="w-full px-4 py-2 text-sm font-semibold text-[#2E7D32] border border-[#BDE4C6] rounded-xl hover:bg-green-50 transition-colors">Expand Calendar</button>
                        </div>
                      </div>
                    </div>

                    {/* Today's Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Summary</h2>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Present</span>
                          <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">{stats.presentToday}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Late</span>
                          <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">{stats.lateToday}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <span className="text-sm font-medium text-blue-800">Checked In Only</span>
                          <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{stats.incompleteToday}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Absent</span>
                          <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">{stats.absentToday}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <span className="text-sm font-medium text-blue-800">Check-ins last hour</span>
                          <span className="text-md font-black text-blue-600">{stats.checkinsLastHour}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col" style={{ height: "400px" }}>
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Live Activity Feed</h2>
                      <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
                        {activity.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <Activity className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No recent activity found.</p>
                          </div>
                        ) : (
                          activity.map((record) => (
                            <div key={record.id} className="flex gap-3 text-sm pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${record.type === 'checkin' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <div>
                                <p className="text-gray-900">
                                  <span className="font-semibold">{record.userName}</span>
                                  <span className="text-gray-500"> ({record.programName})</span>
                                </p>
                                <p className="text-gray-600 mt-0.5">
                                  {record.type === 'checkin' ? 'Checked in' : 'Checked out'} at <span className="font-medium text-gray-800">{format(new Date(record.time), 'HH:mm')}</span>
                                  {record.status === 'late' && <span className="ml-2 text-orange-500 text-xs font-semibold bg-orange-100 px-2 py-0.5 rounded-full">LATE</span>}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Programs Tab */}
            {activeTab === 'programs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Programs Management</h1>
                  <button
                    onClick={() => setShowProgramModal(true)}
                    className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Program
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {programs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No programs found. Click "Create Program" to add your first program.
                          </td>
                        </tr>
                      ) : (
                        programs.map((program) => (
                          <tr key={program._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{program.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{program.code}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {format(new Date(program.startDate), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {format(new Date(program.endDate), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => {
                                  setEditingProgram(program);
                                  setProgramForm({
                                    name: program.name,
                                    code: program.code,
                                    description: (program as any).description || '',
                                    startDate: program.startDate ? program.startDate.split('T')[0] : '',
                                    endDate: program.endDate ? program.endDate.split('T')[0] : '',
                                    schedule: (program as any).schedule ? { ...(program as any).schedule } : { ...defaultSchedule }
                                  });
                                  setShowProgramModal(true);
                                }}
                                className="text-[#2E7D32] hover:text-[#1B5E20] mr-3"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProgram(program._id, program.name)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                    >
                      <option value="">All Programs</option>
                      {programs.map(program => (
                        <option key={program._id} value={program._id}>{program.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.filter(user => !selectedProgram || user.programId === selectedProgram).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center">
                              <Users className="w-10 h-10 text-gray-200 mb-2" />
                              <p className="font-medium">No users found</p>
                              <p className="text-xs">Try adjusting your search or program filter.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers
                          .filter(user => !selectedProgram || user.programId === selectedProgram)
                          .map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center">
                                  {user.profilePhotoUrl ? (
                                    <img
                                      src={user.profilePhotoUrl}
                                      alt={user.name}
                                      className="w-8 h-8 rounded-full mr-3"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                                      <Users className="w-4 h-4 text-gray-600" />
                                    </div>
                                  )}
                                  <span className="text-gray-900 font-medium">{user.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">{user.role}</td>
                              <td className="px-6 py-4 text-sm">
                                <select
                                  value={user.programId || ''}
                                  onChange={(e) => handleUserProgramUpdate(user._id, e.target.value || null)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                                >
                                  <option value="">No Program</option>
                                  {programs.map(program => (
                                    <option key={program._id} value={program._id}>{program.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <button
                                  onClick={() => handleDeleteUser(user._id, user.name)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Attendance Monitoring</h1>
                  <div className="flex items-center gap-4">
                    <select
                      value={attendanceProgramFilter}
                      onChange={(e) => setAttendanceProgramFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="">All Programs</option>
                      {programs.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Check-in</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Check-out</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verification</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendanceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No attendance records found for {format(new Date(selectedDate), 'MMMM dd, yyyy')}.
                          </td>
                        </tr>
                      ) : (
                        attendanceRecords.map((record) => (
                          <tr key={record._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                {record.profilePhotoUrl ? (
                                  <img
                                    src={record.profilePhotoUrl}
                                    alt={record.userName}
                                    className="w-8 h-8 rounded-full mr-3"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-gray-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-gray-900 font-medium">{record.userName}</div>
                                  <div className="text-gray-500 text-xs">{record.userEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.programName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                              {record.checkInTime
                                ? formatInTimeZone(new Date(record.checkInTime), getProgramTimezone(record), 'HH:mm:ss')
                                : '--:--:--'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                              {record.checkOutTime
                                ? formatInTimeZone(new Date(record.checkOutTime), getProgramTimezone(record), 'HH:mm:ss')
                                : '--:--:--'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status.toLowerCase() === 'present' || record.status.toLowerCase() === 'on time'
                                  ? 'bg-green-100 text-green-700'
                                  : record.status.toLowerCase() === 'present (late)'
                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                    : record.status.toLowerCase() === 'late'
                                      ? 'bg-orange-100 text-orange-700'
                                      : record.status.toLowerCase() === 'checked in'
                                        ? 'bg-blue-100 text-blue-700'
                                        : record.status.toLowerCase() === 'absent'
                                          ? 'bg-red-100 text-red-700 font-bold'
                                          : record.status.toLowerCase() === 'excused'
                                            ? 'bg-purple-100 text-purple-700 font-bold'
                                            : record.status.toLowerCase() === 'half-day'
                                              ? 'bg-yellow-100 text-yellow-700 font-bold'
                                              : 'bg-gray-100 text-gray-700'
                                }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{record.location || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => {
                                  setSelectedAttendanceRecord(record);
                                  setShowPhotoModal(true);
                                }}
                                disabled={!record.checkInPhotoUrl && !record.checkOutPhotoUrl}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${record.checkInPhotoUrl || record.checkOutPhotoUrl
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm'
                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed grayscale'
                                  }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>{record.checkOutPhotoUrl ? 'View All' : record.checkInPhotoUrl ? 'View In' : 'No Photo'}</span>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => {
                                  setSelectedAttendanceRecord(record);
                                  setManualError(null);
                                  setManualForm({
                                    checkInStatus: record.status.toLowerCase() === 'absent' ? 'on-time' : (record.status.toLowerCase().replace(' ', '-') as any),
                                    checkOutStatus: record.checkOutTime ? 'on-time' : '',
                                    notes: (record as any).manualNotes || ''
                                  });
                                  setShowManualModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all shadow-sm"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Adjust</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">

                  {/* Left Side: Professional Presets & Calendar Concept */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">Attendance Reports</h2>
                      <p className="text-gray-500 text-sm">Select a predefined period or use the calendar to pinpoint precise dates.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          const d = format(new Date(), 'yyyy-MM-dd');
                          setReportStartDate(d); setReportEndDate(d);
                        }}
                        className={`px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${reportStartDate === format(new Date(), 'yyyy-MM-dd') && reportEndDate === format(new Date(), 'yyyy-MM-dd') ? 'bg-[#E8F5E9] border-[#BDE4C6] text-[#2E7D32] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const y = new Date(); y.setDate(y.getDate() - 1);
                          const d = format(y, 'yyyy-MM-dd');
                          setReportStartDate(d); setReportEndDate(d);
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(); d.setDate(d.getDate() - 7);
                          setReportStartDate(format(d, 'yyyy-MM-dd')); setReportEndDate(format(new Date(), 'yyyy-MM-dd'));
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        Last 7 Days
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date();
                          setReportStartDate(format(startOfWeek(d), 'yyyy-MM-dd')); setReportEndDate(format(endOfWeek(d), 'yyyy-MM-dd'));
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date();
                          setReportStartDate(format(startOfMonth(d), 'yyyy-MM-dd')); setReportEndDate(format(endOfMonth(d), 'yyyy-MM-dd'));
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(); d.setMonth(d.getMonth() - 1);
                          setReportStartDate(format(startOfMonth(d), 'yyyy-MM-dd')); setReportEndDate(format(endOfMonth(d), 'yyyy-MM-dd'));
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        Last Month
                      </button>
                      <button
                        onClick={() => {
                          setReportStartDate('2020-01-01'); setReportEndDate(format(new Date(), 'yyyy-MM-dd'));
                        }}
                        className="px-4 py-3 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all col-span-2 lg:col-span-3 text-center"
                      >
                        All Time (Entire Record)
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Custom Range & Calendar</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent shadow-sm text-sm font-medium"
                        />
                        <span className="text-gray-400 font-bold">to</span>
                        <input
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent shadow-sm text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Downloader Configuration */}
                  <div className="md:w-80 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Export Settings</h3>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Target Program</label>
                      <select
                        value={reportProgramId}
                        onChange={(e) => setReportProgramId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent bg-white shadow-sm mb-6 font-medium text-sm text-gray-800"
                      >
                        <option value="">All Programs Combined</option>
                        {programs.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>

                      <div className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-100 mb-6 shadow-sm">
                        <span className="block font-bold text-gray-700 mb-1">Selected Scope:</span>
                        {reportStartDate === reportEndDate ? (
                          <span>Single day track for {format(new Date(reportStartDate), 'MMM dd, yyyy')}.</span>
                        ) : reportStartDate === '2020-01-01' ? (
                          <span>Comprehensive historic dataset from inception up to {format(new Date(reportEndDate), 'MMM dd, yyyy')}.</span>
                        ) : (
                          <span>From {format(new Date(reportStartDate), 'MMM dd, yyyy')} till {format(new Date(reportEndDate), 'MMM dd, yyyy')}.</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Export Formats</p>

                      <button onClick={() => handleDownloadReport('pdf')} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95">
                        <Download className="w-5 h-5" /> Download PDF
                      </button>

                      <button onClick={() => handleDownloadReport('excel')} className="w-full flex items-center justify-center gap-2 bg-[#1B5E20] hover:bg-[#134316] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95">
                        <FileText className="w-5 h-5" /> Download Excel
                      </button>

                      <button onClick={() => handleDownloadReport('word')} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 ">
                        <FileText className="w-5 h-5" /> Download Word Document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">General Configurations</h2>
                    <p className="text-sm text-gray-500">Manage your system preferences and default values.</p>
                  </div>
                  <div className="p-6">
                    <div className="max-w-xl space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#2E7D32] focus:border-[#2E7D32]" defaultValue="Igire Verify" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                        <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#2E7D32] focus:border-[#2E7D32]" defaultValue="admin@igireverify.com" />
                      </div>
                      <div className="pt-4">
                        <button className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-2 px-6 rounded-lg transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Program Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingProgram ? 'Edit Program' : 'Create Program'}
            </h2>
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 mb-6 text-sm font-medium">
                {formError}
              </div>
            )}
            <form onSubmit={handleProgramSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={programForm.name}
                      onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={programForm.code}
                      onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={programForm.startDate}
                      onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={programForm.endDate}
                      onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />
                <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#2E7D32] pl-2">Schedule Configuration</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in Start</label>
                    <input type="time" required value={programForm.schedule.checkInStart} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, checkInStart: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#2E7D32]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in End</label>
                    <input type="time" required value={programForm.schedule.checkInEnd} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, checkInEnd: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#2E7D32]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 text-orange-600">Late After</label>
                    <input type="time" required value={programForm.schedule.lateAfter} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, lateAfter: e.target.value } })} className="w-full bg-orange-50 px-3 py-2 border border-orange-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Class Start</label>
                    <input type="time" required value={programForm.schedule.classStart} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, classStart: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#2E7D32]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out Start</label>
                    <input type="time" required value={programForm.schedule.checkOutStart} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, checkOutStart: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#2E7D32]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out End</label>
                    <input type="time" required value={programForm.schedule.checkOutEnd} onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, checkOutEnd: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#2E7D32]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Active Days</label>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={programForm.schedule.days.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...programForm.schedule.days, day]
                              : programForm.schedule.days.filter(d => d !== day);
                            setProgramForm({ ...programForm, schedule: { ...programForm.schedule, days: newDays } });
                          }}
                          className="w-4 h-4 text-[#2E7D32] rounded focus:ring-[#2E7D32]"
                        />
                        {day.substring(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    setEditingProgram(null);
                    setProgramForm({ name: '', code: '', description: '', startDate: '', endDate: '', schedule: { ...defaultSchedule } });
                  }}
                  className="px-5 py-2.5 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                >
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete {deleteDialog.type === 'program' ? 'Program' : 'User'}</h3>
              <p className="text-gray-500 mb-6 px-4">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteDialog.name}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
                  className="flex-1 px-5 py-3 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Photo Verification Modal */}
      {showPhotoModal && selectedAttendanceRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors shadow-sm"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 border-b border-gray-100 pb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden ring-4 ring-green-50 shadow-lg">
                    {selectedAttendanceRecord.profilePhotoUrl ? (
                      <img src={selectedAttendanceRecord.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{selectedAttendanceRecord.userName}</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedAttendanceRecord.programName} · {selectedAttendanceRecord.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Check-in Photo */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-black uppercase tracking-widest text-[#2E7D32]">Check-In Photo</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      {selectedAttendanceRecord.checkInTime ? format(new Date(selectedAttendanceRecord.checkInTime), 'hh:mm:ss a') : 'Not captures'}
                    </span>
                  </div>
                  <div className="aspect-[4/3] bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl ring-4 ring-gray-50 relative group">
                    {selectedAttendanceRecord.checkInPhotoUrl ? (
                      <img src={selectedAttendanceRecord.checkInPhotoUrl} alt="Check-in" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <Clock className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-bold text-sm tracking-tight">No check-in photo</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <p className="text-white text-xs font-bold">{selectedAttendanceRecord.location || 'Location verified'}</p>
                    </div>
                  </div>
                </div>

                {/* Check-out Photo */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-black uppercase tracking-widest text-orange-600">Check-Out Photo</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      {selectedAttendanceRecord.checkOutTime ? format(new Date(selectedAttendanceRecord.checkOutTime), 'hh:mm:ss a') : 'Pending'}
                    </span>
                  </div>
                  <div className="aspect-[4/3] bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl ring-4 ring-gray-50 relative group">
                    {selectedAttendanceRecord.checkOutPhotoUrl ? (
                      <img src={selectedAttendanceRecord.checkOutPhotoUrl} alt="Check-out" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <Clock className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-bold text-sm tracking-tight text-center px-6">Participant has not checked out yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Verification Audit</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Review these images relative to the official profile photo to ensure identity integrity. If images appear suspicious or do not match, please contact the program coordinator.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manual Attendance Adjustment Modal */}
      {showManualModal && selectedAttendanceRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] overflow-y-auto p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[24px]">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-none">Manual Adjustment</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1.5">{selectedAttendanceRecord.userName}</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Adjust Check-In Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['on-time', 'late', 'absent', 'half-day', 'excused'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, checkInStatus: status })}
                      className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight transition-all ${manualForm.checkInStatus === status
                          ? 'bg-[#E8F5E9] border-[#16A34A] text-[#16A34A] shadow-sm'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                    >
                      {status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Adjust Check-Out Status (Optional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['', 'on-time', 'early', 'half-day', 'excused'].map((status) => (
                    <button
                      key={status || 'none'}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, checkOutStatus: status })}
                      className={`px-3 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight transition-all ${manualForm.checkOutStatus === status
                          ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                    >
                      {status === '' ? 'None' : status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 font-black">Reason / Communication Note (Mandatory)</label>
                <textarea
                  required
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="e.g. User sent sick note via WhatsApp, or permission given for business meeting..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all outline-none"
                />
              </div>

              {manualError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700 leading-relaxed">{manualError}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-gray-900 hover:bg-[#111111] shadow-lg transition-all active:scale-95"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
