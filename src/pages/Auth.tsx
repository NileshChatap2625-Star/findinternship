import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, Shield, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "nileshchatap25@gmail.com";
const ADMIN_PASSWORD = "Nilesh@2625";
const MAX_OTP_ATTEMPTS = 5;

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

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminStep, setAdminStep] = useState<1 | 2 | 3>(1); // 1=email, 2=OTP, 3=password fallback
  const [otpValue, setOtpValue] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (adminEmail.toLowerCase() !== ADMIN_EMAIL) {
      toast.error("This email is not authorized for admin access");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-otp", {
        body: { email: adminEmail.toLowerCase() },
      });

      if (error) throw new Error(error.message || "Failed to send OTP");
      if (data?.error) throw new Error(data.error);

      toast.success("OTP sent to your email!");
      setAdminStep(2);
      setOtpValue("");
      setOtpAttempts(0);
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast.error("Please enter the full 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-otp", {
        body: { email: adminEmail.toLowerCase(), otp: otpValue },
      });

      if (error) throw new Error(error.message || "Verification failed");
      if (data?.error) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          toast.error("Too many failed attempts. Use password login instead.");
          setAdminStep(3);
          return;
        }
        
        throw new Error(data.error);
      }

      // OTP verified — sign in with password
      await signIn(adminEmail.toLowerCase(), ADMIN_PASSWORD);
      toast.success("Welcome, Admin!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
      setOtpValue("");
    }
  };

  const handlePasswordFallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== ADMIN_PASSWORD) {
      toast.error("Invalid password");
      return;
    }

    setLoading(true);
    try {
      await signIn(adminEmail.toLowerCase(), ADMIN_PASSWORD);
      toast.success("Welcome, Admin!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Admin login failed");
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

  const renderAdminForm = () => {
    if (adminStep === 1) {
      return (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-foreground">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A 6-digit OTP will be sent to your admin email.
            </p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending OTP...
              </span>
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>
      );
    }

    if (adminStep === 2) {
      return (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Enter OTP</Label>
            <p className="text-xs text-muted-foreground mb-2">
              We sent a 6-digit code to <span className="font-medium text-foreground">{adminEmail}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
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
            {otpAttempts > 0 && (
              <p className="text-xs text-destructive text-center">
                {MAX_OTP_ATTEMPTS - otpAttempts} attempt{MAX_OTP_ATTEMPTS - otpAttempts !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || otpValue.length !== 6}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </Button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setAdminStep(1); setOtpAttempts(0); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Change email
            </button>
            <button
              type="button"
              onClick={() => handleSendOTP()}
              disabled={resendCooldown > 0 || loading}
              className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      );
    }

    // Step 3: Password fallback
    return (
      <form onSubmit={handlePasswordFallback} className="space-y-4">
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Too many OTP attempts. Use password to login.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-fallback-password" className="text-foreground">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="admin-fallback-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In with Password"
          )}
        </Button>
        <button
          type="button"
          onClick={() => { setAdminStep(1); setOtpAttempts(0); setAdminPassword(""); }}
          className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
        >
          ← Start over
        </button>
      </form>
    );
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
            {isAdminMode
              ? adminStep === 3 ? "Password Login" : "Admin Login"
              : isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            {isAdminMode
              ? adminStep === 1
                ? "Enter your admin email to receive a login OTP"
                : adminStep === 2
                ? "Enter the OTP sent to your email"
                : "Enter your admin password"
              : isLogin
              ? "Sign in to find your dream internship"
              : "Join InternAI to get AI-powered recommendations"}
          </p>

          {isAdminMode ? renderAdminForm() : (
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
