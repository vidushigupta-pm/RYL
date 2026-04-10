/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  User, 
  History, 
  Settings, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Plus,
  MessageCircle,
  Send,
  Sparkles,
  Search,
  Tag,
  Barcode,
  Image as ImageIcon,
  Home,
  Trash2,
  Edit2,
  LogOut,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from './services/geminiService';
import { analyseLabel, searchProductByName, chatAboutProduct } from './services/functionsService';
import { recordScanEvent, normaliseProductId, detectSubCategory } from './services/swapService';
import { calculateProfileVerdict } from './services/profileScoringEngine';
import { 
  DIETARY_PREFERENCES_UI, 
  HEALTH_GOALS_UI,
  CONDITION_GROUPS,
  ALLERGEN_OPTIONS,
  AGE_GROUPS,
  ACTIVITY_LEVELS,
  DietaryPreference,
  HealthGoal
} from './data/familyProfiles';
import { AlsoScanned } from './components/AlsoScanned';

import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  onAuthStateChanged, 
  handleFirestoreError, 
  OperationType,
  Timestamp
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errJson = JSON.parse(this.state.error?.message || "{}");
        if (errJson.error?.includes("insufficient permissions")) {
          message = "You don't have permission to perform this action. Please check if you are signed in correctly.";
        }
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#FDF6EE]">
          <div className="w-16 h-16 bg-[#FDECEA] rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-[#D94F3D]" />
          </div>
          <h2 className="text-xl font-bold text-[#1B3D2F] mb-2">Oops!</h2>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types ---

type AppPhase = 'onboarding' | 'home' | 'processing' | 'result' | 'profiles' | 'history' | 'auth' | 'signup' | 'no-results';

interface Profile {
  id: string;
  name: string;
  display_name: string;
  avatar_color: string;
  avatar_letter: string;
  age_group: string;
  gender: string;
  activity_level: string;
  conditions: string[];
  allergens: string[];
  dietary_preference: string;
  health_goals: string[];
  isDefault: boolean;
  userId?: string;
  updatedAt?: any;
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'default_self',
    name: 'Me',
    display_name: 'Me',
    avatar_color: '#1B3D2F',
    avatar_letter: 'M',
    age_group: 'ADULT_26_45',
    gender: 'PREFER_NOT_TO_SAY',
    activity_level: 'MODERATELY_ACTIVE',
    conditions: ['NONE'],
    allergens: [],
    dietary_preference: 'NO_RESTRICTION',
    health_goals: ['NONE'],
    isDefault: true,
    updatedAt: Timestamp.now()
  }
];

// --- Components ---

const ProfileAvatar: React.FC<{ profile: Profile, size?: "xs" | "sm" | "md" | "lg", className?: string }> = ({ profile, size = "md", className = "" }) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl"
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: profile.avatar_color || '#1B3D2F' }}
    >
      {profile.avatar_letter || (profile.name ? profile.name[0].toUpperCase() : '?')}
    </div>
  );
};

