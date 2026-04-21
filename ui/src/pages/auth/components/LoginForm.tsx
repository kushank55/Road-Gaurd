import React, { useState } from "react";
import { Trans } from "@/components/Trans";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { getRoleRedirectPath } from "@/lib/role.utils";

export default function LoginForm(): React.ReactElement {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  const { role } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      alert("Please enter both your identifier and password.");
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      await login({ identifier, password });
      // Redirect based on user role
      const redirectPath = getRoleRedirectPath(role);
      navigate(redirectPath);
    } catch (error) {
      // Error is already set in the store
      console.error("Login failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shadow-gray-200/40 dark:shadow-black/40">
      <div className="p-8">
        <div className="space-y-1 mb-8">
          <h2 className="text-balance text-2xl font-semibold text-gray-900 dark:text-white">
            <Trans translationKey="login.form.title" text="Welcome back" />
          </h2>
          <p className="text-pretty text-sm text-gray-600 dark:text-gray-400">
            <Trans
              translationKey="login.form.description"
              text="Enter your credentials to access your account."
            />
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Trans
                translationKey="login.form.identifierLabel"
                text="Email or phone"
              />
            </label>
            <input
              id="identifier"
              placeholder="you@example.com or +1234567890"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <Trans
                  translationKey="login.form.passwordLabel"
                  text="Password"
                />
              </label>
              <a
                href="#"
                className="text-xs text-amber-600 hover:underline dark:text-amber-500"
              >
                <Trans
                  translationKey="login.form.forgotPassword"
                  text="Forgot password?"
                />
              </a>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-md text-white font-semibold bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <Trans
                translationKey="login.form.submitting"
                text="Logging in..."
              />
            ) : (
              <Trans translationKey="login.form.submit" text="Login" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
