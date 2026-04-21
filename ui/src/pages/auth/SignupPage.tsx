import SignupHero from "./components/SignupHero";
import SignupForm from "./components/SignupForm";
import { Trans } from "@/components/Trans";
import { Link } from "react-router-dom";

export default function SignupPage() {
  return (
    <main className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 text-center lg:text-left">
          <p className="text-xs font-medium tracking-widest text-amber-600 dark:text-amber-500">
            <Trans translationKey="signup.page.breadcrumb" text="Roadguard • Sign up" />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <SignupHero />
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-balance">
              <Trans translationKey="signup.page.title" text="Create your Roadguard account" />
            </h1>
            <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
              <Trans translationKey="signup.page.description" text="Enter your details, generate an OTP, and confirm to complete signup." />
            </p>
            <SignupForm />
            <p className="mt-6 text-xs text-gray-600 dark:text-gray-400">
              <Trans translationKey="signup.page.loginPrompt" text="Already have an account?" />{" "}
              <Link to="/login" className="underline underline-offset-4 hover:text-amber-600 dark:hover:text-amber-500">
                <Trans translationKey="signup.page.loginLink" text="Log in" />
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

