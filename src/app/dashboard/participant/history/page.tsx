import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { format } from "date-fns";

export default async function HistoryPage() {
  const claims = await requireAuthOrRedirect("participant");
  const db = await getDb();
  const attendance = await db
    .collection("attendance")
    .find({ userId: new ObjectId(claims.userId) })
    .sort({ date: -1 })
    .toArray();

  const userData = {
    userName: claims.name,
    programName: "Participant", // Will be updated by TopBar fetch
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex w-full">
      <Sidebar />
      <div className="flex-1 sm:ml-20 md:ml-24 lg:ml-32">
        <TopBar userName={userData.userName} />
        <main className="p-6 md:p-10">
          <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Attendance History</h1>
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#7FAF8C] text-white">
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-xs">Date</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-xs">Check-in</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-xs">Check-out</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      No attendance records found yet.
                    </td>
                  </tr>
                ) : (
                  attendance.map((record: any) => (
                    <tr key={record._id.toString()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-700">
                        {format(new Date(record.date), "EEEE, MMM d, yyyy")}
                      </td>
                      <td className="px-8 py-6 text-slate-600">
                        {record.checkInTime ? format(new Date(record.checkInTime), "hh:mm a") : "—"}
                      </td>
                      <td className="px-8 py-6 text-slate-600">
                        {record.checkOutTime ? format(new Date(record.checkOutTime), "hh:mm a") : "—"}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          record.checkInStatus === "on-time" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : record.checkInStatus === "late" 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-red-100 text-red-700"
                        }`}>
                          {record.checkInStatus || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
