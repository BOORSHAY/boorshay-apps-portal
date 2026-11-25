
"use client";

import { useRef, useState } from "react";
import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const captchaRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!captchaToken) {
      setMessage("Please complete the security verification.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const result = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            captchaToken,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Request timed out. Please check your internet connection and Supabase settings."
                )
              ),
            15000
          )
        ),
      ]);

      if (result.error) {
        setMessage("Signup error: " + result.error.message);
      } else {
        setMessage(
          "Registration submitted. Please check your email for confirmation."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken("");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSignup}
        style={{
          background: "white",
          padding: "32px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ color: "#14213d", marginBottom: "10px" }}>
          Create Customer Account
        </h1>

        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Register with BOORSHAY APPS
        </p>

        <label>Full Name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
          placeholder="Enter your full name"
        />

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
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          placeholder="Minimum 12 characters"
        />

        <div style={{ marginTop: "10px", marginBottom: "18px" }}>
          {siteKey ? (
            <Turnstile
              ref={captchaRef}
              siteKey={siteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          ) : (
            <p style={{ color: "red" }}>
              Security verification is not configured.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !captchaToken || !siteKey}
          style={{
            width: "100%",
            padding: "14px",
            background: "#14213d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginTop: "12px",
            cursor: "pointer",
            opacity: loading || !captchaToken || !siteKey ? 0.6 : 1,
          }}
        >
          {loading ? "Please wait..." : "Create Account"}
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
  borderRadius: "7px",
};
