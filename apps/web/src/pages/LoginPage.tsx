import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface items-center justify-center">
        {/* Ambient glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber/5 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-amber/3 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-12"
        >
          {/* Orb */}
          <div className="mx-auto mb-8 h-24 w-24 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center glow-amber">
            <span className="font-display text-4xl font-bold text-amber">
              F
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-text text-balance">
            AI Mülakat
            <br />
            <span className="text-amber">Platformu</span>
          </h1>
          <p className="mt-4 text-text-secondary max-w-sm mx-auto text-pretty">
            Wingman ile gerçekçi teknik mülakatlar yapın.
            Sesli AI mülakatçınız sizi bekliyor.
          </p>
        </motion.div>

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-amber) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-amber) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center bg-bg p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-amber/15 border border-amber/20 flex items-center justify-center glow-amber-sm">
              <span className="font-display text-xl font-bold text-amber">W</span>
            </div>
            <span className="font-display text-2xl font-bold text-text">Wingman</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-text">
            Giriş Yap
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Hesabınıza giriş yaparak devam edin
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Input
              label="E-posta"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="ornek@email.com"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Şifre"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Giriş Yap
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Hesabınız yok mu?{" "}
            <Link
              to="/register"
              className="text-amber hover:text-amber-light transition-colors duration-150"
            >
              Kayıt Ol
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
