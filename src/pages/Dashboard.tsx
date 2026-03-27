import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Plus, X, Sparkles, FileText, Bell, Loader2, Upload, Send, MapPin, Clock, DollarSign, CheckCircle, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface AIRecommendation {
  title: string;
  role: string;
  reason: string;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Internship {
  id: string;
  title: string;
  company: string;
  role: string;
  location: string;
  domain: string;
  type: string;
  description: string;
  skills: string[];
  duration: string;
  stipend: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{ full_name: string; email: string; skills: string[]; resume_text: string }>({
    full_name: "", email: "", skills: [], resume_text: "",
  });
  const [newSkill, setNewSkill] = useState("");
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [matchingInternships, setMatchingInternships] = useState<Internship[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [applyDialog, setApplyDialog] = useState<Internship | AIRecommendation | null>(null);
  const [applyDialogType, setApplyDialogType] = useState<"internship" | "recommendation">("internship");
  const [applyForm, setApplyForm] = useState({ name: "", email: "", coverLetter: "" });
  const [applySubmitted, setApplySubmitted] = useState(false);

  // Steps tracking for the flow
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotifications();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      const p = {
        full_name: data.full_name || "",
        email: data.email || "",
        skills: data.skills || [],
        resume_text: data.resume_text || "",
      };
      setProfile(p);
      // If resume already exists, show results step
      if (p.resume_text) {
        setStep("results");
      }
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data as Notification[]);
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    const updated = [...profile.skills, newSkill.trim()];
    await supabase.from("profiles").update({ skills: updated }).eq("user_id", user!.id);
    setProfile({ ...profile, skills: updated });
    setNewSkill("");
    toast.success("Skill added!");
    setTimeout(fetchNotifications, 500);
  };

  const removeSkill = async (skill: string) => {
    const updated = profile.skills.filter((s) => s !== skill);
    await supabase.from("profiles").update({ skills: updated }).eq("user_id", user!.id);
    setProfile({ ...profile, skills: updated });
    setTimeout(fetchNotifications, 500);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setPdfLoading(true);
    try {
      const text = await extractTextFromPdf(file);
      if (!text) {
        toast.error("Could not extract text from PDF. Try pasting text manually.");
        return;
      }
      const updatedProfile = { ...profile, resume_text: text };
      setProfile(updatedProfile);
      await supabase.from("profiles").update({ resume_text: text }).eq("user_id", user!.id);
      toast.success("Resume PDF uploaded and text extracted!");
      setTimeout(fetchNotifications, 500);
      // Auto-trigger analysis
      autoAnalyze(text, profile.skills);
    } catch (err) {
      toast.error("Failed to parse PDF. Try pasting resume text instead.");
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAndAnalyze = async () => {
    if (!profile.resume_text.trim()) {
      toast.error("Please upload a PDF or paste your resume text first!");
      return;
    }
    await supabase.from("profiles").update({ resume_text: profile.resume_text }).eq("user_id", user!.id);
    toast.success("Resume saved!");
    setTimeout(fetchNotifications, 500);
    autoAnalyze(profile.resume_text, profile.skills);
  };

  const autoAnalyze = async (resumeText: string, skills: string[]) => {
    setStep("analyzing");
    setResumeLoading(true);
    setAiLoading(true);
    setMatchLoading(true);

    try {
      // 1. Analyze resume
      const analyzeResponse = await supabase.functions.invoke("ai-recommend", {
        body: { resume_text: resumeText, type: "analyze" },
      });
      if (!analyzeResponse.error) {
        setResumeAnalysis(analyzeResponse.data.analysis || "");
      }
    } catch (err) {
      console.error("Resume analysis error:", err);
    } finally {
      setResumeLoading(false);
    }

    try {
      // 2. Get AI recommendations
      const recResponse = await supabase.functions.invoke("ai-recommend", {
        body: { skills, resume_text: resumeText, type: "recommend" },
      });
      if (!recResponse.error) {
        setRecommendations(recResponse.data.recommendations || []);
        setSkillSuggestions(recResponse.data.skill_suggestions || "");

        // 3. Generate real notifications based on analysis
        const recs = recResponse.data.recommendations || [];
        if (recs.length > 0) {
          const topTitles = recs.slice(0, 3).map((r: AIRecommendation) => r.title).join(", ");
          await supabase.from("notifications").insert({
            user_id: user!.id,
            message: `AI found ${recs.length} matching internships for you: ${topTitles}`,
            type: "ai_match",
          });
        }

        if (recResponse.data.skill_suggestions) {
          await supabase.from("notifications").insert({
            user_id: user!.id,
            message: "AI has skill improvement suggestions for you! Check your dashboard.",
            type: "skill_suggestion",
          });
        }

        setTimeout(fetchNotifications, 500);
      }
    } catch (err) {
      console.error("Recommendation error:", err);
    } finally {
      setAiLoading(false);
    }

    try {
      // 4. Fetch matching internships from DB based on skills
      const { data: allInternships } = await supabase.from("internships").select("*");
      if (allInternships) {
        const resumeLower = resumeText.toLowerCase();
        const skillsLower = skills.map(s => s.toLowerCase());

        const scored = (allInternships as Internship[]).map(intern => {
          let score = 0;
          // Match by internship skills vs user skills
          intern.skills.forEach(is => {
            if (skillsLower.some(us => is.toLowerCase().includes(us) || us.includes(is.toLowerCase()))) score += 3;
            if (resumeLower.includes(is.toLowerCase())) score += 2;
          });
          // Match by domain/title in resume
          if (resumeLower.includes(intern.domain.toLowerCase())) score += 2;
          if (resumeLower.includes(intern.title.toLowerCase())) score += 1;
          return { intern, score };
        });

        const matched = scored
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map(s => s.intern);

        setMatchingInternships(matched.length > 0 ? matched : (allInternships as Internship[]).slice(0, 6));

        if (matched.length > 0) {
          await supabase.from("notifications").insert({
            user_id: user!.id,
            message: `Found ${matched.length} internships matching your resume! Apply now.`,
            type: "internship_match",
          });
          setTimeout(fetchNotifications, 500);
        }
      }
    } catch (err) {
      console.error("Matching error:", err);
    } finally {
      setMatchLoading(false);
      setStep("results");
    }
  };

  const openApplyDialog = (item: Internship | AIRecommendation, type: "internship" | "recommendation") => {
    setApplyDialog(item);
    setApplyDialogType(type);
    setApplySubmitted(false);
    setApplyForm({ name: profile.full_name, email: profile.email, coverLetter: "" });
  };

  const submitApplication = async () => {
    if (!applyForm.name.trim() || !applyForm.email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (user && applyDialog) {
      const title = applyDialogType === "internship" ? (applyDialog as Internship).title : (applyDialog as AIRecommendation).title;
      const internshipId = applyDialogType === "internship" ? (applyDialog as Internship).id : null;
      await supabase.from("applications").insert({
        user_id: user.id,
        internship_id: internshipId,
        internship_title: title,
        name: applyForm.name,
        email: applyForm.email,
        cover_letter: applyForm.coverLetter,
      });

      // Notify user
      await supabase.from("notifications").insert({
        user_id: user.id,
        message: `Your application for "${title}" has been submitted! The admin will review it soon.`,
        type: "application_submitted",
      });
      setTimeout(fetchNotifications, 500);
    }
    setApplySubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Upload your resume, get AI analysis, and find matching internships.</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { key: "upload", label: "Upload Resume", icon: Upload },
            { key: "analyzing", label: "AI Analysis", icon: Sparkles },
            { key: "results", label: "Matching Internships", icon: Briefcase },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className={`w-12 h-0.5 ${step === s.key || (s.key === "results" && step === "results") || (s.key === "analyzing" && step !== "upload") ? "bg-primary" : "bg-border"}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s.key ? "bg-primary text-primary-foreground" :
                (s.key === "upload" && step !== "upload") || (s.key === "analyzing" && step === "results") ? "bg-primary/20 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>
                {(s.key === "upload" && step !== "upload") || (s.key === "analyzing" && step === "results") ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" />
                )}
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">{profile.full_name || "User"}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <h3 className="font-display font-medium text-foreground mb-3">Your Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground gap-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
              {profile.skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet</p>}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill..." className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" onKeyDown={(e) => e.key === "Enter" && addSkill()} />
              <Button size="icon" onClick={addSkill} className="bg-primary text-primary-foreground shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
          </motion.div>

          {/* Resume Upload & Analysis */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Resume</h3>
            </div>

            {/* PDF Upload */}
            <div className="mb-4">
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading}
                className="w-full border-dashed border-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-2 h-16"
              >
                {pdfLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Extracting text from PDF...</>
                ) : (
                  <><Upload className="w-5 h-5" /> Upload Resume PDF</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">or paste text below</p>
            </div>

            <Textarea
              value={profile.resume_text}
              onChange={(e) => setProfile({ ...profile, resume_text: e.target.value })}
              placeholder="Paste your resume text here for AI analysis..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[140px] mb-4"
            />
            <Button
              onClick={handleSaveAndAnalyze}
              disabled={resumeLoading || aiLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {(resumeLoading || aiLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Save & Analyze Resume
            </Button>

            {/* Analysis Result */}
            {resumeAnalysis && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-sm text-foreground prose prose-invert prose-sm max-w-none max-h-[300px] overflow-y-auto">
                <ReactMarkdown>{resumeAnalysis}</ReactMarkdown>
              </div>
            )}
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Notifications</h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-muted-foreground" : "bg-primary"}`} />
                  <div>
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications yet. Upload your resume to get started!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> AI Recommendations
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors flex flex-col">
                  <h3 className="font-display font-semibold text-foreground mb-1">{rec.title}</h3>
                  <p className="text-sm text-primary mb-3">{rec.role}</p>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{rec.reason}</p>
                  <Button
                    size="sm"
                    onClick={() => openApplyDialog(rec, "recommendation")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
                  >
                    <Send className="w-4 h-4" /> Apply Now
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skill Suggestions */}
        {skillSuggestions && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-3">🎯 Skill Improvement Suggestions</h3>
              <div className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{skillSuggestions}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {/* Matching Internships from Database */}
        {(matchingInternships.length > 0 || matchLoading) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Matching Internships
            </h2>

            {matchLoading ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Finding internships that match your resume...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matchingInternships.map((intern, i) => (
                  <motion.div key={intern.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors flex flex-col">
                    <div className="mb-3">
                      <h3 className="font-display font-semibold text-foreground">{intern.title}</h3>
                      <p className="text-sm text-primary">{intern.company}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{intern.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {intern.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="bg-secondary/70 text-secondary-foreground text-xs">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{intern.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{intern.duration}</span>
                      {intern.stipend && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{intern.stipend}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">{intern.type}</Badge>
                      <Button size="sm" onClick={() => openApplyDialog(intern, "internship")} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs h-8">
                        <Send className="w-3.5 h-3.5" /> Apply
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state when no resume */}
        {step === "upload" && !resumeAnalysis && matchingInternships.length === 0 && (
          <div className="mt-8 glass-card rounded-xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Get Started!</p>
            <p className="text-muted-foreground text-sm">Upload your resume (PDF or text) and we'll analyze it, suggest improvements, and find matching internships for you to apply.</p>
          </div>
        )}

        {/* Analyzing state */}
        {step === "analyzing" && (
          <div className="mt-8 glass-card rounded-xl p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Analyzing your resume...</p>
            <p className="text-muted-foreground text-sm">Our AI is reviewing your resume, finding matching internships, and preparing personalized suggestions.</p>
          </div>
        )}

        {/* Apply Dialog */}
        <Dialog open={!!applyDialog} onOpenChange={(open) => { if (!open) setApplyDialog(null); }}>
          <DialogContent className="bg-card border-border text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                {applySubmitted ? "Application Submitted!" : `Apply for ${applyDialog && 'title' in applyDialog ? applyDialog.title : ""}`}
              </DialogTitle>
            </DialogHeader>
            {applySubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-2">Your application has been submitted!</p>
                <p className="text-sm text-muted-foreground">The administrator will review your application and reply soon.</p>
                <Button onClick={() => setApplyDialog(null)} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Close</Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); submitApplication(); }}
                className="space-y-4"
              >
                {applyDialogType === "internship" && applyDialog && "company" in applyDialog && (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{applyDialog.company}</span> · {applyDialog.role} · {applyDialog.location}
                  </p>
                )}
                <div>
                  <Label className="text-foreground">Full Name *</Label>
                  <Input value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })} className="bg-secondary border-border text-foreground mt-1" required />
                </div>
                <div>
                  <Label className="text-foreground">Email *</Label>
                  <Input type="email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} className="bg-secondary border-border text-foreground mt-1" required />
                </div>
                <div>
                  <Label className="text-foreground">Cover Letter</Label>
                  <Textarea value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} placeholder="Why are you interested in this role?" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground mt-1 min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Send className="w-4 h-4" /> Submit Application
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
