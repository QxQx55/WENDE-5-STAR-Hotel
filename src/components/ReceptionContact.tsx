import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, MessageSquare, CheckCircle, Clock, AlertCircle, Phone, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  message_type: 'request' | 'complaint' | 'inquiry';
  status: 'new' | 'responded' | 'resolved';
  response?: string;
  created_at: string;
  responded_at?: string;
}

export default function ReceptionContact() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reservation_id: '',
    subject: '',
    message: '',
    message_type: 'request' as const,
  });
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!user?.id) return;

      const [messagesRes, reservationsRes] = await Promise.all([
        supabase
          .from('contact_messages')
          .select('*')
          .eq('guest_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('reservations').select('id, guest_id').eq('guest_id', user.id),
      ]);

      if (messagesRes.error) throw messagesRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setMessages(messagesRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          guest_id: user?.id,
          reservation_id: formData.reservation_id || null,
          subject: formData.subject,
          message: formData.message,
          message_type: formData.message_type,
          status: 'new',
        },
      ]);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        reservation_id: '',
        subject: '',
        message: '',
        message_type: 'request',
      });
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'responded':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4" />;
      case 'responded':
        return <MessageSquare className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading messages...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Contact Reception</h2>
        <p className="text-slate-600 mt-1">Send requests, inquiries, or report issues to our reception team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <Phone className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Call Reception</h3>
          <p className="text-sm text-slate-600 mt-1">Ext. 0 or Dial 9</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <Mail className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Email</h3>
          <p className="text-sm text-slate-600 mt-1">reception@hotel.com</p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
          <MessageSquare className="w-6 h-6 text-slate-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Response Time</h3>
          <p className="text-sm text-slate-600 mt-1">Usually within 1 hour</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Your Messages</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Send className="w-5 h-5" />
          Send Message
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No messages yet. Send a message to our reception team!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`border-l-4 rounded-lg p-4 ${
                msg.message_type === 'request'
                  ? 'border-l-blue-500 bg-blue-50'
                  : msg.message_type === 'complaint'
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-amber-500 bg-amber-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-slate-900">{msg.subject}</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    msg.status
                  )}`}
                >
                  {getStatusIcon(msg.status)}
                  {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                </span>
              </div>

              <p className="text-slate-700 mb-3">{msg.message}</p>

              {msg.response && (
                <div className="mt-4 p-3 bg-white border border-slate-200 rounded">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Response from Reception:</p>
                  <p className="text-sm text-slate-700">{msg.response}</p>
                  {msg.responded_at && (
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(msg.responded_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Send Message to Reception</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Type *</label>
                <select
                  value={formData.message_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message_type: e.target.value as 'request' | 'complaint' | 'inquiry',
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="request">Service Request</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reservation (Optional)</label>
                <select
                  value={formData.reservation_id}
                  onChange={(e) => setFormData({ ...formData, reservation_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="">Select a reservation</option>
                  {reservations.map((res) => (
                    <option key={res.id} value={res.id}>
                      Reservation {res.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Room temperature too cold"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your request or issue in detail..."
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      reservation_id: '',
                      subject: '',
                      message: '',
                      message_type: 'request',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
