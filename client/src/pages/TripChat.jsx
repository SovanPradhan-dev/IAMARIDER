import { useParams } from 'react-router-dom';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import { MessageCircle, ShieldCheck } from 'lucide-react';

export default function TripChat() {
  const { tripId } = useParams();
  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-5 flex flex-col gap-4 rounded-[24px] bg-forest-950 p-6 text-white shadow-xl shadow-forest-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-200"><MessageCircle size={20} /></span>
          <div><h2 className="text-xl font-extrabold tracking-tight">The group conversation</h2><p className="mt-1 text-xs text-emerald-100/70">Share updates and keep every rider in the loop.</p></div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200"><ShieldCheck size={14} /> Only trip members can read this chat</span>
      </section>
      <ChatPanel tripId={tripId} fullPage />
    </div>
  );
}
