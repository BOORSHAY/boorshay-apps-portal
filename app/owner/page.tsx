
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Shop = {
  id: string;
  shop_name: string;
  contact_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  status: string;
  created_at: string;
};

export default function OwnerPage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    async function loadOwnerPanel() {
      const supabase = createClient();

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: owner, error: ownerError } = await supabase
        .from("platform_owners")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownerError || !owner) {
        setMessage("Access denied. Owner account required.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("platform_shops")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Could not load shops: " + error.message);
      } else {
        setShops((data || []) as Shop[]);
      }

      setLoading(false);
    }

    loadOwnerPanel();
  }, [router]);

  async function updateShopStatus(
    shopId: string,
    status: "approved" | "rejected"
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to ${status} this shop?`
    );

    if (!confirmed) return;

    setBusyId(shopId);
    setMessage("");

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("platform_shops")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", shopId);

    if (error) {
      setMessage("Update failed: " + error.message);
    } else {
      setShops((previous) =>
        previous.map((shop) =>
          shop.id === shopId ? { ...shop, status } : shop
        )
      );
      setMessage(`Shop ${status} successfully.`);
    }

    setBusyId("");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return <main style={{ padding: "40px" }}>Loading Owner Panel...</main>;
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f6fa",
      padding: "30px 20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h1 style={{ color: "#14213d" }}>
          BOORSHAY <span style={{ color: "#c49a45" }}>APPS</span>
        </h1>

        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </header>

      <section style={{
        maxWidth: "1100px",
        margin: "40px auto",
        background: "white",
        padding: "28px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>
        <h2 style={{ color: "#14213d", marginBottom: "20px" }}>
          Owner Panel - Shop Registrations
        </h2>

        {message && (
          <p style={{ marginBottom: "18px", color: "#b42318" }}>
            {message}
          </p>
        )}

        {shops.length === 0 ? (
          <p>No shop registrations found.</p>
        ) : (
          shops.map((shop) => (
            <div key={shop.id} style={{
              border: "1px solid #e2e8f0",
              borderRadius: "9px",
              padding: "18px",
              marginBottom: "16px"
            }}>
              <h3 style={{ color: "#14213d" }}>{shop.shop_name}</h3>

              <p>Contact: {shop.contact_name}</p>
              <p>Mobile: {shop.phone}</p>
              <p>WhatsApp: {shop.whatsapp || "Not provided"}</p>
              <p>Address: {shop.address}</p>
              <p style={{ marginTop: "8px" }}>
                Status: <strong>{shop.status}</strong>
              </p>

              {shop.status === "pending" && (
                <div style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "16px",
                  flexWrap: "wrap"
                }}>
                  <button
                    disabled={busyId === shop.id}
                    onClick={() => updateShopStatus(shop.id, "approved")}
                    style={{
                      ...buttonStyle,
                      background: "#167a45"
                    }}
                  >
                    Approve
                  </button>

                  <button
                    disabled={busyId === shop.id}
                    onClick={() => updateShopStatus(shop.id, "rejected")}
                    style={{
                      ...buttonStyle,
                      background: "#b42318"
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "11px 18px",
  background: "#14213d",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer"
};
