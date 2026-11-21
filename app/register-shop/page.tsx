
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterShopPage() {
  const router = useRouter();

  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("platform_shops")
        .insert({
          app_id: "6d1c05ac-bea6-47f6-8225-830aa5785c30",
          owner_user_id: user.id,
          shop_name: shopName,
          contact_name: contactName,
          phone: phone,
          whatsapp: whatsapp,
          address: address,
          status: "pending",
        });

      if (error) {
        setMessage("Registration error: " + error.message);
      } else {
        router.replace("/dashboard");
        return;
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f6fa",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "white",
        padding: "32px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "480px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{ color: "#14213d", marginBottom: "10px" }}>
          Shop Registration
        </h1>

        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Register your shop with BOORSHAY APPS
        </p>

        <label>Shop Name</label>
        <input
          required
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          style={inputStyle}
          placeholder="Enter shop name"
        />

        <label>Contact Person Name</label>
        <input
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          style={inputStyle}
          placeholder="Enter contact person name"
        />

        <label>Mobile Number</label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
          placeholder="Enter mobile number"
        />

        <label>WhatsApp Number</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          style={inputStyle}
          placeholder="Enter WhatsApp number"
        />

        <label>Shop Address</label>
        <textarea
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ ...inputStyle, minHeight: "90px" }}
          placeholder="Enter complete shop address"
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#14213d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginTop: "12px",
            cursor: "pointer"
          }}
        >
          {loading ? "Please wait..." : "Submit Registration"}
        </button>

        {message && (
          <p style={{ marginTop: "18px", color: "#b42318" }}>
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
  fontFamily: "Arial, sans-serif"
};
