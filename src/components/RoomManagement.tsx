import { useState, useEffect } from 'react';
import { supabase, Room } from '../lib/supabase';
import { Plus, Search, Edit, Bed, DollarSign, Users } from 'lucide-react';

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential'] as const;
const ROOM_STATUSES = ['Available', 'Occupied', 'Cleaning', 'Maintenance'] as const;

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Standard' as typeof ROOM_TYPES[number],
    floor: 1,
    price_per_night: 0,
    max_occupancy: 2,
    status: 'Available' as typeof ROOM_STATUSES[number],
    amenities: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amenitiesArray = formData.amenities
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a);

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update({
            ...formData,
            amenities: amenitiesArray,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRoom.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('rooms').insert([
          {
            ...formData,
            amenities: amenitiesArray,
          },
        ]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingRoom(null);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'Standard',
      floor: 1,
      price_per_night: 0,
      max_occupancy: 2,
      status: 'Available',
      amenities: '',
    });
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      floor: room.floor,
      price_per_night: room.price_per_night,
      max_occupancy: room.max_occupancy,
      status: room.status,
      amenities: room.amenities?.join(', ') || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    resetForm();
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Occupied':
        return 'bg-red-100 text-red-800';
      case 'Cleaning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading rooms...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Room Management</h2>
          <p className="text-slate-600 mt-1">Manage hotel rooms and their status</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by room number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
        >
          <option value="all">All Status</option>
          {ROOM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full">
                  <Bed className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Room {room.room_number}</h3>
                  <p className="text-sm text-slate-600">{room.room_type}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(room)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </span>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${room.price_per_night}/night</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>Max {room.max_occupancy}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {room.amenities?.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
                  {room.amenities && room.amenities.length > 3 && (
                    <span className="text-xs text-slate-500">+{room.amenities.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {searchTerm || filterStatus !== 'all'
            ? 'No rooms found matching your filters.'
            : 'No rooms yet. Add your first room!'}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room Type *</label>
                  <select
                    required
                    value={formData.room_type}
                    onChange={(e) =>
                      setFormData({ ...formData, room_type: e.target.value as typeof ROOM_TYPES[number] })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Floor *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price per Night ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max Occupancy *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as typeof ROOM_STATUSES[number] })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    {ROOM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amenities (comma-separated)
                </label>
                <textarea
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, TV, Air Conditioning, Mini Bar"
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
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
