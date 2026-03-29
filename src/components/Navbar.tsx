import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Briefcase, LayoutDashboard, Home, LogOut, Bot, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import logoImg from "@/assets/logo.jpg";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/internships", label: "Internships", icon: Briefcase },
  { to: "/chatbot", label: "AI Chat", icon: Bot },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="InternAI Logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-lg text-foreground">InternAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button variant={location.pathname === item.to ? "secondary" : "ghost"} size="sm" className="gap-2 text-foreground">
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin">
              <Button variant={location.pathname.startsWith("/admin") ? "secondary" : "ghost"} size="sm" className="gap-2 text-accent">
                <Shield className="w-4 h-4" /> Admin
              </Button>
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-foreground">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
            </Link>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}>
              <Button variant={location.pathname === item.to ? "secondary" : "ghost"} className="w-full justify-start gap-2 text-foreground">
                <item.icon className="w-4 h-4" /> {item.label}
              </Button>
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2 text-accent"><Shield className="w-4 h-4" /> Admin Panel</Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" onClick={() => { signOut(); setMobileOpen(false); }} className="justify-start gap-2 text-foreground">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground">Get Started</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