const Breadcrumbs = ({ phase }: { phase: AppPhase }) => {
  const steps: { id: AppPhase; label: string }[] = [
    { id: 'onboarding', label: 'Welcome' },
    { id: 'home', label: 'Scan' },
    { id: 'result', label: 'Verdict' },
  ];

  // If we are in auth or signup, we show a different path
  if (phase === 'auth' || phase === 'signup') {
    return (
      <div className="px-6 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span>Home</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#D4871E]">{phase === 'auth' ? 'Sign In' : 'Sign Up'}</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
      {steps.map((step, i) => {
        const isActive = step.id === phase || (phase === 'processing' && step.id === 'result');
        const isPast = steps.findIndex(s => s.id === phase) > i || (phase === 'result' && i < 2) || (phase === 'processing' && i < 2);
        
        return (
          <React.Fragment key={step.id}>
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={isActive ? 'text-[#D4871E]' : isPast ? 'text-[#1B3D2F]' : ''}>
              {step.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-[#1B3D2F] text-white shadow-lg shadow-[#1B3D2F]/20',
    secondary: 'bg-white text-[#1B3D2F] border border-[#E8DDD0]',
    ghost: 'bg-transparent text-[#1B3D2F]',
    danger: 'bg-[#D94F3D] text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const ScoreBadge = ({ score }: { score: number }) => {
  const getGrade = (s: number) => {
    if (s >= 85) return 'A+';
    if (s >= 70) return 'A';
    if (s >= 55) return 'B';
    if (s >= 40) return 'C';
    if (s >= 25) return 'D';
    return 'E';
  };

  const getColor = (s: number) => {
    if (s >= 70) return 'text-[#2E7D4F] bg-[#E6F4EC]';
    if (s >= 40) return 'text-[#E07B2A] bg-[#FFF0E0]';
    return 'text-[#D94F3D] bg-[#FDECEA]';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-mono font-bold ${getColor(score)}`}>
      <span>{getGrade(score)}</span>
      <div className="w-px h-3 bg-current opacity-20" />
      <span>{score}</span>
    </div>
  );
};

// ── Position-aware ingredient logic ──────────────────────────────────────────
// Ingredients are listed in descending order by weight on every Indian pack.
// If a nutritionally concerning ingredient appears in top 3, it's a MAJOR component.

const POSITION_WATCH: Record<string, string> = {
  'sugar':               'Sugar is the {ord} ingredient by weight — a large part of this product IS sugar.',
  'sucrose':             'Sucrose (sugar) is the {ord} ingredient — a significant portion of this product is sugar.',
  'glucose syrup':       'Glucose syrup is the {ord} ingredient — a high-GI sugar making up a major part of this product.',
  'corn syrup':          'Corn syrup is the {ord} ingredient — a high-GI sweetener as a primary component.',
  'invert sugar':        'Invert sugar is the {ord} ingredient — sugar in a different form, still a primary component.',
  'fructose':            'Fructose is the {ord} ingredient — processed directly by the liver in large quantities.',
  'maltodextrin':        'Maltodextrin is the {ord} ingredient — a high-GI filler that spikes blood sugar like sugar.',
  'palm oil':            'Palm oil is the {ord} ingredient — a major source of saturated fat in this product.',
  'edible vegetable oil':'Vegetable oil is the {ord} ingredient — contributes heavily to the fat content.',
  'wheat flour':         'Wheat flour is the {ord} ingredient — refined wheat flour has a high GI and low fibre; the dominant base of this product.',
  'maida':               'Maida (refined flour) is the {ord} ingredient — the primary base with very low fibre and high GI.',
  'refined wheat flour': 'Refined wheat flour is the {ord} ingredient — acts like sugar in the body, spikes blood glucose.',
  'refined flour':       'Refined flour is the {ord} ingredient — high-GI base with minimal nutritional value.',
  'salt':                'Salt is the {ord} ingredient — very high sodium as a primary component.',
  'iodised salt':        'Iodised salt is the {ord} ingredient — very high sodium as a primary component.',
  'sodium chloride':     'Sodium chloride (salt) is the {ord} ingredient — very high sodium content.',
};

function getPositionWatchMatch(name: string): string | null {
  const n = (name || '').toLowerCase();
  for (const keyword of Object.keys(POSITION_WATCH)) {
    if (n.includes(keyword)) return keyword;
  }
  return null;
}

function getPositionAwareTier(name: string, position: number, originalTier: string): string {
  if (position >= 3) return originalTier;
  if (originalTier === 'AVOID' || originalTier === 'BANNED_IN_INDIA') return originalTier;
  const match = getPositionWatchMatch(name);
  if (!match) return originalTier;
  if (originalTier === 'SAFE') return 'CAUTION';
  return originalTier;
}

const ORDINALS = ['#1', '#2', '#3'];

const TierBadge = ({ tier }: { tier: string }) => {
  const tiers: any = {
    SAFE: { label: 'Safe', color: 'text-[#2E7D4F] bg-[#E6F4EC]' },
    CAUTION: { label: 'Caution', color: 'text-[#E07B2A] bg-[#FFF0E0]' },
    AVOID: { label: 'Avoid', color: 'text-[#D94F3D] bg-[#FDECEA]' },
    BANNED_IN_INDIA: { label: 'Banned in India', color: 'text-white bg-[#D94F3D]' },
    UNVERIFIED: { label: 'Unverified', color: 'text-gray-500 bg-gray-100' },
  };

  const t = tiers[tier] || tiers.UNVERIFIED;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${t.color}`}>
      {t.label}
    </span>
  );
};

// --- Screens ---

const Onboarding = ({ onComplete, onSignIn, onSignUp }: { onComplete: () => void, onSignIn: () => void, onSignUp: () => void }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-screen overflow-hidden justify-between bg-white"
    >
      <Breadcrumbs phase="onboarding" />
      <div className="flex-1 flex flex-col p-4">
        <div className="w-10 h-10 bg-[#1B3D2F] rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-[#1B3D2F]/20">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#1B3D2F] mb-1 leading-tight">
          Read Your Labels. <br />
          <span className="text-[#D4871E]">Know the Truth.</span>
        </h1>
        <p className="text-[#4A4A4A] text-sm leading-relaxed mb-2 max-w-xs">
          Scan any packaged product — food, cosmetics, personal care, pet food and more. Unmask misleading claims and get honest, plain-language verdicts for your whole family.
        </p>
        
        <div className="space-y-1 mb-2">
          {[
            { icon: <Zap className="w-4 h-4" />, text: "Works on food, skincare, supplements & pet products" },
            { icon: <User className="w-4 h-4" />, text: "Unmask 'Natural', 'No Added Sugar', 'Clinically Tested' claims" },
            { icon: <CheckCircle2 className="w-4 h-4" />, text: "Personalised for your family — kids, seniors, health conditions" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[#1B3D2F] text-sm font-medium">
              <div className="text-[#D4871E] flex-shrink-0">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-1">
          <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">
            Grounded in FSSAI · ICMR-NIN · CDSCO · BIS · EWG
          </p>
        </div>
      </div>
      
      <div className="mt-auto space-y-2 p-4">
        <div className="space-y-1">
          <Button onClick={() => setShowDisclaimer(true)} className="w-full flex flex-col items-center justify-center py-3 h-auto bg-[#1B3D2F] text-white rounded-2xl shadow-lg active:scale-95 transition-all">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span className="text-lg font-bold uppercase">Scan as Guest</span>
            </div>
            <span className="text-[10px] font-medium opacity-60 uppercase tracking-widest mt-0.5">No account needed</span>
          </Button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8DDD0]"></div>
          </div>
          <div className="relative px-4 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onSignUp}
            className="flex-1 py-2 bg-white border border-[#1B3D2F] text-[#1B3D2F] font-bold rounded-2xl active:scale-95 transition-all"
          >
            Sign Up
          </button>
          <button 
            onClick={onSignIn}
            className="flex-1 py-2 bg-white border border-[#1B3D2F] text-[#1B3D2F] font-bold rounded-2xl active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-medium leading-relaxed">
          Sign in to save history and family profiles across devices
        </p>
      </div>

      {/* Onboarding Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[32px] p-8 max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 bg-[#FFF0E0] rounded-2xl flex items-center justify-center mb-6">
                <ShieldAlert className="text-[#E07B2A] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1B3D2F] mb-4">Important Notice</h3>
              <p className="text-sm text-[#4A4A4A] leading-relaxed mb-8">
                ReadYourLabels is an informational tool based on ICMR 2024 guidelines and is NOT a substitute for professional medical advice. Always consult a qualified doctor or nutritionist before making significant changes to your diet or health regimen. By continuing, you acknowledge that this app provides general guidance only.
              </p>
              <Button onClick={onComplete} className="w-full py-4">
                I Understand & Accept
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SignUpScreen = ({ onBack, onSignUp, onSignIn }: { onBack: () => void, onSignUp: () => void, onSignIn: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#FDF6EE]"
    >
      <Breadcrumbs phase="signup" />
      <div className="flex-1 flex flex-col p-8 pt-4">
        <header className="mb-8">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center mb-6">
            <ChevronLeft className="w-6 h-6 text-[#1B3D2F]" />
          </button>
          <h2 className="font-display text-3xl font-bold text-[#1B3D2F] mb-2">Create Account</h2>
          <p className="text-gray-500 text-sm">Join thousands of families making healthier choices.</p>
        </header>

        <div className="flex-1 space-y-4">
          {/* Google Signup Option */}
          <button 
            onClick={onSignUp}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#E8DDD0] rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Sign up with Google
          </button>

          <p className="text-xs text-center text-gray-400 pt-2">More sign-in options coming soon.</p>
        </div>
      </div>

      <footer className="mt-auto p-8 text-center border-t border-[#E8DDD0]/50">
        <p className="text-sm text-gray-500">
          Already have an account? <button onClick={onSignIn} className="font-bold text-[#1B3D2F] hover:underline">Sign In</button>
        </p>
      </footer>
    </motion.div>
  );
};

const LoginScreen = ({ onBack, onLogin, onSignUp }: { onBack: () => void, onLogin: () => void, onSignUp: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#FDF6EE]"
    >
      <Breadcrumbs phase="auth" />
      <div className="flex-1 flex flex-col p-8 pt-4">
        <header className="mb-12">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center mb-8">
            <ChevronLeft className="w-6 h-6 text-[#1B3D2F]" />
          </button>
          <h2 className="font-display text-3xl font-bold text-[#1B3D2F] mb-2">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to sync your family profiles and scan history.</p>
        </header>

        <div className="flex-1 space-y-6">
          {/* Google Login Option */}
          <button 
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#E8DDD0] rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-xs text-center text-gray-400 pt-2">More sign-in options coming soon.</p>
        </div>
      </div>

      <footer className="mt-auto p-8 text-center border-t border-[#E8DDD0]/50">
        <p className="text-sm text-gray-500">
          Don't have an account? <button onClick={onSignUp} className="font-bold text-[#1B3D2F] hover:underline">Create Account</button>
        </p>
      </footer>
    </motion.div>
  );
};

const HomeScreen = ({ onAnalyse, onProfileClick, onHistoryClick, onBack, profiles, onSearch, user, onLogout, cameFromOnboarding }: { onAnalyse: (files: { front: File | null, back: File }) => void, onProfileClick: () => void, onHistoryClick: () => void, onBack: () => void, profiles: Profile[], onSearch: (name: string) => void, user: any, onLogout: () => void, cameFromOnboarding: boolean }) => {
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const backInputRef = useRef<HTMLInputElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'back') setBackFile(file);
      else setFrontFile(file);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleContinue = () => {
    if (backFile) {
      onAnalyse({ front: frontFile, back: backFile });
    } else if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const isContinueEnabled = !!backFile || !!searchQuery.trim();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FDF6EE]">
      <Breadcrumbs phase="home" />
      
      <div className="flex-1 px-5 overflow-y-auto no-scrollbar pb-28">
        {/* Header matching screenshot */}
        <header className="py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {cameFromOnboarding && (
              <button 
                onClick={onBack}
                className="w-7 h-7 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center active:scale-95 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#1B3D2F]" />
              </button>
            )}
            <div>
              <h2 className="font-serif text-[20px] font-bold text-[#1B3D2F] leading-none">ReadYourLabels</h2>
              <p className="text-[#8E9299] text-[7px] font-medium mt-0.5">India's honest ingredient truth-teller</p>
            </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="flex flex-col items-center justify-center w-8 h-12 rounded-full bg-[#F3F4F6] border border-[#E8DDD0] shadow-sm active:scale-95 transition-all"
          >
            <div className="relative mb-0.5">
              <div className="w-5 h-5 rounded-full bg-[#1B3D2F] flex items-center justify-center text-white text-[8px] font-bold border-2 border-white">
                V
              </div>
            </div>
            <div className="flex flex-col items-center leading-none">
              <span className="text-[4px] font-black text-[#1B3D2F] uppercase">For</span>
              <span className="text-[4px] font-black text-[#1B3D2F] uppercase">My</span>
              <span className="text-[4px] font-black text-[#1B3D2F] uppercase">Family</span>
            </div>
          </button>
        </header>

        <div className="mb-2">
          <h3 className="font-serif text-[16px] font-bold text-[#1B3D2F] mb-0.5 leading-tight">What's really inside this product?</h3>
          <p className="text-[#4A4A4A] text-[10px] leading-tight opacity-80">
            Point at the back of any pack — food, skincare, supplements, pet food. We'll tell you what the brand isn't saying.
          </p>
        </div>

        <div className="space-y-2.5">
          {/* Combined Upload Frame */}
          <div className="bg-[#E5E7EB]/50 rounded-[24px] p-2.5 space-y-2.5">
            {/* Back Label Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-[#1B3D2F] text-xs">Back of Pack</span>
                    <span className="bg-[#1B3D2F] text-white text-[6px] font-bold px-1 py-0.5 rounded uppercase">Required</span>
                  </div>
                  <p className="text-[9px] text-[#8E9299] leading-tight max-w-[150px]">Ingredients, contents or nutritional label</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => backInputRef.current?.click()}
                    className="w-7 h-7 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => backInputRef.current?.click()}
                    className="w-7 h-7 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {backFile && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#E8DDD0]">
                  <img src={URL.createObjectURL(backFile)} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setBackFile(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input ref={backInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'back')} />
            </div>

            {/* Horizontal Divider */}
            <div className="h-[1px] bg-white/60 w-full"></div>

            {/* Front Label Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-[#1B3D2F] text-xs">Front of Pack</span>
                    <span className="bg-[#D1D5DB] text-[#4B5563] text-[6px] font-bold px-1 py-0.5 rounded uppercase">Optional</span>
                  </div>
                  <p className="text-[9px] text-[#8E9299] leading-tight max-w-[150px]">Front claims, certifications & brand name — unlocks Claim Unmasker</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => frontInputRef.current?.click()}
                    className="w-7 h-7 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => frontInputRef.current?.click()}
                    className="w-7 h-7 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {frontFile && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#E8DDD0]">
                  <img src={URL.createObjectURL(frontFile)} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setFrontFile(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input ref={frontInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'front')} />
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-3 px-2 py-0.5">
              <div className="h-[1px] bg-white/40 flex-1"></div>
              <span className="text-[7px] font-bold text-[#8E9299] uppercase tracking-widest">OR</span>
              <div className="h-[1px] bg-white/40 flex-1"></div>
            </div>

            {/* Barcode Scan Section */}
            <button 
              onClick={() => backInputRef.current?.click()}
              className="w-full bg-[#1B3D2F] rounded-xl p-3 flex items-center justify-between group active:scale-[0.98] transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Barcode className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-bold text-xs">Scan Barcode</h3>
                  <p className="text-white/60 text-[8px] font-medium">Identify product instantly</p>
                </div>
              </div>
              <div className="bg-white text-[#1B3D2F] px-2.5 py-1 rounded-full text-[9px] font-bold shadow-sm group-hover:bg-[#FDF6EE] transition-colors">
                Scan →
              </div>
            </button>
          </div>

          {/* Tips Section */}
          <div className="p-2 bg-[#E6F4EC] rounded-[16px] border border-[#2E7D4F]/10">
            <button 
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-2.5 h-2.5 text-[#2E7D4F]" />
                <h4 className="text-[7px] font-bold text-[#2E7D4F] uppercase tracking-widest">Scanning Tips</h4>
              </div>
              <ChevronRight className={`w-2.5 h-2.5 text-[#2E7D4F] transition-transform ${showTips ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showTips && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 6 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {[
                      { id: '01', text: "Get close to the back of the pack and hold steady — good lighting helps" },
                      { id: '02', text: "Include the full ingredients list and nutritional table if visible" },
                      { id: '03', text: "Add the front photo to catch misleading health claims like 'Natural' or 'No Added Sugar'" },
                      { id: '04', text: "Works on food, cosmetics, supplements, household products and pet food" }
                    ].map((tip) => (
                      <div key={tip.id} className="flex gap-2 items-start">
                        <span className="font-mono text-[8px] font-bold text-[#2E7D4F] mt-0.5">{tip.id}</span>
                        <p className="text-[10px] text-[#1B3D2F] font-medium leading-tight">{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar Section */}
          <div className="pt-2 border-t border-[#E8DDD0]">
            <div className="mb-1">
              <h3 className="font-serif text-[14px] font-bold text-[#1B3D2F] mb-0.5">Know the product name?</h3>
              <p className="text-[#8E9299] text-[8px] font-medium">Search by name — we'll find the ingredients and give you an honest verdict.</p>
            </div>
            <form onSubmit={handleSearchSubmit} className="mb-0.5">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any product — food, cosmetics, supplements..." 
                  className="w-full py-2 pl-9 pr-4 bg-white border border-[#E8DDD0] rounded-lg text-xs font-medium text-[#1B3D2F] placeholder:text-[#8E9299] focus:outline-none focus:border-[#1B3D2F] focus:ring-1 focus:ring-[#1B3D2F] transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8E9299] group-focus-within:text-[#1B3D2F] transition-colors" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Action and Nav - Changed to absolute to stay within the app frame */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E8DDD0] z-20">
        <div className="px-6 py-3">
          <button 
            disabled={!isContinueEnabled}
            onClick={handleContinue}
            className={`w-full py-4 rounded-full font-bold transition-all active:scale-95 text-sm ${
              isContinueEnabled 
                ? 'bg-[#1B3D2F] text-white shadow-lg shadow-[#1B3D2F]/20' 
                : 'bg-[#E8DDD0] text-[#8E9299] cursor-not-allowed'
            }`}
          >
            {backFile ? 'Analyse Label' : searchQuery.trim() ? 'Search Product' : 'Add label or search to continue'}
          </button>
        </div>
        
        <nav className="flex justify-around items-center py-1.5 pb-3 border-t border-[#FDF6EE]">
          <button className="flex flex-col items-center gap-1 text-[#1B3D2F] min-w-[64px]">
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          <button onClick={onHistoryClick} className="flex flex-col items-center gap-1 text-[#8E9299] min-w-[64px]">
            <History className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">History</span>
          </button>
          <button onClick={onProfileClick} className="flex flex-col items-center gap-1 text-[#8E9299] min-w-[64px]">
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Profiles</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

const HistoryScreen = ({ scans, onBack, onSelectScan }: { scans: any[], onBack: () => void, onSelectScan: (scan: any) => void }) => {
  return (
    <div className="flex flex-col h-full bg-[#FDF6EE]">
      <header className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center active:scale-95 transition-all">
          <ChevronLeft className="w-5 h-5 text-[#1B3D2F]" />
        </button>
        <h2 className="font-serif text-2xl font-bold text-[#1B3D2F]">Scan History</h2>
      </header>
      
      <div className="flex-1 px-6 overflow-y-auto no-scrollbar pb-10">
        {scans.length > 0 ? (
          <div className="space-y-4">
            {scans.map((scan) => (
              <button 
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="w-full p-5 bg-white rounded-[28px] border border-[#E8DDD0] flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-sm ${scan.overallScore >= 70 ? 'bg-[#E6F4EC] text-[#2E7D4F]' : scan.overallScore >= 40 ? 'bg-[#FFF0E0] text-[#E07B2A]' : 'bg-[#FDECEA] text-[#D94F3D]'}`}>
                    {scan.overallScore}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[#1B3D2F] truncate max-w-[150px]">{scan.productName}</h4>
                    <p className="text-[10px] text-[#8E9299] font-medium uppercase tracking-widest mt-0.5">
                      {scan.timestamp?.toDate().toLocaleDateString()} · {scan.brand}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8E9299]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[32px] border border-[#E8DDD0] text-center space-y-4">
            <div className="w-16 h-16 bg-[#FDF6EE] rounded-full flex items-center justify-center mx-auto">
              <History className="w-8 h-8 text-[#8E9299]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1B3D2F]">No scans yet</h3>
              <p className="text-sm text-[#8E9299] mt-1">Your analyzed products will appear here for quick reference.</p>
            </div>
            <Button onClick={onBack} className="w-full">Start Scanning</Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilesScreen = ({ profiles, setProfiles, user, onBack }: { profiles: Profile[], setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>, user: any, onBack: () => void }) => {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#1B3D2F');
  const [ageGroup, setAgeGroup] = useState('ADULT_26_45');
  const [gender, setGender] = useState('MALE');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietaryPreference, setDietaryPreference] = useState('NO_RESTRICTION');
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('MODERATELY_ACTIVE');
  const [hasConsented, setHasConsented] = useState(false);
  const [hasParentalConsent, setHasParentalConsent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const AVATAR_COLORS = ['#1B3D2F', '#D94F3D', '#F27D26', '#5A5A40', '#4A4A4A', '#8E9299', '#2E7D4F', '#B45309', '#065F46', '#1E40AF', '#7C3AED', '#BE185D'];

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleStartEdit = (p: Profile) => {
    setEditingProfile(p);
    setName(p.name);
    setAvatarColor(p.avatar_color || '#1B3D2F');
    setAgeGroup(p.age_group || 'ADULT_26_45');
    setGender(p.gender || 'MALE');
    setConditions(p.conditions || []);
    setAllergens(p.allergens || []);
    setDietaryPreference(p.dietary_preference || 'NO_RESTRICTION');
    setHealthGoals(p.health_goals || []);
    setActivityLevel(p.activity_level || 'MODERATELY_ACTIVE');
    setHasConsented(true); // Already consented if editing
    setHasParentalConsent(true);
    setStep(1);
    setIsAdding(false);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingProfile(null);
    setName('');
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setAgeGroup('ADULT_26_45');
    setGender('MALE');
    setConditions([]);
    setAllergens([]);
    setDietaryPreference('NO_RESTRICTION');
    setHealthGoals([]);
    setActivityLevel('MODERATELY_ACTIVE');
    setHasConsented(false);
    setHasParentalConsent(false);
    setStep(1);
  };

  const handleSave = async () => {
    const profileData = {
      name,
      display_name: name,
      avatar_color: avatarColor,
      avatar_letter: name ? name[0].toUpperCase() : '?',
      age_group: ageGroup,
      gender,
      activity_level: activityLevel,
      conditions,
      allergens,
      dietary_preference: dietaryPreference,
      health_goals: healthGoals,
      updatedAt: Timestamp.now()
    };

    try {
      if (user) {
        if (isAdding) {
          await addDoc(collection(db, `users/${user.uid}/profiles`), {
            ...profileData,
            isDefault: false,
            userId: user.uid
          });
        } else if (editingProfile) {
          await updateDoc(doc(db, `users/${user.uid}/profiles`, editingProfile.id), profileData);
        }
      } else {
        let updatedProfiles: Profile[];
        if (isAdding) {
          const newProfile: Profile = {
            ...profileData,
            id: Math.random().toString(36).substr(2, 9),
            isDefault: false,
            userId: 'guest'
          } as Profile;
          updatedProfiles = [...profiles, newProfile];
        } else {
          updatedProfiles = profiles.map(p => 
            p.id === editingProfile?.id ? { ...p, ...profileData } : p
          );
        }
        localStorage.setItem('ryl_guest_profiles', JSON.stringify(updatedProfiles));
        setProfiles(updatedProfiles);
      }
      
      setToast("Profile saved ✓");
      setTimeout(() => {
        setIsAdding(false);
        setEditingProfile(null);
      }, 500);
    } catch (error) {
      console.error("Save failed:", error);
      handleFirestoreError(error, isAdding ? OperationType.CREATE : OperationType.UPDATE, user ? `users/${user.uid}/profiles` : 'local');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      const updated = profiles.filter(p => p.id !== id);
      localStorage.setItem('ryl_guest_profiles', JSON.stringify(updated));
      setProfiles(updated);
      setEditingProfile(null);
      return;
    }
    try {
      await deleteDoc(doc(db, `users/${user.uid}/profiles`, id));
      setEditingProfile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/profiles/${id}`);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeletingAll(true);
    try {
      // Delete all profiles
      const profilesSnap = await getDocs(collection(db, `users/${user.uid}/profiles`));
      const profileDeletes = profilesSnap.docs.map(d => deleteDoc(d.ref));
      
      // Delete all scans
      const scansSnap = await getDocs(collection(db, `users/${user.uid}/scans`));
      const scanDeletes = scansSnap.docs.map(d => deleteDoc(d.ref));
      
      await Promise.all([...profileDeletes, ...scanDeletes]);
      
      setToast("All data erased permanently ✓");
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setIsDeletingAll(false);
        logout();
      }, 2000);
    } catch (error) {
      console.error("Delete all failed:", error);
      setIsDeletingAll(false);
      setToast("Failed to delete data. Please try again.");
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const toggleCondition = (id: string) => {
    if (id === 'NONE') {
      setConditions(['NONE']);
      return;
    }
    setConditions(prev => {
      const filtered = prev.filter(c => c !== 'NONE');
      if (filtered.includes(id)) {
        return filtered.filter(c => c !== id);
      } else {
        return [...filtered, id];
      }
    });
  };

  const toggleAllergen = (id: string) => {
    if (id === 'NONE') {
      setAllergens(['NONE']);
      return;
    }
    setAllergens(prev => {
      const filtered = prev.filter(c => c !== 'NONE');
      if (filtered.includes(id)) {
        return filtered.filter(c => c !== id);
      } else {
        return [...filtered, id];
      }
    });
  };

  const toggleHealthGoal = (id: string) => {
    if (id === 'NONE') {
      setHealthGoals(['NONE']);
      return;
    }
    setHealthGoals(prev => {
      const filtered = prev.filter(c => c !== 'NONE');
      if (filtered.includes(id)) {
        return filtered.filter(c => c !== id);
      } else {
        return [...filtered, id];
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FDF6EE]">
      <header className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center active:scale-95 transition-all">
          <ChevronLeft className="w-5 h-5 text-[#1B3D2F]" />
        </button>
        <h2 className="font-serif text-2xl font-bold text-[#1B3D2F]">Family Profiles</h2>
      </header>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar pb-10">
        <div className="mb-6 p-4 bg-[#E6F4EC] border border-[#2E7D4F]/20 rounded-2xl">
          <div className="flex gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#2E7D4F] flex-shrink-0" />
            <h4 className="text-sm font-bold text-[#1B3D2F]">Consent & Privacy Notice</h4>
          </div>
          <p className="text-[11px] text-[#2E7D4F] leading-relaxed">
            We collect data on age, gender, and health conditions to provide personalized nutritional safety alerts. This data is used solely for the 'Family Vault' multi-persona logic. You can withdraw consent at any time by deleting a profile or using the 'Delete My Data' button below.
          </p>
        </div>

        <div className="space-y-4">
          {profiles.map(p => (
            <div key={p.id} className="p-5 bg-white rounded-[28px] border border-[#E8DDD0] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <ProfileAvatar profile={p} size="md" />
                <div>
                  <h4 className="font-bold text-[#1B3D2F]">{p.name} {p.isDefault && <span className="text-[10px] bg-[#E6F4EC] text-[#2E7D4F] px-1.5 py-0.5 rounded ml-1 uppercase">You</span>}</h4>
                  <p className="text-[10px] text-[#8E9299] font-medium uppercase tracking-widest mt-0.5">
                    {p.gender} · {AGE_GROUPS.find(g => g.id === p.age_group)?.label || p.age_group} · {p.activity_level}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleStartEdit(p)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9299] hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button 
            onClick={handleStartAdd}
            className="w-full p-5 rounded-[28px] border-2 border-dashed border-[#E8DDD0] flex items-center justify-center gap-2 text-[#8E9299] font-bold active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Family Member
          </button>

          {user && (
            <div className="pt-8 space-y-4">
              <p className="text-center text-xs text-[#8E9299]">
                Signed in as <span className="font-bold text-[#1B3D2F]">{user.email}</span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => logout()}
                  className="w-full p-5 bg-white border border-[#E8DDD0] rounded-[28px] flex items-center justify-center gap-3 text-[#1B3D2F] font-bold active:scale-95 transition-all shadow-sm"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full p-5 bg-[#FFF5F5] border border-[#FEE2E2] rounded-[28px] flex items-center justify-center gap-3 text-[#D94F3D] font-bold active:scale-95 transition-all shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete My Data
                </button>
              </div>
              <p className="text-[10px] text-center text-[#8E9299] px-4 leading-relaxed">
                As per India's DPDP Act 2023, you have the 'Right to be Forgotten'. Deleting your data will permanently erase all health records and scan history from our backend within 72 hours.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[32px] p-8 max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="text-[#D94F3D] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1B3D2F] mb-4">Erase All Data?</h3>
              <p className="text-sm text-[#4A4A4A] leading-relaxed mb-8">
                Are you sure you want to delete all your data? This will permanently erase all your health records and family profiles from our backend within 72 hours. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleDeleteAllData} 
                  disabled={isDeletingAll}
                  variant="danger" 
                  className="w-full py-4"
                >
                  {isDeletingAll ? 'Erasing...' : 'Yes, Delete Everything'}
                </Button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 text-sm font-bold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {(editingProfile || isAdding) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => { setEditingProfile(null); setIsAdding(false); }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[32px] h-[92vh] flex flex-col relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-[#E8DDD0] rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 border-b border-[#FDF6EE]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#1B3D2F]">
                    {isAdding ? 'Add Family Member' : 'Edit Profile'} — Step {step} of 5
                  </h3>
                  {!isAdding && !editingProfile?.isDefault && step === 1 && (
                    <button 
                      onClick={() => handleDelete(editingProfile!.id)}
                      className="p-2 text-[#D94F3D]"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <div 
                      key={s} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        s < step ? 'bg-[#1B3D2F]' : s === step ? 'bg-[#1B3D2F]' : 'bg-[#E8DDD0]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-32">
                {step === 1 && (
                  <div className="space-y-8">
                    {/* Avatar Preview */}
                    <div className="flex flex-col items-center gap-4">
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {name ? name[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {AVATAR_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setAvatarColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${avatarColor === c ? 'border-[#1B3D2F] scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Name</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Dadi, Rahul, Myself"
                          className="w-full p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl focus:outline-none focus:border-[#1B3D2F] font-bold text-[#1B3D2F]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Age Group</label>
                        {(ageGroup === 'INFANT_0_2' || ageGroup === 'CHILD_3_7' || ageGroup === 'CHILD_8_12') && (
                          <div className="mb-4 space-y-3">
                            <div className="p-3 bg-[#FFF0E0] border border-[#E07B2A]/20 rounded-xl flex gap-2">
                              <Info className="w-3 h-3 text-[#E07B2A] flex-shrink-0 mt-0.5" />
                              <p className="text-[9px] text-[#E07B2A] font-medium leading-tight">
                                Note: Nutritional needs for children change rapidly. These alerts are based on standard pediatric guidelines and may not reflect your child's specific requirements.
                              </p>
                            </div>
                            <label className="flex items-start gap-3 p-3 bg-white border border-[#E8DDD0] rounded-xl cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={hasParentalConsent}
                                onChange={(e) => setHasParentalConsent(e.target.checked)}
                                className="mt-1 w-4 h-4 accent-[#1B3D2F]"
                              />
                              <span className="text-[10px] text-[#4A4A4A] leading-tight">
                                I confirm that I am the parent/legal guardian of this child and provide verifiable consent for ReadYourLabels to process their health data as per Section 9 of the DPDP Act 2023.
                              </span>
                            </label>
                          </div>
                        )}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                          {AGE_GROUPS.map(g => (
                            <button
                              key={g.id}
                              onClick={() => setAgeGroup(g.id)}
                              className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all ${ageGroup === g.id ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white' : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'}`}
                            >
                              {g.label} ({g.range})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Gender</label>
                        <div className="flex gap-2">
                          {['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'].map(g => (
                            <button
                              key={g}
                              onClick={() => setGender(g)}
                              className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${gender === g ? 'bg-[#1B3D2F] text-white' : 'bg-[#FDF6EE] border border-[#E8DDD0] text-[#8E9299]'}`}
                            >
                              {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      {CONDITION_GROUPS.filter(g => g.group !== 'Fitness Goals' && g.group !== 'Nutritional').map(group => {
                        const selectedInGroup = group.conditions.filter(c => conditions.includes(c.id));
                        const isExpanded = expandedGroups.includes(group.group);
                        
                        return (
                          <div key={group.group} className="border border-[#E8DDD0] rounded-2xl overflow-hidden bg-[#FDF6EE]">
                            <button 
                              onClick={() => toggleGroup(group.group)}
                              className="w-full p-4 flex items-center justify-between bg-white"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{group.emoji}</span>
                                <span className="text-xs font-bold text-[#1B3D2F] uppercase tracking-wider">{group.group}</span>
                                {selectedInGroup.length > 0 && (
                                  <span className="bg-[#1B3D2F] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {selectedInGroup.length}
                                  </span>
                                )}
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8E9299]" /> : <ChevronDown className="w-4 h-4 text-[#8E9299]" />}
                            </button>
                            
                            {isExpanded && (
                              <div className="p-4 grid grid-cols-1 gap-2 bg-[#FDF6EE]">
                                {(group.group === 'Chronic Conditions' || group.group === 'Diabetes & Blood Sugar') && (
                                  <div className="mb-2 p-3 bg-[#FFF0E0] border border-[#E07B2A]/20 rounded-xl flex gap-2">
                                    <Info className="w-3 h-3 text-[#E07B2A] flex-shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-[#E07B2A] font-medium leading-tight">
                                      Warning: Thresholds for chronic conditions are based on general population averages. Individual medical needs vary significantly; please use this as a general guide only.
                                    </p>
                                  </div>
                                )}
                                {group.conditions.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => toggleCondition(c.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                      conditions.includes(c.id)
                                        ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                                        : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                                    }`}
                                  >
                                    <span className="text-xs font-bold">{c.label}</span>
                                    {conditions.includes(c.id) && <Check className="w-4 h-4" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <button
                        onClick={() => toggleCondition('NONE')}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                          conditions.includes('NONE')
                            ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                            : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">None of the above</span>
                        {conditions.includes('NONE') && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-[#FFF0E0] rounded-2xl flex gap-3 border border-[#E07B2A]/20">
                      <AlertCircle className="w-5 h-5 text-[#E07B2A] flex-shrink-0" />
                      <p className="text-xs text-[#E07B2A] font-medium leading-relaxed">
                        We'll flag any product containing these allergens as <span className="font-bold">UNSAFE</span> regardless of other health benefits.
                      </p>
                    </div>

                    {/* Food allergens */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B6F47]">Food & Ingredient Allergens</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALLERGEN_OPTIONS.filter(a => !['FRAGRANCE_ALLERGY','NICKEL_ALLERGY','LATEX_ALLERGY','LANOLIN_ALLERGY','PARABENS_SENSITIVITY'].includes(a.id)).map(allergen => (
                        <button
                          key={allergen.id}
                          onClick={() => toggleAllergen(allergen.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                            allergens.includes(allergen.id)
                              ? 'bg-[#D94F3D] border-[#D94F3D] text-white'
                              : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                          }`}
                        >
                          <span className="text-lg">{allergen.emoji}</span>
                          <span className="text-xs font-bold">{allergen.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Skin / topical sensitisers */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B6F47] mt-2">Skin & Topical Sensitivities</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALLERGEN_OPTIONS.filter(a => ['FRAGRANCE_ALLERGY','NICKEL_ALLERGY','LATEX_ALLERGY','LANOLIN_ALLERGY','PARABENS_SENSITIVITY'].includes(a.id)).map(allergen => (
                        <button
                          key={allergen.id}
                          onClick={() => toggleAllergen(allergen.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                            allergens.includes(allergen.id)
                              ? 'bg-[#D94F3D] border-[#D94F3D] text-white'
                              : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                          }`}
                        >
                          <span className="text-lg">{allergen.emoji}</span>
                          <span className="text-xs font-bold">{allergen.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => toggleAllergen('NONE')}
                      className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                        allergens.includes('NONE')
                          ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                          : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">No known allergies</span>
                      {allergens.includes('NONE') && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-bold text-[#1B3D2F] mb-4 uppercase tracking-widest">Activity Level</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {ACTIVITY_LEVELS.map(level => (
                          <button
                            key={level.id}
                            onClick={() => setActivityLevel(level.id)}
                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                              activityLevel === level.id
                                ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                                : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                            }`}
                          >
                            <span className="text-2xl">{level.emoji}</span>
                            <div>
                              <p className="text-xs font-bold">{level.label}</p>
                              <p className={`text-[9px] mt-1 leading-tight ${activityLevel === level.id ? 'text-white/70' : 'text-[#8E9299]'}`}>{level.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#1B3D2F] mb-4 uppercase tracking-widest">Dietary Preference</h4>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_PREFERENCES_UI.map(pref => (
                          <button
                            key={pref.id}
                            onClick={() => setDietaryPreference(pref.id)}
                            className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                              dietaryPreference === pref.id
                                ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                                : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                            }`}
                          >
                            {pref.emoji} {pref.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#1B3D2F] mb-4 uppercase tracking-widest">Health Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {HEALTH_GOALS_UI.map(goal => (
                          <button
                            key={goal.id}
                            onClick={() => toggleHealthGoal(goal.id)}
                            className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                              healthGoals.includes(goal.id)
                                ? 'bg-[#1B3D2F] border-[#1B3D2F] text-white'
                                : 'bg-white border-[#E8DDD0] text-[#1B3D2F]'
                            }`}
                          >
                            {goal.emoji} {goal.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-8">
                    <div className="w-16 h-16 bg-[#E6F4EC] rounded-3xl flex items-center justify-center mb-2">
                      <ShieldCheck className="text-[#2E7D4F] w-8 h-8" />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-[#1B3D2F]">Consent Notice</h4>
                      <p className="text-sm text-[#4A4A4A] leading-relaxed">
                        To provide personalized safety alerts, we collect data including age, gender, and health conditions (like allergies or chronic illnesses). This data is used solely for our multi-persona logic to calculate safety scores specific to each family member.
                      </p>
                      <p className="text-sm text-[#4A4A4A] leading-relaxed">
                        You can withdraw your consent at any time by deleting this profile or your entire account through the 'Delete My Data' option.
                      </p>
                      
                      <div className="pt-4 space-y-4">
                        <label className="flex items-start gap-3 p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={hasConsented}
                            onChange={e => setHasConsented(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-[#E8DDD0] text-[#1B3D2F] focus:ring-[#1B3D2F]"
                          />
                          <span className="text-xs font-medium text-[#1B3D2F] leading-relaxed">
                            I consent to the processing of this personal data for the purpose of health safety analysis.
                          </span>
                        </label>

                        {(ageGroup === 'INFANT_0_2' || ageGroup === 'CHILD_3_7' || ageGroup === 'CHILD_8_12' || ageGroup === 'TEEN_13_17') && (
                          <div className="space-y-4">
                            <div className="p-4 bg-[#FFF0E0] border border-[#E07B2A]/20 rounded-2xl">
                              <h5 className="text-xs font-bold text-[#E07B2A] uppercase tracking-widest mb-2">Parental Consent Required</h5>
                              <p className="text-[11px] text-[#E07B2A] font-medium leading-relaxed">
                                As this profile is for a minor (under 18), India's DPDP Act 2023 requires verifiable consent from a parent or lawful guardian.
                              </p>
                            </div>
                            
                            <label className="flex items-start gap-3 p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={hasParentalConsent}
                                onChange={e => setHasParentalConsent(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-[#E8DDD0] text-[#1B3D2F] focus:ring-[#1B3D2F]"
                              />
                              <span className="text-xs font-medium text-[#1B3D2F] leading-relaxed">
                                I confirm that I am the parent/lawful guardian of this individual and consent to the processing of their personal data.
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Summary Bar (Step 2 & 3) */}
              {(step === 2 || step === 3) && (
                <div className="absolute bottom-24 left-0 right-0 px-6 py-3 bg-white/80 backdrop-blur-md border-t border-[#FDF6EE] flex justify-between items-center z-10">
                  <span className="text-xs font-bold text-[#1B3D2F]">
                    {step === 2 ? `${conditions.length} conditions selected` : `${allergens.length} allergens selected`}
                  </span>
                  {((step === 2 && conditions.length === 0) || (step === 3 && allergens.length === 0)) && (
                    <button 
                      onClick={() => setStep(step + 1)}
                      className="text-xs font-bold text-[#1B3D2F] underline"
                    >
                      Skip this step
                    </button>
                  )}
                </div>
              )}

              {/* Navigation Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-[#FDF6EE] flex gap-3">
                {step > 1 ? (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-4 bg-white border border-[#E8DDD0] text-[#1B3D2F] font-bold rounded-2xl active:scale-95 transition-all"
                  >
                    Back
                  </button>
                ) : (
                  <button 
                    onClick={() => { setEditingProfile(null); setIsAdding(false); }}
                    className="flex-1 py-4 bg-white border border-[#E8DDD0] text-[#1B3D2F] font-bold rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                )}

                {step < 5 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    disabled={step === 1 && !name.trim()}
                    className={`flex-1 py-4 bg-[#1B3D2F] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all ${step === 1 && !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Continue
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    disabled={!hasConsented || ((ageGroup === 'INFANT_0_2' || ageGroup === 'CHILD_3_7' || ageGroup === 'CHILD_8_12' || ageGroup === 'TEEN_13_17') && !hasParentalConsent)}
                    className={`flex-1 py-4 bg-[#1B3D2F] text-white font-bold rounded-2xl shadow-lg shadow-[#1B3D2F]/20 active:scale-95 transition-all ${(!hasConsented || ((ageGroup === 'INFANT_0_2' || ageGroup === 'CHILD_3_7' || ageGroup === 'CHILD_8_12' || ageGroup === 'TEEN_13_17') && !hasParentalConsent)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Save Profile
                  </button>
                )}
              </div>

              {/* Toast */}
              <AnimatePresence>
                {toast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[#1B3D2F] text-white px-6 py-3 rounded-full font-bold shadow-xl z-[100]"
                  >
                    {toast}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Processing = ({ isSearch = false, onBack }: { isSearch?: boolean, onBack: () => void }) => {
  const [step, setStep] = useState(0);
  const scanSteps = [
    "Reading label with OCR...",
    "Detecting product category...",
    "Identifying ingredients...",
    "Cross-checking marketing claims...",
    "Generating safety verdict..."
  ];

  const searchSteps = [
    "Searching for product details...",
    "Fetching ingredients list...",
    "Retrieving nutritional table...",
    "Analyzing safety data...",
    "Generating safety verdict..."
  ];

  const steps = isSearch ? searchSteps : scanSteps;

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 h-10 pl-3 pr-5 rounded-full bg-white border border-[#E8DDD0] text-[#1B3D2F] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-bold">Cancel</span>
        </button>
      </div>
      <Breadcrumbs phase="processing" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative w-24 h-24 mb-12">
        <div className="absolute inset-0 border-4 border-[#E8DDD0] rounded-full" />
        <div className="absolute inset-0 border-4 border-[#1B3D2F] rounded-full border-t-transparent animate-ryl-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-[#1B3D2F]" />
        </div>
      </div>
      
      <div className="space-y-4 w-full max-w-xs">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${i > step ? 'opacity-20' : 'opacity-100'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-[#1B3D2F] text-white' : i === step ? 'border-2 border-[#1B3D2F] text-[#1B3D2F]' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-[#1B3D2F]' : 'text-gray-500'}`}>{s}</span>
          </div>
        ))}
      </div>
      
      <p className="mt-12 text-xs text-gray-400 font-medium uppercase tracking-widest">
        FSSAI · ICMR-NIN · CDSCO · BIS
      </p>
    </div>
  </div>
);
};

const BreakdownItem = ({ label, explanation, impact, impactColor }: { label: string; explanation: string; impact?: number | null; impactColor?: string }) => {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = explanation.length > 90;
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <h5 className="text-sm font-bold text-[#1B3D2F]">{label}</h5>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {isLong && !expanded ? explanation.slice(0, 90) + '…' : explanation}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] font-bold text-[#D4871E] mt-0.5 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      {impact != null && impact !== 0 && (
        <span className={`text-xs font-bold font-mono mt-1 whitespace-nowrap ${impactColor || (impact < 0 ? 'text-[#D94F3D]' : 'text-[#2E7D4F]')}`}>
          {impact > 0 ? `+${impact}` : impact}
        </span>
      )}
    </div>
  );
};

const ScoreBreakdown = ({ score, concerns, baseScore, profileName, productBreakdown }: any) => {
  return (
    <div className="space-y-6 p-1 max-h-[60vh] overflow-y-auto no-scrollbar">
      {/* Product Level Breakdown */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Analysis</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impact</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-[#1B3D2F]">Starting Score</span>
          <span className="font-mono font-bold text-gray-400">100</span>
        </div>

        {(!productBreakdown || productBreakdown.length === 0) && (
          <div className="py-3 px-4 bg-[#FDF6EE] rounded-2xl border border-dashed border-[#E8DDD0]">
            <p className="text-xs text-gray-500 leading-relaxed">No specific deductions or bonuses were identified — score reflects the baseline for this product category.</p>
          </div>
        )}
        {(productBreakdown || []).map((item: any, i: number) => (
          <React.Fragment key={i}>
            <BreakdownItem label={item.label} explanation={item.explanation} impact={item.impact} />
          </React.Fragment>
        ))}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-sm font-bold text-[#1B3D2F]">Base Product Score</span>
          <span className="font-mono font-bold text-[#1B3D2F] text-lg">{baseScore}</span>
        </div>
      </div>

      {/* Profile Level Breakdown */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personalization for {profileName}</span>
        </div>

        {concerns.length > 0 ? (
          <div className="space-y-4">
            {concerns.map((c: any, i: number) => (
              <React.Fragment key={i}>
                <BreakdownItem label={c.label} explanation={c.detail} impact={c.impact} />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center text-center gap-2 bg-[#FDF6EE] rounded-2xl border border-dashed border-[#E8DDD0]">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D4F]" />
            <p className="text-xs font-bold text-[#1B3D2F]">No additional adjustments for this profile.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mt-4 sticky bottom-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-[#1B3D2F] uppercase tracking-tight">Final Verdict</span>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-xl ${
            score >= 70 ? 'bg-[#E6F4EC] text-[#2E7D4F]' : 
            score >= 40 ? 'bg-[#FFF3DC] text-[#D4871E]' : 
            'bg-[#FDECEA] text-[#D94F3D]'
          }`}>
            {score}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultScreen = ({ 
  result, 
  profiles, 
  onBack, 
  user, 
  onSearch, 
  onProfileClick,
  onSignUp,
  onSignIn,
  hasDismissedNudge,
  onDismissNudge
}: { 
  result: any, 
  profiles: Profile[], 
  onBack: () => void, 
  user: any, 
  onSearch: (name: string) => void, 
  onProfileClick: () => void,
  onSignUp: () => void,
  onSignIn: () => void,
  hasDismissedNudge: boolean,
  onDismissNudge: () => void
}) => {
  const [activeProfile, setActiveProfile] = useState<Profile>(profiles[0] || { 
    id: 'guest', 
    name: 'Guest', 
    display_name: 'Guest',
    avatar_color: '#1B3D2F',
    avatar_letter: 'G',
    age_group: 'ADULT_26_45',
    gender: 'MALE',
    activity_level: 'MODERATELY_ACTIVE',
    conditions: ['NONE'],
    allergens: [],
    dietary_preference: 'NO_RESTRICTION',
    health_goals: ['NONE'],
    isDefault: false 
  });
  const [showFamilyNudge, setShowFamilyNudge] = useState(
    profiles.length === 0  // show nudge if user has no profiles
  );
  const [expandedIng, setExpandedIng] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSignUpNudge, setShowSignUpNudge] = useState(false);
  const [showFamilyBanner, setShowFamilyBanner] = useState(profiles.length === 0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && result) {
      recordScanEvent(result, user.uid, 'GENERAL');
    }
  }, [result, user]);

  useEffect(() => {
    if (!user && !hasDismissedNudge && result) {
      const timer = setTimeout(() => {
        setShowSignUpNudge(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, hasDismissedNudge, result]);

  // Update active profile if it was changed/deleted (fallback to first)
  useEffect(() => {
    const exists = profiles.find(p => p.id === activeProfile?.id);
    if (profiles.length === 0) return; // guest — keep the fallback profile
    if (!exists) setActiveProfile(profiles[0]);
    else setActiveProfile(exists); // Update in case name/conditions changed
  }, [profiles]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showChat) scrollToBottom();
  }, [chatMessages, showChat]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const msg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsTyping(true);

    try {
      const reply = await chatAboutProduct(result, msg, activeProfile, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getProfileVerdict = (profile: Profile) => {
    // Map local Profile to FamilyProfile for the engine
    const familyProfile: any = {
      ...profile,
      display_name: profile.name,
      avatar_emoji: '👤',
      age_group: profile.age_group,
      activity_level: profile.activity_level,
      health_conditions: profile.conditions || [],
      allergens: profile.allergens || [],
      dietary_preference: profile.dietary_preference || 'NO_RESTRICTION',
      health_goals: profile.health_goals || []
    };

    // Normalise ingredients to the shape profileScoringEngine expects
    const normalisedIngredients = (result.ingredients || [])
      .filter(Boolean)
      .map((ing: any) => ({
        name: ing.name || ing.plain_name || 'Unknown',
        safety_tier: ing.safety_tier || 'UNVERIFIED',
        flag_for: Array.isArray(ing.flag_for) ? ing.flag_for : [],
        function: ing.function || '',
        plain_explanation: ing.plain_explanation || '',
        common_names: Array.isArray(ing.common_names) ? ing.common_names : [],
        condition_flags: Array.isArray(ing.condition_flags) ? ing.condition_flags : [],
        score_impact: ing.score_impact ?? 0,
        data_quality: ing.data_quality || 'LLM_GENERATED',
      }));

    const verdict = calculateProfileVerdict(
      familyProfile,
      result.overall_score,
      normalisedIngredients,
      result.nutrition || null,
      result.allergens || [],
      result.category || 'FOOD'
    );

    return { 
      score: verdict.profile_score, 
      concerns: verdict.concerns.map(c => ({ 
        ...c, 
        impact: typeof c.impact === 'number' ? c.impact : (c.severity === 'HIGH' ? -15 : c.severity === 'MODERATE' ? -8 : -3) 
      })), 
      baseScore: result.overall_score 
    };
  };

  const defaultProfile: Profile = {
    id: 'default',
    name: 'You',
    display_name: 'You',
    avatar_color: '#1B3D2F',
    avatar_letter: 'Y',
    age_group: 'ADULT_26_45',
    gender: 'PREFER_NOT_TO_SAY',
    isDefault: true,
    conditions: [],
    allergens: [],
    dietary_preference: 'NO_RESTRICTION',
    health_goals: [],
    activity_level: 'MODERATELY_ACTIVE',
  };
  const currentVerdict = getProfileVerdict(activeProfile || defaultProfile);

  return (
    <div className="flex flex-col h-full bg-[#FDF6EE]">
      <Breadcrumbs phase="result" />
      <header className="sticky top-0 z-10 bg-[#1B3D2F] text-white p-6 pb-8 rounded-b-[40px] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            {profiles.length > 0 && profiles.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProfile(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeProfile?.id === p.id ? 'bg-white scale-110 shadow-lg' : 'bg-white/10 opacity-50'}`}
              >
                <ProfileAvatar profile={p} size="md" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold leading-tight mb-1">
              {result.product_name && result.product_name.toLowerCase() !== 'unknown' ? result.product_name : 'Scanned Product'}
            </h2>
            <p className="text-white/60 text-sm font-medium">
              {result.brand && result.brand.toLowerCase() !== 'unknown' ? result.brand : 'Brand not identified — add front of pack for full details'}
            </p>
            
            {/* HFSS & UPF Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {result.hfss_status === 'RED' && (
                <span className="bg-[#D94F3D] text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/20 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> HFSS (High Risk)
                </span>
              )}
              {result.is_upf && (
                <span className="bg-[#E07B2A] text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/20 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Ultra-Processed (UPF)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setShowBreakdown(true)}
              className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-all group"
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle 
                  cx="40" cy="40" r="36" fill="none" 
                  stroke={currentVerdict.score >= 70 ? '#2E7D4F' : currentVerdict.score >= 40 ? '#E07B2A' : '#D94F3D'} 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentVerdict.score / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-mono text-2xl font-bold">{currentVerdict.score}</span>
              <div className="absolute -bottom-1 -right-1 bg-white text-[#1B3D2F] rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="w-3 h-3" />
              </div>
            </button>
            <button 
              onClick={() => setShowBreakdown(true)}
              className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60 hover:opacity-100 transition-opacity underline underline-offset-2"
            >
              WHY THIS SCORE?
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {/* Summary */}
        <div className="bg-[#E8DDD0]/30 p-6 rounded-[32px] border border-[#E8DDD0] shadow-sm">
          <p className="text-[#1B3D2F] font-medium leading-relaxed italic">
            "{result.summary}"
          </p>
        </div>

        {/* Claim Unmasker */}
        {(result.claim_checks || []).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-4 h-4 text-[#D4871E]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Claim Unmasker</h3>
            </div>
            <div className="bg-white rounded-[32px] border border-[#E8DDD0] overflow-hidden">
              {(result.claim_checks || []).map((c: any, i: number) => (
                <div key={i} className={`p-5 ${i > 0 ? 'border-t border-[#FDF6EE]' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Claim: "{c.claim}"</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      c.verdict === 'CONFIRMED' ? 'bg-[#E6F4EC] text-[#2E7D4F]' :
                      c.verdict === 'MISLEADING' ? 'bg-[#FDECEA] text-[#D94F3D]' : 'bg-[#FFF0E0] text-[#E07B2A]'
                    }`}>
                      {c.verdict}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1B3D2F] mb-1">{c.explanation}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition */}
        {(result.category === 'FOOD' || result.category === 'SUPPLEMENT' || result.category === 'PET_FOOD') && (() => {
          const n = result.nutrition;
          // Check if any real nutrition data exists (calories > 0 means a nutrition panel was in the image)
          const hasRealNutrition = n && (n.energy_kcal ?? 0) > 0;
          return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Info className="w-4 h-4 text-[#1B3D2F]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Nutrition per 100g</h3>
            </div>
            {hasRealNutrition ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Calories',
                    val: (n!.energy_kcal ?? 0) > 0 ? `${n!.energy_kcal} kcal` : '—',
                    sub: 'per 100g',
                    color: 'bg-white',
                    icon: '🔥'
                  },
                  {
                    label: 'Sugar',
                    val: n!.sugar_g != null ? `${n!.sugar_g}g` : '—',
                    sub: (n!.sugar_g || 0) > 20 ? 'Very High' : (n!.sugar_g || 0) > 10 ? 'High' : 'OK',
                    color: (n!.sugar_g || 0) > 10 ? 'bg-[#FDECEA] text-[#D94F3D]' : 'bg-white',
                    icon: '🍬'
                  },
                  {
                    label: 'Sodium',
                    val: n!.sodium_mg != null ? `${n!.sodium_mg}mg` : '—',
                    sub: (n!.sodium_mg || 0) > 800 ? 'Very High' : (n!.sodium_mg || 0) > 500 ? 'High' : 'OK',
                    color: (n!.sodium_mg || 0) > 500 ? 'bg-[#FFF3DC] text-[#D4871E]' : 'bg-white',
                    icon: '🧂'
                  },
                  {
                    label: 'Protein',
                    val: n!.protein_g != null ? `${n!.protein_g}g` : '—',
                    sub: (n!.protein_g || 0) > 20 ? 'High ✓' : (n!.protein_g || 0) > 10 ? 'Good ✓' : 'Low',
                    color: (n!.protein_g || 0) > 10 ? 'bg-[#E6F4EC] text-[#2E7D4F]' : 'bg-white',
                    icon: '💪'
                  },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-[20px] border border-[#E8DDD0] flex items-center gap-3 shadow-sm ${item.color}`}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-lg font-mono font-bold tracking-tight leading-none">{item.val}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{item.label}</div>
                      <div className="text-[9px] opacity-50 mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-[#E8DDD0] rounded-[20px] p-5 flex items-center gap-3 text-center justify-center">
                <div>
                  <p className="text-sm font-bold text-[#1B3D2F]">Nutrition panel not in image</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Add a photo of the nutrition facts table to see calories, sugar, sodium &amp; protein.</p>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-[#1B3D2F]" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Ingredient Breakdown</h3>
          </div>
          <div className="bg-white rounded-[32px] border border-[#E8DDD0] overflow-hidden">
            {(result.ingredients || []).filter((ing: any) => ing && (ing.name || ing.plain_name)).length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <div>
                  <p className="font-bold text-[#1B3D2F] text-sm">Ingredients Not Readable</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">The ingredients list could not be read from this image. Try scanning a clearer photo of the back label, or use the search feature instead.</p>
                </div>
              </div>
            ) : null}
            {(() => {
              // Deduplicate by name client-side as a safety net
              const seen = new Set<string>();
              return (result.ingredients || []).filter((ing: any) => {
                if (!ing || (!ing.name && !ing.plain_name)) return false;
                const key = (ing.plain_name || ing.name || '').toLowerCase().trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            })().map((ing: any, i: number) => {
              const ingName = ing.plain_name || ing.name || '';
              const positionKey = getPositionWatchMatch(ingName);
              const isPositionConcern = i < 3 && !!positionKey;
              const displayTier = getPositionAwareTier(ingName, i, ing.safety_tier);
              const positionNote = isPositionConcern
                ? POSITION_WATCH[positionKey!].replace('{ord}', ORDINALS[i])
                : null;

              return (
                <div
                  key={i}
                  onClick={() => setExpandedIng(expandedIng === i ? null : i)}
                  className={`p-5 transition-colors ${expandedIng === i ? 'bg-[#FDF6EE]' : ''} ${i > 0 ? 'border-t border-[#FDF6EE]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#1B3D2F]">{ingName}</h4>
                        {isPositionConcern && (
                          <span className="text-[9px] font-bold bg-[#FFF3DC] text-[#D4871E] px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                            {ORDINALS[i]} ingredient
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{ing.function}</p>
                    </div>
                    <TierBadge tier={displayTier} />
                  </div>
                  <AnimatePresence>
                    {expandedIng === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {positionNote && (
                          <div className="mt-3 p-3 bg-[#FFF3DC] border border-[#E07B2A]/20 rounded-xl">
                            <p className="text-[11px] text-[#D4871E] font-semibold leading-relaxed">
                              ⚠ {positionNote}
                            </p>
                          </div>
                        )}
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                          {ing.plain_explanation}
                        </p>
                        {ing.flag_for?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ing.flag_for.map((f: string, j: number) => (
                              <span key={j} className="text-[10px] font-bold bg-[#FDECEA] text-[#D94F3D] px-2 py-0.5 rounded-md">
                                ⚠ {f}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Data quality indicator */}
                        <p className="mt-3 text-[9px] text-gray-300 leading-relaxed">
                          {ing.data_quality === 'LLM_GENERATED'
                            ? '⚠ AI-analysed · not from regulatory database · verify independently'
                            : '✓ Verified against FSSAI / CDSCO / WHO regulatory database'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* India Context */}
        <div className="p-6 bg-[#FFF3DC] rounded-[32px] border border-[#D4871E]/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🇮🇳</span>
            <h3 className="font-bold text-[#D4871E]">India Context</h3>
          </div>
          <p className="text-sm text-[#D4871E] font-medium leading-relaxed">
            {result.india_context}
          </p>
        </div>

        {/* Smarter Switch */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-[#D4871E]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Smarter Switch</h3>
            </div>
            <div className="bg-white rounded-[32px] border border-[#E8DDD0] overflow-hidden">
              {result.suggestions.map((s: any, i: number) => {
                const suggestion = typeof s === 'string' ? { name: s, reason: 'A healthier alternative.', type: 'GENERIC' } : s;
                if (!suggestion.name) return null;
                return (
                  <div key={i} className={`p-5 ${i > 0 ? 'border-t border-[#FDF6EE]' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#E6F4EC] text-[#2E7D4F]">
                        Natural Alternative
                      </span>
                    </div>
                    <h4 className="font-bold text-[#1B3D2F] mb-1">{suggestion.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{suggestion.reason}</p>
                  </div>
                );
              })}
              <div className="p-4 bg-gray-50 border-t border-[#FDF6EE]">
                <p className="text-[9px] text-gray-400 text-center leading-relaxed italic">
                  Suggestions are based solely on nutritional data and FSSAI standards. No brand has paid for this recommendation.
                </p>
              </div>
            </div>
          </div>
        )}

        <AlsoScanned 
          currentProductId={normaliseProductId(result.product_name, result.brand)}
          category={result.category}
          subCategory={detectSubCategory(result.product_name, result.category)}
          profileType="GENERAL"
          currentScore={result.overall_score}
          onScanSuggested={(name) => onSearch(name)}
        />

        {showFamilyNudge && profiles.length === 0 && (
          <div className="bg-[#FFF3DC] rounded-[28px] border border-[#D4871E]/30 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">👨👩👧</span>
                <div>
                  <h4 className="font-bold text-[#1B3D2F] text-sm mb-1">
                    Shopping for your family?
                  </h4>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed">
                    Add Dadi, kids, or anyone with health conditions. 
                    Same scan — personalised scores for everyone.
                  </p>
                  <button
                    onClick={onProfileClick}
                    className="mt-3 text-xs font-bold text-[#D4871E] flex items-center gap-1"
                  >
                    Set up family profiles →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowFamilyNudge(false)}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E8DDD0] flex items-center justify-center"
              >
                <X className="w-3 h-3 text-[#8E9299]" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 mb-2 text-center px-6">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {result.category === 'FOOD' || result.category === 'SUPPLEMENT' ? 
              "Analysis based on FSSAI, ICMR-NIN 2024, and Codex Alimentarius standards." :
              result.category === 'COSMETIC' || result.category === 'PERSONAL_CARE' ?
              "Analysis based on CDSCO, BIS, and EU Cosmetics Regulation standards." :
              result.category === 'PET_FOOD' ?
              "Analysis based on BIS and AAFCO (Global) pet food standards." :
              result.category === 'HOUSEHOLD' ?
              "Analysis based on BIS and EPA safety standards." :
              "Analysis based on FSSAI, CDSCO, and global safety standards."
            }
          </p>
        </div>

        {currentVerdict.score < 70 && (
          <div className="mb-4 px-6">
            <div className="p-4 bg-white border border-[#E8DDD0] rounded-2xl flex gap-3">
              <ShieldAlert className="w-4 h-4 text-[#D94F3D] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                <span className="font-bold text-[#D94F3D]">Disclaimer:</span> This score is for informational purposes only. It does not account for individual medical history or specific health needs. Always consult your doctor before consuming products flagged with concerns.
              </p>
            </div>
          </div>
        )}

        <Button onClick={onBack} className="w-full py-4">
          Scan Another Product
        </Button>
      </div>

      {/* Chat Button */}
      {!showChat && (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#1B3D2F] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-20"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-30 bg-[#FDF6EE] flex flex-col"
          >
            <header className="p-6 bg-[#1B3D2F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold">Knowledgeable Friend</h3>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">Deep Dive Analysis</p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[#D4871E]" />
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {chatMessages.length === 0 && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-[#E8DDD0] shadow-sm">
                    <p className="text-[#1B3D2F] font-medium leading-relaxed">
                      "Hi! I'm your knowledgeable friend. Ask me anything about this {result.product_name}. For example:"
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Is this safe for children?",
                      "Why did this score low?",
                      "What is INS 102?",
                      "Is the 'No Added Sugar' claim true?"
                    ].map((q, i) => (
                      <button 
                        key={i}
                        onClick={() => { setUserInput(q); }}
                        className="text-left p-4 rounded-2xl bg-white border border-[#E8DDD0] text-sm font-medium text-[#1B3D2F] active:bg-gray-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl ${
                    m.role === 'user' 
                      ? 'bg-[#1B3D2F] text-white rounded-tr-none' 
                      : 'bg-white text-[#1B3D2F] border border-[#E8DDD0] rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl border border-[#E8DDD0] rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#1B3D2F] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#1B3D2F] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[#1B3D2F] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-[#E8DDD0] flex gap-2">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3D2F]"
              />
              <button 
                onClick={handleSendMessage}
                className="w-12 h-12 bg-[#1B3D2F] text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Breakdown Modal */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1B3D2F] via-[#D4871E] to-[#D94F3D]" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1B3D2F]">Score Breakdown</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">For {activeProfile?.name ?? 'You'}</p>
                </div>
                <button 
                  onClick={() => setShowBreakdown(false)}
                  className="w-10 h-10 rounded-full bg-[#FDF6EE] flex items-center justify-center text-[#1B3D2F] active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ScoreBreakdown 
                score={currentVerdict.score} 
                concerns={currentVerdict.concerns} 
                baseScore={currentVerdict.baseScore}
                profileName={activeProfile?.name ?? 'You'}
                productBreakdown={result.score_breakdown}
              />

              <button 
                onClick={() => setShowBreakdown(false)}
                className="w-full mt-8 py-4 bg-[#1B3D2F] text-white font-bold rounded-2xl shadow-lg shadow-[#1B3D2F]/20 active:scale-95 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Up Nudge Bottom Sheet */}
      <AnimatePresence>
        {showSignUpNudge && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]"
              onClick={() => {
                setShowSignUpNudge(false);
                onDismissNudge();
              }}
            />
            
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-8 pt-4 max-w-md mx-auto"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-[#1B3D2F]">Save this result?</h3>
                <button 
                  onClick={() => {
                    setShowSignUpNudge(false);
                    onDismissNudge();
                  }}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-[#4A4A4A] leading-relaxed">
                  You're scanning as a guest. Sign up free to:
                </p>
                <ul className="space-y-3">
                  {[
                    "Save your scan history",
                    "Add family profiles for personalised scores",
                    "Access results anytime across devices"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-[#1B3D2F]">
                      <div className="text-[#2E7D4F] mt-0.5">✓</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    setShowSignUpNudge(false);
                    onDismissNudge();
                    onSignUp();
                  }} 
                  className="w-full py-4 bg-[#1B3D2F] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  Create Free Account
                </Button>
                
                <button 
                  onClick={() => {
                    setShowSignUpNudge(false);
                    onDismissNudge();
                    onSignIn();
                  }}
                  className="w-full text-center text-xs font-bold text-gray-400 hover:text-[#1B3D2F] transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

const NoResults = ({ query, onRetry, onScan }: { query: string, onRetry: () => void, onScan: () => void }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
      <div className="w-20 h-20 bg-[#FFF9F2] rounded-full flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-[#D4871E]" />
      </div>
      <h2 className="text-2xl font-bold text-[#1B3D2F] mb-3">Product Not Found</h2>
      <p className="text-[#8E9299] mb-8 leading-relaxed max-w-[280px]">
        We couldn't find reliable ingredient data for <span className="font-bold text-[#1B3D2F]">"{query}"</span> in our search.
      </p>
      
      <div className="w-full space-y-4 max-w-[320px]">
        <div className="p-5 bg-[#FFF9F2] rounded-2xl text-left border border-[#FDF6EE]">
          <h4 className="font-bold text-[#1B3D2F] text-sm mb-3">Try these instead:</h4>
          <ul className="text-xs text-[#8E9299] space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] shrink-0" />
              Check for spelling errors.
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] shrink-0" />
              Add the brand name (e.g., "Parle-G Biscuits").
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] shrink-0" />
              Scan the product label for 100% accuracy.
            </li>
          </ul>
        </div>

        <Button onClick={onScan} className="w-full flex items-center justify-center gap-2 py-4">
          <Camera className="w-5 h-5" /> Scan Product Label
        </Button>
        
        <Button onClick={onRetry} variant="secondary" className="w-full py-4 border-[#E8DDD0]">
          Try Another Search
        </Button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [phase, setPhase] = useState<AppPhase>('onboarding');
  const [result, setResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [appToast, setAppToast] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const [isSearch, setIsSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasDismissedNudge, setHasDismissedNudge] = useState(false);
  const [cameFromOnboarding, setCameFromOnboarding] = useState(false);

  // --- Auth & Data Listeners ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Migrate guest profiles from localStorage to Firestore on sign-in
        const raw = localStorage.getItem('ryl_guest_profiles') || localStorage.getItem('guest_profiles');
        if (raw) {
          try {
            const guestProfiles: Profile[] = JSON.parse(raw);
            if (guestProfiles.length > 0) {
              await Promise.all(
                guestProfiles.map(p => {
                  const { id: _id, userId: _uid, ...profileData } = p as any;
                  return addDoc(collection(db, `users/${u.uid}/profiles`), profileData);
                })
              );
              localStorage.removeItem('ryl_guest_profiles');
              localStorage.removeItem('guest_profiles');
              setAppToast('Your profiles have been saved to your account ✓');
            }
          } catch (e) {
            console.error('Guest profile migration failed:', e);
          }
        }
        if (phase === 'onboarding' || phase === 'auth' || phase === 'signup') {
          setPhase('home');
        }
      }
    });
    return () => unsubscribe();
  }, [phase]);

  // Profiles Listener
  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      const localProfiles = localStorage.getItem('ryl_guest_profiles') || localStorage.getItem('guest_profiles');
      if (localProfiles) {
        try {
          setProfiles(JSON.parse(localProfiles));
        } catch (e) {
          console.error("Failed to parse local profiles", e);
          setProfiles([]);
        }
      } else {
        setProfiles([]);
      }
      return;
    }

    const q = query(collection(db, `users/${user.uid}/profiles`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
      setProfiles(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles`);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // History Listener
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, `users/${user.uid}/scans`), 
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScans(sList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/scans`);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleAnalyse = async (files: { front: File | null, back: File }) => {
    setIsSearch(false);
    setPhase('processing');
    try {
      const backBase64 = await fileToBase64(files.back);
      const frontBase64 = files.front ? await fileToBase64(files.front) : undefined;
      
      // Always send as image/jpeg (canvas compression output)
      const analysis = await analyseLabel(
        backBase64,
        'image/jpeg',
        frontBase64,
        frontBase64 ? 'image/jpeg' : undefined
      );
      
      if (!analysis || analysis.product_name === "Unknown Product" || analysis.product_name === "__ERROR__") {
        const errMsg = analysis?.summary && analysis.product_name === "__ERROR__"
          ? analysis.summary
          : "Could not read the label. Please try again with a clearer photo.";
        throw new Error(errMsg);
      }

      const safeAnalysis = {
        ...analysis,
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.filter(Boolean) : [],
        ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients.filter(Boolean) : [],
        score_breakdown: Array.isArray(analysis.score_breakdown) ? analysis.score_breakdown.filter(Boolean) : [],
        claim_checks: Array.isArray(analysis.claim_checks) ? analysis.claim_checks.filter(Boolean) : [],
        front_claims_detected: Array.isArray(analysis.front_claims_detected) ? analysis.front_claims_detected.filter(Boolean) : [],
        unverified_ingredients: Array.isArray(analysis.unverified_ingredients) ? analysis.unverified_ingredients.filter(Boolean) : [],
      };
      setResult(safeAnalysis);
      setPhase('result');

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/scans`), {
          productName: analysis.product_name,
          brand: analysis.brand,
          category: analysis.category,
          overallScore: analysis.overall_score,
          summary: analysis.summary,
          resultJson: JSON.stringify(analysis),
          userId: user.uid,
          timestamp: Timestamp.now()
        });
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      setAppError(error?.message || "Analysis failed. Please try again.");
      setPhase('home');
    }
  };

  // Compress image to JPEG ≤1200px wide, quality 0.82 — keeps files well under Vercel's 4.5 MB limit
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
          else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  };

  const handleSearch = async (name: string) => {
    setIsSearch(true);
    setSearchQuery(name);
    setPhase('processing');
    try {
      const analysis = await searchProductByName(name);

      // API/network error — show the real message, don't silently show no-results
      if (analysis?.product_name === '__ERROR__') {
        setAppError(analysis.summary || 'Search failed. Please try again.');
        setPhase('home');
        return;
      }

      // Genuine not found (all fallbacks exhausted, no ingredients found)
      if (!analysis || analysis.product_name === "Unknown Product") {
        setPhase('no-results');
        return;
      }

      const safeAnalysis = {
        ...analysis,
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.filter(Boolean) : [],
        ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients.filter(Boolean) : [],
        score_breakdown: Array.isArray(analysis.score_breakdown) ? analysis.score_breakdown.filter(Boolean) : [],
        claim_checks: Array.isArray(analysis.claim_checks) ? analysis.claim_checks.filter(Boolean) : [],
        front_claims_detected: Array.isArray(analysis.front_claims_detected) ? analysis.front_claims_detected.filter(Boolean) : [],
        unverified_ingredients: Array.isArray(analysis.unverified_ingredients) ? analysis.unverified_ingredients.filter(Boolean) : [],
      };
      setResult(safeAnalysis);
      setPhase('result');

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/scans`), {
          productName: analysis.product_name,
          brand: analysis.brand,
          category: analysis.category,
          overallScore: analysis.overall_score,
          summary: analysis.summary,
          resultJson: JSON.stringify(analysis),
          userId: user.uid,
          timestamp: Timestamp.now()
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setAppError(error?.message || 'Search failed. Please try again.');
      setPhase('home');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-md mx-auto h-screen bg-[#FDF6EE] shadow-2xl relative overflow-hidden flex flex-col">
        {/* App-level toasts */}
        <AnimatePresence>
          {appToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onAnimationComplete={() => setTimeout(() => setAppToast(null), 3000)}
              className="absolute top-4 left-4 right-4 z-50 bg-[#1B3D2F] text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-lg text-center"
            >
              {appToast}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {appError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onAnimationComplete={() => setTimeout(() => setAppError(null), 4000)}
              className="absolute top-4 left-4 right-4 z-50 bg-[#C0392B] text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-lg text-center"
            >
              ⚠ {appError}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {phase === 'onboarding' && (
            <motion.div key="onboarding" className="h-full">
              <Onboarding 
                onComplete={() => { setPhase('home'); setCameFromOnboarding(true); }} 
                onSignIn={() => setPhase('auth')} 
                onSignUp={() => setPhase('signup')}
              />
            </motion.div>
          )}
          {phase === 'auth' && (
            <motion.div key="auth" className="h-full">
              <LoginScreen 
                onBack={() => setPhase('onboarding')} 
                onLogin={handleGoogleSignIn} 
                onSignUp={() => setPhase('signup')}
              />
            </motion.div>
          )}
          {phase === 'signup' && (
            <motion.div key="signup" className="h-full">
              <SignUpScreen 
                onBack={() => setPhase('onboarding')} 
                onSignUp={handleGoogleSignIn} 
                onSignIn={() => setPhase('auth')}
              />
            </motion.div>
          )}
          {phase === 'home' && (
            <motion.div key="home" className="h-full">
              <HomeScreen 
                onAnalyse={handleAnalyse} 
                onProfileClick={() => setPhase('profiles')} 
                onHistoryClick={() => setPhase('history')}
                onBack={() => { setPhase('onboarding'); setCameFromOnboarding(false); }} 
                profiles={profiles}
                onSearch={handleSearch}
                user={user}
                onLogout={logout}
                cameFromOnboarding={cameFromOnboarding}
              />
            </motion.div>
          )}
          {phase === 'no-results' && (
            <motion.div key="no-results" className="h-full">
              <NoResults 
                query={searchQuery} 
                onRetry={() => setPhase('home')} 
                onScan={() => setPhase('home')} 
              />
            </motion.div>
          )}

          {phase === 'profiles' && (
            <motion.div key="profiles" className="h-full">
              <ProfilesScreen 
                profiles={profiles} 
                setProfiles={setProfiles}
                user={user}
                onBack={() => setPhase('home')} 
              />
            </motion.div>
          )}

          {phase === 'history' && (
            <motion.div key="history" className="h-full">
              <HistoryScreen 
                scans={scans}
                onBack={() => setPhase('home')} 
                onSelectScan={(scan) => {
                  setResult(JSON.parse(scan.resultJson));
                  setPhase('result');
                }}
              />
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="processing" className="h-full">
              <Processing 
                isSearch={isSearch} 
                onBack={() => setPhase('home')} 
              />
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div key="result" className="h-full">
              <ResultScreen 
                result={result} 
                profiles={profiles} 
                onBack={() => setPhase('home')} 
                user={user}
                onSearch={handleSearch}
                onProfileClick={() => setPhase('profiles')}
                onSignUp={() => setPhase('signup')}
                onSignIn={() => setPhase('auth')}
                hasDismissedNudge={hasDismissedNudge}
                onDismissNudge={() => setHasDismissedNudge(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
