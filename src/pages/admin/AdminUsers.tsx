import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Trash2, Search } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  skills: string[] | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", skills: "" });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as Profile[]);
  };

  const openEdit = (u: Profile) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name || "", email: u.email || "", skills: (u.skills || []).join(", ") });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    const skills = editForm.skills.split(",").map(s => s.trim()).filter(Boolean);
    await supabase.from("profiles").update({ full_name: editForm.full_name, email: editForm.email, skills }).eq("user_id", editUser.user_id);
    toast.success("User updated");
    setEditUser(null);
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user's profile?")) return;
    await supabase.from("profiles").update({ full_name: "[Deleted]", email: null, skills: [], resume_text: null }).eq("user_id", userId);
    toast.success("User profile cleared");
    fetchUsers();
  };

  const filtered = users.filter(u =>
    !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">User Management</h1>
      <p className="text-muted-foreground mb-6">View and manage registered users.</p>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10 bg-secondary border-border text-foreground" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-4 text-muted-foreground font-medium">Name</th>
              <th className="p-4 text-muted-foreground font-medium">Email</th>
              <th className="p-4 text-muted-foreground font-medium">Skills</th>
              <th className="p-4 text-muted-foreground font-medium">Joined</th>
              <th className="p-4 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-4 text-foreground">{u.full_name || "—"}</td>
                <td className="p-4 text-foreground">{u.email || "—"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(u.skills || []).slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    {(u.skills || []).length > 3 && <Badge variant="outline" className="text-xs">+{(u.skills!).length - 3}</Badge>}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteUser(u.user_id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}
      </div>

      <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            <div><Label>Skills (comma-separated)</Label><Input value={editForm.skills} onChange={e => setEditForm({ ...editForm, skills: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            <Button onClick={saveEdit} className="w-full bg-primary text-primary-foreground">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
