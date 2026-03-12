"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { registerByEmail, requestSiwsNonce, verifySiws } from "@/lib/phase3-api";

export default function AuthPage() {
  const [registerForm, setRegisterForm] = useState({
    email: "",
    fullName: "",
    role: "borrower" as "borrower" | "lender",
    walletAddress: "",
  });
  const [siwsForm, setSiwsForm] = useState({
    walletAddress: "",
    nonce: "",
    signature: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    await trackEvent({
      name: "auth_register_started",
      actor: registerForm.role,
    });

    setIsSubmitting(true);
    const result = await registerByEmail({
      email: registerForm.email,
      fullName: registerForm.fullName,
      role: registerForm.role,
      walletAddress: registerForm.walletAddress || undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Register gagal");
      return;
    }

    await trackEvent({
      name: "auth_register_completed",
      actor: registerForm.role,
    });

    toast.success(result.message ?? "Register berhasil");
  }

  async function handleRequestNonce() {
    await trackEvent({
      name: "auth_siws_nonce_requested",
      actor: "borrower",
      meta: {
        walletLength: siwsForm.walletAddress.length,
      },
    });

    const result = await requestSiwsNonce(siwsForm.walletAddress);

    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Gagal mengambil nonce");
      return;
    }

    setSiwsForm((prev) => ({ ...prev, nonce: result.data?.nonce ?? "" }));
    toast.success("Nonce siap untuk ditandatangani");
  }

  async function handleVerifySiws() {
    setIsSubmitting(true);
    const result = await verifySiws(siwsForm);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Verifikasi SIWS gagal");
      return;
    }

    await trackEvent({
      name: "auth_siws_verified",
      actor: "borrower",
    });

    toast.success("SIWS berhasil diverifikasi");
  }

  return (
    <AppShell
      title="Auth flow"
      subtitle="Simulasi register email dan SIWS wallet handshake untuk Phase 3"
    >
      <section className="peer-grid md:grid-cols-2">
        <article className="peer-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Register by email</h2>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Nama lengkap"
            value={registerForm.fullName}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
          />
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Email"
            type="email"
            value={registerForm.email}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            value={registerForm.role}
            onChange={(event) =>
              setRegisterForm((prev) => ({
                ...prev,
                role: event.target.value as "borrower" | "lender",
              }))
            }
          >
            <option value="borrower">Borrower</option>
            <option value="lender">Lender</option>
          </select>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Wallet address (opsional)"
            value={registerForm.walletAddress}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, walletAddress: event.target.value }))
            }
          />
          <Button onClick={handleRegister} disabled={isSubmitting}>
            Submit Register
          </Button>
        </article>

        <article className="peer-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">SIWS (mock)</h2>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Wallet address"
            value={siwsForm.walletAddress}
            onChange={(event) =>
              setSiwsForm((prev) => ({ ...prev, walletAddress: event.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRequestNonce}>
              Request nonce
            </Button>
          </div>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Nonce"
            value={siwsForm.nonce}
            onChange={(event) => setSiwsForm((prev) => ({ ...prev, nonce: event.target.value }))}
          />
          <textarea
            className="min-h-28 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Signature"
            value={siwsForm.signature}
            onChange={(event) =>
              setSiwsForm((prev) => ({ ...prev, signature: event.target.value }))
            }
          />
          <Button onClick={handleVerifySiws} disabled={isSubmitting}>
            Verify SIWS
          </Button>
        </article>
      </section>
    </AppShell>
  );
}
