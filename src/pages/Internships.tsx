import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { internships, domains, locations, types, Internship } from "@/data/internships";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MapPin, Clock, DollarSign, Search, Filter } from "lucide-react";

export default function InternshipsPage() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("internship_id").eq("user_id", user!.id);
    if (data) setBookmarkedIds(new Set(data.map((b) => b.internship_id)));
  };

  const toggleBookmark = async (id: string) => {
    if (!user) { toast.error("Sign in to bookmark"); return; }
    if (bookmarkedIds.has(id)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("internship_id", id);
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success("Bookmark removed");
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, internship_id: id });
      setBookmarkedIds((prev) => new Set(prev).add(id));
      toast.success("Bookmarked!");
    }
  };

  const filtered = internships.filter((i) => {
    const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.company.toLowerCase().includes(search.toLowerCase()) || i.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesDomain = !domainFilter || i.domain === domainFilter;
    const matchesLocation = !locationFilter || i.location === locationFilter;
    const matchesType = !typeFilter || i.type === typeFilter;
    return matchesSearch && matchesDomain && matchesLocation && matchesType;
  });

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Internships</h1>
          <p className="text-muted-foreground">Browse and bookmark opportunities that match your goals.</p>
        </motion.div>

        {/* Search & Filters */}
        <div className="glass-card rounded-xl p-4 mb-8">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, or skill..." className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 border-border text-foreground hover:bg-secondary">
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="grid sm:grid-cols-3 gap-3 mt-4">
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-lg bg-secondary border border-border text-foreground px-3 py-2 text-sm">
                <option value="">All Domains</option>
                {domains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="rounded-lg bg-secondary border border-border text-foreground px-3 py-2 text-sm">
                <option value="">All Locations</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg bg-secondary border border-border text-foreground px-3 py-2 text-sm">
                <option value="">All Types</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((intern, i) => (
            <motion.div
              key={intern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{intern.title}</h3>
                  <p className="text-sm text-primary">{intern.company}</p>
                </div>
                <button onClick={() => toggleBookmark(intern.id)} className="text-muted-foreground hover:text-accent transition-colors">
                  {bookmarkedIds.has(intern.id) ? <BookmarkCheck className="w-5 h-5 text-accent" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{intern.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {intern.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="bg-secondary/70 text-secondary-foreground text-xs">{s}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{intern.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{intern.duration}</span>
                {intern.stipend && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{intern.stipend}</span>}
              </div>
              <Badge className="mt-3 bg-primary/10 text-primary border-0 text-xs">{intern.type}</Badge>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No internships match your filters. Try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
