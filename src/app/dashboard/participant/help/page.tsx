import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { requireAuthOrRedirect } from "@/lib/auth";
import { HelpCircle, MessageSquare, Phone, Mail } from "lucide-react";

export default async function HelpPage() {
  const claims = await requireAuthOrRedirect("participant");

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex w-full">
      <Sidebar />
      <div className="flex-1 sm:ml-20 md:ml-24 lg:ml-[120px]">
        <TopBar userName={claims.name} />
        <main className="p-6 md:p-10 max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">How can we help?</h1>
          <p className="text-slate-500 font-medium text-lg mb-12">Get instant answers to common questions or reach out to our support team.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-emerald-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Live Chat</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Reach out to   support team in real-time when  there is emergency case .</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-orange-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Call Center</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Reach us at +250788 473 533 for urgent attendance issues.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Email Support</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Send us an email at info@igirerwanda.org for documentation </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] p-12 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {[
                  { q: "Why is my facial recognition failing?", a: "Ensure you are in a well-lit area and looking directly at the camera. If you wear glasses, try removing them if you didn't have them during enrollment." },
                  { q: "I missed a check-in, what do I do?", a: "Communicate immediately with your facilitator. They can manually adjust your attendance if you have a valid reason." },
                  { q: "Can I check in from home?", a: "No, check-ins are restricted to the official Igire Rwanda Organisation premises via GPS geofencing." },
                ].map((item, i) => (
                  <details key={i} className="group border-b border-white/10 pb-6 last:border-0">
                    <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center">
                      {item.q}
                      <span className="group-open:rotate-180 transition-transform duration-300">↓</span>
                    </summary>
                    <p className="mt-4 text-slate-400 font-medium leading-relaxed max-w-2xl">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <HelpCircle className="w-64 h-64" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
