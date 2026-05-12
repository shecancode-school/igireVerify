import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { format } from "date-fns";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const claims = await requireAuthOrRedirect("participant");
  const db = await getDb();
  
  const notifications = await db
    .collection("notifications")
    .find({
      $or: [
        { recipientId: new ObjectId(claims.userId) },
        { recipientId: "participant" },
        { recipientId: "all" },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex w-full">
      <Sidebar />
      <div className="flex-1 sm:ml-20 md:ml-24 lg:ml-[120px]">
        <TopBar userName={claims.name} />
        <main className="p-6 md:p-10 max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Notifications</h1>
          <div className="space-y-6">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                <Bell className="w-16 h-16 mx-auto mb-6 text-slate-200" />
                <p className="text-slate-500 font-bold text-lg italic">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <div key={n._id.toString()} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  {!n.readBy?.some((id: any) => id.toString() === claims.userId) && (
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#F97316]"></div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{n.title}</h3>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {format(new Date(n.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-6 font-medium">{n.message}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-black text-[#14532D] uppercase tracking-[0.2em]">Official Broadcast</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">From Admin Team</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
