import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface DBInternship {
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

const emptyForm = { title: "", company: "", role: "", location: "", domain: "", type: "Remote", description: "", skills: "", duration: "", stipend: "" };

export default function AdminInternships() {
  const [internships, setInternships] = useState<DBInternship[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("internships").select("*").order("created_at", { ascending: false });
    if (data) setInternships(data as DBInternship[]);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (i: DBInternship) => {
    setEditId(i.id);
    setForm({ title: i.title, company: i.company, role: i.role, location: i.location, domain: i.domain, type: i.type, description: i.description, skills: i.skills.join(", "), duration: i.duration, stipend: i.stipend || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const payload = { ...form, skills, stipend: form.stipend || null };
    if (editId) {
      await supabase.from("internships").update(payload).eq("id", editId);
      toast.success("Internship updated");
    } else {
      await supabase.from("internships").insert(payload);
      toast.success("Internship created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this internship?")) return;
    await supabase.from("internships").delete().eq("id", id);
    toast.success("Internship deleted");
    fetchAll();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Internship Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove internships visible to all users.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Add Internship</Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-4 text-muted-foreground font-medium">Title</th>
              <th className="p-4 text-muted-foreground font-medium">Company</th>
              <th className="p-4 text-muted-foreground font-medium">Domain</th>
              <th className="p-4 text-muted-foreground font-medium">Location</th>
              <th className="p-4 text-muted-foreground font-medium">Skills</th>
              <th className="p-4 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {internships.map(i => (
              <tr key={i.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-4 text-foreground font-medium">{i.title}</td>
                <td className="p-4 text-foreground">{i.company}</td>
                <td className="p-4"><Badge variant="secondary" className="text-xs">{i.domain}</Badge></td>
                <td className="p-4 text-muted-foreground">{i.location}</td>
                <td className="p-4"><div className="flex flex-wrap gap-1">{i.skills.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}{i.skills.length > 2 && <Badge variant="outline" className="text-xs">+{i.skills.length - 2}</Badge>}</div></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {internships.length === 0 && <p className="text-center text-muted-foreground py-8">No internships yet.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Internship" : "Add New Internship"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company *</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
              <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
              <div><Label>Domain</Label><Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full mt-1 rounded-md bg-secondary border border-border text-foreground px-3 py-2 text-sm">
                  <option>Remote</option><option>On-site</option><option>Hybrid</option>
                </select>
              </div>
              <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="bg-secondary border-border text-foreground mt-1" /></div>
            </div>
            <div><Label>Stipend</Label><Input value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} className="bg-secondary border-border text-foreground mt-1" placeholder="e.g. $2,000/month" /></div>
            <div><Label>Skills (comma-separated) *</Label><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="bg-secondary border-border text-foreground mt-1" placeholder="React, TypeScript, Node.js" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border text-foreground mt-1 min-h-[80px]" /></div>
            <Button onClick={save} className="w-full bg-primary text-primary-foreground" disabled={!form.title.trim() || !form.company.trim()}>{editId ? "Update" : "Create"} Internship</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
