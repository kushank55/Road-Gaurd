import { useEffect, useRef } from "react"

// Custom hook for floating animation
function useFloating(delta = 20, duration = 4000) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: number | null = null
    const dir = 1
    let raf = 0
    const loop = (t: number) => {
      if (start == null) start = t
      const progress = (t - start) / duration
      const y = Math.sin(progress * Math.PI * 2) * delta * dir
      el.style.transform = `translateY(${y}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [delta, duration])
  return ref
}

// HeroAnimated Component
export default function HeroAnimated() {
  const carRef = useFloating(8, 5000)
  const brandColor = "#714B67"

  return (
    <>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .marquee {
            animation: marquee 18s linear infinite;
          }
          .mask-gradient {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          }
        `}
      </style>
      
      <div className="relative">
        <div
          ref={carRef}
          className="mx-auto flex h-56 w-full max-w-md items-end justify-center rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm"
          aria-label="Animated roadside illustration"
        >
          {/* Simple car illustration */}
          <div className="relative h-24 w-40">
            <div className="absolute left-0 top-5 h-10 w-40 rounded-md bg-gray-900 dark:bg-gray-100" />
            <div className="absolute left-2 top-0 h-8 w-32 rounded-t-lg bg-gray-900 dark:bg-gray-100" />
            <div className="absolute left-5 top-2 h-4 w-10 rounded-sm bg-white/70 dark:bg-gray-900/70" />
            <div className="absolute right-6 top-2 h-4 w-10 rounded-sm bg-white/70 dark:bg-gray-900/70" />
            {/* wheels */}
            <div className="absolute -bottom-4 left-6 h-10 w-10 rounded-full bg-black ring-2 ring-white dark:ring-gray-900">
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-gray-900" />
            </div>
            <div className="absolute -bottom-4 right-6 h-10 w-10 rounded-full bg-black ring-2 ring-white dark:ring-gray-900">
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-gray-900" />
            </div>
          </div>
        </div>

        {/* Scrolling services marquee */}
        <div className="mt-6 overflow-hidden rounded-md border bg-white dark:bg-gray-900">
          <div
            className="flex marquee gap-8 whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400 mask-gradient"
            aria-label="Service types marquee"
          >
            {[
              "Towing",
              "Battery Jumpstart",
              "Flat Tyre",
              "Fuel Delivery",
              "Key Lockout",
              "Minor Repairs",
              "On-spot Support",
            ].map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: brandColor }}
                  aria-hidden="true"
                />
                {s}
              </span>
            ))}
            {/* duplicate for seamless loop */}
            {[
              "Towing",
              "Battery Jumpstart",
              "Flat Tyre",
              "Fuel Delivery",
              "Key Lockout",
              "Minor Repairs",
              "On-spot Support",
            ].map((s, i) => (
              <span key={`dup-${i}`} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: brandColor }}
                  aria-hidden="true"
                />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}