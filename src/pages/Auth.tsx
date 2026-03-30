import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, Shield } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get("mode") === "admin";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Admin OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Listen for auth changes to handle OTP verification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isAdminMode && event === "SIGNED_IN" && session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          toast.success("Welcome, Admin!");
          navigate("/admin");
        } else {
          toast.error("You do not have admin access.");
          await supabase.auth.signOut();
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [isAdminMode, navigate]);

  const handleAdminSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setOtpSent(true);
      toast.success("OTP sent to your email! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      // Auth state change listener handles the rest
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        await signUp(email, password, fullName);
        toast.success("Account created! You can now sign in.");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdminMode ? 'bg-destructive' : 'bg-primary'}`}>
              {isAdminMode ? (
                <Shield className="w-6 h-6 text-destructive-foreground" />
              ) : (
                <Briefcase className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            {isAdminMode ? "Admin Login" : isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            {isAdminMode
              ? otpSent
                ? "Enter the 6-digit OTP sent to your email"
                : "Enter your admin email to receive an OTP"
              : isLogin
              ? "Sign in to find your dream internship"
              : "Join InternAI to get AI-powered recommendations"}
          </p>

          {isAdminMode ? (
            // Admin OTP Login
            !otpSent ? (
              <form onSubmit={handleAdminSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-foreground">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-foreground text-center block">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    OTP sent to <span className="text-primary font-medium">{email}</span>
                  </p>
                </div>
                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
                  ← Change email
                </button>
              </form>
            )
          ) : (
            // Regular user login/signup
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required minLength={6} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
          )}

          {!isAdminMode && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
