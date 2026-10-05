import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Hotel, Loader, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury Hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold">ወንዴ Grand Hotel and Spa</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('login_welcomeBack')}</h1>
          <p className="text-lg text-white/80 max-w-md">
            {t('login_desc')}
          </p>
          <div className="mt-12 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <div className="h-2 w-8 rounded-full bg-white/30" />
            <div className="h-2 w-2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-3 rounded-xl">
              <Hotel className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('login_signIn')}</h2>
            <p className="text-slate-600">Access your hotel management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('login_email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('login_password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm"
                placeholder="Enter your password"
              />
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><span>{t('login_signIn')}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-slate-900 font-semibold hover:underline">
                Create one
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              {t('login_demo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
