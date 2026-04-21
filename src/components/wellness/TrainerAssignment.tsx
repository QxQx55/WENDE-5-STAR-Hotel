import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Star, Zap } from 'lucide-react';

interface Trainer {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  rating: number;
  hourly_rate: number;
  certifications: string[];
  image_url: string;
}

export default function TrainerAssignment() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [myTrainer, setMyTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wellnessProfile, setWellnessProfile] = useState<any>(null);

  useEffect(() => {
    fetchTrainers();
    if (user) {
      fetchMyTrainer();
      fetchWellnessProfile();
    }
  }, [user]);

  const fetchTrainers = async () => {
    try {
      const { data } = await supabase
        .from('wellness_trainers')
        .select('*')
        .order('rating', { ascending: false });

      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTrainer = async () => {
    try {
      const { data } = await supabase
        .from('trainer_assignments')
        .select('*, wellness_trainers(*)')
        .eq('user_id', user?.id)
        .order('assignment_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setMyTrainer(data);
    } catch (error) {
      console.error('Error fetching trainer assignment:', error);
    }
  };

  const fetchWellnessProfile = async () => {
    try {
      const { data } = await supabase
        .from('guest_wellness_profile')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      setWellnessProfile(data);
    } catch (error) {
      console.error('Error fetching wellness profile:', error);
    }
  };

  const assignTrainer = async (trainerId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('trainer_assignments')
        .insert([
          {
            user_id: user?.id,
            trainer_id: trainerId,
            assignment_date: today,
            sessions_remaining: 3,
            program_focus: 'General wellness',
          },
        ]);

      if (error) throw error;

      alert('Trainer assigned! Your sessions will begin shortly.');
      fetchMyTrainer();
    } catch (error) {
      console.error('Error assigning trainer:', error);
      alert('Failed to assign trainer. Please try again.');
    }
  };

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      if (wellnessProfile) {
        const { error } = await supabase
          .from('guest_wellness_profile')
          .update({
            fitness_level: formData.get('fitness_level'),
            goals: (formData.get('goals') as string).split(',').map((g) => g.trim()),
          })
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guest_wellness_profile')
          .insert([
            {
              user_id: user?.id,
              fitness_level: formData.get('fitness_level'),
              goals: (formData.get('goals') as string).split(',').map((g) => g.trim()),
              language: 'English',
            },
          ]);

        if (error) throw error;
      }

      alert('Profile updated!');
      fetchWellnessProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading trainers...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Elite Personal Trainers</h2>

            <div className="grid gap-6">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-lg p-6 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-400/10"
                >
                  <div className="flex items-start gap-6">
                    {trainer.image_url && (
                      <img
                        src={trainer.image_url}
                        alt={trainer.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white">{trainer.name}</h3>
                          <p className="text-blue-400 text-sm">{trainer.specialization}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(trainer.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                            />
                          ))}
                          <span className="text-sm text-slate-400 ml-1">{trainer.rating}</span>
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm mb-4">{trainer.bio}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {trainer.certifications?.slice(0, 2).map((cert, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-400 font-semibold">${trainer.hourly_rate}/hour</span>
                          <button
                            onClick={() => assignTrainer(trainer.id)}
                            className="px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {myTrainer && (
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Trainer
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-blue-200 font-semibold">{myTrainer.wellness_trainers?.name}</p>
                  <p className="text-sm text-blue-300">{myTrainer.wellness_trainers?.specialization}</p>
                </div>

                <div className="border-t border-blue-700 pt-4">
                  <p className="text-sm text-blue-300 mb-2">Sessions Remaining</p>
                  <p className="text-3xl font-bold text-white">{myTrainer.sessions_remaining}</p>
                </div>

                <div className="border-t border-blue-700 pt-4">
                  <p className="text-sm text-blue-300 mb-2">Program Focus</p>
                  <p className="text-white font-medium">{myTrainer.program_focus}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Wellness Profile
            </h3>

            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fitness Level</label>
                <select
                  name="fitness_level"
                  defaultValue={wellnessProfile?.fitness_level || 'Beginner'}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Goals (comma-separated)</label>
                <input
                  type="text"
                  name="goals"
                  defaultValue={wellnessProfile?.goals?.join(', ') || ''}
                  placeholder="e.g. Strength, Flexibility, Endurance"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold py-2 rounded-lg hover:from-amber-500 hover:to-orange-600 transition"
              >
                Update Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
