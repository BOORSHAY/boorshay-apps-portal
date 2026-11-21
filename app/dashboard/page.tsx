
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Shop = {
  id: string;
  status: string;
  shop_name?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data, error: shopError } = await supabase
        .from("platform_shops")
        .select("*")
        .eq("owner_user_id", user.id);

      if (shopError) {
        setMessage("Could not load shop information.");
      } else {
        setShops((data || []) as Shop[]);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return <main style={{ padding: "40px" }}>Loading Dashboard...</main>;
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f6fa",
      padding: "30px 20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        maxWidth: "1000px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap"
      }}>
        <h1 style={{ color: "#14213d" }}>
          BOORSHAY <span style={{ color: "#c49a45" }}>APPS</span>
        </h1>

        <button onClick={handleLogout} style={{
          padding: "10px 18px",
          background: "#14213d",
          color: "white",
          border: "none",
          borderRadius: "7px",
          cursor: "pointer"
        }}>
          Logout
        </button>
      </header>

      <section style={{
        maxWidth: "1000px",
        margin: "45px auto",
        background: "white",
        padding: "28px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>
        <h2 style={{ color: "#14213d", marginBottom: "12px" }}>
          Customer Dashboard
        </h2>

        <p style={{ color: "#64748b" }}>
          Welcome! You are logged in as:
        </p>

        <p style={{ marginTop: "8px", fontWeight: "bold" }}>
          {email}
        </p>

        <hr style={{ margin: "25px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

        <h3 style={{ color: "#14213d", marginBottom: "15px" }}>
          My Shop Registrations
        </h3>

        {message && <p>{message}</p>}

        {shops.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            You have not registered a shop yet.
          </p>
        ) : (
          shops.map((shop) => (
            <div key={shop.id} style={{
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              marginBottom: "12px"
            }}>
              <strong>{shop.shop_name || "Registered Shop"}</strong>
              <p style={{ marginTop: "8px", color: "#64748b" }}>
                Approval Status: {shop.status}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

