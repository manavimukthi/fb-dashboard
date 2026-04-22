import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerificationCodeInputProps {
  length?: number;
  onComplete?: (code: string) => void;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  onComplete,
}) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    if (newCode.every((digit) => digit !== "") && onComplete) {
      onComplete(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split("").forEach((char, i) => {
      if (i < length) newCode[i] = char;
    });
    setCode(newCode);

    const nextEmptyIndex = newCode.findIndex((digit) => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
    setActiveIndex(focusIndex);

    if (newCode.every((digit) => digit !== "") && onComplete) {
      onComplete(newCode.join(""));
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {code.map((digit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveIndex(index)}
            className={`w-12 h-14 text-center text-2xl font-semibold rounded-xl border-2 bg-background transition-all duration-200 focus:outline-none ${
              digit
                ? "border-primary bg-primary/5"
                : activeIndex === index
                  ? "border-primary"
                  : "border-border"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

interface LoginPageProps {
  onSuccess: (rememberFor14Days: boolean) => void;
}

interface VerifyWebhookResponse {
  verification_code?: string;
  expires_at?: string;
  message?: string;
  data?: VerifyWebhookResponse;
}

const ALLOWED_EMAIL = "support@ceyliz.tech";
const ALLOWED_PASSWORD = "ceyliz";
const VERIFY_PROXY_URL = "/api/verify";
const VERIFY_DIRECT_URL = "https://n8n.kasunmadhuwantha.cv/webhook/verify";
const VERIFY_WEBHOOK_URL_FROM_ENV = String(import.meta.env.VITE_VERIFY_WEBHOOK_URL ?? "").trim();

const getVerifyEndpointCandidates = (): string[] => {
  const candidates = import.meta.env.DEV
    ? [VERIFY_PROXY_URL, VERIFY_WEBHOOK_URL_FROM_ENV, VERIFY_DIRECT_URL]
    : [VERIFY_WEBHOOK_URL_FROM_ENV, VERIFY_DIRECT_URL, VERIFY_PROXY_URL];

  return candidates.filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
};

const extractVerifyPayload = (input: unknown): VerifyWebhookResponse => {
  if (!input || typeof input !== "object") {
    return {};
  }

  const asRecord = input as Record<string, unknown>;
  if (Array.isArray(input) && input.length > 0) {
    return extractVerifyPayload(input[0]);
  }

  if (asRecord.data && typeof asRecord.data === "object") {
    return extractVerifyPayload(asRecord.data);
  }

  if (asRecord.json && typeof asRecord.json === "object") {
    return extractVerifyPayload(asRecord.json);
  }

  return asRecord as VerifyWebhookResponse;
};

const getWebhookErrorMessage = (input: unknown): string => {
  if (!input) {
    return "Could not start verification. Please try again.";
  }

  if (typeof input === "string") {
    return input;
  }

  if (typeof input === "object") {
    const payload = input as Record<string, unknown>;
    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message;
    }
  }

  return "Could not start verification. Please try again.";
};

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [expectedCode, setExpectedCode] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<number | null>(null);
  const [rememberFor14Days, setRememberFor14Days] = useState(false);

  useEffect(() => {
    if (step !== "verify" || isVerified || !verificationExpiresAt) {
      return undefined;
    }

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.floor((verificationExpiresAt - Date.now()) / 1000));
      setCountdown(secondsLeft);

      if (secondsLeft === 0) {
        setError("Verification code expired. Please login again.");
        setStep("login");
        setPassword("");
        setExpectedCode("");
        setVerificationExpiresAt(null);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [isVerified, step, verificationExpiresAt]);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (email.trim().toLowerCase() !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
      setError("Invalid email or password.");
      return;
    }

    setIsLoading(true);

    try {
      const verifyEndpoints = getVerifyEndpointCandidates();
      let payload: VerifyWebhookResponse | null = null;
      let latestError: string | null = null;

      for (const endpoint of verifyEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              Accept: "application/json",
            },
            body: "yes",
          });

          const rawText = await response.text();
          let rawPayload: unknown = rawText;
          try {
            rawPayload = JSON.parse(rawText) as unknown;
          } catch {
            // Keep plain-text payload when body is not JSON.
          }

          if (!response.ok) {
            latestError = getWebhookErrorMessage(rawPayload);
            continue;
          }

          payload = extractVerifyPayload(rawPayload);
          break;
        } catch (endpointError) {
          latestError = endpointError instanceof Error ? endpointError.message : "Could not start verification. Please try again.";
        }
      }

      if (!payload) {
        throw new Error(latestError || "Could not start verification. Please try again.");
      }

      const webhookCode = String(payload.verification_code ?? "").trim();

      if (!webhookCode) {
        throw new Error("Webhook did not return verification_code.");
      }

      const parsedExpiry = payload.expires_at ? Date.parse(payload.expires_at) : Number.NaN;
      const expiryTime = Number.isNaN(parsedExpiry) ? Date.now() + 5 * 60 * 1000 : parsedExpiry;

      setExpectedCode(webhookCode);
      setVerificationExpiresAt(expiryTime);
      setCountdown(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
      setStep("verify");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Could not start verification. Please try again.";
      setError(errorMessage);
      setStep("login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = (enteredCode: string) => {
    const isExpired = !verificationExpiresAt || Date.now() > verificationExpiresAt;
    const isCorrectCode = enteredCode === expectedCode;

    if (isExpired || !isCorrectCode) {
      setError(isExpired ? "Verification code expired. Please login again." : "Wrong verification code. Please login again.");
      setStep("login");
      setPassword("");
      setExpectedCode("");
      setVerificationExpiresAt(null);
      setCountdown(0);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);

      setTimeout(() => {
        onSuccess(rememberFor14Days);
      }, 700);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "login") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <AnimatePresence mode="wait">
        {step === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 mx-auto"
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2 text-center text-foreground"
              >
                Welcome Back
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm mb-8 text-center"
              >
                Sign in to continue to your account
              </motion.p>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-12 rounded-xl border-border focus:border-primary transition-colors"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-12 rounded-xl border-border focus:border-primary transition-colors"
                    />
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-rose-700 bg-rose-50 dark:text-rose-200 dark:bg-rose-900/30 p-3 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                  className="flex items-center justify-between"
                >
                  <label htmlFor="remember-login" className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                    <input
                      id="remember-login"
                      type="checkbox"
                      checked={rememberFor14Days}
                      onChange={(e) => setRememberFor14Days(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Keep me logged in for 14 days
                  </label>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-end"
                >
                  <button className="text-sm text-primary hover:underline font-medium" type="button">
                    Forgot password?
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-base font-semibold"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                        />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-6 mx-auto transition-colors duration-300 ${
                  isVerified ? "bg-green-500/10" : "bg-primary/10"
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Lock className="w-8 h-8 text-primary" />
                )}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2 text-center text-foreground"
              >
                {isVerified ? "Verified!" : "Verify Your Email"}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm mb-8 text-center"
              >
                {isVerified
                  ? "Your account has been verified successfully"
                  : `We sent a verification code to ${email}`}
              </motion.p>

              {!isVerified && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                  >
                    <VerificationCodeInput length={6} onComplete={handleVerificationComplete} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Verification code expires in <span className="font-semibold text-foreground">{countdown}s</span>
                    </p>

                    <button
                      onClick={() => setStep("login")}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      type="button"
                    >
                      ← Back to login
                    </button>
                  </motion.div>
                </>
              )}

              {isVerified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                  </div>
                  <p className="text-muted-foreground">Redirecting...</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
