import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import AttendanceStats from "@/components/dashboard/AttendanceStats";
import AttendanceHistory from "@/components/dashboard/RequirementsBanner"; // Use the one from RequirementsBanner as seen in screenshot
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import AttendanceCalendar from "@/components/dashboard/AttendanceCalendar";
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
        checkInWindow = `${program.schedule.checkInStart} - ${program.schedule.checkInEnd} and Check-out ${program.schedule.checkOutStart || "10:40"} - ${program.schedule.checkOutEnd || "17:30"}`;
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
    sessionDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    checkInWindow,
    currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col w-full overflow-x-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 sm:pb-0">

        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        {/* RESPONSIVE CONTENT */}
        <main className="px-4 sm:px-6 py-6 md:py-10 flex-1">
          <div className="w-full min-w-0 flex flex-col gap-8 md:gap-12">

            {/* Row 1: Program Card + Attendance Chart - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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

            {/* Row 2: Attendance Stats */}
            <div>
              <AttendanceStats
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>

            {/* Row 4: Attendance History */}
            <div className="w-full">
              <AttendanceHistory 
                programId={userData.programId} 
                userId={userData.userId || ""} 
              />
            </div>

            {/* Row 3: Attendance Calendar */}
            <div className="w-full">
              <AttendanceCalendar
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