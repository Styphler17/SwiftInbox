import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail,
  Copy,
  RefreshCw,
  Shield,
  Zap,
  Inbox,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Clock,
  Lock,
  Code,
  ExternalLink,
  Menu,
  X,
  Github,
  Plus,
  Bell,
  Globe,
  Settings,
  Layers,
  Star,
  ArrowRight,
  Database,
  Webhook,
  ArrowUp,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Email, InboxState } from './types';

// --- Constants ---
const DOMAINS = [
  { name: 'debesties.mail', premium: false },
  { name: 'mail-temp.org', premium: false },
  { name: 'gmail.com', premium: true, provider: 'Google' },
  { name: 'outlook.com', premium: true, provider: 'Microsoft' },
  { name: 'hotmail.com', premium: true, provider: 'Microsoft' },
  { name: 'yahoo.com', premium: true, provider: 'Yahoo' },
  { name: 'icloud.com', premium: true, provider: 'Apple' },
  { name: 'private-mail.io', premium: true },
  { name: 'dev-test.net', premium: true },
  { name: 'secure-inbox.pro', premium: true },
];

// --- Mock Data Generator ---
const generateRandomAddress = (domain: string) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result}@${domain}`;
};

const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    from: 'hello@debesties.mail',
    subject: 'Welcome to the Fam!',
    body: 'Thanks for hanging with Debesties Mail. Your temporary email is ready to go! Itll refresh automatically so you dont miss a thing.',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    from: 'security@verify.com',
    subject: 'Your Verification Code: 882910',
    body: 'Please use the following code to verify your account: 882910. This code will expire in 10 minutes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
  }
];

// --- Main Component ---
export default function App() {
  const [inboxes, setInboxes] = useState<InboxState[]>([]);
  const [activeInboxId, setActiveInboxId] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0]);
  const [plan, setPlan] = useState<'free' | 'plus' | 'pro'>('free');
  const [user, setUser] = useState<{ id: string; email: string; plan?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isPro = plan === 'plus' || plan === 'pro';
  const isUltimate = plan === 'pro';

  const activeInbox = inboxes.find(i => i.id === activeInboxId);

  // --- Auth Effects ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');

    if (authToken) {
      verifyMagicLink(authToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setPlan(data.user.plan || 'free');
      }
    } catch (e) {
      localStorage.removeItem('auth_token');
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify?token=${token}`);
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        setPlan(data.user.plan || 'free');
        showToast("Welcome back, bestie!");
      } else {
        showToast(data.error || "Login failed");
      }
    } catch (e) {
      showToast("Verification failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setPlan('free');
    showToast("Logged out safely");
  };

  const requestMagicLink = async (email: string) => {
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message || "Working on it!");
      setIsAuthModalOpen(false);
    } catch (e) {
      showToast("Something went wrong");
    }
  };

  // Simulation of auto-refresh
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const newPlan = params.get('plan') as 'plus' | 'pro' | null;

    if (sessionId && newPlan) {
      setPlan(newPlan);
      showToast(`Successfully upgraded to ${newPlan.toUpperCase()}!`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpgrade = async (targetPlan: 'plus' | 'pro') => {
    try {
      setIsCheckingOut(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: targetPlan,
          appUrl: window.location.origin,
          email: user?.email
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      showToast(error.message || "Payment system unavailable. Try again later.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const createInbox = useCallback(async (domainName: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    const expiry = new Date(now.getTime() + 10 * 60 * 1000);

    // Check if it's a "mock" premium domain or a real one
    const domainObj = DOMAINS.find(d => d.name === domainName);
    const isRealDomain = domainObj && !domainObj.premium;

    let address = generateRandomAddress(domainName);
    let token = '';
    let accountId = '';

    if (isRealDomain) {
      try {
        const domainRes = await fetch('/api/domains');
        const domains = await domainRes.json();
        const apiDomain = domains['hydra:member']?.find((d: any) => d.domain === domainName) || domains['hydra:member']?.[0];

        if (apiDomain) {
          const username = Math.random().toString(36).substring(2, 10);
          const password = Math.random().toString(36).substring(2, 12);
          const fullAddress = `${username}@${apiDomain.domain}`;

          const accountRes = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: fullAddress, password }),
          });
          const account = await accountRes.json();

          const tokenRes = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: fullAddress, password }),
          });
          const tokenData = await tokenRes.json();

          address = fullAddress;
          token = tokenData.token;
          accountId = account.id;
        }
      } catch (err) {
        console.error("Mail.tm Error:", err);
      }
    }

    const newInbox: InboxState = {
      id,
      address,
      domain: domainName,
      emails: [{ ...MOCK_EMAILS[0], id: Math.random().toString(), timestamp: now.toISOString() }],
      isLoading: false,
      lastUpdated: now,
      expiresAt: expiry,
      timeLeft: 600,
      token,
      accountId
    };

    setInboxes(prev => [...prev, newInbox]);
    setActiveInboxId(id);
    return id;
  }, []);

  const generateNewEmail = useCallback(() => {
    if (activeInbox) {
      setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, isLoading: true } : i));
      setTimeout(() => {
        const now = new Date();
        const expiry = new Date(now.getTime() + 10 * 60 * 1000);
        setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
          ...i,
          address: generateRandomAddress(i.domain),
          emails: [{ ...MOCK_EMAILS[0], id: Math.random().toString(), timestamp: now.toISOString() }],
          isLoading: false,
          lastUpdated: now,
          expiresAt: expiry,
          timeLeft: 600,
        } : i));
      }, 800);
    } else {
      createInbox(selectedDomain.name);
    }
  }, [activeInbox, activeInboxId, createInbox, selectedDomain.name]);

  const simulateIncomingEmail = () => {
    if (!activeInboxId) return;
    const newEmail: Email = {
      id: Math.random().toString(36).substr(2, 9),
      from: 'noreply@service.com',
      subject: 'Your Verification Code',
      body: `Your code is: ${Math.floor(100000 + Math.random() * 900000)}. Use this to complete your registration.`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
      ...i,
      emails: [newEmail, ...i.emails]
    } : i));
    showToast("New simulated email received!");
  };

  const refreshInbox = useCallback(async (showLoading = false) => {
    if (!activeInboxId || !activeInbox) return;

    if (!activeInbox.token) {
      // Mock refresh for premium domains
      setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, isLoading: showLoading } : i));
      setTimeout(() => {
        setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, isLoading: false, lastUpdated: new Date() } : i));
      }, 500);
      return;
    }

    setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, isLoading: showLoading } : i));

    try {
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${activeInbox.token}` },
      });
      const data = await response.json();
      const messages = data['hydra:member'] || [];

      const mappedEmails: Email[] = messages.map((msg: any) => ({
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        body: msg.intro || 'No preview available',
        timestamp: msg.createdAt,
        read: msg.seen,
      }));

      setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
        ...i,
        emails: mappedEmails.length > 0 ? mappedEmails : i.emails,
        isLoading: false,
        lastUpdated: new Date(),
      } : i));
    } catch (error) {
      console.error('Failed to refresh inbox:', error);
      setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, isLoading: false } : i));
    }
  }, [activeInboxId, activeInbox]);

  // Initial generation
  useEffect(() => {
    if (inboxes.length === 0) {
      createInbox(DOMAINS[0].name);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    countdownInterval.current = setInterval(() => {
      setInboxes(prev => prev.map(inbox => {
        if (inbox.timeLeft <= 1) {
          // Auto-rotate
          const now = new Date();
          const expiry = new Date(now.getTime() + 10 * 60 * 1000);
          return {
            ...inbox,
            address: generateRandomAddress(inbox.domain),
            emails: [{ ...MOCK_EMAILS[0], id: Math.random().toString(), timestamp: now.toISOString() }],
            lastUpdated: now,
            expiresAt: expiry,
            timeLeft: 600,
          };
        }
        return { ...inbox, timeLeft: inbox.timeLeft - 1 };
      }));
    }, 1000);

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  // Background refresh
  useEffect(() => {
    refreshInterval.current = setInterval(() => {
      refreshInbox(false);
    }, 3000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [refreshInbox]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const addTime = () => {
    if (!activeInboxId || !activeInbox) return;

    if (plan === 'free') {
      if (activeInbox.timeLeft >= 1200) {
        showToast("Free tier is limited to 20 minutes. Upgrade for more!");
        return;
      }
      const newTime = Math.min(activeInbox.timeLeft + 600, 1200);
      setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, timeLeft: newTime } : i));
      showToast(`Added time! Max 20m for Free tier.`);
      return;
    }

    const amount = isUltimate ? 3600 * 24 : 3600;
    setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, timeLeft: i.timeLeft + amount } : i));
    showToast(isUltimate ? "Added 24 hours to your inbox!" : "Added 1 hour to your inbox!");
  };

  const setExtendedExpiry = () => {
    if (!isUltimate) {
      showToast("Extended 30-day expiry requires the Pro plan!");
      return;
    }
    setInboxes(prev => prev.map(i => i.id === activeInboxId ? { ...i, timeLeft: 3600 * 24 * 30 } : i));
    showToast("Inbox expiry extended to 30 days!");
  };

  const copyToClipboard = () => {
    if (!activeInbox?.address) return;
    navigator.clipboard.writeText(activeInbox.address);
    setCopied(true);
    showToast("Email address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);

    if (activeInbox?.token) {
      try {
        const response = await fetch(`/api/messages/${email.id}`, {
          headers: { 'Authorization': `Bearer ${activeInbox.token}` },
        });
        const fullMsg = await response.json();
        const updatedEmail = {
          ...email,
          body: fullMsg.text || fullMsg.html || email.body,
          read: true
        };
        setSelectedEmail(updatedEmail);

        setInboxes(prev => prev.map(inbox => {
          if (inbox.id === activeInboxId) {
            return {
              ...inbox,
              emails: inbox.emails.map(e => e.id === email.id ? updatedEmail : e)
            };
          }
          return inbox;
        }));
      } catch (error) {
        console.error('Failed to fetch full email body:', error);
      }
    }

    navigator.clipboard.writeText(email.body);
    showToast("Email content copied to clipboard!");
  };

  const deleteEmail = async (id: string) => {
    if (activeInbox?.token) {
      try {
        await fetch(`/api/messages/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${activeInbox.token}` },
        });
      } catch (error) {
        console.error('Failed to delete email from server:', error);
      }
    }

    setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
      ...i,
      emails: i.emails.filter(e => e.id !== id)
    } : i));
    if (selectedEmail?.id === id) setSelectedEmail(null);
  };

  const removeInbox = (id: string) => {
    if (inboxes.length <= 1) {
      showToast("You must have at least one inbox.");
      return;
    }
    setInboxes(prev => prev.filter(i => i.id !== id));
    if (activeInboxId === id) {
      setActiveInboxId(inboxes.find(i => i.id !== id)?.id || '');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo Notice */}
      <div className="bg-amber-50 border-b border-amber-100 py-2 px-4 text-center">
        <p className="text-xs font-medium text-amber-800 flex items-center justify-center gap-2">
          <Shield className="w-3 h-3" />
          <span>DEMO MODE: This is a frontend prototype. It does not receive real emails yet.</span>
        </p>
      </div>

      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <img src="/logo.png" alt="Debesties Mail - Professional Temporary Email Service" className="w-20 h-20 object-contain" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-text hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-text hover:text-primary transition-colors">How it Works</a>
              <a href="#faq" className="text-sm font-medium text-muted-text hover:text-primary transition-colors">FAQ</a>

              {user ? (
                <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                  {plan === 'free' && (
                    <button
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                      className="btn-primary py-2 px-6 text-sm shadow-md flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      Go Pro
                    </button>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-main-text">{user.email}</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{plan} member</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-muted-text hover:text-primary transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-sm font-bold text-muted-text hover:text-primary transition-colors px-4 py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-primary py-2 px-6 text-sm shadow-md"
                  >
                    Get Pro
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-700" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-slate-700" onClick={() => setIsMenuOpen(false)}>How it Works</a>
                <a href="#faq" className="block px-3 py-2 text-base font-medium text-slate-700" onClick={() => setIsMenuOpen(false)}>FAQ</a>

                {user ? (
                  <div className="pt-4 space-y-4">
                    <div className="px-3 py-3 bg-page-bg rounded-xl">
                      <p className="text-sm font-bold text-main-text">{user.email}</p>
                      <p className="text-xs text-primary font-bold uppercase tracking-wider">{plan} member</p>
                    </div>
                    {plan === 'free' && (
                      <button
                        onClick={() => { setIsMenuOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        Upgrade to Pro
                      </button>
                    )}
                    <button
                      onClick={() => { setIsMenuOpen(false); logout(); }}
                      className="w-full btn-outline py-3 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }}
                      className="w-full btn-outline py-3"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setIsMenuOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="w-full btn-primary py-3"
                    >
                      Get Pro
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-16 pb-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 border-[16px] border-primary/5 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-main-text tracking-tight mb-6">
                Protect Your Real Inbox <br />
                <span className="text-primary italic">with Disposable Emails.</span>
              </h1>
              <p className="text-lg text-muted-text mb-10 max-w-2xl mx-auto">
                Approachable, fast, and community-friendly. Get a temporary email for signups and developer testing in one click.
              </p>
            </motion.div>

            {/* Email Generator Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto neon-border-wrapper shadow-2xl"
            >
              <div className="neon-border-line"></div>
              <div className="neon-border-content p-6 md:p-10 relative overflow-hidden">
                <div className="flex flex-col gap-8">
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={activeInbox?.address || 'Generating...'}
                        className="w-full bg-page-bg border border-separator rounded-xl px-6 py-5 font-mono text-xl text-main-text focus:outline-none pr-16 shadow-inner"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-muted-text hover:text-primary transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Copy className="w-6 h-6" />}
                      </button>
                    </div>

                    <button
                      onClick={generateNewEmail}
                      disabled={activeInbox?.isLoading}
                      className="w-full bg-primary text-white rounded-xl py-5 font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                      {activeInbox?.isLoading ? <RefreshCw className="animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                      New Address
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Standard Domains</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {DOMAINS.filter(d => !d.premium).map((domain) => (
                          <button
                            key={domain.name}
                            onClick={() => {
                              setSelectedDomain(domain);
                              if (activeInbox) {
                                setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
                                  ...i,
                                  domain: domain.name,
                                  address: generateRandomAddress(domain.name)
                                } : i));
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedDomain.name === domain.name
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-card-bg border border-separator text-muted-text hover:bg-page-bg'
                              }`}
                          >
                            {domain.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Premium & Major Providers</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {DOMAINS.filter(d => d.premium).map((domain) => (
                          <button
                            key={domain.name}
                            onClick={() => {
                              if (!isPro) {
                                showToast("Premium domains require a Pro subscription!");
                                return;
                              }
                              setSelectedDomain(domain);
                              if (activeInbox) {
                                setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
                                  ...i,
                                  domain: domain.name,
                                  address: generateRandomAddress(domain.name)
                                } : i));
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedDomain.name === domain.name
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                          >
                            <Star className={`w-3 h-3 ${selectedDomain.name === domain.name ? 'text-white fill-white' : 'text-amber-400 fill-amber-400'}`} />
                            {domain.name}
                          </button>
                        ))}
                        {isUltimate && (
                          <div className="flex items-center gap-2 ml-2">
                            <input
                              type="text"
                              placeholder="custom-domain.com"
                              value={customDomain}
                              onChange={(e) => setCustomDomain(e.target.value)}
                              className="px-4 py-2 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-primary w-44"
                            />
                            <button
                              onClick={() => {
                                if (!customDomain.includes('.')) {
                                  showToast("Please enter a valid domain.");
                                  return;
                                }
                                const newAddr = generateRandomAddress(customDomain);
                                setInboxes(prev => prev.map(i => i.id === activeInboxId ? {
                                  ...i,
                                  domain: customDomain,
                                  address: newAddr
                                } : i));
                                showToast(`Switched to custom domain: ${customDomain}`);
                              }}
                              className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Privacy Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Expires in {formatTime(activeInbox?.timeLeft || 0)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={addTime}
                      className="flex items-center gap-2 text-accent hover:text-emerald-600 transition-colors font-bold"
                      title={isPro ? "Add 1 hour" : "Add 10 minutes"}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isPro ? "Add 1 Hour" : "Add Time"}</span>
                    </button>
                    {isUltimate && (
                      <button
                        onClick={setExtendedExpiry}
                        className="flex items-center gap-2 text-primary hover:text-blue-700 transition-colors font-bold"
                      >
                        <Layers className="w-4 h-4" />
                        <span>30 Days Expiry</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-90"
              aria-label="Back to top"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-8 left-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <Bell className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Inbox Section */}
        <section className="bg-slate-100 py-20 px-4" id="inbox">
          <div className="max-w-7xl mx-auto">
            {!isPro && (
              <div className="mb-8 p-4 bg-slate-200/50 border border-slate-300 rounded-xl text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Advertisement</p>
                <div className="h-20 flex items-center justify-center text-slate-400 italic">
                  Upgrade to Pro to remove all advertisements.
                </div>
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Manage Your Inboxes</h2>
                <p className="text-slate-600">Switch between multiple temporary addresses easily.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                  <RefreshCw className={`w-4 h-4 ${activeInbox?.isLoading ? 'animate-spin' : ''}`} />
                  <span>Last checked: {activeInbox?.lastUpdated.toLocaleTimeString()}</span>
                </div>
                <button
                  onClick={simulateIncomingEmail}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-4 py-2 rounded-lg hover:bg-accent/20 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  Simulate Email
                </button>
                <button
                  onClick={() => {
                    const maxInboxes = plan === 'pro' ? Infinity : (plan === 'plus' ? 5 : 1);
                    if (inboxes.length >= maxInboxes) {
                      showToast(`${plan === 'free' ? 'Free' : 'Plus'} plan is limited to ${maxInboxes} inbox${maxInboxes > 1 ? 'es' : ''}. Upgrade for more!`);
                      return;
                    }
                    createInbox(selectedDomain.name);
                    showToast("New inbox created!");
                  }}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Inbox
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inbox Sidebar */}
              <div className="lg:col-span-3 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Your Inboxes</div>
                {inboxes.map((ib) => (
                  <div
                    key={ib.id}
                    onClick={() => setActiveInboxId(ib.id)}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${activeInboxId === ib.id
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeInboxId === ib.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{ib.address}</p>
                        <p className="text-[10px] text-slate-500">{formatTime(ib.timeLeft)} left</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeInbox(ib.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email List */}
              <div className={`lg:col-span-4 space-y-3 ${selectedEmail ? 'hidden lg:block' : 'block'}`}>
                {!activeInbox || activeInbox.emails.length === 0 ? (
                  <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"
                    >
                      <Inbox className="w-10 h-10 text-slate-300" />
                    </motion.div>
                    <h3 className="text-slate-900 font-bold text-lg mb-2">Empty inbox</h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-[250px] mx-auto">
                      Waiting for incoming emails for {activeInbox?.address}.
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={() => refreshInbox(true)}
                        className="btn-primary py-2 text-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${activeInbox?.isLoading ? 'animate-spin' : ''}`} />
                        Refresh Inbox
                      </button>
                    </div>
                  </div>
                ) : (
                  activeInbox.emails.map((email) => (
                    <motion.div
                      key={email.id}
                      layoutId={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${selectedEmail?.id === email.id ? 'border-l-primary bg-slate-50' : 'border-l-transparent'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{email.from}</span>
                        <span className="text-xs text-slate-400">{new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h3 className="text-sm font-medium text-slate-700 truncate mb-1">{email.subject}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{email.body}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Email Detail View */}
              <div className={`lg:col-span-5 ${selectedEmail ? 'block' : 'hidden lg:block'}`}>
                <div className="glass-card h-full min-h-[400px] flex flex-col">
                  {selectedEmail ? (
                    <div className="flex flex-col h-full">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <button
                          onClick={() => setSelectedEmail(null)}
                          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteEmail(selectedEmail.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete email"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6 overflow-y-auto flex-grow">
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                              {selectedEmail.from[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{selectedEmail.from}</p>
                              <p className="text-xs text-slate-500">To: {activeInbox?.address}</p>
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedEmail.subject}</h2>
                          <p className="text-xs text-slate-400">{new Date(selectedEmail.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
                          {selectedEmail.body}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                      <Mail className="w-16 h-16 text-slate-100 mb-4" />
                      <p className="text-slate-400 font-medium">Select an email to read its content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-24 px-4" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-bold text-sm uppercase tracking-widest mb-4 block">Why SwiftInbox?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Features for Privacy</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Built for privacy-conscious users and developers who need a reliable way to handle temporary communications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="text-amber-500" />,
                  title: "Instant Generation",
                  desc: "Generate a new email address in milliseconds. No forms, no passwords, no waiting."
                },
                {
                  icon: <Lock className="text-blue-500" />,
                  title: "Privacy First",
                  desc: "We don't log your IP or personal data. Your temporary inbox is private and unguessable."
                },
                {
                  icon: <RefreshCw className="text-emerald-500" />,
                  title: "Auto-Refreshing",
                  desc: "Our live inbox updates in real-time. See incoming verification codes and links instantly."
                },
                {
                  icon: <Shield className="text-purple-500" />,
                  title: "Spam Protection",
                  desc: "Keep your real email safe from marketing lists and data breaches. Use us for one-time signups."
                },
                {
                  icon: <Code className="text-slate-700" />,
                  title: "Developer Ready",
                  desc: "Perfect for QA testing, automated signup flows, and email integration debugging."
                },
                {
                  icon: <CheckCircle2 className="text-accent" />,
                  title: "Free Forever",
                  desc: "Basic usage is and always will be free. No hidden costs or credit cards required."
                }
              ].map((feature, i) => (
                <article
                  key={i}
                  className="neon-border-wrapper"
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <div className="neon-border-line"></div>
                    <div className="neon-border-content p-8 h-full">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6" aria-hidden="true">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pro Pricing Section */}
        <section className="py-24 px-4 bg-white" id="pricing">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-accent font-bold text-sm uppercase tracking-widest mb-4 block">Upgrade Your Experience</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">SwiftInbox Pro</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Unlock advanced features designed for developers, testers, and power users who need more than just a temporary address.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="glass-card p-8 border-2 border-separator flex flex-col relative shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-main-text mb-2">Basic</h3>
                <p className="text-muted-text mb-6 text-sm">Free forever for friends.</p>
                <div className="text-3xl font-bold text-main-text mb-6">$0<span className="text-base text-muted-text font-normal">/mo</span></div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "1 Active Inbox",
                    "Standard Domains",
                    "10 Minute Auto-Rotation",
                    "Basic Spam Protection",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-text">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full btn-outline py-2 text-sm">Current Plan</button>
              </div>

              {/* Plus Plan */}
              <div className="glass-card p-8 border-2 border-separator flex flex-col relative shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-main-text mb-2">Debesties Mail Plus</h3>
                <p className="text-muted-text mb-6 text-sm">Great for regular users.</p>
                <div className="text-3xl font-bold text-main-text mb-6">$3.99<span className="text-base text-muted-text font-normal">/mo</span></div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "5 Active Inboxes",
                    "Premium Domains",
                    "1 Hour Auto-Rotation",
                    "Ad-Free Experience",
                    "Standard Support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-main-text font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('plus')}
                  disabled={isCheckingOut}
                  className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Upgrade to Debesties Mail Plus
                </button>
              </div>

              {/* Pro Plan */}
              <div className="glass-card p-8 border-2 border-primary relative overflow-hidden flex flex-col shadow-2xl shadow-primary/10">
                <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold px-4 py-1 uppercase tracking-widest transform rotate-45 translate-x-8 translate-y-4 shadow-sm">Ultimate</div>
                <h3 className="text-xl font-bold text-main-text mb-2">Debesties Mail Pro</h3>
                <p className="text-muted-text mb-6 text-sm">For power users & devs.</p>
                <div className="text-3xl font-bold text-main-text mb-6">$8.95<span className="text-base text-muted-text font-normal">/mo</span></div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "Unlimited Active Inboxes",
                    "Custom Domains",
                    "30 Day Extended Expiry",
                    "REST API & Webhooks",
                    "Priority Support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-main-text font-bold">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCheckingOut}
                  className="w-full btn-primary py-2 text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Upgrade to Debesties Mail Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pro Features Grid */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Globe className="text-blue-500" />,
                  title: "Premium Domains",
                  desc: "Access exclusive domains that are never blacklisted by major services."
                },
                {
                  icon: <Database className="text-emerald-500" />,
                  title: "API Access",
                  desc: "Automate your testing flows with our robust REST API documentation."
                },
                {
                  icon: <Webhook className="text-purple-500" />,
                  title: "Webhooks",
                  desc: "Get notified instantly in Slack, Discord, or your own server when mail arrives."
                }
              ].map((feature, i) => (
                <div key={i} className="neon-border-wrapper">
                  <div className="neon-border-line"></div>
                  <div className="neon-border-content p-6 h-full flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-card-bg shadow-sm flex items-center justify-center border border-separator">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-main-text mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-text leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Redesigned Simple Steps Section */}
        <section className="py-32 px-4 bg-slate-900 text-white overflow-hidden" id="how-it-works">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-accent font-mono text-sm tracking-widest uppercase mb-4 block">The Workflow</span>
                  <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-none">
                    THREE <br />
                    <span className="text-white/20 italic">SIMPLE</span> <br />
                    STEPS.
                  </h2>
                  <p className="text-slate-400 text-xl mb-12 max-w-md leading-relaxed">
                    Debesties Mail is engineered for speed. No learning curve, just instant results for your privacy.
                  </p>
                </motion.div>

                <div className="space-y-12">
                  {[
                    { step: "01", title: "GENERATE", desc: "Instantly create a unique, random email address with one tap." },
                    { step: "02", title: "SIGN UP", desc: "Use your temporary address for any service or verification." },
                    { step: "03", title: "RECEIVE", desc: "Watch codes and links arrive in real-time in your live inbox." }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-8 group"
                    >
                      <span className="text-5xl font-bold text-white/5 group-hover:text-primary/20 transition-colors duration-500">{item.step}</span>
                      <div className="pt-2">
                        <h3 className="text-2xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative z-10"
                >
                  <div className="absolute -inset-10 bg-accent/10 blur-[120px] rounded-full"></div>
                  <div className="glass-card bg-white/5 border-white/10 p-4 rounded-3xl shadow-2xl backdrop-blur-3xl">
                    <img
                      src="https://picsum.photos/seed/swift-ui/1000/800"
                      alt="App Interface Preview"
                      className="rounded-2xl shadow-inner brightness-90 grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/5 blur-[100px] rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-4" id="faq">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-main-text text-center mb-16">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "What is a temporary email?",
                  a: "A temporary email (also known as disposable or throwaway email) is a short-lived address that you can use to receive messages without revealing your primary email. It's perfect for avoiding spam."
                },
                {
                  q: "How long do emails stay in my inbox?",
                  a: "Your temporary email address is valid for 10 minutes. After 10 minutes, a new address is automatically generated to ensure maximum privacy."
                },
                {
                  q: "Can I use this for important accounts?",
                  a: "We strongly recommend against using temporary emails for important accounts (like banking or primary social media) because you may lose access to the email address later."
                },
                {
                  q: "Do you log my personal data?",
                  a: "No way. Debesties Mail is built for the community with privacy as a core value. We don't track your IPs, browser signatures, or anything else."
                }
              ].map((faq, i) => (
                <div key={i} className="glass-card p-6 border border-separator hover:border-primary/30 transition-colors">
                  <h3 className="text-lg font-bold text-main-text mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    {faq.q}
                  </h3>
                  <p className="text-muted-text pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-6">
                <img src="/logo.png" alt="Debesties Mail" className="w-12 h-12 object-contain" />
              </div>
              <p className="text-sm text-muted-text mb-6">
                Protect your real inbox with disposable emails. Approachable, fast, and built for the community.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-text hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-main-text mb-6">Service</h4>
              <ul className="space-y-4 text-sm text-muted-text">
                <li><a href="#" className="hover:text-primary transition-colors">Temp Mail</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Access</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Browser Extension</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Custom Domains</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-main-text mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-text">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-main-text mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-muted-text">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Debesties Mail. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Made with</span>
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>for a cleaner web</span>
            </div>
          </div>
        </div>
        {/* Support Bubble */}
        {isPro && (
          <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
              {showSupport && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="bg-primary p-4 text-white">
                    <h4 className="font-bold">Priority Support</h4>
                    <p className="text-xs text-white/80">Pro members get 24/7 priority assistance.</p>
                  </div>
                  <div className="p-6 h-64 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-page-bg rounded-full flex items-center justify-center mb-4">
                      <Zap className="text-primary" />
                    </div>
                    <p className="text-sm text-muted-text">How can we help you today?</p>
                    <button className="btn-primary mt-4 w-full py-2 text-sm">Start Chat</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowSupport(!showSupport)}
              className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              {showSupport ? <X /> : <Bell />}
            </button>
          </div>
        )}
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-main-text/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-muted-text hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-main-text mb-2">Welcome Back</h3>
                <p className="text-muted-text text-sm">Sign in to access your Pro features or save your inboxes.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                requestMagicLink(formData.get('email') as string);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Real Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-separator focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  Send Magic Link
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="mt-6 text-center text-[10px] text-muted-text font-medium leading-relaxed">
                By signing in, you agree to our Terms of Service. <br />
                We'll never spam you or share your real data.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
