"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string>("Checking reset link...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) return setStatus(`Error: ${error.message}`);
      if (!data.session) return setStatus("Reset link not valid (no session). Request a new reset email.");
      setStatus("Enter a new password.");
    });
  }, []);

  async function onSubmit() {
    setStatus("");
    if (pw1.length < 8) return setStatus("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setStatus("Passwords do not match.");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);

    if (error) return setStatus(`Error: ${error.message}`);

    setStatus("Password updated. Redirecting to app...");
    setTimeout(() => router.push("/app"), 800);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, padding: 20, border: "1px solid #333", borderRadius: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Reset password</h1>
        <p style={{ opacity: 0.85, marginBottom: 16 }}>{status}</p>

        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            placeholder="New password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333", background: "transparent" }}
          />
          <button
            onClick={onSubmit}
            disabled={busy}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #333",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </div
