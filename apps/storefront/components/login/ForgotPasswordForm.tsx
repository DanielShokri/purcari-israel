import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowRight } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { emailSchema, passwordSchema } from "../../schemas/validationSchemas";

const inputClass =
  "w-full border border-gray-300 rounded-xl p-3 focus:ring-secondary focus:border-secondary";

/** Two steps: request a code by email, then enter the code with a new password. */
const ForgotPasswordForm: React.FC = () => {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email: parsed.data, flow: "reset" });
    } catch (err) {
      // Same screen whether or not the account exists, so this form cannot be used to probe for emails.
      console.warn("Password reset request failed", err);
    } finally {
      setLoading(false);
    }
    setEmail(parsed.data);
    setStep("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pw = passwordSchema.safeParse(newPassword);
    if (!pw.success) {
      setError(pw.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email, code: code.trim(), newPassword, flow: "reset-verification" });
      navigate("/dashboard");
    } catch (err) {
      console.warn("Password reset verification failed", err);
      setError("הקוד שגוי או שפג תוקפו. אפשר לבקש קוד חדש.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
    >
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={32} className="text-secondary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">שחזור סיסמה</h1>
        <p className="text-gray-500">
          {step === "email"
            ? "הזינו את כתובת האימייל ונשלח אליכם קוד לאיפוס הסיסמה"
            : "אם קיים חשבון עם הכתובת הזו, נשלח אליה קוד. הזינו אותו יחד עם הסיסמה החדשה."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            className={inputClass}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-red-900 transition-colors disabled:opacity-70 cursor-pointer"
          >
            {loading ? "שולח..." : "שלחו לי קוד"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="קוד בן 8 ספרות"
            autoComplete="one-time-code"
            dir="ltr"
            className={`${inputClass} text-center tracking-widest`}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="סיסמה חדשה (לפחות 8 תווים)"
            autoComplete="new-password"
            className={inputClass}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.trim().length === 0}
            className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-red-900 transition-colors disabled:opacity-70 cursor-pointer"
          >
            {loading ? "מעדכן..." : "עדכון סיסמה"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-gray-500 hover:underline cursor-pointer"
          >
            לא קיבלתם קוד? חזרה לשליחה מחדש
          </button>
        </form>
      )}

      <div className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-secondary font-bold hover:underline">
          <ArrowRight size={18} />
          חזרה להתחברות
        </Link>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordForm;
