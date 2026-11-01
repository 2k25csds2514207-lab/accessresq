import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { AccessibleRoutesView } from './components/navigation/AccessibleRoutesView';
import { RoadsideRescueView } from './components/rescue/RoadsideRescueView';
import { CommunityView } from './components/community/CommunityView';
import { SOSModal } from './components/sos/SOSModal';
import { DemoGuideModal } from './components/demo/DemoGuideModal';
import { SettingsModal } from './components/common/SettingsModal';
import { ReportBarrierModal } from './components/community/ReportBarrierModal';
import { AuthModal } from './components/auth/AuthModal';
import { StorageService } from './services/storageService';
import { getSupabaseClient } from './services/supabaseClient';
import { BarrierReport } from './types/community';
import { RoutePreferences, Coordinate } from './types/navigation';
import { User } from '@supabase/supabase-js';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [preferences, setPreferences] = useState<RoutePreferences>(StorageService.getPreferences());
  const [barriers, setBarriers] = useState<BarrierReport[]>(StorageService.getBarriers());
  const [highContrast, setHighContrast] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportBarrierOpen, setIsReportBarrierOpen] = useState(false);
  const [reportBarrierPreset, setReportBarrierPreset] = useState<{
    name: string;
    coordinate: Coordinate;
    affectedSegmentId?: string;
  } | undefined>(undefined);

  // Trigger counters for Demo A and Demo B
  const [demoTriggerA, setDemoTriggerA] = useState(0);
  const [demoTriggerB, setDemoTriggerB] = useState(0);

  // Synchronize initial barrier data and auth session from Supabase if configured
  useEffect(() => {
    StorageService.fetchBarriersFromCloud().then(res => {
      if (res.data && res.data.length > 0) {
        setBarriers(res.data);
      }
    });

    const client = getSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user);
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    setCurrentUser(null);
  };

  const handleUpdatePreferences = (newPrefs: RoutePreferences) => {
    setPreferences(newPrefs);
    StorageService.savePreferences(newPrefs);
  };

  const handleBarriersChange = (newBarriers: BarrierReport[]) => {
    setBarriers(newBarriers);
    StorageService.saveBarriers(newBarriers);
  };

  const handleOpenReportBarrierWithPreset = (preset?: {
    name: string;
    coordinate: Coordinate;
    affectedSegmentId?: string;
  }) => {
    setReportBarrierPreset(preset);
    setIsReportBarrierOpen(true);
  };

  const handleTriggerDemoA = () => {
    setActiveTab('navigation');
    setDemoTriggerA(prev => prev + 1);
  };

  const handleTriggerDemoB = () => {
    setActiveTab('rescue');
    setDemoTriggerB(prev => prev + 1);
  };

  const handleDataReset = () => {
    setBarriers(StorageService.getBarriers());
    setPreferences(StorageService.getPreferences());
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      highContrast 
        ? 'contrast-125 bg-white text-black' 
        : 'bg-slate-50/60 text-slate-900'
    }`}>
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenDemoScenarios={() => setIsDemoGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            barriers={barriers}
            onOpenReportBarrier={() => handleOpenReportBarrierWithPreset()}
            onOpenSOS={() => setIsSOSOpen(true)}
            onTriggerDemoA={handleTriggerDemoA}
            onTriggerDemoB={handleTriggerDemoB}
          />
        )}

        {activeTab === 'navigation' && (
          <AccessibleRoutesView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            barriers={barriers}
            onOpenReportBarrier={handleOpenReportBarrierWithPreset}
            demoTrigger={Boolean(demoTriggerA)}
          />
        )}

        {activeTab === 'rescue' && (
          <RoadsideRescueView
            demoTrigger={Boolean(demoTriggerB)}
          />
        )}

        {activeTab === 'community' && (
          <CommunityView
            barriers={barriers}
            onBarriersChange={handleBarriersChange}
            onOpenReportBarrier={() => handleOpenReportBarrierWithPreset()}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenDemoScenarios={() => setIsDemoGuideOpen(true)}
      />

      {/* Modals & Dialogs */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />

      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        setActiveTab={setActiveTab}
        onTriggerDemoA={handleTriggerDemoA}
        onTriggerDemoB={handleTriggerDemoB}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={handleDataReset}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onContinueAsGuest={() => {
          setIsAuthOpen(false);
        }}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        onSignOut={handleSignOut}
      />

      <ReportBarrierModal
        isOpen={isReportBarrierOpen}
        onClose={() => setIsReportBarrierOpen(false)}
        presetLocation={reportBarrierPreset}
        onBarrierCreated={(newBarrier) => {
          setBarriers(prev => {
            const exists = prev.some(b => b.id === newBarrier.id);
            if (exists) {
              return prev.map(b => b.id === newBarrier.id ? newBarrier : b);
            }
            return [newBarrier, ...prev];
          });
        }}
      />

    </div>
  );
}

