import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Zap, TrendingUp, Award, Clock } from 'lucide-react';

export default function WellnessDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingClasses: 0,
    spaSessions: 0,
    sessionsCompleted: 0,
    totalMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchWellnessStats();
      fetchRecentSessions();
    }
  }, [user]);

  const fetchWellnessStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [classRes, spaRes, sessionsRes] = await Promise.all([
        supabase
          .from('class_bookings')
          .select('id')
          .eq('user_id', user?.id)
          .eq('status', 'Confirmed')
          .gte('booking_date', today),
        supabase
          .from('spa_bookings')
          .select('id')
          .eq('user_id', user?.id)
          .eq('status', 'Confirmed')
          .gte('booking_date', today),
        supabase
          .from('wellness_sessions')
          .select('duration_minutes')
          .eq('user_id', user?.id),
      ]);

      const totalMinutes = (sessionsRes.data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      setStats({
        upcomingClasses: classRes.count || 0,
        spaSessions: spaRes.count || 0,
        sessionsCompleted: sessionsRes.count || 0,
        totalMinutes,
      });
    } catch (error) {
      console.error('Error fetching wellness stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const { data } = await supabase
        .from('wellness_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('session_date', { ascending: false })
        .limit(5);

      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading wellness dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-amber-400/50 transition-all hover:shadow-lg hover:shadow-amber-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.upcomingClasses}</h3>
          <p className="text-slate-400 text-sm mt-2">Upcoming Classes</p>
        </div>

        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:from-green-500/30 group-hover:to-green-600/30 transition">
              <Waves className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.spaSessions}</h3>
          <p className="text-slate-400 text-sm mt-2">Booked Spa Sessions</p>
        </div>

        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.sessionsCompleted}</h3>
          <p className="text-slate-400 text-sm mt-2">Sessions Completed</p>
        </div>

        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 hover:border-orange-400/50 transition-all hover:shadow-lg hover:shadow-orange-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.totalMinutes}</h3>
          <p className="text-slate-400 text-sm mt-2">Total Minutes</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
        </div>

        <div className="space-y-3">
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition">
                <div>
                  <h4 className="text-white font-medium">{session.activity_name}</h4>
                  <p className="text-sm text-slate-400">
                    {session.session_date} • {session.duration_minutes} mins • {session.intensity}
                  </p>
                </div>
                {session.calories_burned && (
                  <div className="text-right">
                    <p className="text-orange-400 font-semibold">{session.calories_burned} cal</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">No activity yet. Book a class or session to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Waves(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c-1 0-2 1-2.5 2.5M5 5c-1 0-2 1-2.5 2.5M19 5c1 0 2 1 2.5 2.5M12 14v-4M4 20h16c1 0 2-1 2-2v-2c0-1-1-2-2-2H2c-1 0-2 1-2 2v2c0 1 1 2 2 2z" />
    </svg>
  );
}
