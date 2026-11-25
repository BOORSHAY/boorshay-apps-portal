
"use client";

import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<any>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!captchaToken) {
      setMessage("Please complete the security verification.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken,
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Login successful!");
      }
    } catch {
      setMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
      setCaptchaToken("");
      turnstileRef.current?.reset();
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <form onSubmit={handleLogin} style={{
        background: "white",
        padding: "32px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{ color: "#14213d", marginBottom: "10px" }}>
          Customer Login
        </h1>

        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Sign in to BOORSHAY APPS
        </p>

        <label>Email Address</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          placeholder="Enter your password"
        />

        <div style={{ marginTop: "10px", marginBottom: "18px" }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken("")}
            onError={() => setCaptchaToken("")}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !captchaToken}
          style={{
            width: "100%",
            padding: "14px",
            background: "#14213d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginTop: "12px",
            cursor: loading || !captchaToken ? "not-allowed" : "pointer",
            opacity: loading || !captchaToken ? 0.6 : 1
          }}
        >
          {loading ? "Please wait..." : "Login"}
        </button>

        {message && (
          <p style={{ marginTop: "18px", color: "#14213d" }}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "18px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px"
};
