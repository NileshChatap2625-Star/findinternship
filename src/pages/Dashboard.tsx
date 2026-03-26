import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Plus, X, Sparkles, FileText, Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface AIRecommendation {
  title: string;
  role: string;
  reason: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; email: string; skills: string[]; resume_text: string }>({
    full_name: "", email: "", skills: [], resume_text: "",
  });
  const [newSkill, setNewSkill] = useState("");
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        skills: data.skills || [],
        resume_text: data.resume_text || "",
      });
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    const updated = [...profile.skills, newSkill.trim()];
    await supabase.from("profiles").update({ skills: updated }).eq("user_id", user!.id);
    setProfile({ ...profile, skills: updated });
    setNewSkill("");
    toast.success("Skill added!");
  };

  const removeSkill = async (skill: string) => {
    const updated = profile.skills.filter((s) => s !== skill);
    await supabase.from("profiles").update({ skills: updated }).eq("user_id", user!.id);
    setProfile({ ...profile, skills: updated });
  };

  const saveResume = async () => {
    await supabase.from("profiles").update({ resume_text: profile.resume_text }).eq("user_id", user!.id);
    toast.success("Resume saved!");
  };

  const getRecommendations = async () => {
    if (profile.skills.length === 0 && !profile.resume_text) {
      toast.error("Add skills or resume text first!");
      return;
    }
    setAiLoading(true);
    try {
      const response = await supabase.functions.invoke("ai-recommend", {
        body: { skills: profile.skills, resume_text: profile.resume_text, type: "recommend" },
      });
      if (response.error) throw response.error;
      setRecommendations(response.data.recommendations || []);
      setSkillSuggestions(response.data.skill_suggestions || "");
    } catch (err: any) {
      toast.error("Failed to get recommendations");
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeResume = async () => {
    if (!profile.resume_text) {
      toast.error("Paste your resume text first!");
      return;
    }
    setResumeLoading(true);
    try {
      const response = await supabase.functions.invoke("ai-recommend", {
        body: { resume_text: profile.resume_text, type: "analyze" },
      });
      if (response.error) throw response.error;
      setResumeAnalysis(response.data.analysis || "");
    } catch (err: any) {
      toast.error("Failed to analyze resume");
    } finally {
      setResumeLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile and get AI-powered recommendations.</p>
        </motion.div>

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

          {/* Resume Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Resume Text</h3>
            </div>
            <Textarea
              value={profile.resume_text}
              onChange={(e) => setProfile({ ...profile, resume_text: e.target.value })}
              placeholder="Paste your resume text here for AI analysis..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[200px] mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={saveResume} variant="outline" className="border-border text-foreground hover:bg-secondary">Save</Button>
              <Button onClick={analyzeResume} disabled={resumeLoading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                {resumeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyze Resume
              </Button>
            </div>
            {resumeAnalysis && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-sm text-foreground prose prose-invert prose-sm max-w-none">
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
            <div className="space-y-3">
              {[
                { msg: "New AI internships matching your skills!", time: "2h ago" },
                { msg: "Complete your profile for better matches.", time: "1d ago" },
                { msg: "5 new internships in Web Development.", time: "3d ago" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{n.msg}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">AI Recommendations</h2>
            <Button onClick={getRecommendations} disabled={aiLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Get Recommendations
            </Button>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <h3 className="font-display font-semibold text-foreground mb-1">{rec.title}</h3>
                  <p className="text-sm text-primary mb-3">{rec.role}</p>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Add your skills or resume, then click "Get Recommendations" to see AI-curated internships.</p>
            </div>
          )}

          {skillSuggestions && (
            <div className="mt-6 glass-card rounded-xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-3">🎯 Skill Improvement Suggestions</h3>
              <div className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{skillSuggestions}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
