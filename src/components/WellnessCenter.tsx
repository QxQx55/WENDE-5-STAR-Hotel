import { useState } from 'react';
import { Dumbbell, Zap, Waves, Wind } from 'lucide-react';
import WellnessDashboard from './wellness/WellnessDashboard';
import ClassBooking from './wellness/ClassBooking';
import SpaBooking from './wellness/SpaBooking';
import TrainerAssignment from './wellness/TrainerAssignment';
import RecoveryZone from './wellness/RecoveryZone';

type WellnessTab = 'dashboard' | 'classes' | 'spa' | 'trainers' | 'recovery';

export default function WellnessCenter() {
  const [activeTab, setActiveTab] = useState<WellnessTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Zap },
    { id: 'classes', label: 'Classes', icon: Dumbbell },
    { id: 'spa', label: 'Spa & Wellness', icon: Waves },
    { id: 'trainers', label: 'Personal Training', icon: Dumbbell },
    { id: 'recovery', label: 'Recovery Zone', icon: Wind },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <WellnessDashboard />;
      case 'classes':
        return <ClassBooking />;
      case 'spa':
        return <SpaBooking />;
      case 'trainers':
        return <TrainerAssignment />;
      case 'recovery':
        return <RecoveryZone />;
      default:
        return <WellnessDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent)]" />

      <div className="relative">
        <div className="bg-gradient-to-b from-black via-slate-900 to-transparent border-b border-slate-700/30">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                <Waves className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Elite Wellness Center</h1>
                <p className="text-slate-400 mt-2">Premium fitness, spa, and recovery experience</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as WellnessTab)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
