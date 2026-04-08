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
              <AttendanceChart 
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>
          </div>

          {/* Row 2: Attendance Stats - 3 cards */}
          <div className="mb-8">
            <AttendanceStats
              programId={userData.programId}
              userId={userData.userId || ""}
            />
          </div>

          {/* Row 3: Attendance History - Takes only LEFT half */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <AttendanceHistory 
                programId={userData.programId}
                userId={userData.userId || ""}
              />
            </div>
            {/* Right side is FREE SPACE */}
          </div>

        </main>
      </div>

    </div>
  );
}