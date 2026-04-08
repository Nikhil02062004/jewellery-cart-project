import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Send, RefreshCw, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'register' | 'otp';

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  // ── Countdown for OTP resend button ──────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Send Magic Link (Email OTP) ──────────────────────────────────
  const sendOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
      setOtpSent(true);
      startCooldown();
      toast({
        title: '✉️ Magic Link Sent!',
        description: `Check your inbox at ${email} and click the link to login.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Password Login / Register ────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast({ title: 'Welcome back!', description: "You've successfully logged in." });
        navigate('/account');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email to verify your account.' });
        navigate('/account');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── OTP form submit ──────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtp(formData.email);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[25vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Welcome</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">
            {mode === 'register' ? 'Register' : mode === 'otp' ? 'Magic Link' : 'Login'}
          </h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-lg p-8">

              {/* ── Mode Tabs ──────────────────────────────────── */}
              <div className="flex mb-8 border-b border-border">
                {(['login', 'register', 'otp'] as AuthMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setOtpSent(false); }}
                    className={`flex-1 pb-4 font-body uppercase tracking-wider text-xs transition-colors ${
                      mode === m ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground'
                    }`}
                  >
                    {m === 'otp' ? '🔗 Magic Link' : m === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>

              {/* ── OTP / Magic Link Flow ──────────────────────── */}
              {mode === 'otp' && (
                <>
                  {!otpSent ? (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-2 block">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="you@example.com"
                            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                        <Send className="w-4 h-4" />
                        {loading ? 'Sending...' : 'Send Magic Link'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        We'll send a secure login link to your email. No password needed.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl mb-2">Check Your Email</h3>
                        <p className="font-body text-sm text-muted-foreground">
                          We sent a magic link to <strong>{formData.email}</strong>.
                          Click the link in the email to login instantly.
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                        <p>📬 Didn't receive it? Check your spam folder.</p>
                        <p>⏳ Link expires in 1 hour.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        disabled={resendCooldown > 0 || loading}
                        onClick={() => sendOtp(formData.email)}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Magic Link'}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* ── Password Login / Register ──────────────────── */}
              {mode !== 'otp' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {mode === 'register' && (
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Your Name"
                          className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div className="flex justify-between items-center">
                      <span />
                      <button
                        type="button"
                        onClick={() => setMode('otp')}
                        className="font-body text-sm text-gold hover:underline"
                      >
                        Login without password →
                      </button>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                  </Button>
                </form>
              )}

              {mode !== 'otp' && (
                <p className="font-body text-sm text-muted-foreground text-center mt-6">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-gold hover:underline"
                  >
                    {mode === 'login' ? 'Register' : 'Login'}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AuthPage;
