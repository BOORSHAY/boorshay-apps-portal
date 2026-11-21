
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

type License = {
  shop_id: string;
  license_type: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  max_admin_devices: number;
  max_cashier_devices: number;
  offline_grace_days: number;
};

export default function OwnerPage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [licenses, setLicenses] = useState<Record<string, License>>({});
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
        setLoading(false);
        return;
      }

      const loadedShops = (data || []) as Shop[];
      setShops(loadedShops);

      if (loadedShops.length > 0) {
        const shopIds = loadedShops.map((shop) => shop.id);

        const { data: licenseData, error: licenseError } = await supabase
          .from("platform_licenses")
          .select(
            "shop_id, license_type, status, starts_at, expires_at, max_admin_devices, max_cashier_devices, offline_grace_days"
          )
          .in("shop_id", shopIds);

        if (licenseError) {
          setMessage(
            "Shops loaded, but licenses could not be loaded: " +
              licenseError.message
          );
        } else {
          const licenseMap: Record<string, License> = {};

          (licenseData || []).forEach((license) => {
            licenseMap[license.shop_id] = license as License;
          });

          setLicenses(licenseMap);
        }
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
      setBusyId("");
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

  function formatDate(date: string | null) {
    if (!date) return "Not set";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
          shops.map((shop) => {
            const license = licenses[shop.id];

            return (
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
                  Shop Status: <strong>{shop.status}</strong>
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

                <div style={{
                  marginTop: "22px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px"
                }}>
                  <h3 style={{
                    color: "#14213d",
                    marginBottom: "12px"
                  }}>
                    License Information
                  </h3>

                  {!license ? (
                    <p>
                      License Status: <strong>Not Created</strong>
                    </p>
                  ) : (
                    <>
                      <p>
                        License Type: <strong>{license.license_type}</strong>
                      </p>

                      <p>
                        License Status: <strong>{license.status}</strong>
                      </p>

                      <p>Start Date: {formatDate(license.starts_at)}</p>

                      <p>Expiry Date: {formatDate(license.expires_at)}</p>

                      <p>
                        Admin Device Limit:{" "}
                        <strong>{license.max_admin_devices}</strong>
                      </p>

                      <p>
                        Cashier Device Limit:{" "}
                        <strong>{license.max_cashier_devices}</strong>
                      </p>

                      <p>
                        Offline Grace Days:{" "}
                        <strong>{license.offline_grace_days}</strong>
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })
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
