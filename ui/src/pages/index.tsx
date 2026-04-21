import type { ReactNode } from "react"
import { Bolt, MapPin, Sparkles } from "lucide-react"
import HeroAnimated from "../components/heroanimated"
import LocationPanel from "../components/locationpanel"
import Button from "../components/button"
import { Trans } from "../components/Trans"
import { useNavigate } from "react-router-dom"

// Feature Card Component
function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
      <div aria-hidden className="text-2xl mb-3">
        {icon}
      </div>
      <Trans as="h3" translationKey={`feature.${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.title`} text={title} className="font-semibold mb-1" />
      <Trans as="p" translationKey={`feature.${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.desc`} text={desc} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" />
    </div>
  )
}

// Audience Card Component
function AudienceCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-5">
      <Trans as="h4" translationKey={`audience.${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.title`} text={title} className="font-semibold mb-1" />
      <Trans as="p" translationKey={`audience.${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.desc`} text={desc} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" />
    </div>
  )
}

// Step Card Component
function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <li className="rounded-lg border bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
          {step}
        </span>
        <Trans as="h5" translationKey={`steps.step${step}.title`} text={title} className="font-semibold" />
      </div>
      <Trans as="p" translationKey={`steps.step${step}.desc`} text={desc} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" />
    </li>
  )
}

// Main HomePage Component
export default function HomePage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header / Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
          <div className="text-center md:text-left space-y-6">
            <Trans 
              as="h1" 
              translationKey="hero.title" 
              text="RoadGuard — Smart, location‑aware roadside assistance"
              className="text-balance text-4xl md:text-5xl font-bold tracking-tight"
            />
            <Trans 
              as="p" 
              translationKey="hero.subtitle" 
              text="Connect stranded drivers with nearby mechanics and towing services in real time. Reduce response times, improve communication, and stay safe — even in remote or hazardous areas."
              className="text-pretty text-gray-600 dark:text-gray-400 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row gap-3 md:justify-start justify-center pt-2">
              <Button className="px-6 py-5 text-base" onClick={() => navigate('/login')}>
                <Trans translationKey="hero.cta.get_help" text="Get Help Now" />
              </Button>
              <Button variant="outline" className="px-6 py-5 text-base" onClick={() => navigate('/login')}>
                <Trans translationKey="hero.cta.become_provider" text="Become a Provider" />
              </Button>
            </div>
          </div>

          {/* Animated visual */}
          <div className="order-first md:order-none">
            <HeroAnimated />
          </div>
        </div>
      </section>

      {/* Key Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <FeatureCard
            title="Real‑time assistance"
            desc="Request help 24/7 and get matched to the nearest available workshop or tow."
            icon={<Bolt className="h-6 w-6 text-blue-600" aria-hidden />}
          />
          <FeatureCard
            title="Find nearby mechanics"
            desc="List, card, and map views with distance filters and sorting by rating."
            icon={<MapPin className="h-6 w-6 text-blue-600" aria-hidden />}
          />
          <FeatureCard
            title="AI‑powered matching"
            desc="Smart suggestions and quick quotations to speed up your decision."
            icon={<Sparkles className="h-6 w-6 text-blue-600" aria-hidden />}
          />
        </div>
      </section>

      {/* Problem → Solution Summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          <div className="space-y-4">
            <Trans 
              as="h2" 
              translationKey="problem.title" 
              text="What problem are we solving?"
              className="text-2xl md:text-3xl font-semibold"
            />
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
              <Trans as="li" translationKey="problem.point1" text="Lack of real‑time roadside service and slow response." />
              <Trans as="li" translationKey="problem.point2" text="Difficulty locating trusted nearby mechanics and towing." />
              <Trans as="li" translationKey="problem.point3" text="No predictive guidance to pick the right provider quickly." />
              <Trans as="li" translationKey="problem.point4" text="No simple DIY guides for minor issues on the go." />
            </ul>
          </div>
          <div className="space-y-4">
            <Trans 
              as="h3" 
              translationKey="solution.title" 
              text="Our solution"
              className="text-xl md:text-2xl font-semibold"
            />
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
              <Trans as="li" translationKey="solution.point1" text="Live map and distance filters to discover nearby workshops." />
              <Trans as="li" translationKey="solution.point2" text="AI suggestions and fast quotations from providers." />
              <Trans as="li" translationKey="solution.point3" text="Role‑based flows for Admins, Providers, and Vehicle Owners." />
              <Trans as="li" translationKey="solution.point4" text="Notifications via in‑app and SMS/WhatsApp for every step." />
            </ul>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <AudienceCard
            title="Drivers & Travelers"
            desc="Request help, track status, and view ETA with live location."
          />
          <AudienceCard
            title="Workshop Owners"
            desc="Showcase services, manage requests, and receive ratings & reviews."
          />
          <AudienceCard
            title="Mechanics & Workers"
            desc="See assigned tasks on calendar, log stages, and complete jobs."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 md:p-8">
          <Trans 
            as="h3" 
            translationKey="how_it_works.title" 
            text="How it works"
            className="text-xl md:text-2xl font-semibold mb-4"
          />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StepCard
              step="1"
              title="Submit request"
              desc="Log in, fill details (vehicle, service type, photos, location), then submit."
            />
            <StepCard
              step="2"
              title="Assignment"
              desc="Admins or auto‑matching assign a provider and notify both parties."
            />
            <StepCard
              step="3"
              title="Completion"
              desc="Mechanic updates stages; you track progress and review on completion."
            />
          </ol>
        </div>
      </section>

      {/* Map + Location context */}
      <section id="nearby" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center justify-between mb-4">
          <Trans 
            as="h3" 
            translationKey="nearby.title" 
            text="Help near you"
            className="text-xl md:text-2xl font-semibold"
          />
          <Trans 
            as="p" 
            translationKey="nearby.subtitle" 
            text="Live location helps us find the best nearby provider"
            className="text-sm text-gray-600 dark:text-gray-400"
          />
        </div>

        <LocationPanel />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Trans 
              as="h4" 
              translationKey="cta.title" 
              text="Ready when you are"
              className="text-lg md:text-xl font-semibold"
            />
            <Trans 
              as="p" 
              translationKey="cta.subtitle" 
              text="Submit a request now or sign up your workshop to start receiving jobs."
              className="text-gray-600 dark:text-gray-400"
            />
          </div>
          <div className="flex gap-3">
            <Button className="px-6" onClick={() => navigate('/login')}>
              <Trans translationKey="cta.request_assistance" text="Request Assistance" />
            </Button>
            <Button variant="outline" className="px-6" onClick={() => navigate('/login')}>
              <Trans translationKey="cta.signup_workshop" text="Sign Up Workshop" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}