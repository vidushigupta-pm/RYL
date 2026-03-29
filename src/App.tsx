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
  Zap,
  ArrowRight,
  X,
  Plus,
  MessageCircle,
  Send,
  Sparkles,
  Search,
  Tag,
  Image as ImageIcon,
  Home,
  Trash2,
  Edit2,
  LogOut
} from 'lucide-react';
import { analyseLabel, chatAboutProduct, PRODUCT_CATEGORIES, searchProductByName } from './services/geminiService';
import { recordScanEvent } from './services/swapService';
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
  emoji: string;
  age: string;
  gender: 'Male' | 'Female' | 'Kid';
  lifestyle: 'Sedentary' | 'Moderate' | 'Very Active';
  conditions: string;
  isDefault: boolean;
}

const DEFAULT_PROFILES: Profile[] = [
  { id: '1', name: 'Myself', emoji: '🧑', age: '28', gender: 'Male', lifestyle: 'Moderate', conditions: 'None', isDefault: true },
  { id: '2', name: 'Dadi', emoji: '👵', age: '72', gender: 'Female', lifestyle: 'Sedentary', conditions: 'Diabetes, Hypertension', isDefault: false },
  { id: '3', name: 'Rhea', emoji: '👧', age: '8', gender: 'Kid', lifestyle: 'Very Active', conditions: 'None', isDefault: false },
];

