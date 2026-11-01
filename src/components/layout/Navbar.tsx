import React, { useState } from 'react';
import { 
  Navigation, 
  Wrench, 
  Users, 
  LayoutDashboard, 
  AlertTriangle, 
  ShieldAlert, 
  Menu, 
  X, 
  Sparkles,
  Settings,
  Sun,
  Moon,
  User as UserIcon
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { RoutePreferences } from '../../types/navigation';

export type ActiveTab = 'dashboard' | 'navigation' | 'rescue' | 'community';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  preferences: RoutePreferences;
  onUpdatePreferences: (prefs: RoutePreferences) => void;
  onOpenSOS: () => void;
  onOpenDemoScenarios: () => void;
  onOpenSettings: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  preferences,
  onUpdatePreferences,
  onOpenSOS,
  onOpenDemoScenarios,
  onOpenSettings,
  highContrast,
  onToggleHighContrast,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleWheelchairMode = () => {
    onUpdatePreferences({
      ...preferences,
      wheelchairMode: !preferences.wheelchairMode,
      stepFreeAccess: !preferences.wheelchairMode ? true : preferences.stepFreeAccess,
      avoidStairs: !preferences.wheelchairMode ? true : preferences.avoidStairs
    });
  };

  const navLinks: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'navigation', label: 'Accessible Routes', icon: Navigation },
    { id: 'rescue', label: 'Roadside Rescue', icon: Wrench },
    { id: 'community', label: 'Community', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-emerald-400 p-0.5 shadow-md shadow-brand-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-brand-700 rounded-[14px] flex items-center justify-center text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="4.5" r="2.5"/>
                  <path d="m10 9 4 2.5-2.5 4.5"/>
                  <path d="M6 14.5a5.5 5.5 0 1 0 11 0"/>
                  <path d="M12 9.5v5"/>
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Access<span className="text-brand-600">ResQ</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Catalyst '26
                </span>
              </div>
              <p className="text-[10.5px] font-semibold tracking-widest text-slate-500 uppercase">
                Navigate • Assist • Include
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-white text-brand-700 shadow-sm shadow-slate-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Hub */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Catalyst Demo Walkthrough Launcher */}
            <button
              onClick={onOpenDemoScenarios}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition shadow-sm"
              title="Launch Live Catalyst Hack 2026 Walkthroughs"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Demo Scenarios
            </button>

            {/* Wheelchair Mode Switch */}
            <button
              onClick={toggleWheelchairMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                preferences.wheelchairMode
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Wheelchair Transit Mode (Forces 100% Step-Free & Incline Limits)"
            >
              <span className={`w-2 h-2 rounded-full ${preferences.wheelchairMode ? 'bg-emerald-200 animate-pulse' : 'bg-slate-300'}`}></span>
              Wheelchair Mode: {preferences.wheelchairMode ? 'ON' : 'OFF'}
            </button>

            {/* High Contrast / Settings */}
            <button
              onClick={onToggleHighContrast}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="Toggle High Contrast Accessible Palette"
            >
              {highContrast ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="AI & Database Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth / Identity State Button */}
            {onOpenAuth && (
              currentUser ? (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                  title={`Signed in as ${currentUser.user_metadata?.full_name || currentUser.email}. Click to view profile or sign out.`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="max-w-[110px] truncate">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition border border-slate-200"
                  title="Sign In or Continue as Guest"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Guest</span>
                  <span className="text-[10px] text-brand-700 font-extrabold bg-brand-50 px-1 py-0.5 rounded border border-brand-200">
                    Sign In
                  </span>
                </button>
              )
            )}

            {/* Emergency SOS Shortcut */}
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShieldAlert className="w-4 h-4" />
              SOS
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSOS}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-sm flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              SOS
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${
                  activeTab === id ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                toggleWheelchairMode();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-sm font-medium"
            >
              <span>Wheelchair Priority Mode</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${preferences.wheelchairMode ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                {preferences.wheelchairMode ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => {
                onOpenDemoScenarios();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 text-brand-700 text-sm font-bold border border-brand-200"
            >
              <Sparkles className="w-4 h-4" />
              Catalyst Hack Demo Walkthrough
            </button>

            {onOpenAuth && (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>
                    {currentUser 
                      ? (currentUser.user_metadata?.full_name || currentUser.email) 
                      : 'Guest Mode'}
                  </span>
                </div>
                <span className="text-xs font-bold text-brand-600">
                  {currentUser ? 'Manage Session' : 'Sign In'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

