import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full bg-[var(--page-bg)] text-[var(--page-fg)] px-6 py-10">
      <div className="absolute top-8 right-8 z-10 flex items-center gap-4 text-[10px] tracking-widest text-[var(--muted-fg)]">
        <span>V03.81</span>
        <AnimatedThemeToggler />
      </div>

      <div className="mx-auto mt-16 w-full max-w-3xl rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 backdrop-blur-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">Maplify</h1>
        <p className="mt-3 text-[var(--muted-fg)]">
          Maplify is a collaborative trip coordination platform built for groups that need shared location visibility and smarter route planning.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-4">
            <h2 className="text-sm font-semibold">Live Position Sharing</h2>
            <p className="mt-2 text-xs text-[var(--muted-fg)]">Track friends and teammates in real time on a shared map view.</p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-4">
            <h2 className="text-sm font-semibold">Collaborative Routing</h2>
            <p className="mt-2 text-xs text-[var(--muted-fg)]">Build routes together and adjust stops dynamically as plans change.</p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--chip-bg)] p-4">
            <h2 className="text-sm font-semibold">Trip Context</h2>
            <p className="mt-2 text-xs text-[var(--muted-fg)]">Keep quick history and room context so groups stay synchronized.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Link
            to="/"
            className="rounded-full border border-[var(--card-border)] bg-[var(--chip-bg)] px-6 py-2 text-sm font-semibold transition hover:bg-[var(--chip-bg-hover)]"
          >
            HOME
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-[var(--card-border)] bg-[var(--button-bg)] px-6 py-2 text-sm font-semibold text-[var(--button-fg)] transition hover:bg-[var(--button-hover-bg)]"
          >
            LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
