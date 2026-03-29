import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Briefcase } from "lucide-react";

const COLORS = [
  "hsl(187, 94%, 43%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(0, 84%, 60%)",
  "hsl(210, 80%, 55%)",
  "hsl(320, 70%, 55%)",
  "hsl(45, 90%, 55%)",
];

export default function LiveDashboard() {
  const [skillData, setSkillData] = useState<{ name: string; count: number }[]>([]);
  const [domainData, setDomainData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Skills from internships
    const { data: internships } = await supabase.from("internships").select("skills, domain");
    if (internships) {
      const skillFreq: Record<string, number> = {};
      const domainFreq: Record<string, number> = {};
      internships.forEach((i: any) => {
        (i.skills || []).forEach((s: string) => {
          skillFreq[s] = (skillFreq[s] || 0) + 1;
        });
        if (i.domain) {
          domainFreq[i.domain] = (domainFreq[i.domain] || 0) + 1;
        }
      });
      setSkillData(
        Object.entries(skillFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }))
      );
      setDomainData(
        Object.entries(domainFreq)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }))
      );
    }
  };

  if (skillData.length === 0 && domainData.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-24 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <span className="text-sm font-medium text-primary uppercase tracking-widest">Live Insights</span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
          Trending <span className="gradient-text">Right Now</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          Real-time data from our internship platform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Most Popular Skills */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground text-xl">Most Popular Skills</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={skillData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(230, 40%, 10%)",
                  border: "1px solid hsl(230, 25%, 22%)",
                  borderRadius: "12px",
                  color: "hsl(210, 40%, 95%)",
                  fontFamily: "'Times New Roman', serif",
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {skillData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Most Popular Domains */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display font-bold text-foreground text-xl">Most Popular Domains</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={domainData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontFamily: "'Times New Roman', serif", fontSize: 11 }}
              >
                {domainData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(230, 40%, 10%)",
                  border: "1px solid hsl(230, 25%, 22%)",
                  borderRadius: "12px",
                  color: "hsl(210, 40%, 95%)",
                  fontFamily: "'Times New Roman', serif",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}