// --- Components ---

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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <Breadcrumbs phase="onboarding" />
      <div className="flex-1 flex flex-col justify-center p-8">
        <div className="w-20 h-20 bg-[#1B3D2F] rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-[#1B3D2F]/20">
          <ShieldAlert className="text-white w-10 h-10" />
        </div>
        <h1 className="font-display text-4xl font-bold text-[#1B3D2F] mb-4 leading-tight">
          Read Your Labels. <br />
          <span className="text-[#D4871E]">Know the Truth.</span>
        </h1>
        <p className="text-[#4A4A4A] text-lg leading-relaxed mb-8">
          India's first honest ingredient interpreter. Unmask misleading marketing and get personalized safety verdicts for your family.
        </p>
        
        <div className="space-y-4">
          {[
            { icon: <Zap className="w-5 h-5" />, text: "Unmask 'No Added Sugar' & 'Natural' claims" },
            { icon: <User className="w-5 h-5" />, text: "Personalized for Diabetes, Thyroid & Kids" },
            { icon: <CheckCircle2 className="w-5 h-5" />, text: "FSSAI & ICMR-NIN 2024 Grounded" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-[#1B3D2F] font-medium">
              <div className="text-[#D4871E]">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3 p-8 pt-0">
        <Button onClick={onComplete} className="w-full flex items-center justify-center gap-2">
          Start Scanning <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-center text-sm text-gray-400">
          <button onClick={onSignIn} className="text-[#1B3D2F] font-semibold hover:underline">
            Sign in
          </button>
          {" "}to save your scan history
        </p>
      </div>
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

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8DDD0]"></div></div>
            <span className="relative bg-[#FDF6EE] px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or</span>
          </div>

          {/* Email Signup Option */}
          {!showEmailForm ? (
            <button 
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#1B3D2F] text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              <ImageIcon className="w-5 h-5" />
              Sign up with Email
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Sharma"
                  className="w-full bg-white border border-[#E8DDD0] rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[#1B3D2F] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@example.com"
                  className="w-full bg-white border border-[#E8DDD0] rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[#1B3D2F] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E8DDD0] rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[#1B3D2F] transition-all"
                />
              </div>
              
              <Button onClick={() => alert("Email signup is coming soon! Please use Google for now.")} className="w-full py-4 mt-4">
                Create Account
              </Button>
            </motion.div>
          )}
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

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8DDD0]"></div></div>
            <span className="relative bg-[#FDF6EE] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
          </div>

          {/* Email Login Option */}
          {!showEmailForm ? (
            <button 
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#1B3D2F] text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              <ImageIcon className="w-5 h-5" />
              Sign in with Email
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-[#E8DDD0] rounded-2xl px-5 py-4 focus:outline-none focus:border-[#1B3D2F] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E8DDD0] rounded-2xl px-5 py-4 focus:outline-none focus:border-[#1B3D2F] transition-all"
                />
              </div>
              <button className="text-sm font-bold text-[#D4871E] hover:underline px-1">Forgot Password?</button>
              
              <Button onClick={() => alert("Email login is coming soon! Please use Google for now.")} className="w-full py-4 mt-4">
                Sign In
              </Button>
            </motion.div>
          )}
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

const HomeScreen = ({ onAnalyse, onProfileClick, onHistoryClick, onBack, profiles, onSearch, user, onLogout }: { onAnalyse: (files: { front: File | null, back: File }) => void, onProfileClick: () => void, onHistoryClick: () => void, onBack: () => void, profiles: Profile[], onSearch: (name: string) => void, user: any, onLogout: () => void }) => {
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
    <div className="flex flex-col h-full bg-[#FDF6EE]">
      <Breadcrumbs phase="home" />
      
      <div className="flex-1 px-6 overflow-y-auto no-scrollbar pb-32">
        {/* Header matching screenshot */}
        <header className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-[#1B3D2F]" />
            </button>
            {user && (
              <button onClick={onLogout} className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1B3D2F]/20">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-full h-full object-cover" />
              </button>
            )}
            <div>
              <h2 className="font-serif text-[28px] font-bold text-[#1B3D2F] leading-tight">ReadYourLabels</h2>
              <p className="text-[#8E9299] text-xs font-medium">India's honest ingredient truth-teller</p>
            </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white border border-[#E8DDD0] shadow-sm active:scale-95 transition-all"
          >
            <div className="flex -space-x-2">
              {profiles.slice(0, 3).map(p => (
                <span key={p.id} className="w-6 h-6 rounded-full bg-[#FDF6EE] border border-white flex items-center justify-center text-xs shadow-sm">
                  {p.emoji}
                </span>
              ))}
            </div>
            <span className="text-[8px] font-bold text-[#1B3D2F] uppercase tracking-tighter">Family Profiles</span>
          </button>
        </header>

        <div className="mb-6">
          <h3 className="font-serif text-xl font-bold text-[#1B3D2F] mb-1">Photograph the product label</h3>
          <p className="text-[#4A4A4A] text-xs leading-tight">
            Back label is required for ingredient analysis.
          </p>
        </div>

        <div className="space-y-6">
          {/* Combined Upload Frame */}
          <div className="bg-white rounded-[32px] border border-[#E8DDD0] p-5 shadow-sm space-y-6">
            {/* Back Label Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#1B3D2F] text-sm">Back of Pack</span>
                    <span className="bg-[#1B3D2F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Required</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299]">Ingredients list & Nutritional table</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => backInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => backInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {backFile && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#E8DDD0]">
                  <img src={URL.createObjectURL(backFile)} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setBackFile(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input ref={backInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'back')} />
            </div>

            {/* Horizontal Divider */}
            <div className="h-[1px] bg-[#FDF6EE] w-full"></div>

            {/* Front Label Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#1B3D2F] text-sm">Front of Pack</span>
                    <span className="bg-[#E8DDD0] text-[#8E9299] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Optional</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299]">Marketing claims & Brand name</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => frontInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => frontInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#E8DDD0] flex items-center justify-center text-[#1B3D2F] active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {frontFile && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#E8DDD0]">
                  <img src={URL.createObjectURL(frontFile)} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setFrontFile(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input ref={frontInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'front')} />
            </div>
          </div>

          {/* Tips Section */}
          <div className="p-4 bg-[#E6F4EC] rounded-[24px] border border-[#2E7D4F]/10">
            <button 
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#2E7D4F]" />
                <h4 className="text-[9px] font-bold text-[#2E7D4F] uppercase tracking-widest">Scanning Tips</h4>
              </div>
              <ChevronRight className={`w-3 h-3 text-[#2E7D4F] transition-transform ${showTips ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showTips && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {[
                      { id: '01', text: "Capture the full back label — get close and hold steady" },
                      { id: '02', text: "Include the nutritional table if visible in the same shot" },
                      { id: '03', text: "No need to select a category — we detect it automatically from the label" }
                    ].map((tip) => (
                      <div key={tip.id} className="flex gap-3 items-start">
                        <span className="font-mono text-[11px] font-bold text-[#2E7D4F] mt-0.5">{tip.id}</span>
                        <p className="text-sm text-[#1B3D2F] font-medium leading-tight">{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar Section */}
          <div className="pt-4 border-t border-[#E8DDD0]">
            <div className="mb-4">
              <h3 className="font-serif text-lg font-bold text-[#1B3D2F] mb-1">Don't have the product?</h3>
              <p className="text-[#8E9299] text-[10px] font-medium">Search by name to see its analysis from our database.</p>
            </div>
            <form onSubmit={handleSearchSubmit} className="mb-2">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Nutella, Maggi, Oreo" 
                  className="w-full py-4 pl-12 pr-4 bg-white border border-[#E8DDD0] rounded-2xl text-sm font-medium text-[#1B3D2F] placeholder:text-[#8E9299] focus:outline-none focus:border-[#1B3D2F] focus:ring-1 focus:ring-[#1B3D2F] transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E9299] group-focus-within:text-[#1B3D2F] transition-colors" />
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
            className={`w-full py-3.5 rounded-[20px] font-bold transition-all active:scale-95 text-sm ${
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

const ProfilesScreen = ({ profiles, user, onBack }: { profiles: Profile[], user: any, onBack: () => void }) => {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🧑');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Kid'>('Male');
  const [newLifestyle, setNewLifestyle] = useState<'Sedentary' | 'Moderate' | 'Very Active'>('Moderate');
  const [newConditions, setNewConditions] = useState('None');

  const EMOJIS = ['🧑', '👧', '👦', '👵', '👴', '👶', '👨‍🦱', '👩‍🦱', '🧔'];
  const GENDERS: ('Male' | 'Female' | 'Kid')[] = ['Male', 'Female', 'Kid'];
  const LIFESTYLES: ('Sedentary' | 'Moderate' | 'Very Active')[] = ['Sedentary', 'Moderate', 'Very Active'];

  const handleStartEdit = (p: Profile) => {
    setEditingProfile(p);
    setNewName(p.name);
    setNewEmoji(p.emoji);
    setNewAge(p.age);
    setNewGender(p.gender);
    setNewLifestyle(p.lifestyle);
    setNewConditions(p.conditions);
    setIsAdding(false);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingProfile(null);
    setNewName('');
    setNewEmoji('🧑');
    setNewAge('');
    setNewGender('Male');
    setNewLifestyle('Moderate');
    setNewConditions('None');
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    if (!user) {
      alert("Please sign in to save profiles.");
      return;
    }

    try {
      if (isAdding) {
        await addDoc(collection(db, `users/${user.uid}/profiles`), {
          name: newName,
          emoji: newEmoji,
          age: newAge,
          gender: newGender,
          lifestyle: newLifestyle,
          conditions: newConditions || 'None',
          isDefault: false,
          userId: user.uid,
          updatedAt: Timestamp.now()
        });
      } else if (editingProfile) {
        await updateDoc(doc(db, `users/${user.uid}/profiles`, editingProfile.id), {
          name: newName,
          emoji: newEmoji,
          age: newAge,
          gender: newGender,
          lifestyle: newLifestyle,
          conditions: newConditions || 'None',
          updatedAt: Timestamp.now()
        });
      }
      
      setIsAdding(false);
      setEditingProfile(null);
    } catch (error) {
      handleFirestoreError(error, isAdding ? OperationType.CREATE : OperationType.UPDATE, `users/${user.uid}/profiles`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/profiles`, id));
      setEditingProfile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/profiles/${id}`);
    }
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
        <p className="text-sm text-[#4A4A4A] mb-6 leading-relaxed">
          Add family members to get personalized safety alerts based on their specific health conditions.
        </p>

        <div className="space-y-4">
          {profiles.map(p => (
            <div key={p.id} className="p-5 bg-white rounded-[28px] border border-[#E8DDD0] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FDF6EE] rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                  {p.emoji}
                </div>
                <div>
                  <h4 className="font-bold text-[#1B3D2F]">{p.name} {p.isDefault && <span className="text-[10px] bg-[#E6F4EC] text-[#2E7D4F] px-1.5 py-0.5 rounded ml-1 uppercase">You</span>}</h4>
                  <p className="text-[10px] text-[#8E9299] font-medium uppercase tracking-widest mt-0.5">
                    {p.gender} · {p.age} yrs · {p.lifestyle} · {p.conditions === 'None' ? 'No conditions' : p.conditions}
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
              <button 
                onClick={() => logout()}
                className="w-full p-5 bg-white border border-[#FDECEA] rounded-[28px] flex items-center justify-center gap-3 text-[#D94F3D] font-bold active:scale-95 transition-all shadow-sm"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal Overlay */}
      <AnimatePresence>
        {(editingProfile || isAdding) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => { setEditingProfile(null); setIsAdding(false); }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#1B3D2F]">{isAdding ? 'Add Family Member' : 'Edit Profile'}</h3>
                {!isAdding && !editingProfile?.isDefault && (
                  <button 
                    onClick={() => handleDelete(editingProfile!.id)}
                    className="p-2 text-[#D94F3D] active:scale-90 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Name</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Dadi"
                      className="w-full p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl focus:outline-none focus:border-[#1B3D2F]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Age</label>
                    <input 
                      type="number" 
                      value={newAge}
                      onChange={e => setNewAge(e.target.value)}
                      placeholder="Age"
                      className="w-full p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl focus:outline-none focus:border-[#1B3D2F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Gender</label>
                  <div className="flex gap-2">
                    {GENDERS.map(g => (
                      <button 
                        key={g}
                        onClick={() => setNewGender(g)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${newGender === g ? 'bg-[#1B3D2F] text-white' : 'bg-[#FDF6EE] border border-[#E8DDD0] text-[#8E9299]'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Lifestyle</label>
                  <div className="flex gap-2">
                    {LIFESTYLES.map(l => (
                      <button 
                        key={l}
                        onClick={() => setNewLifestyle(l)}
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] transition-all ${newLifestyle === l ? 'bg-[#1B3D2F] text-white' : 'bg-[#FDF6EE] border border-[#E8DDD0] text-[#8E9299]'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Avatar</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {EMOJIS.map(e => (
                      <button 
                        key={e}
                        onClick={() => setNewEmoji(e)}
                        className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xl transition-all ${newEmoji === e ? 'bg-[#1B3D2F] text-white' : 'bg-[#FDF6EE] border border-[#E8DDD0]'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2">Health Conditions</label>
                  <textarea 
                    value={newConditions}
                    onChange={e => setNewConditions(e.target.value)}
                    placeholder="Enter any specific health conditions (e.g. Nut Allergy, Diabetes)"
                    className="w-full p-4 bg-[#FDF6EE] border border-[#E8DDD0] rounded-2xl focus:outline-none focus:border-[#1B3D2F] min-h-[100px] resize-none"
                  />
                  <p className="text-[10px] text-[#8E9299] mt-1 italic">Type "None" if no conditions apply.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => { setEditingProfile(null); setIsAdding(false); }}
                  className="flex-1 py-4 bg-white border border-[#E8DDD0] text-[#1B3D2F] font-bold rounded-2xl active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-[#1B3D2F] text-white font-bold rounded-2xl shadow-lg shadow-[#1B3D2F]/20 active:scale-95 transition-all"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Processing = ({ isSearch = false }: { isSearch?: boolean }) => {
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

        {productBreakdown?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h5 className="text-sm font-bold text-[#1B3D2F]">{item.label}</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.explanation}</p>
            </div>
            <span className={`text-xs font-bold font-mono mt-1 ${item.impact < 0 ? 'text-[#D94F3D]' : 'text-[#2E7D4F]'}`}>
              {item.impact > 0 ? `+${item.impact}` : item.impact}
            </span>
          </div>
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
              <div key={i} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-[#1B3D2F]">{c.label}</h5>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{c.detail}</p>
                </div>
                <span className={`text-xs font-bold font-mono mt-1 ${c.impact < 0 ? 'text-[#D94F3D]' : 'text-[#2E7D4F]'}`}>
                  {c.impact > 0 ? `+${c.impact}` : c.impact}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center text-center gap-2 bg-[#FDF6EE] rounded-2xl border border-dashed border-[#E8DDD0]">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D4F]" />
            <p className="text-xs font-bold text-[#1B3D2F]">No additional adjustments for this profile.</p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between items-center sticky bottom-0 bg-white">
        <span className="text-xs font-bold text-[#1B3D2F] uppercase tracking-tight">Final Verdict</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg ${score >= 70 ? 'bg-[#E6F4EC] text-[#2E7D4F]' : score >= 40 ? 'bg-[#FFF0E0] text-[#E07B2A]' : 'bg-[#FDECEA] text-[#D94F3D]'}`}>
          {score}
        </div>
      </div>
    </div>
  );
};

const ResultScreen = ({ result, profiles, onBack, user, onSearch, onProfileClick }: { result: any, profiles: Profile[], onBack: () => void, user: any, onSearch: (name: string) => void, onProfileClick: () => void }) => {
  const [activeProfile, setActiveProfile] = useState(profiles[0]);
  const [showFamilyNudge, setShowFamilyNudge] = useState(
    profiles.length <= 1  // show nudge if user has only default profile
  );
  const [expandedIng, setExpandedIng] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && result) {
      recordScanEvent(result, user.uid, 'GENERAL');
    }
  }, [result, user]);

  // Update active profile if it was changed/deleted (fallback to first)
  useEffect(() => {
    const exists = profiles.find(p => p.id === activeProfile.id);
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
    let score = result.overall_score;
    const concerns: any[] = [];

    const conditionsLower = profile.conditions.toLowerCase();

    if (conditionsLower.includes('diabetes')) {
      if (result.nutrition?.sugar_g > 10) {
        const impact = -10; 
        score += impact;
        concerns.push({ label: 'Diabetes Warning', detail: `${result.nutrition.sugar_g}g sugar is specifically dangerous for your condition.`, impact });
      }
    }

    if (profile.gender === 'Kid' || parseInt(profile.age) < 13) {
      const cautionIngs = (result.ingredients || []).filter((i: any) => i.safety_tier === 'CAUTION' || i.safety_tier === 'AVOID');
      if (cautionIngs.length > 0) {
        const impact = -10;
        score += impact;
        concerns.push({ label: 'Additives', detail: 'Contains ingredients flagged for child sensitivity.', impact });
      }
    }

    if (profile.lifestyle === 'Sedentary') {
      if (result.nutrition?.calories > 300) {
        const impact = -5;
        score += impact;
        concerns.push({ label: 'High Calorie', detail: 'High calorie density may not suit a sedentary lifestyle.', impact });
      }
      if (result.nutrition?.saturated_fat_g > 5) {
        const impact = -5;
        score += impact;
        concerns.push({ label: 'High Saturated Fat', detail: 'Saturated fat intake should be limited for sedentary individuals.', impact });
      }
    } else if (profile.lifestyle === 'Very Active') {
      if (result.nutrition?.protein_g > 10) {
        const impact = 5;
        score += impact;
        concerns.push({ label: 'High Protein Bonus', detail: 'Extra protein is beneficial for your active lifestyle.', impact });
      }
    }

    return { score: Math.max(0, Math.min(100, score)), concerns, baseScore: result.overall_score };
  };

  const currentVerdict = getProfileVerdict(activeProfile);

  return (
    <div className="flex flex-col h-full bg-[#FDF6EE]">
      <Breadcrumbs phase="result" />
      <header className="sticky top-0 z-10 bg-[#1B3D2F] text-white p-6 pb-8 rounded-b-[40px] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            {profiles.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProfile(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${activeProfile.id === p.id ? 'bg-white scale-110 shadow-lg' : 'bg-white/10 opacity-50'}`}
              >
                {p.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold leading-tight mb-1">{result.product_name}</h2>
            <p className="text-white/60 text-sm font-medium">{result.brand}</p>
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
        {result.nutrition && (result.category === 'FOOD' || result.category === 'SUPPLEMENT' || result.category === 'PET_FOOD') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Info className="w-4 h-4 text-[#1B3D2F]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Nutrition Context</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sugar', val: `${result.nutrition?.sugar_g ?? 0}g`, color: (result.nutrition?.sugar_g || 0) > 10 ? 'bg-[#FDECEA] text-[#D94F3D]' : 'bg-white' },
                { label: 'Protein', val: `${result.nutrition?.protein_g ?? 0}g`, color: 'bg-white' },
                { label: 'Sodium', val: `${result.nutrition?.sodium_mg ?? 0}mg`, color: (result.nutrition?.sodium_mg || 0) > 500 ? 'bg-[#FDECEA] text-[#D94F3D]' : 'bg-white' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-3xl border border-[#E8DDD0] flex flex-col items-center justify-center text-center shadow-sm ${item.color}`}>
                  <span className="text-xl font-mono font-bold tracking-tighter">{item.val}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-[#1B3D2F]" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Ingredient Breakdown</h3>
          </div>
          <div className="bg-white rounded-[32px] border border-[#E8DDD0] overflow-hidden">
            {(result.ingredients || []).map((ing: any, i: number) => (
              <div 
                key={i} 
                onClick={() => setExpandedIng(expandedIng === i ? null : i)}
                className={`p-5 transition-colors ${expandedIng === i ? 'bg-[#FDF6EE]' : ''} ${i > 0 ? 'border-t border-[#FDF6EE]' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1B3D2F] truncate">{ing.plain_name || ing.name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{ing.function}</p>
                  </div>
                  <TierBadge tier={ing.safety_tier} />
                </div>
                <AnimatePresence>
                  {expandedIng === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
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

        <AlsoScanned 
          currentProductId={`${result.brand}_${result.product_name}`.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}
          category={result.category}
          subCategory={result.sub_category || 'FOOD'}
          profileType="GENERAL"
          currentScore={result.overall_score}
          onScanSuggested={(name) => onSearch(name)}
        />

        {showFamilyNudge && (
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
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">For {activeProfile.name}</p>
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
                profileName={activeProfile.name}
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
    </div>
  );
};

// --- Main App ---

const NoResults = ({ query, onRetry, onScan }: { query: string, onRetry: () => void, onScan: () => void }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
      <div className="w-20 h-20 bg-[#FDF6EE] rounded-full flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-[#D4871E]" />
      </div>
      <h2 className="text-2xl font-bold text-[#1B3D2F] mb-3">Product Not Found</h2>
      <p className="text-[#8E9299] mb-8 leading-relaxed">
        We couldn't find reliable ingredient data for <span className="font-bold text-[#1B3D2F]">"{query}"</span> in our search.
      </p>
      
      <div className="w-full space-y-4">
        <div className="p-4 bg-[#FDF6EE] rounded-2xl text-left border border-[#E8DDD0]">
          <h4 className="font-bold text-[#1B3D2F] text-sm mb-2">Try these instead:</h4>
          <ul className="text-xs text-[#8E9299] space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] mt-1" />
              Check for spelling errors.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] mt-1" />
              Add the brand name (e.g., "Parle-G Biscuits").
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4871E] mt-1" />
              Scan the product label for 100% accuracy.
            </li>
          </ul>
        </div>

        <Button onClick={onScan} className="w-full flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" /> Scan Product Label
        </Button>
        
        <Button onClick={onRetry} variant="secondary" className="w-full">
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

  const [isSearch, setIsSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Auth & Data Listeners ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        if (phase === 'onboarding' || phase === 'auth' || phase === 'signup') {
          setPhase('home');
        }
      }
    });
    return () => unsubscribe();
  }, [phase]);

  // Profiles Listener
  useEffect(() => {
    if (!user || !isAuthReady) {
      setProfiles(DEFAULT_PROFILES);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/profiles`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
      if (pList.length === 0) {
        DEFAULT_PROFILES.forEach(async (p) => {
          const { id, ...rest } = p;
          await addDoc(collection(db, `users/${user.uid}/profiles`), { ...rest, userId: user.uid });
        });
      } else {
        setProfiles(pList);
      }
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
      
      const analysis = await analyseLabel(
        backBase64, 
        files.back.type, 
        frontBase64, 
        files.front?.type
      );
      
      if (!analysis || analysis.product_name === "Unknown Product") {
        throw new Error("Invalid analysis result");
      }

      setResult(analysis);
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
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try a clearer photo.");
      setPhase('home');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSearch = async (name: string) => {
    setIsSearch(true);
    setSearchQuery(name);
    setPhase('processing');
    try {
      const analysis = await searchProductByName(name);
      if (!analysis || analysis.product_name === "Unknown Product" || analysis.summary.includes("failed")) {
        setPhase('no-results');
        return;
      }
      setResult(analysis);
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
    } catch (error) {
      console.error(error);
      setPhase('no-results');
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
        <AnimatePresence mode="wait">
          {phase === 'onboarding' && (
            <motion.div key="onboarding" className="h-full">
              <Onboarding 
                onComplete={() => setPhase('home')} 
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
                onBack={() => setPhase('onboarding')} 
                profiles={profiles}
                onSearch={handleSearch}
                user={user}
                onLogout={logout}
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
              <Processing isSearch={isSearch} />
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
