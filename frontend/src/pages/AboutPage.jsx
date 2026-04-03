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

      {/* Footer Section */}
      <footer className="w-full border-t border-[var(--card-border)] bg-[var(--card-bg)]/50 backdrop-blur-xl mt-auto z-10 relative">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4 md:max-w-xs">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-br from-blue-500 to-emerald-400 bg-clip-text text-transparent">Mapplify</h2>
            <p className="text-xs text-[var(--muted-fg)] leading-relaxed">
              Empowering safe, seamless, and synchronized travel. Bringing collaborative routing and AI-driven security to groups around the globe.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2 rounded-full bg-[var(--chip-bg)] text-[var(--muted-fg)] hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[var(--chip-bg)] text-[var(--muted-fg)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[var(--chip-bg)] text-[var(--muted-fg)] hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase opacity-80">Company</h3>
              <ul className="space-y-3 text-sm text-[var(--muted-fg)]">
                <li><Link to="/about" className="hover:text-[var(--page-fg)] transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase opacity-80">Legal</h3>
              <ul className="space-y-3 text-sm text-[var(--muted-fg)]">
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-[var(--page-fg)] transition-colors">Data Security</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full border-t border-[var(--card-border)]/50 py-6 text-center">
          <p className="text-xs text-[var(--muted-fg)]">
            &copy; {new Date().getFullYear()} Mapplify Technologies. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
