import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Hotel, Loader, ArrowRight, Check, Sparkles, Users, Bed, DollarSign, Settings } from 'lucide-react';

type RoleKey = 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance' | 'customer';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RoleKey>('customer');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const roleInfo: Record<RoleKey, { icon: typeof Users; label: string; desc: string }> = {
    admin: { icon: Settings, label: 'Administrator', desc: 'Full system access, manage everything' },
    manager: { icon: Users, label: 'Manager', desc: 'Manage operations, view all reports' },
    front_desk: { icon: Bed, label: 'Front Desk', desc: 'Check-in/out, reservations, guests' },
    housekeeping: { icon: Sparkles, label: 'Housekeeping', desc: 'Room status, cleaning tasks' },
    finance: { icon: DollarSign, label: 'Finance', desc: 'Billing, payments, reports' },
    customer: { icon: Users, label: 'Guest', desc: 'Book rooms, view reservations' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const success = await signUp(email, password, fullName, role);
      if (success) {
        navigate('/');
      } else {
        setNotice('Account created. Check your email to confirm your account, then sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury Hotel Room"
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
          <h1 className="text-4xl font-bold mb-4">{t('signup_joinTeam')}</h1>
          <p className="text-lg text-white/80 max-w-md mb-8">{t('signup_desc')}</p>
          <div className="space-y-4">
            {['Manage reservations and guests', 'Track housekeeping in real-time', 'Process payments securely', 'Access audit logs and reports'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-3 rounded-xl">
              <Hotel className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('signup_createAccount')}</h2>
            <p className="text-slate-600">{t('signup_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('signup_fullName')}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('signup_emailLabel')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm" placeholder="your@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('signup_passwordLabel')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('signup_confirm')}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm" placeholder="Confirm password" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('signup_accountType')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(roleInfo) as RoleKey[]).map((r) => {
                  const info = roleInfo[r];
                  const isSelected = role === r;
                  const Icon = info.icon;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{info.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">{roleInfo[role].desc}</p>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
            {notice && <div className="bg-green-50 text-green-800 p-3 rounded-xl text-sm">{notice}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><span>{t('signup_createAccount')}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-slate-900 font-semibold hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
