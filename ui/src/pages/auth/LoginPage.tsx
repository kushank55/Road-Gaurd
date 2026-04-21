import LoginHero from "./components/LoginHero.jsx";
import LoginForm from "./components/LoginForm.jsx";
import { Trans } from "@/components/Trans.js";
import { Link } from "react-router-dom";

// --- Main LoginPage Component ---
export default function LoginPage() {
    return (
      <main className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 text-center lg:text-left">
          <p className="text-xs font-medium tracking-widest text-amber-600 dark:text-amber-500">
            <Trans translationKey="login.page.brandHeader" text="Roadguard • Log in" />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <LoginHero />
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-balance">
              <Trans translationKey="login.page.title" text="Log in to your account" />
            </h1>
            <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
              <Trans
                translationKey="login.page.description"
                text="Enter your credentials to access your RoadGuard dashboard."
              />
            </p>
            <LoginForm />
            <p className="mt-6 text-xs text-gray-600 dark:text-gray-400">
              <Trans
                translationKey="login.page.signupPrompt"
                text="Don't have an account? "
              />
                            <Link to="/signup" className="underline underline-offset-4 hover:text-amber-600 dark:hover:text-amber-500">
                <Trans translationKey="login.page.signupLink" text="Sign up" />
                    </Link>
            </p>
          </div>
        </div>
      </section>
      </main>
    );
  }

