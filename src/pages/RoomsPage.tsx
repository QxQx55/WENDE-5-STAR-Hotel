import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Bed, Users, DollarSign, Loader, Wifi, Coffee, Tv, Bath, Wind, Star, Check, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type RoomTypeWithImage = {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  image_url?: string;
};

type PmsRoom = {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: string;
  room_type: RoomTypeWithImage;
};

const ROOM_IMAGES: Record<string, string> = {
  'Standard': 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Deluxe': 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Suite': 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Executive': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Presidential': 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  'WiFi': Wifi, 'Coffee': Coffee, 'TV': Tv, 'Bathtub': Bath, 'Air Conditioning': Wind, 'Mini Bar': Coffee, 'Balcony': Sparkles,
};

export function RoomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const [roomsRes, typesRes] = await Promise.all([
          supabase.from('pms_rooms').select('*, room_type:pms_room_types(*)').eq('status', 'AVAILABLE').order('room_number'),
          supabase.from('pms_room_types').select('*').eq('is_active', true).order('sort_order'),
        ]);
        if (roomsRes.data) setRooms(roomsRes.data as PmsRoom[]);
        if (typesRes.data) setRoomTypes(typesRes.data as RoomTypeWithImage[]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const getTypeName = (typeId: string) => roomTypes.find(t => t.id === typeId)?.name || 'Standard';

  const filteredRooms = rooms.filter(room => {
    const typeName = getTypeName(room.room_type_id);
    if (selectedType && typeName !== selectedType) return false;
    const price = room.room_type?.base_price || 0;
    if (priceRange === 'budget' && price > 200) return false;
    if (priceRange === 'mid' && (price < 200 || price > 400)) return false;
    if (priceRange === 'luxury' && price < 400) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury Room"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Our Rooms</h1>
          <p className="text-xl text-slate-300 max-w-xl">Discover the perfect room for your stay. Each space is designed with your comfort in mind.</p>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="sticky top-16 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Room Type</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Types</option>
                {[...new Set(rooms.map(r => getTypeName(r.room_type_id)))].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Price Range</label>
              <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Any Price</option>
                <option value="budget">Budget ($0 - $200)</option>
                <option value="mid">Mid-Range ($200 - $400)</option>
                <option value="luxury">Luxury ($400+)</option>
              </select>
            </div>
            <div className="text-sm text-slate-500 self-end pb-2">
              {filteredRooms.length} rooms available
            </div>
          </div>
        </div>
      </section>

      {/* Room Types Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Room Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roomTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.name)}
              className={`relative rounded-xl overflow-hidden h-40 group ${selectedType === type.name ? 'ring-2 ring-amber-500' : ''}`}
            >
              <SafeImage src={ROOM_IMAGES[type.name] || ROOM_IMAGES['Standard']} alt={type.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold">{type.name}</h3>
                <p className="text-amber-300 text-sm">From ${type.base_price}/night</p>
              </div>
              {selectedType === type.name && <div className="absolute top-3 right-3 bg-amber-500 rounded-full p-1"><Check className="w-4 h-4 text-white" /></div>}
            </button>
          ))}
        </div>
      </section>

      {/* Rooms Grid - Alternating Layout */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20 space-y-6">
        {filteredRooms.map((room, index) => (
          <RoomRow key={room.id} room={room} index={index} onBook={() => navigate(`/rooms/${room.id}`)} />
        ))}
        {filteredRooms.length === 0 && (
          <div className="text-center py-16">
            <Bed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No rooms match your criteria</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </div>
        )}
      </section>
    </div>
  );
}

function RoomRow({ room, index, onBook }: { room: PmsRoom; index: number; onBook: () => void }) {
  const [isLiked, setIsLiked] = useState(false);
  const typeName = room.room_type?.name || 'Standard';
  const image = room.room_type?.image_url || ROOM_IMAGES[typeName] || ROOM_IMAGES['Standard'];
  const isReversed = index % 2 === 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isReversed ? 'md:[direction:rtl]' : ''}`}>
        {/* Image */}
        <div className="relative h-64 md:h-80 overflow-hidden [direction:ltr]">
          <SafeImage src={image} alt={`Room ${room.room_number}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
          <button onClick={() => setIsLiked(!isLiked)} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition">
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Available</span>
            <span className="bg-white/90 text-slate-900 text-xs font-semibold px-3 py-1 rounded-full">Floor {room.floor}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col justify-center [direction:ltr]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Room {room.room_number}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{typeName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">ETB {room.room_type?.base_price?.toLocaleString() || 0}</p>
              <p className="text-xs text-slate-500">per night</p>
            </div>
          </div>

          {room.room_type?.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{room.room_type.description}</p>
          )}

          <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
            <div className="flex items-center gap-1"><Users className="w-4 h-4 text-amber-500" /> {room.room_type?.max_occupancy || 2} guests</div>
            <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9</div>
            <div className="flex items-center gap-1"><Bed className="w-4 h-4 text-amber-500" /> King Bed</div>
          </div>

          {room.room_type?.amenities && room.room_type.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {room.room_type.amenities.slice(0, 4).map(a => {
                const Icon = AMENITY_ICONS[a] || Check;
                return <span key={a} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"><Icon className="w-3 h-3" />{a}</span>;
              })}
              {room.room_type.amenities.length > 4 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">+{room.room_type.amenities.length - 4} more</span>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onBook}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition flex items-center justify-center gap-2"
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
