import { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import { Bed, Users, DollarSign, Loader } from 'lucide-react';
import type { Room } from '../types';

export function RoomsPage() {
  const { rooms, loading, error } = useRooms();
  const [selectedType, setSelectedType] = useState<string>('');

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

  const filteredRooms = selectedType
    ? rooms.filter(r => r.room_type === selectedType)
    : rooms;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Our Rooms</h1>
        <p className="text-slate-600">Choose the perfect room for your stay</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Filter by Type</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedType === ''
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Rooms
          </button>
          {roomTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error loading rooms: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No rooms found
          </div>
        ) : (
          filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))
        )}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg transition overflow-hidden">
      {/* Room Image Placeholder */}
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 h-48 flex items-center justify-center">
        <Bed className="w-12 h-12 text-slate-400" />
      </div>

      {/* Room Details */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-slate-900">Room {room.room_number}</h3>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
            {room.room_type}
          </span>
        </div>

        {room.description && (
          <p className="text-sm text-slate-600 mb-4">{room.description}</p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            Up to {room.max_occupancy} guests
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="w-4 h-4" />
            ${room.price_per_night}/night
          </div>
        </div>

        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Amenities:</p>
            <div className="flex flex-wrap gap-1">
              {room.amenities.map(amenity => (
                <span key={amenity} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          className={`w-full py-2 rounded-lg font-medium transition ${
            room.status === 'Available'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          disabled={room.status !== 'Available'}
        >
          {room.status === 'Available' ? 'Book Now' : 'Not Available'}
        </button>
      </div>
    </div>
  );
}
