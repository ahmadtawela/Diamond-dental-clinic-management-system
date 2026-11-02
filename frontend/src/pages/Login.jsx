import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { Button, Input } from "../components/ui";

export default function Login() {
  const { login, register } = useAuth();
  const { language, t, toggleLanguage } = useLocale();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function getErrorMessage(err, fallback) {
    const errors = err.response?.data?.errors;
    const firstFieldError = errors && Object.values(errors).find((messages) => Array.isArray(messages))?.[0];
    return firstFieldError || err.response?.data?.message || fallback;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      if (isRegistering) {
        await register(fullName, email, password);
        setFullName("");
        setPassword("");
        setIsRegistering(false);
        setSuccess("Account created. Your account is pending administrator approval.");
        return;
      }

      const user = await login(email, password);
      navigate(user.role?.name === "receptionist" ? "/dashboard" : "/patients");
    } catch (err) {
      setError(getErrorMessage(err, isRegistering ? "Could not create account. Please try again." : "Incorrect email or password."));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleFormMode() {
    setIsRegistering((current) => !current);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <button
        type="button"
        onClick={toggleLanguage}
        className="absolute end-4 top-4 rounded px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-white"
      >
        {language === "ar" ? "English" : "العربية"}
      </button>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-3.5 h-3.5 bg-primary rotate-45 shrink-0" />
          <span className="font-display font-semibold text-ink text-xl tracking-tight">Diamond</span>
        </div>
        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="text-lg text-ink mb-1">{t(isRegistering ? "Create account" : "Sign in")}</h1>
          <p className="text-sm text-ink-secondary mb-6">{t("Dental clinic management")}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <Input
                label={t("Full name")}
                type="text"
                autoComplete="name"
                required
                maxLength={150}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            )}
            <Input
              label={t("Email")}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@diamond-clinic.test"
            />
            <div className="relative">
              <Input
                label={t("Password")}
                type={showPassword ? "text" : "password"}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute end-3 top-[2.125rem] text-ink-muted hover:text-ink"
                aria-label={t(showPassword ? "Hide password" : "Show password")}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-danger">{t(error)}</p>}
            {success && <p className="text-sm text-success">{t(success)}</p>}
            <Button type="submit" disabled={submitting} className="w-full justify-center">
              {submitting
                ? t(isRegistering ? "Creating account…" : "Signing in…")
                : t(isRegistering ? "Create account" : "Sign in")}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-ink-secondary">
            {t(isRegistering ? "Already have an account?" : "Don't have an account?")}{" "}
            <button type="button" onClick={toggleFormMode} className="font-medium text-primary hover:text-primary-dark">
              {t(isRegistering ? "Sign in" : "Create an account")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
