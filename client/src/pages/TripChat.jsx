import { useParams } from 'react-router-dom';
import ChatPanel from '../components/chat/ChatPanel.jsx';

export default function TripChat() {
  const { tripId } = useParams();
  return <ChatPanel tripId={tripId} />;
}
