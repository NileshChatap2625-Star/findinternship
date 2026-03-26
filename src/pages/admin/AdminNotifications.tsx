import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Profile { user_id: string; full_name: string | null; email: string | null; }

export default function AdminNotifications() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("user_id, full_name, email").then(({ data }) => {
      if (data) setUsers(data as Profile[]);
    });
  }, []);

  const toggleUser = (uid: string) => {
    setSelectedUsers(prev => prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]);
  };

  const selectAll = () => setSelectedUsers(users.map(u => u.user_id));

  const send = async () => {
    if (!message.trim() || selectedUsers.length === 0) { toast.error("Select users and write a message"); return; }
    setSending(true);
    const rows = selectedUsers.map(user_id => ({ user_id, message: message.trim(), type: "admin" }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) toast.error("Failed to send"); else { toast.success(`Sent to ${selectedUsers.length} users`); setMessage(""); setSelectedUsers([]); }
    setSending(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Send Notifications</h1>
      <p className="text-muted-foreground mb-6">Broadcast messages to users.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-foreground font-medium">Select Users</Label>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-primary">Select All</Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.map(u => (
              <label key={u.user_id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(u.user_id) ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-transparent"}`}>
                <input type="checkbox" checked={selectedUsers.includes(u.user_id)} onChange={() => toggleUser(u.user_id)} className="accent-primary" />
                <div>
                  <p className="text-sm text-foreground">{u.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <Label className="text-foreground font-medium mb-2 block">Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your notification message..." className="bg-secondary border-border text-foreground min-h-[200px] mb-4" />
          <Button onClick={send} disabled={sending} className="w-full bg-primary text-primary-foreground gap-2">
            <Send className="w-4 h-4" /> Send to {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
