import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { WingLogo } from "@/components/icons/WingLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
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
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-12"
        >
          <WingLogo size={96} className="mx-auto mb-8 !rounded-full glow-amber" />
          <h1 className="font-display text-4xl font-bold text-text text-balance">
            Kariyerine
            <br />
            <span className="text-amber">Yön Ver</span>
          </h1>
          <p className="mt-4 text-text-secondary max-w-sm mx-auto text-pretty">
            Yapay zeka destekli mülakat simülasyonları ile
            teknik becerilerini geliştir.
          </p>
        </motion.div>

        <div
          className="absolute inset-0 opacity-[0.03]"
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
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <WingLogo size={40} className="glow-amber-sm" />
            <span className="font-display text-2xl font-bold text-text">Wingman</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-text">
            Kayıt Ol
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Yeni hesap oluşturun ve hemen başlayın
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Input
              label="Ad Soyad"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Adınız Soyadınız"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              autoComplete="new-password"
              placeholder="En az 8 karakter…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Hesap Oluştur
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Zaten hesabınız var mı?{" "}
            <Link
              to="/login"
              className="text-amber hover:text-amber-light transition-colors duration-150"
            >
              Giriş Yap
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
