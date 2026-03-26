import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Application {
  id: string;
  internship_title: string;
  name: string;
  email: string;
  cover_letter: string;
  status: string;
  created_at: string;
}

export default function AdminApplications() {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", id);
    toast.success(`Application ${status}`);
    fetchApps();
  };

  const statusColor = (s: string) => s === "approved" ? "bg-primary/20 text-primary" : s === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent";

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Applications</h1>
      <p className="text-muted-foreground mb-6">Review and manage user applications.</p>

      <div className="space-y-4">
        {apps.map(a => (
          <div key={a.id} className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground">{a.internship_title}</h3>
                <p className="text-sm text-muted-foreground">{a.name} · {a.email}</p>
                {a.cover_letter && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.cover_letter}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <Badge className={`${statusColor(a.status)} border-0`}>{a.status}</Badge>
            </div>
            {a.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => updateStatus(a.id, "approved")} className="bg-primary text-primary-foreground">Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(a.id, "rejected")}>Reject</Button>
              </div>
            )}
          </div>
        ))}
        {apps.length === 0 && <p className="text-center text-muted-foreground py-8">No applications yet.</p>}
      </div>
    </div>
  );
}
