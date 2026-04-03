import React from 'react';
import { Link } from 'react-router-dom';
import { RetroGrid } from './RetroGrid';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';
import Shuffle from './Shuffle';

export default function LandingPage() {
  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-(--page-bg) px-6 text-(--page-fg)">
      <RetroGrid
        className="opacity-60"
        angle={65}
        cellSize={56}
        lightLineColor="#64748b"
        darkLineColor="#64748b"
      />
      <div className="absolute z-10 top-8 right-8 flex items-center gap-4 text-[10px] tracking-widest text-(--muted-fg)">
        <span>V03.81</span>
        <AnimatedThemeToggler />
      </div>
      <div className="relative z-20 flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <Shuffle
          text="Maplify"
          className="font-sans normal-case text-6xl font-semibold tracking-[0.03em] leading-tight sm:text-7xl"
          shuffleDirection="left"
          duration={2.0}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0}
          threshold={0.3}
          triggerOnce={true}
          triggerOnHover
          respectReducedMotion={true}
          loop
          loopDelay={1.9}
        />
        <p className="max-w-xl text-sm text-(--muted-fg) sm:text-base">
          Share live locations and plan routes together in one simple map.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-(--card-border) bg-(--chip-bg) px-8 py-3 text-sm font-semibold tracking-wide text-(--page-fg) transition hover:bg-(--chip-bg-hover)"
          >
            LOGIN
          </Link>
          <Link
            to="/about"
            className="rounded-full border border-(--card-border) bg-transparent px-8 py-3 text-sm font-semibold tracking-wide text-(--page-fg) transition hover:bg-(--chip-bg-hover)"
          >
            ABOUT
          </Link>
        </div>
      </div>
    </div>
  );
}
