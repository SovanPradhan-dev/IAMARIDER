import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { connectSocket, getSocket, disconnectSocket } from '../../lib/socket';
import { toast } from '../common/Toast.jsx';
import { useAuth } from '../../hooks/useAuth';

export default function ChatPanel({ tripId }) {
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
        setMessages((data.messages || []).reverse());
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  useEffect(() => {
    if (!accessToken) return;
    const sock = connectSocket(accessToken);
    socketRef.current = sock;
    sock.emit('trip:join', { tripId });

    sock.on('trip:message:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      sock.off('trip:message:new');
    };
  }, [tripId, accessToken]);

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const sock = getSocket();
    if (!sock) {
      toast.error('Not connected');
      return;
    }
    sock.emit('trip:message:send', { tripId, text: input }, (resp) => {
      if (resp?.error) toast.error(resp.error);
    });
    setInput('');
  };

  if (loading) {
    return (
      <div className="card p-4 flex items-center justify-center h-64 text-slate-500 text-xs">Loading messages...</div>
    );
  }

  return (
    <div className="card flex flex-col h-[300px]">
      <div className="p-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm">Group chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
        {messages.map((m) => (
          <div
            key={m._id}
            className={`p-2 rounded-lg text-sm max-w-[80%] ${
              m.senderId === user?._id ? 'bg-forest-100 text-forest-900 ml-auto rounded-tl-none' : 'bg-slate-100 text-slate-900 rounded-tr-none'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold">
                {m.senderId === user?._id ? 'You' : m.senderId?.name || 'Rider'}
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
      <form onSubmit={sendMessage} className="p-3 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="input flex-1 text-xs"
            disabled={!accessToken}
          />
          <button
            type="submit"
            disabled={!input.trim() || !accessToken}
            className="btn-primary px-3 py-2 text-xs"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
