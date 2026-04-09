"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StaffSidebar from "@/components/dashboard/staff/StaffSidebar";
import TopBar from "@/components/dashboard/TopBar";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Download,
  CalendarDays,
  Search,
  Activity,
  Building2,
  Radio,
  FileText,
} from "lucide-react";
import { useSocket, joinStaffMonitorRoom } from "@/lib/socket";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type RangeKey = "today" | "week" | "month";
type ManualStatus = "late" | "absent";

interface Program {
  _id: string;
  name: string;
  code: string;
}

interface ProgramBreakdown {
  _id: string;
  name: string;
  code: string;
  enrolled: number;
  checkInsToday: number;
}

interface ParticipantRow {
  userId: string;
  programId: string;
  userName: string;
  programName: string;
  onTime: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

interface Summary {
  checkInRecords: number;
  onTime: number;
  late: number;
  absent: number;
  attendancePercentage: number;
  onTimePercentage: number;
  presentToday: number;
  lateInPeriod: number;
}

interface RosterRow {
  userId: string;
  name: string;
  email: string;
  checkIn: string;
  checkOut: string;
  status: string;
  attendanceStatus: string;
}

export default function StaffDashboardClient() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "overview";

  const socket = useSocket();
  const [topUser, setTopUser] = useState<{
    userName: string;
    programName: string;
    checkInWindow: string;
  } | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programBreakdown, setProgramBreakdown] = useState<ProgramBreakdown[]>([]);
  const [scopeProgramId, setScopeProgramId] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("month");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [liveEvents, setLiveEvents] = useState<
    { userName: string; type: string; status: string; programName: string; time: string }[]
  >([]);

  const [rosterProgramId, setRosterProgramId] = useState<string>("");
  const [rosterDate, setRosterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [calMonth, setCalMonth] = useState(new Date());
  const [calSelected, setCalSelected] = useState(new Date());

  const [repStart, setRepStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [repEnd, setRepEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [repProgram, setRepProgram] = useState<string>("all");
  const [repBusy, setRepBusy] = useState(false);
  const [manualProgramId, setManualProgramId] = useState<string>("");
  const [manualSearch, setManualSearch] = useState("");
  const [manualParticipantId, setManualParticipantId] = useState("");
  const [manualDate, setManualDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [manualStatus, setManualStatus] = useState<ManualStatus>("absent");
  const [manualNotes, setManualNotes] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMessage, setManualMessage] = useState("");

  const overviewQuery = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (scopeProgramId !== "all") params.set("programId", scopeProgramId);
    return `/api/staff/overview?${params.toString()}`;
  }, [range, scopeProgramId]);

  const activityQuery = useMemo(() => {
    const params = new URLSearchParams({ limit: "80" });
    if (scopeProgramId !== "all") params.set("programId", scopeProgramId);
    return `/api/staff/activity?${params.toString()}`;
  }, [scopeProgramId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d)
          setTopUser({
            userName: d.userName,
            programName: d.programName,
            checkInWindow: d.checkInWindow || "N/A",
          });
      })
      .catch(() => {});
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(overviewQuery);
      if (!res.ok) return;
      const data = await res.json();
      setPrograms(data.programs || []);
      setProgramBreakdown(data.programBreakdown || []);
      setParticipantCount(data.participantCount ?? 0);
      setSummary(data.summary || null);
      setParticipants(data.perParticipant || []);
      const from = data.dateRange?.from ? format(new Date(data.dateRange.from), "MMM d, yyyy") : "";
      const to = data.dateRange?.to ? format(new Date(data.dateRange.to), "MMM d, yyyy") : "";
      setDateRangeLabel(from && to ? `${from} – ${to}` : "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [overviewQuery]);

  useEffect(() => {
    if (programs.length > 0 && !rosterProgramId) {
      setRosterProgramId(programs[0]._id);
    }
  }, [programs, rosterProgramId]);

  useEffect(() => {
    if (programs.length > 0 && !manualProgramId) {
      setManualProgramId(programs[0]._id);
    }
  }, [programs, manualProgramId]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch(activityQuery);
      if (!res.ok) return;
      const data = await res.json();
      setLiveEvents(data.activity || []);
    } catch (e) {
      console.error(e);
    }
  }, [activityQuery]);

  const loadRoster = useCallback(async () => {
    if (!rosterProgramId) return;
    setRosterLoading(true);
    try {
      const res = await fetch(
        `/api/staff/program-roster?programId=${rosterProgramId}&date=${rosterDate}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setRoster(data.roster || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRosterLoading(false);
    }
  }, [rosterProgramId, rosterDate]);

  useEffect(() => {
    fetch("/api/attendance/maintenance/absentees").catch(() => {});
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "live") loadActivity();
  }, [activeTab, loadActivity]);

  useEffect(() => {
    if (activeTab === "programs") loadRoster();
  }, [activeTab, loadRoster]);

  useEffect(() => {
    try {
      setCalSelected(parseISO(rosterDate));
      setCalMonth(parseISO(rosterDate));
    } catch {
      /* ignore */
    }
  }, [rosterDate]);

  useEffect(() => {
    if (!socket) return;
    joinStaffMonitorRoom(socket);
    const onUpdate = (payload: {
      userName?: string;
      type?: string;
      status?: string;
      programName?: string;
      timestamp?: string;
    }) => {
      if (!payload.userName) return;
      setLiveEvents((prev) =>
        [
          {
            userName: payload.userName!,
            type: payload.type || "checkin",
            status: payload.status || "on-time",
            programName: payload.programName || "",
            time: payload.timestamp || new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 80)
      );
      loadOverview();
      if (activeTab === "live") loadActivity();
      if (activeTab === "programs") loadRoster();
    };
    socket.on("attendance-update", onUpdate);
    return () => {
      socket.off("attendance-update", onUpdate);
    };
  }, [socket, loadOverview, loadActivity, loadRoster, activeTab]);

  const filteredParticipants = participants.filter(
    (p) =>
      p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.programName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const liveByProgram = useMemo(() => {
    const m = new Map<string, typeof liveEvents>();
    for (const ev of liveEvents) {
      const k = ev.programName || "Program";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(ev);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [liveEvents]);

  function exportTableCsv() {
    const headers = ["Program", "Participant", "Total", "On-time", "Late", "Missed", "Rate %"];
    const rows = filteredParticipants.map((p) => [
      p.programName,
      p.userName,
      String(p.total),
      String(p.onTime),
      String(p.late),
      String(p.absent),
      String(p.attendanceRate),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `igire-staff-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runReport(formatType: "csv" | "json") {
    setRepBusy(true);
    try {
      const params = new URLSearchParams({
        startDate: repStart,
        endDate: repEnd,
        format: formatType,
      });
      if (repProgram !== "all") params.set("programId", repProgram);
      const res = await fetch(`/api/staff/reports?${params}`);
      if (formatType === "csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${repStart}-to-${repEnd}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      return res;
    } finally {
      setRepBusy(false);
    }
  }

  async function downloadReportPdf() {
    setRepBusy(true);
    try {
      const params = new URLSearchParams({
        startDate: repStart,
        endDate: repEnd,
        format: "json",
      });
      if (repProgram !== "all") params.set("programId", repProgram);
      const res = await fetch(`/api/staff/reports?${params}`);
      const json = await res.json();
      const data = json.data || [];
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(27, 94, 32);
      doc.text("Igire Verify — Staff report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`${repStart} to ${repEnd}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [["Date", "Name", "Program", "Status", "In", "Out", "Location"]],
        body: data.map((r: { date: string; name: string; program: string; status: string; checkIn: string; checkOut: string; location?: string }) => [
          r.date,
          r.name,
          r.program,
          r.status,
          r.checkIn,
          r.checkOut,
          r.location || "Unknown",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [46, 125, 50] },
      });
      doc.save(`igire-report-${repStart}-${repEnd}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setRepBusy(false);
    }
  }

  const manualCandidates = useMemo(() => {
    return participants.filter((p) => {
      if (!manualProgramId) return false;
      const inProgram = p.programId === manualProgramId;
      if (!inProgram) return false;
      if (!manualSearch.trim()) return true;
      return p.userName.toLowerCase().includes(manualSearch.toLowerCase());
    });
  }, [participants, manualProgramId, manualSearch]);

  async function submitManualAttendance() {
    setManualMessage("");
    if (!manualProgramId || !manualParticipantId) {
      setManualMessage("Select a program and participant first.");
      return;
    }

    setManualBusy(true);
    try {
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manualParticipantId,
          programId: manualProgramId,
          date: manualDate,
          checkInStatus: manualStatus,
          notes: manualNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setManualMessage(data.error || "Failed to save manual attendance.");
        return;
      }
      setManualNotes("");
      setManualSearch("");
      setManualMessage("Manual attendance saved and dashboards updated.");
      loadOverview();
      if (activeTab === "live") loadActivity();
      if (activeTab === "programs") loadRoster();
    } catch {
      setManualMessage("Network error while saving manual attendance.");
    } finally {
      setManualBusy(false);
    }
  }

  const now = new Date();
  const sessionDate = `Today: ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
  const currentTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const padStart = monthStart.getDay();

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      <StaffSidebar />
      <div className="flex-1 ml-[120px] flex flex-col min-h-screen">
        <TopBar
          userName={topUser?.userName}
          programName={topUser?.programName}
          checkInWindow={topUser?.checkInWindow}
          sessionDate={sessionDate}
          currentTime={currentTime}
        />

        <main className="flex-1 px-8 md:px-16 py-8 max-w-[1400px] w-full">
          {activeTab === "overview" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-black">Staff dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Participant attendance across Admin-managed programs · {dateRangeLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(["today", "week", "month"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      range === r
                        ? "bg-[#16A34A] text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {r === "today" ? "Today" : r === "week" ? "7 days" : "This month"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={exportTableCsv}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-[#C47D0E] text-white ml-auto"
                >
                  Export table CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-sm font-semibold text-gray-700 self-center mr-2">Scope:</span>
                <button
                  type="button"
                  onClick={() => setScopeProgramId("all")}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                    scopeProgramId === "all" ? "bg-[#14532D] text-white" : "bg-white border"
                  }`}
                >
                  All programs
                </button>
                {programs.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setScopeProgramId(p._id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium max-w-[180px] truncate ${
                      scopeProgramId === p._id ? "bg-[#14532D] text-white" : "bg-white border"
                    }`}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#DCEFE3] rounded-3xl px-6 py-6 flex items-center gap-4 shadow-sm border border-[#B8E0C8]">
                  <Users className="w-10 h-10 text-[#16A34A] shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase">Participants</p>
                    <p className="text-3xl font-bold text-black">{loading ? "—" : participantCount}</p>
                    <p className="text-xs text-gray-600">Enrolled in scope</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl px-6 py-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <CalendarDays className="w-10 h-10 text-[#C47D0E] shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase">Check-ins today</p>
                    <p className="text-3xl font-bold text-black">{loading ? "—" : summary?.presentToday ?? 0}</p>
                    <p className="text-xs text-gray-600">Across scope</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl px-6 py-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-10 h-10 text-[#16A34A] shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase">Attendance rate</p>
                    <p className="text-3xl font-bold text-black">
                      {loading ? "—" : `${summary?.attendancePercentage ?? 0}%`}
                    </p>
                    <p className="text-xs text-gray-600">In selected window</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl px-6 py-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <AlertTriangle className="w-10 h-10 text-red-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase">Late</p>
                    <p className="text-3xl font-bold text-black">{loading ? "—" : summary?.lateInPeriod ?? 0}</p>
                    <p className="text-xs text-gray-600">In window</p>
                  </div>
                </div>
              </div>

              {programBreakdown.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#16A34A]" />
                    By program (from database)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programBreakdown.map((p) => (
                      <div
                        key={p._id}
                        className="bg-[#DCEFE3] rounded-2xl px-5 py-4 border border-[#B8E0C8] flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-black truncate max-w-[200px]" title={p.name}>
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-600">{p.enrolled} enrolled</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#14532D]">{p.checkInsToday}</p>
                          <p className="text-[10px] uppercase text-gray-500">today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-bold text-lg">Participant attendance</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full sm:w-64"
                      placeholder="Search…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#7FAF8C] text-white">
                        <th className="px-4 py-3 text-left font-semibold">Program</th>
                        <th className="px-4 py-3 text-left font-semibold">Participant</th>
                        <th className="px-4 py-3 text-center font-semibold">Days</th>
                        <th className="px-4 py-3 text-center font-semibold">On-time</th>
                        <th className="px-4 py-3 text-center font-semibold">Late</th>
                        <th className="px-4 py-3 text-center font-semibold">Missed</th>
                        <th className="px-4 py-3 text-center font-semibold">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredParticipants.map((p) => (
                        <tr key={`${p.userId}-${p.programId}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{p.programName}</td>
                          <td className="px-4 py-3 font-medium">{p.userName}</td>
                          <td className="px-4 py-3 text-center">{p.total}</td>
                          <td className="px-4 py-3 text-center text-[#16A34A] font-medium">{p.onTime}</td>
                          <td className="px-4 py-3 text-center text-[#C47D0E] font-medium">{p.late}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-medium">{p.absent}</td>
                          <td className="px-4 py-3 text-center font-bold">{p.attendanceRate}%</td>
                        </tr>
                      ))}
                      {!loading && filteredParticipants.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                            No rows in this range. Participants need check-ins recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600">
                  On-time in period: <strong>{summary?.onTimePercentage ?? 0}%</strong>
                </div>
              </div>
            </>
          )}

          {activeTab === "live" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-black">Live attendance</h1>
              <p className="text-gray-600 text-sm">All check-ins and check-outs in scope, grouped by program.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setScopeProgramId("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm ${scopeProgramId === "all" ? "bg-[#14532D] text-white" : "bg-white border"}`}
                >
                  All programs
                </button>
                {programs.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setScopeProgramId(p._id)}
                    className={`px-3 py-1.5 rounded-lg text-sm max-w-[160px] truncate ${scopeProgramId === p._id ? "bg-[#14532D] text-white" : "bg-white border"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {liveByProgram.map(([prog, events]) => (
                <div key={prog} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 bg-[#E8F5E9] border-b border-[#C8E6C9] flex justify-between items-center">
                    <span className="font-bold text-[#14532D]">{prog}</span>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[#16A34A]" />
                      Live
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="p-6 text-gray-500 text-sm">No events</p>
                    ) : (
                      events.map((ev, i) => (
                        <div key={`${ev.time}-${i}`} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <p className="font-semibold">{ev.userName}</p>
                            <p className="text-xs text-gray-500 capitalize">{ev.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono">{format(new Date(ev.time), "HH:mm:ss")}</p>
                            <span className="text-xs font-semibold text-[#16A34A]">{ev.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
              {liveByProgram.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  No activity loaded. Open scope to &quot;All programs&quot; or pick a program.
                </div>
              )}
            </div>
          )}

          {activeTab === "programs" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-black">Programs · read-only roster</h1>
              <p className="text-gray-600 text-sm">
                View who checked in or out on a selected day. Staff cannot edit or delete records.
              </p>

              <div className="flex flex-wrap gap-4 items-end bg-white rounded-2xl p-4 border border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Program</label>
                  <select
                    className="border rounded-xl px-3 py-2 text-sm min-w-[200px]"
                    value={rosterProgramId}
                    onChange={(e) => setRosterProgramId(e.target.value)}
                  >
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
                  <input
                    type="date"
                    className="border rounded-xl px-3 py-2 text-sm"
                    value={rosterDate}
                    onChange={(e) => setRosterDate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={loadRoster}
                  className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-sm font-semibold"
                >
                  Refresh
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <button type="button" className="text-sm text-[#14532D] font-semibold" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
                    ←
                  </button>
                  <span className="font-bold">{format(calMonth, "MMMM yyyy")}</span>
                  <button type="button" className="text-sm text-[#14532D] font-semibold" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                    →
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: padStart }).map((_, i) => (
                    <span key={`pad-${i}`} />
                  ))}
                  {calDays.map((day) => {
                    const sel = isSameDay(day, calSelected);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setCalSelected(day);
                          setRosterDate(format(day, "yyyy-MM-dd"));
                        }}
                        className={`py-2 rounded-lg text-sm font-medium ${
                          sel ? "bg-[#14532D] text-white" : "hover:bg-[#E8F5E9]"
                        }`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#7FAF8C] text-white">
                      <th className="px-4 py-3 text-left">Participant</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-center">Check-in</th>
                      <th className="px-4 py-3 text-center">Check-out</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rosterLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Loading…
                        </td>
                      </tr>
                    ) : (
                      roster.map((r) => (
                        <tr key={r.userId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{r.email}</td>
                          <td className="px-4 py-3 text-center">{r.checkIn}</td>
                          <td className="px-4 py-3 text-center">{r.checkOut}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                r.status === "absent"
                                  ? "bg-red-100 text-red-800"
                                  : 
                                r.status === "checked-out"
                                  ? "bg-green-100 text-green-800"
                                  : r.status === "checked-in"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {r.status === "not-checked-in" ? "not checked in" : r.status.replace("-", " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {!rosterLoading && roster.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          No participants or no records for this day.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-2xl font-bold text-black">Reports</h1>
              <p className="text-gray-600 text-sm">
                Download participant attendance for any day or range. Read-only; same data as Admin reports for participants.
              </p>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Start date</label>
                    <input
                      type="date"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={repStart}
                      onChange={(e) => setRepStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">End date</label>
                    <input
                      type="date"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={repEnd}
                      onChange={(e) => setRepEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Program</label>
                  <select
                    className="w-full mt-1 border rounded-xl px-3 py-2"
                    value={repProgram}
                    onChange={(e) => setRepProgram(e.target.value)}
                  >
                    <option value="all">All programs</option>
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={repBusy}
                    onClick={() => runReport("csv")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] text-white font-semibold text-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Excel / CSV
                  </button>
                  <button
                    type="button"
                    disabled={repBusy}
                    onClick={downloadReportPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C47D0E] text-white font-semibold text-sm disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-2xl font-bold text-black">My attendance</h1>
              <p className="text-gray-600 text-sm">
                Record your own check-in or check-out. Your program and schedule are set by Admin in your user profile.
              </p>
              <div className="bg-[#DCEFE3] rounded-3xl p-8 border border-[#B8E0C8] space-y-4">
                <Link
                  href="/dashboard/staff/attendance/checkin"
                  className="block w-full text-center py-4 rounded-2xl bg-[#14532D] text-white font-bold"
                >
                  Check in
                </Link>
                <Link
                  href="/dashboard/staff/attendance/checkout"
                  className="block w-full text-center py-4 rounded-2xl bg-white text-[#14532D] font-bold border-2 border-[#14532D]"
                >
                  Check out
                </Link>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                <h2 className="text-lg font-bold text-black">Manual participant attendance</h2>
                <p className="text-sm text-gray-600">
                  Use this when a participant reports late or absent. This record updates staff/admin dashboards and reports.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Program</label>
                    <select
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={manualProgramId}
                      onChange={(e) => {
                        setManualProgramId(e.target.value);
                        setManualParticipantId("");
                      }}
                    >
                      <option value="">Select program</option>
                      {programs.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Date</label>
                    <input
                      type="date"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Search participant</label>
                  <div className="relative mt-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      placeholder="Type participant name"
                      className="w-full border rounded-xl pl-9 pr-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Participant</label>
                  <select
                    className="w-full mt-1 border rounded-xl px-3 py-2"
                    value={manualParticipantId}
                    onChange={(e) => setManualParticipantId(e.target.value)}
                  >
                    <option value="">Select participant</option>
                    {manualCandidates.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.userName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Status</label>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setManualStatus("absent")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                        manualStatus === "absent"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-white text-gray-700 border-gray-200"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualStatus("late")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                        manualStatus === "late"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-white text-gray-700 border-gray-200"
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 border rounded-xl px-3 py-2 min-h-24"
                    maxLength={500}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Participant communicated illness, transport issue, etc."
                  />
                </div>
                {manualMessage && (
                  <p className="text-sm text-[#14532D] bg-[#ECFDF3] border border-[#BBF7D0] px-3 py-2 rounded-xl">
                    {manualMessage}
                  </p>
                )}
                <button
                  type="button"
                  disabled={manualBusy}
                  onClick={submitManualAttendance}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14532D] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {manualBusy ? "Saving..." : "Save manual attendance"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4 max-w-lg">
              <h1 className="text-2xl font-bold text-black">Settings</h1>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 text-sm text-gray-700 space-y-3">
                <p>
                  <strong>Programs</strong> are created and managed in the Admin portal. Staff dashboards only display
                  live MongoDB data.
                </p>
                <p>
                  If your check-in window looks wrong, ask an Admin to assign the correct <strong>program</strong> to
                  your staff account.
                </p>
                <Link href="/dashboard/profile" className="text-[#16A34A] font-semibold underline">
                  Open profile
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
