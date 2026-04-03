import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedThemeToggler } from '../components/common/AnimatedThemeToggler';
import { Mail, MapPin, Users, Navigation, ArrowRight, ShieldCheck, Lock, Activity, Bot, Share2, AlertTriangle, RadioTower, Route, Github, Twitter, Linkedin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="relative h-screen flex flex-col w-full bg-[var(--page-bg)] text-[var(--page-fg)] font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Decorative background blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 z-50 flex items-center gap-4 text-[10px] tracking-widest text-[var(--muted-fg)]">
        <span className="opacity-80">V1.0</span>
        <AnimatedThemeToggler />
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col items-center">
        <div className="mx-auto mt-28 w-full max-w-6xl rounded-[40px] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12 backdrop-blur-3xl shadow-2xl relative mb-16 mx-4 sm:mx-6 shrink-0">
          <div className="flex flex-col gap-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-blue-500 to-emerald-400 bg-clip-text text-transparent inline-block pb-2">
              Mapplify
            </h1>
            <p className="text-lg text-[var(--muted-fg)] leading-relaxed">
              Mapplify is the ultimate collaborative trip coordination platform. We fuse real-time location visibility, smarter route planning, and cutting-edge security to keep you and your loved ones safe on the move.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 pl-2 pr-2">
            {/* Left Column: Current Features */}
            <div className="md:col-span-2 space-y-10">
              <section className="space-y-5">
                <h3 className="text-xl font-bold border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Core Capabilities
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5 hover:bg-[var(--chip-bg-hover)] transition group">
                    <Users className="w-6 h-6 mb-3 text-sky-500 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-semibold">Live Position Sharing</h4>
                    <p className="mt-2 text-xs text-[var(--muted-fg)]">Track friends and teammates in real time on a shared, beautiful map view.</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5 hover:bg-[var(--chip-bg-hover)] transition group">
                    <Navigation className="w-6 h-6 mb-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-semibold">Collaborative Routing</h4>
                    <p className="mt-2 text-xs text-[var(--muted-fg)]">Build routes together and adjust stops dynamically as your plans change.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <h3 className="text-xl font-bold border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  Security & Privacy
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5 flex gap-3 items-start">
                    <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Anonymous Rooms</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Join sessions using short-lived tokens. No permanent tracking footprint left behind.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Instant SOS Alerts</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Trigger a safety alarm that instantly broadcasts your exact coordinates to your room.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <h3 className="text-xl font-bold border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-500" />
                  Upcoming Innovation (Vision 2.0)
                </h3>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 flex gap-4">
                    <Bot className="w-6 h-6 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[15px] font-semibold text-purple-600 dark:text-purple-300">AI Safety Calling</h4>
                      <p className="mt-1 text-sm text-[var(--muted-fg)]">Proactive AI that routinely calls passengers via phone to verify their safety during late-night or risky travel routes. Powered by natural language voice logic.</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5">
                      <Share2 className="w-6 h-6 mb-3 text-green-500" />
                      <h4 className="text-sm font-semibold">WhatsApp Automation</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Failsafe logic: If a passenger is unresponsive, the AI automatically texts their live-location to emergency contacts via WhatsApp.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5">
                      <RadioTower className="w-6 h-6 mb-3 text-rose-500" />
                      <h4 className="text-sm font-semibold">First Responder Matrix</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Direct API integration to share live coordinates with nearest government authorities and police stations for rapid dispatch.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5">
                      <Route className="w-6 h-6 mb-3 text-orange-500" />
                      <h4 className="text-sm font-semibold">Predictive Route Defense</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Machine learning models that analyze route risk factors (weather, crime zones, traffic) to suggest the safest possible path.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-5">
                      <Activity className="w-6 h-6 mb-3 text-cyan-500" />
                      <h4 className="text-sm font-semibold">Offline Mesh Networking</h4>
                      <p className="mt-1 text-xs text-[var(--muted-fg)]">Bluetooth/Wi-Fi Direct location syncing to maintain group connection even when cellular service drops in remote areas.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Contact & Nav */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--card-border)] bg-blue-500/5 p-6 space-y-4 sticky top-8">
                <h3 className="text-sm font-semibold tracking-widest uppercase opacity-80">Contact Us</h3>
                <p className="text-sm text-[var(--muted-fg)]">
                  Have questions, feature requests, or just want to say hi? We'd love to hear from you.
                </p>
                
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--chip-bg)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--card-border)]">
                    <Mail className="w-4 h-4 text-[var(--page-fg)]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-fg)] font-semibold">Email</div>
                    <a href="mailto:mapplify@gmail.com" className="text-sm font-medium hover:underline decoration-blue-500 underline-offset-4">
                      mapplify@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2 pb-6 border-b border-[var(--card-border)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--chip-bg)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--card-border)]">
                    <MapPin className="w-4 h-4 text-[var(--page-fg)]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-fg)] font-semibold">Location</div>
                    <div className="text-sm font-medium">
                      New Delhi, India
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Link
                    to="/"
                    className="group flex w-full items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] px-5 py-4 text-sm font-semibold transition hover:bg-[var(--chip-bg-hover)]"
                  >
                    <span>Return Home</span>
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                  </Link>
                  <Link
                    to="/login"
                    className="group flex w-full items-center justify-between rounded-2xl border border-transparent bg-[var(--button-bg)] px-5 py-4 text-sm font-semibold text-[var(--button-fg)] transition hover:bg-[var(--button-hover-bg)]"
                  >
                    <span>Login or Sign up</span>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Footer Section */}
      <footer className="w-full mt-auto relative z-10 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--card-bg)] pointer-events-none opacity-50" />
        <div className="relative border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-2xl">
          <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-6 md:max-w-sm">
              <Link to="/" className="inline-block">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-blue-500 to-emerald-400 bg-clip-text text-transparent">Mapplify</h2>
              </Link>
              <p className="text-sm text-[var(--muted-fg)] leading-relaxed font-medium">
                Empowering safe, seamless, and synchronized travel. Bringing collaborative routing and AI-driven security to groups around the globe.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--card-border)] text-[var(--muted-fg)] hover:text-sky-400 hover:border-sky-400/50 hover:bg-sky-400/10 transition-all shadow-sm">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--card-border)] text-[var(--muted-fg)] hover:text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-400/10 transition-all shadow-sm">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--card-border)] text-[var(--muted-fg)] hover:text-indigo-400 hover:border-indigo-400/50 hover:bg-indigo-400/10 transition-all shadow-sm">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-12 md:gap-24">
              <div className="space-y-5">
                <h3 className="text-[13px] font-bold tracking-widest uppercase text-[var(--page-fg)] opacity-90">Platform</h3>
                <ul className="space-y-4 text-sm font-medium text-[var(--muted-fg)]">
                  <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
                  <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
                  <li><Link to="/login" className="hover:text-blue-500 transition-colors">Sign Up</Link></li>
                  <li><a href="mailto:mapplify@gmail.com" className="hover:text-blue-500 transition-colors">Contact Support</a></li>
                </ul>
              </div>

              <div className="space-y-5">
                <h3 className="text-[13px] font-bold tracking-widest uppercase text-[var(--page-fg)] opacity-90">Legal</h3>
                <ul className="space-y-4 text-sm font-medium text-[var(--muted-fg)]">
                  <li><Link to="/legal/privacy" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">Privacy Policy <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" /></Link></li>
                  <li><Link to="/legal/terms" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">Terms & Conditions <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" /></Link></li>
                  <li><Link to="/legal/cookies" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">Cookie Policy <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" /></Link></li>
                  <li><Link to="/legal/security" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">Data Security <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" /></Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-6">
            <div className="w-full border-t border-[var(--card-border)] py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[13px] text-[var(--muted-fg)] font-medium">
                &copy; {new Date().getFullYear()} Mapplify Technologies.
              </p>
              <div className="text-[13px] text-[var(--muted-fg)] font-medium flex items-center gap-1.5">
                Designed with <span className="text-rose-500 text-base leading-none animate-pulse">&hearts;</span> for safe travels.
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
