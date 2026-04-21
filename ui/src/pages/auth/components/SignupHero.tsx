import React from "react";

// The left-side panel showcasing the app's benefits.
export default function SignupHero(): React.ReactElement {
  return (
    <aside
      aria-label="RoadGuard benefits"
      className="relative hidden h-full overflow-hidden rounded-2xl bg-gray-900 text-white lg:flex"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 h-56 w-56 rounded-full border border-zinc-800/80" />
        <div className="absolute left-28 top-36 h-64 w-64 rounded-full border border-zinc-900/70" />
        <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full border border-zinc-800/80" />
      </div>
      <div className="relative z-10 flex h-full flex-col gap-6 p-10">
        <span className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-400">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2l2.4 5 5.3.8-3.8 3.7.9 5.3L12 14.9 7.2 16.8l.9-5.3L4.3 7.8 9.6 7l2.4-5z"
            />
          </svg>
          Roadside assistance, reimagined
        </span>
        <h2 className="text-pretty text-4xl font-bold leading-tight md:text-5xl">Get help on the road in minutes</h2>
        <p className="max-w-md text-zinc-300">
          Join RoadGuard to connect with nearby mechanics, towing and fuel delivery. Live tracking, transparent pricing, and 24/7 coverage keep you moving.
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            "Avg. 18 min arrival in metros",
            "10,000+ successful rescues",
            "Background‑verified partners",
            "Live status & secure payments",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <svg
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-zinc-200">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-zinc-200">
          {["Flat‑tyre", "Jumpstart", "Fuel delivery", "Key unlock", "Towing", "Minor repairs"].map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {s}
            </span>
          ))}
        </div>
        <blockquote className="mt-auto rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-200">
            “Booked in seconds and help arrived in under half an hour. Absolute lifesaver.”
          </p>
          <footer className="mt-2 text-xs text-zinc-400">A commuter in Bengaluru</footer>
        </blockquote>
      </div>
    </aside>
  );
}
