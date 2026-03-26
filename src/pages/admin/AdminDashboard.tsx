import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Briefcase, Bookmark, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, internships: 0, bookmarks: 0, applications: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("internships").select("id", { count: "exact", head: true }),
      supabase.from("bookmarks").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]).then(([u, i, b, a]) => {
      setStats({
        users: u.count ?? 0,
        internships: i.count ?? 0,
        bookmarks: b.count ?? 0,
        applications: a.count ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Internships", value: stats.internships, icon: Briefcase, color: "text-accent" },
    { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark, color: "text-primary" },
    { label: "Applications", value: stats.applications, icon: Bell, color: "text-accent" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of your platform.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <c.icon className={`w-8 h-8 ${c.color}`} />
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
