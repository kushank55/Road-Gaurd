import React from "react";
import { Trans } from "@/components/Trans";


export default function LoginHero(): React.ReactElement {
  return (
    <aside
      aria-label="RoadGuard welcome back"
      className="relative hidden h-full overflow-hidden rounded-2xl bg-gray-900 text-white lg:block"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 h-56 w-56 rounded-full border border-zinc-800/80" />
        <div className="absolute left-28 top-36 h-64 w-64 rounded-full border border-zinc-900/70" />
        <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full border border-zinc-800/80" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-10">
        <div className="flex-grow flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-400">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2l2.4 5 5.3.8-3.8 3.7.9 5.3L12 14.9 7.2 16.8l.9-5.3L4.3 7.8 9.6 7l2.4-5z"
              />
            </svg>
            <Trans
              translationKey="login.hero.welcome"
              text="Welcome back to RoadGuard"
            />
          </span>
          <h2 className="text-pretty text-4xl font-bold leading-tight md:text-5xl">
            <Trans
              translationKey="login.hero.title"
              text="Your journey awaits. Let's get you back on the road."
            />
          </h2>
          <p className="max-w-md text-zinc-300">
            <Trans
              translationKey="login.hero.description"
              text="Sign in to access your account, manage your details, and get help whenever you need it. We're glad to have you with us."
            />
          </p>
        </div>
        <blockquote className="mt-auto rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-200">
            <Trans
              translationKey="login.hero.quote"
              text="“Knowing I have RoadGuard is such a relief. Fast, professional, and always there when you need them.”"
            />
          </p>
          <footer className="mt-2 text-xs text-zinc-400">
            <Trans
              translationKey="login.hero.quoteAuthor"
              text="Satisfied member since 2025"
            />
          </footer>
        </blockquote>
      </div>
    </aside>
  );
}
