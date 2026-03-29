import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Search, BookOpen, Bot, ArrowRight, Zap, Target, TrendingUp, Shield, Code, Briefcase, GraduationCap, Github, Linkedin, Twitter, BarChart3 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/* ─── Floating Particles ─── */
function Particles() {
  const particles = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    delay: Math.random() * 6,
    duration: Math.random() * 8 + 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 4 === 0
              ? `hsl(var(--glow-primary) / 0.7)`
              : p.id % 4 === 1
              ? `hsl(var(--glow-accent) / 0.6)`
              : p.id % 4 === 2
              ? `hsl(250 85% 75% / 0.5)`
              : `hsl(195 90% 65% / 0.4)`,
            boxShadow: p.id % 3 === 0
              ? `0 0 ${p.size * 3}px hsl(var(--glow-primary) / 0.4)`
              : p.id % 3 === 1
              ? `0 0 ${p.size * 3}px hsl(var(--glow-accent) / 0.3)`
              : 'none',
          }}
          animate={{
            y: [0, -80 - Math.random() * 40, 0],
            x: [0, p.id % 2 === 0 ? 30 + Math.random() * 20 : -(30 + Math.random() * 20), 0],
            opacity: [0.15, 0.9, 0.15],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Gradient Mesh Background ─── */
function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary orb */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-primary/8 blur-[180px] animate-drift" />
      {/* Accent orb */}
      <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/6 blur-[160px] animate-drift-slow" />
      {/* Center glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[200px] animate-pulse-glow" />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

const features = [
  { icon: Sparkles, title: "AI Resume Analysis", desc: "Upload your resume and get instant AI-powered skill extraction and career insights." },
  { icon: Search, title: "Smart Matching", desc: "Our AI matches your profile with internships that fit your skills and aspirations." },
  { icon: Bot, title: "AI Career Assistant", desc: "Chat with our intelligent assistant for personalized internship guidance." },
  { icon: BookOpen, title: "Skill Gap Analysis", desc: "Discover what skills to learn to unlock your dream internship opportunities." },
];

const stats = [
  { icon: Zap, value: "500+", label: "Internships", color: "text-primary" },
  { icon: Target, value: "95%", label: "Match Rate", color: "text-accent" },
  { icon: TrendingUp, value: "10K+", label: "Students Placed", color: "text-primary" },
];

const domains = [
  { icon: Code, label: "Software Engineering" },
  { icon: Briefcase, label: "Product & Design" },
  { icon: GraduationCap, label: "Data Science & AI" },
  { icon: Bot, label: "Machine Learning" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 } as const,
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } as const,
};

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen pt-16 hero-gradient relative">
      <GradientMesh />
      <Particles />

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2.5 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-sm text-muted-foreground font-medium">Powered by AI • Gemini Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] mb-6 tracking-tight"
            >
              Find Your Dream{" "}
              <span className="gradient-text">Internship</span>
              <br />
              <span className="text-foreground/80">with AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Upload your resume, let our AI analyze your skills, and get matched with perfect internship opportunities — all in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/auth?mode=admin">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 gap-2 px-7 rounded-xl neon-button"
                >
                  <Shield className="w-4 h-4" /> Admin Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 gap-2 px-8 rounded-xl glow-primary text-base font-semibold"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/internships">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/60 text-foreground hover:bg-secondary/60 gap-2 px-7 rounded-xl neon-button"
                >
                  Browse Internships
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex justify-center gap-10 md:gap-20 mt-24"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className="text-center group cursor-default"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Domains Ticker ─── */}
      <section className="border-y border-border/40 py-6 overflow-hidden">
        <div className="flex gap-8 items-center justify-center flex-wrap px-4">
          {domains.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground/70"
            >
              <d.icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{d.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="container mx-auto px-4 py-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
            AI-Powered <span className="gradient-text">Career Matching</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            From resume upload to internship offer — our AI handles the heavy lifting.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="glass-card-hover rounded-2xl p-7 group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-5 group-hover:from-primary/30 group-hover:to-accent/20 transition-all duration-300">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Live Dashboard ─── */}
      <LiveDashboard />

      {/* ─── CTA ─── */}
      <section className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* CTA Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[100px]" />

          <div className="relative glass-card rounded-3xl p-12 md:p-16 text-center border-primary/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-5">
                Ready to Launch Your <span className="gradient-text">Career</span>?
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Join thousands of students who found their perfect internship using our AI platform.
              </p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 gap-2 px-10 py-6 rounded-xl text-lg font-semibold glow-primary"
                >
                  Start Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-10 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-foreground">InternAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 InternAI. Built with AI for the future of hiring.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
