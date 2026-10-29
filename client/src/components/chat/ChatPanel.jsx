import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { connectSocket, getSocket } from '../../lib/socket';
import { toast } from '../common/Toast.jsx';
import { useAuth } from '../../hooks/useAuth';
import { MessageCircle } from 'lucide-react';

export default function ChatPanel({ tripId, manageRoom = true, socket: sharedSocket = null, fullPage = false }) {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/trips/${tripId}/messages`, {
          params: { page: 1, limit: 100 },
        });
        setMessages(data.messages || []);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  useEffect(() => {
    if (!accessToken) return;
    const sock = manageRoom ? connectSocket(accessToken) : sharedSocket || getSocket();
    if (!sock) return;
    socketRef.current = sock;
    if (manageRoom) sock.emit('trip:join', { tripId });

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };
    sock.on('trip:message:new', handleMessage);

    return () => {
      sock.off('trip:message:new', handleMessage);
      if (manageRoom) sock.emit('trip:leave', { tripId });
    };
  }, [tripId, accessToken, manageRoom, sharedSocket]);

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const sock = socketRef.current || getSocket();
    if (!sock) {
      toast.error('Not connected');
      return;
    }
    const text = input.trim();
    sock.emit('trip:message:send', { tripId, text }, (resp) => {
      if (resp?.error) {
        toast.error(resp.error);
        return;
      }
      setInput((current) => current === text ? '' : current);
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 text-xs text-slate-500 ${fullPage ? 'h-[min(68vh,720px)]' : 'h-64'}`} role="status">Loading messages...</div>
    );
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm ${fullPage ? 'h-[min(68vh,720px)]' : 'h-[340px]'}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Group chat</h3>
          <p className="mt-1 text-[10px] text-slate-500">A conversation just for this trip</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Trip only</span>
      </div>
      <div className={`flex-1 overflow-y-auto bg-[#fbfcfb] p-4 ${fullPage ? 'space-y-3 sm:p-6' : 'space-y-2'}`} ref={scrollRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center py-10 text-center">
            <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><MessageCircle size={21} /></span><p className="mt-3 text-sm font-bold text-slate-700">Say hello to your crew</p><p className="mt-1 text-xs text-slate-400">Messages will appear here for trip members.</p></div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m._id || `${m.createdAt}-${m.senderId?._id || m.senderId}`}
            className={`rounded-2xl p-3 text-sm max-w-[85%] shadow-sm ${
              (m.senderId?._id || m.senderId) === user?._id ? 'bg-forest-100 text-forest-900 ml-auto rounded-tl-none' : 'bg-slate-100 text-slate-900 rounded-tr-none'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold">
                {(m.senderId?._id || m.senderId) === user?._id ? 'You' : m.senderId?.name || 'Rider'}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-3 sm:p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message to your crew…"
            aria-label="Message"
            maxLength={1000}
            className="input flex-1 !rounded-xl text-sm"
            disabled={!accessToken}
          />
          <button
            type="submit"
            disabled={!input.trim() || !accessToken}
            className="btn-primary !rounded-xl px-4 py-2 text-xs"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
