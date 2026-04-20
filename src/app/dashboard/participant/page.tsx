import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import AttendanceStats from "@/components/dashboard/AttendanceStats";
import AttendanceHistory from "@/components/dashboard/AttendanceHistory";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export default async function ParticipantDashboard() {
  const claims = await requireAuthOrRedirect("participant");

  // Fetch user data from database to get program
  const db = await getDb();
  const users = db.collection("users");
  const programs = db.collection("programs");
  
  const user = await users.findOne({ email: claims.email });
  
  let programName = "No Program Assigned";
  let checkInWindow = "N/A";
  const programId = user?.programId || "";

  if (user?.programId) {
    const program = await programs.findOne({ _id: user.programId });
    if (program) {
      programName = program.name;
      if (program.schedule) {
        checkInWindow = `${program.schedule.checkInStart} - ${program.schedule.checkInEnd}`;
      }
    } else {
        programName = "Program Not Found";
    }
  }

  const userData = {
    userName: claims.name,
    programName,
    programId: programId.toString(),
    userId: user?._id.toString(),
    sessionDate: `Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    checkInWindow,
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col-reverse sm:flex-row w-full overflow-x-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 sm:pb-0">

        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        {/* RESPONSIVE CONTENT - Compact Layout */}
        <main className="px-2 sm:px-3 md:px-4 lg:px-5 py-3 sm:py-4 md:py-6 w-full">
          <div className="w-full max-w-[1400px] mx-auto min-w-0">

          {/* Row 1: Program Card + Attendance Chart - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-5 md:mb-6">
            {/* Program Card - Full width on mobile, 1 col on desktop */}
            <div className="lg:col-span-1">
              <ProgramCard programName={userData.programName} />
            </div>
            
            {/* Attendance Chart - Full width on mobile, 1 col on desktop */}
            <div className="lg:col-span-1">
              <AttendanceChart
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>
          </div>

          {/* Row 2: Attendance Stats - Full width responsive grid */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <AttendanceStats
              programId={userData.programId}
              userId={userData.userId || ""}
            />
          </div>

          {/* Row 3: Attendance History - Full width on all sizes */}
          <div className="w-full">
            <AttendanceHistory
              programId={userData.programId}
              userId={userData.userId || ""}
            />
          </div>

          </div>
        </main>
      </div>

    </div>
  );
}