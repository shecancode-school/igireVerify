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
  let programId = user?.programId || "";

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
    isOnline: true,
    sessionDate: `Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    checkInWindow,
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col-reverse sm:flex-col">

      <Sidebar />

      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 sm:pb-0">

        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          isOnline={userData.isOnline}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        {/* RESPONSIVE CONTENT */}
        <main className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 max-w-7xl w-full mx-auto">

          {/* Row 1: Program Card + Attendance Chart - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
            {/* Program Card - Full width on mobile, 5 cols on desktop */}
            <div className="col-span-1 md:col-span-5">
              <ProgramCard programName={userData.programName} />
            </div>
            
            {/* Attendance Chart - Full width on mobile, 7 cols on desktop */}
            <div className="col-span-1 md:col-span-7">
              <AttendanceChart
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>
          </div>

          {/* Row 2: Attendance Stats - Responsive 3-card grid */}
          <div className="mb-6 md:mb-8">
            <AttendanceStats
              programId={userData.programId}
              userId={userData.userId || ""}
            />
          </div>

          {/* Row 3: Attendance History - Takes 7 cols on desktop, full width on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
            <div className="col-span-1 md:col-span-7">
              <AttendanceHistory
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>
            {/* Right side is FREE SPACE on desktop */}
          </div>

        </main>
      </div>

    </div>
  );
}