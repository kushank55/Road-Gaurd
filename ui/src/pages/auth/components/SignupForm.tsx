import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Select } from "@/components/ui/select";
import { UserRole } from "@/types/auth";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { getRoleRedirectPath } from "@/lib/role.utils";
import { workshopService } from "@/services/workshop.service";

// User type options for signup (excluding ADMIN)
const USER_TYPE_OPTIONS = [
  { value: UserRole.USER, label: "Regular User" },
  { value: UserRole.MECHANIC_OWNER, label: "Mechanic Owner" },
  { value: UserRole.MECHANIC_EMPLOYEE, label: "Mechanic Employee" },
];

// Workshop interface for selection
interface WorkshopOption {
  id: string;
  name: string;
  address: string;
}

export default function SignupForm() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserRole>(UserRole.USER);
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [loadingWorkshops, setLoadingWorkshops] = useState(false);

  const navigate = useNavigate();
  const { 
    requestEmailVerification, 
    verifyEmail, 
    signup, 
    error, 
    clearError
  } = useAuthStore();
  const { role } = useAuth();

  // Email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^[0-9]{10,15}$/.test(phone.replace(/\D/g, ""));
  const isPasswordValid = password.length >= 8;

  // Check if user type requires workshop selection
  const requiresWorkshopSelection = userType === UserRole.MECHANIC_EMPLOYEE || userType === UserRole.MECHANIC_OWNER;

  // Fetch available workshops when user type changes to mechanic
  useEffect(() => {
    if (requiresWorkshopSelection && step === 3) {
      fetchWorkshops();
    }
  }, [userType, step]);

  // Fetch available workshops
  const fetchWorkshops = async () => {
    setLoadingWorkshops(true);
    try {
      const response = await workshopService.getWorkshops({ status: 'OPEN' });
      if (response.success && response.data.workshops) {
        setWorkshops(response.data.workshops.map(workshop => ({
          id: workshop.id,
          name: workshop.name,
          address: workshop.address
        })));
      }
    } catch (error) {
      console.error("Failed to fetch workshops:", error);
      // Set empty array to prevent infinite loading state
      setWorkshops([]);
    } finally {
      setLoadingWorkshops(false);
    }
  };

  // Step 1: Request email verification
  const handleRequestEmailVerification = async () => {
    if (!name || !isEmailValid) {
      alert("Please provide a valid name and email address.");
      return;
    }

    setSending(true);
    clearError();

    try {
      await requestEmailVerification({ email, name });
      setStep(2);
      setCountdown(30); // 30 second cooldown
      
      // Start countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to request email verification:", error);
    } finally {
      setSending(false);
    }
  };

  // Step 2: Verify email with OTP
  const handleVerifyEmail = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      await verifyEmail({ email, otpCode });
      setStep(3);
    } catch (error) {
      console.error("Failed to verify email:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Complete signup
  const handleSignup = async () => {
    if (!phone || !isPhoneValid || !isPasswordValid) {
      alert("Please provide a valid phone number and password (minimum 8 characters).");
      return;
    }

    // For mechanics, require workshop selection
    if (requiresWorkshopSelection && !selectedWorkshopId) {
      alert("Please select a workshop to join.");
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      const signupData: any = {
        name,
        email,
        phone,
        password,
        role: userType
      };

      // Add workshop_id if user is a mechanic
      if (requiresWorkshopSelection && selectedWorkshopId) {
        signupData.workshop_id = selectedWorkshopId;
      }

      await signup(signupData);
      
      // Redirect based on user role
      const redirectPath = getRoleRedirectPath(role);
      navigate(redirectPath);
    } catch (error) {
      console.error("Failed to signup:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Resend email verification
  const handleResendEmailVerification = async () => {
    if (countdown > 0) return;
    
    setSending(true);
    clearError();

    try {
      await requestEmailVerification({ email, name });
      setCountdown(30);
      
      // Start countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to resend email verification:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shadow-gray-200/40 dark:shadow-black/40">
      <div className="p-8">
        {/* Progress indicator */}
        <ol className="mb-6 flex items-center gap-4 text-sm">
          {[1, 2, 3].map((stepNumber) => {
            const isActive = step >= stepNumber;
            const isCompleted = step > stepNumber;
            
            return (
              <li key={stepNumber} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                    isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : isActive
                      ? "border-amber-500 bg-amber-500 text-black"
                      : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </span>
                <span
                  className={
                    isActive
                      ? "font-medium text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }
                >
                  {stepNumber === 1 ? "Details" : 
                   stepNumber === 2 ? "Verify Email" : 
                   "Complete"}
                </span>
                {stepNumber < 3 && (
                  <span
                    className="mx-2 h-px w-8 bg-gray-200 dark:bg-gray-800"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Enter your details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We'll send a verification code to your email address.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="you@example.com"
                />
                {email && !isEmailValid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Please enter a valid email address
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestEmailVerification}
              disabled={sending || !name || !isEmailValid}
              className="w-full px-4 py-3 rounded-md text-white font-semibold bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending verification..." : "Send verification code"}
            </button>
          </div>
        )}

        {/* Step 2: Email Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verify your email
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We've sent a 6-digit code to {email}. Please enter it below.
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-center text-lg tracking-widest"
                placeholder="000000"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={submitting || otpCode.length !== 6}
                className="flex-1 px-4 py-3 rounded-md text-white font-semibold bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Verifying..." : "Verify email"}
              </button>
              
              <button
                type="button"
                onClick={handleResendEmailVerification}
                disabled={sending || countdown > 0}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend (${countdown}s)` : "Resend"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to details
            </button>
          </div>
        )}

        {/* Step 3: Complete Registration */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Complete your registration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your email has been verified. Please provide the remaining details to complete your account.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="+1234567890"
                />
                {phone && !isPhoneValid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Please enter a valid phone number
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User type
                </label>
                <Select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserRole)}
                  options={USER_TYPE_OPTIONS}
                />
              </div>

              {/* Workshop Selection for Mechanics */}
              {requiresWorkshopSelection && (
                <div>
                  <label htmlFor="workshop" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Workshop to Join
                  </label>
                  {loadingWorkshops ? (
                    <div className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Loading workshops...
                    </div>
                  ) : workshops.length > 0 ? (
                    <select
                      id="workshop"
                      value={selectedWorkshopId}
                      onChange={(e) => setSelectedWorkshopId(e.target.value)}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a workshop</option>
                      {workshops.map((workshop) => (
                        <option key={workshop.id} value={workshop.id}>
                          {workshop.name} - {workshop.address}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="block w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      No workshops available. Please contact support.
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Choose the workshop you want to work with.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
                {password && !isPasswordValid && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSignup}
                disabled={submitting || !isPhoneValid || !isPasswordValid || (requiresWorkshopSelection && !selectedWorkshopId)}
                className="flex-1 px-4 py-3 rounded-md text-white font-semibold bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
