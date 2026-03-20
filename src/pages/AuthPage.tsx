import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully logged in." });
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
        toast({ title: "Account created!", description: "Welcome to Jewels!" });
        navigate('/account');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[25vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Welcome</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">
            {isLogin ? 'Login' : 'Register'}
          </h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-lg p-8">
              {/* Toggle */}
              <div className="flex mb-8 border-b border-border">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 pb-4 font-body uppercase tracking-wider text-sm transition-colors ${
                    isLogin ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 pb-4 font-body uppercase tracking-wider text-sm transition-colors ${
                    !isLogin ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                        placeholder="John Doe"
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
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {isLogin && (
                  <div className="flex justify-end">
                    <a href="#" className="font-body text-sm text-gold hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                </Button>
              </form>

              <p className="font-body text-sm text-muted-foreground text-center mt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gold hover:underline"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AuthPage;
