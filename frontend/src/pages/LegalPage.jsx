import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatedThemeToggler } from '../components/common/AnimatedThemeToggler';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const LEGAL_DOCS = {
  privacy: {
    title: "Privacy Policy",
    date: "Effective from: January 1, 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "At Mapplify, we prioritize your exact privacy. When you use Mapplify, we temporarily process your GPS coordinates solely to broadcast them to your active room members. We do not permanently store your location history after trips are completed."
      },
      {
        heading: "2. How We Use Information",
        body: "Your data is used strictly for facilitating real-time route coordination, calculating ETAs, and projecting upcoming stops. We do not sell, rent, or distribute personal identity and location data to absolute third parties."
      },
      {
        heading: "3. Account Retention",
        body: "You may request the full deletion of your account and any associated trip metadata at any time. Accounts dormant for over a year are purged from our active databases."
      }
    ]
  },
  terms: {
    title: "Terms & Conditions",
    date: "Effective from: January 1, 2026",
    sections: [
      {
        heading: "1. Agreement to Terms",
        body: "By accessing and using Mapplify, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access our collaboration service."
      },
      {
        heading: "2. User Responsibilities",
        body: "You agree to use Mapplify responsibly. You must not use our location services for illegitimate surveillance, harassment, or malicious intent."
      },
      {
        heading: "3. Limitation of Liability",
        body: "While we strive for high precision, Mapplify is not responsible for inaccuracies in mapping data or GPS drifts. Under no circumstances should Mapplify replace professional emergency dispatch tools unless directly stated."
      }
    ]
  },
  cookies: {
    title: "Cookie Policy",
    date: "Effective from: January 1, 2026",
    sections: [
      {
        heading: "1. What Are Cookies?",
        body: "Cookies are small text files stored on your device. We use them primarily for critical session management and authentication validation."
      },
      {
        heading: "2. How We Use Them",
        body: "Mapplify only sets strictly necessary cookies required to keep you logged in to your account and authenticated to your real-time WebSocket connection. No third-party tracking pixels are utilized."
      }
    ]
  },
  security: {
    title: "Data Security",
    date: "Last Updated: March 15, 2026",
    sections: [
      {
        heading: "Secure Transmission",
        body: "All data transiting between the Mapplify client and servers is shielded utilizing modern TLS cryptography. Websocket payloads over STOMP are strictly verified on an active basis."
      },
      {
        heading: "Live Location Ephemerality",
        body: "Once your collaborative room is closed, the real-time node holding the location points of your users is destroyed from system memory. Locations are never hard-committed."
      },
      {
        heading: "Infrastructure",
        body: "Our infrastructure relies on scalable, battle-hardened Spring Boot configurations combined with rapid, isolated Vite frontends, mitigating cross-contamination."
      }
    ]
  }
};

export default function LegalPage() {
  const { docId } = useParams();
  const doc = LEGAL_DOCS[docId];

  if (!doc) return <Navigate to="/about" replace />;

  return (
    <div className="relative min-h-screen flex flex-col w-full bg-[var(--page-bg)] text-[var(--page-fg)] font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Decorative background blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 z-50 flex items-center gap-4 text-[10px] tracking-widest text-[var(--muted-fg)]">
        <AnimatedThemeToggler />
      </div>

      <div className="flex-1 w-full relative z-10 flex flex-col items-center pt-24 pb-20 px-6">
        
        <div className="w-full max-w-3xl space-y-8">
          
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-fg)] hover:text-[var(--page-fg)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to About
          </Link>

          <div className="rounded-[40px] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-14 backdrop-blur-3xl shadow-2xl relative">
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-500">{docId.toUpperCase()}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              {doc.title}
            </h1>
            
            <p className="text-sm font-medium text-[var(--muted-fg)] mb-12 border-b border-[var(--card-border)] pb-8">
              {doc.date}
            </p>

            <div className="space-y-10">
              {doc.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="text-xl font-bold">{section.heading}</h2>
                  <p className="text-[var(--muted-fg)] leading-relaxed text-[15px]">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
