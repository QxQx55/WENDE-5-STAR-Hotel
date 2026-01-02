import { useState, useEffect } from 'react';
import { supabase, Guest } from '../lib/supabase';
import { Plus, Search, Edit, UserCheck, Phone, Mail, MapPin } from 'lucide-react';

export default function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: '',
    nationality: '',
    address: '',
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGuest) {
        const { error } = await supabase
          .from('guests')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingGuest.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('guests').insert([formData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingGuest(null);
      resetForm();
      fetchGuests();
    } catch (error) {
      console.error('Error saving guest:', error);
      alert('Error saving guest. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      id_number: '',
      nationality: '',
      address: '',
    });
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email || '',
      phone: guest.phone,
      id_number: guest.id_number,
      nationality: guest.nationality || '',
      address: guest.address || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGuest(null);
    resetForm();
  };

  const filteredGuests = guests.filter(
    (guest) =>
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm) ||
      guest.id_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading guests...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Guest Management</h2>
          <p className="text-slate-600 mt-1">Manage hotel guests and their information</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          Add Guest
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => (
          <div key={guest.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full">
                  <UserCheck className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {guest.first_name} {guest.last_name}
                  </h3>
                  <p className="text-sm text-slate-600">ID: {guest.id_number}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(guest)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {guest.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span>{guest.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{guest.phone}</span>
              </div>
              {guest.nationality && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{guest.nationality}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {searchTerm ? 'No guests found matching your search.' : 'No guests yet. Add your first guest!'}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
