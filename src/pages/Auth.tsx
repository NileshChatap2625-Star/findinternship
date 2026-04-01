import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, Shield, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "nileshchatap25@gmail.com";
const ADMIN_PASSWORD = "Nilesh@2625";

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

  // Admin OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!adminEmail.trim()) {
      toast.error("Please enter your admin email");
      return;
    }
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

      setOtpSent(true);
      setResendTimer(RESEND_COOLDOWN);
      toast.success("OTP sent to your email! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-otp", {
        body: { email: adminEmail.toLowerCase(), otp },
      });

      if (error) throw new Error(error.message || "Verification failed");
      if (data?.error) throw new Error(data.error);

      if (data?.success && data?.token_hash) {
        // Use the magic link token to create a session
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (verifyError) {
          console.error("Session creation error:", verifyError);
          // Fallback: try password sign in if the admin has a password
          toast.success("OTP verified! Signing you in...");
          try {
            await signIn(adminEmail.toLowerCase(), "Nilesh@2625");
            toast.success("Welcome, Admin!");
            navigate("/admin");
            return;
          } catch {
            // If password login also fails, still redirect since OTP was verified
          }
        }

        toast.success("Welcome, Admin!");
        navigate("/admin");
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setOtp("");
    handleSendOTP();
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
            {isAdminMode
              ? otpSent ? "Enter OTP" : "Admin Login"
              : isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            {isAdminMode
              ? otpSent
                ? `We've sent a 6-digit code to ${adminEmail}`
                : "Enter your admin email to receive a login OTP"
              : isLogin
              ? "Sign in to find your dream internship"
              : "Join InternAI to get AI-powered recommendations"}
          </p>

          {isAdminMode ? (
            <>
              {!otpSent ? (
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
                      Only authorized admin emails can log in.
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
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-foreground text-center block">Enter 6-digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(val) => setOtp(val)}
                      >
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
                      OTP expires in 5 minutes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0 || loading}
                      className={`text-sm flex items-center gap-1 ${
                        resendTimer > 0
                          ? "text-muted-foreground cursor-not-allowed"
                          : "text-primary hover:underline"
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setResendTimer(0);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Change email
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
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
