"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StaffSidebar from "@/components/dashboard/staff/StaffSidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatsCard from "@/components/dashboard/hr/StatsCard";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Search,
  Activity,
  User
} from "lucide-react";
import { useSocket } from "@/lib/socket";
import { format } from "date-fns";

interface Program {
  _id: string;
  name: string;
  code: string;
}

interface ParticipantStats {
  _id: string;
  userName: string;
  onTime: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

export default function UnifiedStaffDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "overview";
  
  const socket = useSocket();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [participants, setParticipants] = useState<ParticipantStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveEvents, setLiveEvents] = useState<any[]>([]);


  // Fetch initial programs
  useEffect(() => {
    async function fetchPrograms() {
      try {
        // Trigger absentee maintenance on load
        fetch('/api/attendance/maintenance/absentees').catch(err => console.error("Maintenance failed:", err));

        const res = await fetch("/api/public/programs");
        if (res.ok) {
          const data = await res.json();
          setPrograms(data);
          if (data.length > 0) {
            setSelectedProgramId(data[0]._id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  // Fetch stats and participants when selected program changes
  useEffect(() => {
    if (!selectedProgramId) return;

    async function fetchStats() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch(`/api/attendance/stats/${selectedProgramId}`),
          fetch(`/api/admin/activity?programId=${selectedProgramId}&limit=50`)
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.summary);
          setParticipants(data.perParticipant || []);
        }

        if (activityRes.ok) {
          const data = await activityRes.json();
          setLiveEvents(data.activity || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }
    fetchStats();

    // Socket listener for real-time updates
    if (socket) {
      socket.emit("join-program", selectedProgramId);
      
      const handleAttendanceUpdate = (data: any) => {
        console.log("Real-time attendance update received:", data);
        
        // Add to live events if it matches current program
        setLiveEvents(prev => [data, ...prev].slice(0, 50));
        
        // Refresh overall stats
        fetchStats(); 
      };

      socket.on("attendance-update", handleAttendanceUpdate);

      return () => {
        socket.off("attendance-update", handleAttendanceUpdate);
      };
    }
  }, [selectedProgramId, socket]);

  const filteredParticipants = participants.filter(p => 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <StaffSidebar />

      <div className="flex-1 ml-[160px] md:ml-[240px] flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-[#111111]">
                Attendance Monitor
              </h1>
              <p className="text-gray-500 font-medium">Real-time participant tracking and analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <CalendarIcon size={18} className="text-[#2E7D32]" />
                This Month
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-[#2E7D32] text-white rounded-xl text-sm font-bold hover:bg-[#1B5E20] transition-all shadow-md active:scale-95">
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatsCard 
              title="Total Participants"
              value={stats?.total || "0"}
              icon={<Users size={28} />}
              bgColor="#E8F5E9"
              borderColor="#A5D6A7"
              iconColor="#2E7D32"
            />
            <StatsCard 
              title="Attendance Rate"
              value={`${stats?.attendancePercentage || "0"}%`}
              icon={<CheckCircle2 size={28} />}
              bgColor="#FFF8E1"
              borderColor="#FFE082"
              iconColor="#FFA000"
            />
            <StatsCard 
              title="On-Time Rate"
              value={`${stats?.onTimePercentage || "0"}%`}
              icon={<Clock size={28} />}
              bgColor="#E3F2FD"
              borderColor="#90CAF9"
              iconColor="#1976D2"
            />
            <StatsCard 
              title="Pending Alerts"
              value={stats?.late || "0"}
              icon={<AlertTriangle size={28} />}
              bgColor="#FFEBEE"
              borderColor="#EF9A9A"
              iconColor="#D32F2F"
            />
          </div>

          {/* Program Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1">
              {programs.map((program) => (
                <button
                  key={program._id}
                  onClick={() => setSelectedProgramId(program._id)}
                  className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all duration-300 relative ${
                    selectedProgramId === program._id
                    ? "bg-white text-[#2E7D32] border-t border-l border-r border-gray-200 -mb-px shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {program.name}
                  {selectedProgramId === program._id && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#2E7D32] rounded-t-xl" />
                  )}
                </button>
              ))}
              {programs.length === 0 && !loading && (
                <p className="text-gray-400 py-3 px-6 italic">No active programs found</p>
              )}
            </div>
          </div>

          {/* Main Content Area: Overview or Live Feed */}
          {activeTab === 'live' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#111111] flex items-center gap-2">
                    <Activity className="text-[#2E7D32]" />
                    Real-time Attendance Feed
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">Streaming live activity for the selected program</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-black text-red-500 uppercase tracking-widest">Live Updates Enabled</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[600px] p-6 space-y-4">
                {liveEvents.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Clock size={40} className="opacity-20" />
                    <p className="font-medium italic">No recent check-in activity recorded today.</p>
                  </div>
                ) : (
                  liveEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-gray-100 hover:border-[#2E7D32]/30 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${
                          event.type === 'checkin' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#EF6C00]'
                        }`}>
                          {event.userName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#111111] text-lg">{event.userName}</h4>
                          <p className="text-sm text-gray-500 font-medium">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)} • {event.programName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#111111]">{format(new Date(event.time), 'HH:mm:ss')}</p>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          event.status === 'on-time' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                          event.status === 'late' ? 'bg-[#FFF8E1] text-[#FFA000]' : 
                          'bg-[#FFEBEE] text-[#D32F2F]'
                        }`}>
                          {event.status || 'Verified'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-black text-[#111111]">
                  Participant Attendance Overview
                </h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#2E7D32] text-white">
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Participant Name</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Total Days</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">On-Time</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Late</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Missed</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Attendance Rate</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredParticipants.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-black text-xs">
                            {p.userName.charAt(0)}
                          </div>
                          {p.userName}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">{p.total}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#2E7D32]">{p.onTime}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#C47D0E]">{p.late}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#DC2626]">{p.absent}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-black ${p.attendanceRate >= 80 ? 'text-[#2E7D32]' : p.attendanceRate >= 50 ? 'text-[#C47D0E]' : 'text-[#DC2626]'}`}>
                              {p.attendanceRate}%
                            </span>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${p.attendanceRate >= 80 ? 'bg-[#2E7D32]' : p.attendanceRate >= 50 ? 'bg-[#C47D0E]' : 'bg-[#DC2626]'}`}
                                style={{ width: `${p.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            p.attendanceRate >= 90 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                            p.attendanceRate >= 75 ? 'bg-[#FFF8E1] text-[#FFA000]' : 
                            'bg-[#FFEBEE] text-[#D32F2F]'
                          }`}>
                            {p.attendanceRate >= 90 ? 'Excellent' : p.attendanceRate >= 75 ? 'Good' : 'Needs Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400 font-medium italic">
                          {loading ? "Loading participant data..." : "No participant records found for this program."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Showing {filteredParticipants.length} of {participants.length} Participants
                </p>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-white transition-colors disabled:opacity-50" disabled>
                    <ChevronLeft size={18} />
                  </button>
                  {[1].map(page => (
                    <button key={page} className="w-8 h-8 rounded-lg bg-[#2E7D32] text-white text-xs font-black shadow-md">
                      {page}
                    </button>
                  ))}
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-white transition-colors disabled:opacity-50" disabled>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-gray-200 mt-auto bg-white">
          © 2026 Igire Rwanda Organisation • Secure Attendance Gateway • All actions auditable
        </footer>
      </div>
    </div>
  );
}
