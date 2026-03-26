import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(187, 94%, 43%)", "hsl(38, 92%, 50%)", "hsl(280, 70%, 55%)", "hsl(150, 60%, 45%)", "hsl(0, 84%, 60%)", "hsl(210, 80%, 55%)"];

export default function AdminAnalytics() {
  const [skillData, setSkillData] = useState<{ name: string; count: number }[]>([]);
  const [domainData, setDomainData] = useState<{ name: string; value: number }[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Skills frequency from profiles
    const { data: profiles } = await supabase.from("profiles").select("skills");
    if (profiles) {
      const freq: Record<string, number> = {};
      profiles.forEach((p: any) => (p.skills || []).forEach((s: string) => { freq[s] = (freq[s] || 0) + 1; }));
      setSkillData(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })));
    }

    // Domain distribution from internships
    const { data: internships } = await supabase.from("internships").select("domain");
    if (internships) {
      const freq: Record<string, number> = {};
      internships.forEach((i: any) => { freq[i.domain] = (freq[i.domain] || 0) + 1; });
      setDomainData(Object.entries(freq).map(([name, value]) => ({ name, value })));
    }

    // User growth by month
    const { data: allProfiles } = await supabase.from("profiles").select("created_at");
    if (allProfiles) {
      const monthly: Record<string, number> = {};
      allProfiles.forEach((p: any) => {
        const m = new Date(p.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        monthly[m] = (monthly[m] || 0) + 1;
      });
      setUserGrowth(Object.entries(monthly).map(([month, users]) => ({ month, users })));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-8">Platform usage and trends.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Most Popular Skills</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} angle={-35} textAnchor="end" height={80} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(230, 40%, 10%)", border: "1px solid hsl(230, 25%, 18%)", color: "hsl(210, 40%, 95%)" }} />
              <Bar dataKey="count" fill="hsl(187, 94%, 43%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Domain Distribution */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Internships by Domain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={domainData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {domainData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(230, 40%, 10%)", border: "1px solid hsl(230, 25%, 18%)", color: "hsl(210, 40%, 95%)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-foreground mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)" }} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(230, 40%, 10%)", border: "1px solid hsl(230, 25%, 18%)", color: "hsl(210, 40%, 95%)" }} />
              <Bar dataKey="users" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
