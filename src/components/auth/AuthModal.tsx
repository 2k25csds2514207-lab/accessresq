import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Info,
  Sliders,
  ArrowLeft,
  Check
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabaseClient';
import { StorageService } from '../../services/storageService';
import { MobilityType, MobilityProfile, MOBILITY_TYPE_LABELS } from '../../types/profile';
import { RoutePreferences } from '../../types/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  currentUser: User | null;
  onAuthSuccess: (user: User) => void;
  onSignOut: () => void;
  initialMode?: 'auth' | 'edit_profile';
  onProfileUpdated?: (profile: MobilityProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  currentUser,
  onAuthSuccess,
  onSignOut,
  initialMode = 'auth',
  onProfileUpdated
}) => {
  // Navigation & Step state: Step 1 (Account), Step 2 (Mobility), Step 3 (Emergency & Medical)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialMode === 'edit_profile' ? 2 : 1);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isEditMode, setIsEditMode] = useState(initialMode === 'edit_profile');

  // Step 1: Account Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Mobility Details (All optional, never pre-filled with fictional data)
  const [mobilityType, setMobilityType] = useState<MobilityType | ''>('');
  const [mobilityDevice, setMobilityDevice] = useState('');
  const [prefAvoidStairs, setPrefAvoidStairs] = useState(true);
  const [prefStepFree, setPrefStepFree] = useState(true);
  const [prefPreferRamps, setPrefPreferRamps] = useState(true);
  const [prefSmoothSurfaces, setPrefSmoothSurfaces] = useState(true);
  const [prefLowerVibration, setPrefLowerVibration] = useState(true);

  // Step 3: Emergency & Medical Information (All optional, never pre-filled with fictional data)
  const [bloodGroup, setBloodGroup] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing profile when modal opens or user changes
  useEffect(() => {
    if (!isOpen) return;

    setIsEditMode(initialMode === 'edit_profile');
    setCurrentStep(initialMode === 'edit_profile' ? 2 : 1);
    setErrorMessage(null);
    setSuccessMessage(null);

    let cancelled = false;

    const loadProfile = async () => {
      // Clear previous account values first, so one user's details cannot
      // remain visible while another account's profile is loading.
      setFullName('');
      setEmail(currentUser?.email || '');
      setMobilityType('');
      setMobilityDevice('');
      setBloodGroup('');
      setMedicalNotes('');
      setEmergencyContactName('');
      setEmergencyContactRelationship('');
      setEmergencyContactPhone('');

      if (currentUser?.id) {
        const p = await StorageService.fetchProfileAsync(currentUser.id);
        if (cancelled) return;

        setFullName(p?.fullName || currentUser.user_metadata?.full_name || '');
        setEmail(p?.email || currentUser.email || '');
        setMobilityType(p?.mobilityType || '');
        setMobilityDevice(p?.mobilityDevice || '');
        setBloodGroup(p?.bloodGroup || '');
        setMedicalNotes(p?.medicalNotes || '');
        setEmergencyContactName(p?.emergencyContactName || '');
        setEmergencyContactRelationship(p?.emergencyContactRelationship || '');
        setEmergencyContactPhone(p?.emergencyContactPhone || '');
      } else {
        const sos = StorageService.getSOSProfile();
        if (cancelled) return;
        setFullName(sos.name || '');
        setMobilityType((sos.mobilityType as MobilityType) || '');
        setMobilityDevice(sos.wheelchairModel || '');
        setBloodGroup(sos.bloodGroup || '');
        setMedicalNotes(sos.medicalNotes || '');
        setEmergencyContactName(sos.emergencyContactName || '');
        setEmergencyContactRelationship(sos.emergencyContactRelationship || '');
        setEmergencyContactPhone(sos.emergencyContactPhone || '');
      }

      const prefs = StorageService.getPreferences();
      if (cancelled) return;
      setPrefAvoidStairs(prefs.avoidStairs);
      setPrefStepFree(prefs.stepFreeAccess);
      setPrefPreferRamps(prefs.preferRamps);
      setPrefSmoothSurfaces(prefs.smoothSurfaces);
      setPrefLowerVibration(prefs.lowerVibration);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser?.id, initialMode]);

  if (!isOpen) return null;

  // Validation for Step 1
  const validateAccountForm = (): boolean => {
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }

    if (activeTab === 'signup' && (!fullName.trim() || fullName.trim().length < 2)) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return false;
    }

    return true;
  };

  // Step 1: Submit Login or Create Account
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const client = getSupabaseClient();

    // If Supabase is unconfigured, explain clearly and offer demo state
    if (!client || !isSupabaseConfigured()) {
      setLoading(false);
      setErrorMessage(
        'Supabase Cloud is not configured. Live authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. You can continue as a Guest or use Quick Demo Login.'
      );
      return;
    }

    try {
      if (activeTab === 'login') {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.user) {
          setSuccessMessage('Successfully signed in! Welcome back.');
          onAuthSuccess(data.user);
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        // Sign Up
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.user && data.session) {
          // Only treat signup as a signed-in session when Supabase actually
          // returns a session. A user object alone can mean email confirmation
          // is still pending.
          onAuthSuccess(data.user);
          setSuccessMessage('Account created! Now personalize your mobility profile.');
          setTimeout(() => {
            setSuccessMessage(null);
            setCurrentStep(2);
          }, 900);
        } else if (data.user) {
          setSuccessMessage(
            'Account created. Please verify your email using the confirmation link, then return here and sign in to finish your profile.'
          );
          setActiveTab('login');
          setPassword('');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Save Mobility & Emergency Profile (Steps 2 & 3)
  const handleSaveMobilityProfile = async (andClose = false) => {
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const client = getSupabaseClient();
      let authenticatedUser: User | null = null;

      // Never write guest/demo placeholder IDs into public.profiles.
      if (client && currentUser?.id && currentUser.id !== 'demo-traveler-id') {
        const { data, error } = await client.auth.getUser();
        if (!error && data.user?.id === currentUser.id) {
          authenticatedUser = data.user;
        }
      }

      const profileData: MobilityProfile = {
        userId: authenticatedUser?.id || '',
        fullName: fullName.trim() || authenticatedUser?.user_metadata?.full_name || '',
        email: authenticatedUser?.email || email.trim(),
        mobilityType: mobilityType || undefined,
        mobilityDevice: mobilityDevice.trim() || undefined,
        bloodGroup: bloodGroup.trim() || undefined,
        medicalNotes: medicalNotes.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactRelationship: emergencyContactRelationship.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined
      };

      // Full name is NOT optional in the database for authenticated profiles.
      if (authenticatedUser && !profileData.fullName) {
        setErrorMessage('Please enter your full name before saving your profile.');
        return;
      }

      // saveProfileAsync always updates the local SOS cache; an empty userId
      // deliberately prevents a guest/demo profile from being upserted to cloud.
      const res = await StorageService.saveProfileAsync(profileData);

      const updatedPrefs: RoutePreferences = {
        ...StorageService.getPreferences(),
        wheelchairMode: mobilityType === 'wheelchair',
        avoidStairs: prefAvoidStairs,
        stepFreeAccess: prefStepFree,
        preferRamps: prefPreferRamps,
        smoothSurfaces: prefSmoothSurfaces,
        lowerVibration: prefLowerVibration
      };
      StorageService.savePreferences(updatedPrefs);

      if (!res.success) {
        setErrorMessage(res.error || 'Cloud profile save failed. Your details are still saved on this device.');
        return;
      }

      onProfileUpdated?.(profileData);
      setSuccessMessage(
        authenticatedUser
          ? 'Mobility profile saved to your account.'
          : 'Profile saved on this device. Sign in to sync it with your account.'
      );

      if (andClose) {
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save the profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for judges/evaluators
  const handleSimulatedDemoLogin = () => {
    const mockUser: any = {
      id: 'demo-traveler-id',
      email: email.trim() || 'traveler@accessresq.demo',
      user_metadata: {
        full_name: fullName.trim() || 'Alex Mercer'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };
    onAuthSuccess(mockUser as User);
    setSuccessMessage('Signed in via Simulated Demo Account.');
    setTimeout(() => {
      setCurrentStep(2);
      setSuccessMessage(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-brand-900 text-white p-6 relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-brand-800 rounded-[10px] flex items-center justify-center text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <circle cx="12" cy="4.5" r="2.5"/>
                  <path d="m10 9 4 2.5-2.5 4.5"/>
                  <path d="M6 14.5a5.5 5.5 0 1 0 11 0"/>
                  <path d="M12 9.5v5"/>
                </svg>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                {isEditMode ? 'Profile Management' : 'AccessResQ Identity & Onboarding'}
              </span>
              <h2 className="text-xl font-black">
                {currentStep === 1 
                  ? (currentUser && !isEditMode ? 'Your Profile' : activeTab === 'login' ? 'Sign In' : 'Create Account')
                  : currentStep === 2
                  ? 'Step 2: Mobility Profile Setup'
                  : 'Step 3: Emergency & Medical Info'}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep === 1
              ? 'Connect your account to save accessibility preferences, report obstacles, and request emergency assistance.'
              : currentStep === 2
              ? 'Tell us how you navigate so AccessResQ can automatically prioritize step-free routes and gradual ramps.'
              : 'Add optional emergency contact and medical telemetry for your one-touch SOS broadcast.'}
          </p>

          {/* Multi-Step Onboarding Stepper Indicator (Visible on Steps 2 and 3) */}
          {currentStep > 1 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-[11px]">
                  ✓
                </span>
                <span className="font-semibold text-emerald-300">Account</span>
              </div>
              <div className="h-0.5 w-8 bg-emerald-500/50"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full font-black flex items-center justify-center text-[11px] ${
                  currentStep === 2 ? 'bg-brand-500 text-slate-950 ring-2 ring-emerald-300' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <span className={`font-semibold ${currentStep === 2 ? 'text-white' : 'text-emerald-300'}`}>
                  Mobility
                </span>
              </div>
              <div className="h-0.5 w-8 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full font-black flex items-center justify-center text-[11px] ${
                  currentStep === 3 ? 'bg-brand-500 text-slate-950 ring-2 ring-emerald-300' : 'bg-white/20 text-slate-300'
                }`}>
                  3
                </span>
                <span className={`font-semibold ${currentStep === 3 ? 'text-white' : 'text-slate-400'}`}>
                  Emergency
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Feedback & Error Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{successMessage}</div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 1: ACCOUNT DETAILS (Or Logged-In User Profile Dashboard) */}
          {/* =============================================================== */}
          {currentStep === 1 && (
            currentUser && !isEditMode ? (
              // Authenticated Profile Summary View
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                    {(currentUser.user_metadata?.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {currentUser.user_metadata?.full_name || 'Traveler'}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{currentUser.email}</p>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wide">
                      Supabase Authenticated
                    </span>
                  </div>
                </div>

                {/* Mobility Profile Summary Pill */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-600" />
                      Saved Mobility Profile
                    </span>
                    <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                      {mobilityType ? MOBILITY_TYPE_LABELS[mobilityType] : 'Not setup yet'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mobility Device:</span>
                      <span className="font-medium text-slate-800">{mobilityDevice || 'None specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Blood Group:</span>
                      <span className="font-medium text-rose-700">{bloodGroup || 'Not specified'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Emergency Contact:</span>
                      <span className="font-medium text-slate-800">
                        {emergencyContactName 
                          ? `${emergencyContactName} ${emergencyContactRelationship ? `(${emergencyContactRelationship})` : ''} ${emergencyContactPhone ? `— ${emergencyContactPhone}` : ''}`
                          : 'No emergency contact registered'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(true);
                      setCurrentStep(2);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-brand-600/25"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Edit Mobility &amp; Emergency Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      setSuccessMessage('Signed out. You are now in Guest Mode.');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out to Guest Mode</span>
                  </button>
                </div>
              </div>
            ) : (
              // Login / Register Form
              <>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'login'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'signup'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleAccountSubmit} className="space-y-3.5">
                  {activeTab === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-brand-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                      </>
                    ) : (
                      <span>
                        {activeTab === 'login' 
                          ? 'Sign In to AccessResQ' 
                          : 'Create Account & Continue to Mobility Setup →'}
                      </span>
                    )}
                  </button>
                </form>

                {/* Guest & Evaluator Fallbacks */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onContinueAsGuest();
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <span>Continue as Guest (No Sign-In Required)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {!isSupabaseConfigured() && (
                    <button
                      type="button"
                      onClick={handleSimulatedDemoLogin}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quick Demo Sign-In (Evaluator Mode)</span>
                    </button>
                  )}
                </div>
              </>
            )
          )}

          {/* =============================================================== */}
          {/* STEP 2: MOBILITY DETAILS (All Optional, No Fictional Pre-Fills) */}
          {/* =============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              
              {/* Mobility Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobility Assistance Type (Optional)
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Select the category that best describes your navigation needs:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(MOBILITY_TYPE_LABELS) as MobilityType[]).map((typeKey) => {
                    const isSelected = mobilityType === typeKey;
                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => setMobilityType(isSelected ? '' : typeKey)}
                        className={`p-3 rounded-xl text-left border transition flex items-center justify-between text-xs font-semibold ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{MOBILITY_TYPE_LABELS[typeKey]}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wheelchair Model / Mobility Device */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobility Device / Wheelchair Model (Optional)
                </label>
                <input
                  type="text"
                  value={mobilityDevice}
                  onChange={(e) => setMobilityDevice(e.target.value)}
                  placeholder="e.g. Quickie 2 Manual Chair, Permobil M3, or Rollator Walker"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Helpful for matching appropriate roadside assistance flatbeds with hydraulic hoists.
                </span>
              </div>

              {/* Accessibility Preferences (Optional) */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Routing Preferences (Optional)
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <span className="font-semibold text-slate-800">Avoid Stairs &amp; Steps</span>
                    <input
                      type="checkbox"
                      checked={prefAvoidStairs}
                      onChange={(e) => setPrefAvoidStairs(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <span className="font-semibold text-slate-800">Strict Step-Free Access</span>
                    <input
                      type="checkbox"
                      checked={prefStepFree}
                      onChange={(e) => setPrefStepFree(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <span className="font-semibold text-slate-800">Prefer Gradual Ramps</span>
                    <input
                      type="checkbox"
                      checked={prefPreferRamps}
                      onChange={(e) => setPrefPreferRamps(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <span className="font-semibold text-slate-800">Smooth Pavement / Low Vibration</span>
                    <input
                      type="checkbox"
                      checked={prefSmoothSurfaces}
                      onChange={(e) => {
                        setPrefSmoothSurfaces(e.target.checked);
                        setPrefLowerVibration(e.target.checked);
                      }}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                  </label>
                </div>
              </div>

              {/* Navigation Action Buttons for Step 2 */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveMobilityProfile(true)}
                  disabled={loading}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-xl hover:bg-slate-100 transition"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setCurrentStep(3);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-brand-600/25"
                >
                  <span>Continue to Emergency Info</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 3: EMERGENCY & MEDICAL INFORMATION (Strict Privacy RLS) */}
          {/* =============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              
              {/* Privacy Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Privacy:</strong> These details are saved with your account and access is controlled by the database's Row-Level Security (RLS) policies. Add only information you are comfortable storing. Review the app's privacy information before sharing sensitive details.
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Blood Group (Optional)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Blood Group (Optional)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="Other / Unknown">Other / Unknown</option>
                </select>
              </div>

              {/* Medical Alert / Accessibility Assistance Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Medical Alert / Accessibility Notes (Optional)
                </label>
                <textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Paraplegic, requires ramp/hoist assistance for vehicle transfer, severe asthma, pacemaker"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Emergency Contact Information */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Primary Emergency Contact (Optional)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Dr. Sunita Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relationship</label>
                    <input
                      type="text"
                      value={emergencyContactRelationship}
                      onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                      placeholder="e.g. Spouse, Parent, Caregiver"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="e.g. +91 98765 01234"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Step 3 */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mobility</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveMobilityProfile(true)}
                    disabled={loading}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-xl hover:bg-slate-100 transition"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveMobilityProfile(true)}
                    disabled={loading}
                    className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-brand-600/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save &amp; Finish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>All mobility and medical details are optional.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
