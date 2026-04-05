import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import AttendanceStats from "@/components/dashboard/AttendanceStats";
import AttendanceHistory from "@/components/dashboard/AttendanceHistory";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

const PROGRAM_NAMES: Record<string, string> = {
  'web-fundamentals': 'Web Fundamentals',
  'advanced-frontend': 'Advanced Frontend',
  'advanced-backend': 'Advanced Backend'
};

export default async function ParticipantDashboard() {
  const claims = await requireAuthOrRedirect("participant");

  // Fetch user data from database to get program
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email: claims.email });

  const programName = user?.programId ? PROGRAM_NAMES[user.programId] || user.programId : 'Web Fundamentals';

  const userData = {
    userName: claims.name,
    programName,
    programId: user?.programId || 'web-fundamentals',
    userId: user?._id.toString(),
    isOnline: true,
    sessionDate: `Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    checkInWindow: "08:00 - 08:30", // TODO: Get from attendance rules
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    daysAttended: 15,
    pendingAlerts: 2,
    missedDays: 1,
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      
      <Sidebar />

      <div className="flex-1 ml-[120px]">
        
        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          isOnline={userData.isOnline}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        {/* CENTERED CONTENT WITH FREE SPACE ON SIDES */}
        <main className="px-16 py-8 max-w-[1400px]">
          
          {/* Row 1: Program Card (LEFT) + Attendance Chart (RIGHT) */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            {/* Program Card - Takes 5 columns */}
            <div className="col-span-5">
              <ProgramCard programName={userData.programName} />
            </div>
            
            {/* Attendance Chart - Takes 7 columns */}
            <div className="col-span-7">
              <AttendanceChart />
            </div>
          </div>

          {/* Row 2: Attendance Stats - 3 cards */}
          <div className="mb-8">
            <AttendanceStats
              programId={userData.programId}
              userId={userData.userId}
            />
          </div>

          {/* Row 3: Attendance History - Takes only LEFT half */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <AttendanceHistory />
            </div>
            {/* Right side is FREE SPACE */}
          </div>

        </main>
      </div>

    </div>
  );
}