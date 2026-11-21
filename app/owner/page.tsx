
"use client";

import { useCallback, useEffect, useState } from "react";
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
  id: string;
  shop_id: string;
  license_type: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  max_admin_devices: number;
  max_cashier_devices: number;
  offline_grace_days: number;
};

type Payment = {
  id: string;
  license_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_reference: string | null;
  payment_date: string | null;
  status: string;
  verified_at: string | null;
  license_applied_at: string | null;
  notes: string | null;
  created_at: string;
};

export default function OwnerPage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [licenses, setLicenses] = useState<Record<string, License>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadOwnerPanel = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const { data: shopData, error: shopError } = await supabase
      .from("platform_shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (shopError) {
      setMessage("Could not load shops: " + shopError.message);
      setLoading(false);
      return;
    }

    const loadedShops = (shopData || []) as Shop[];
    setShops(loadedShops);

    const shopIds = loadedShops.map((shop) => shop.id);

    if (shopIds.length === 0) {
      setLicenses({});
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data: licenseData, error: licenseError } = await supabase
      .from("platform_licenses")
      .select(
        "id, shop_id, license_type, status, starts_at, expires_at, max_admin_devices, max_cashier_devices, offline_grace_days"
      )
      .in("shop_id", shopIds);

    if (licenseError) {
      setMessage("Licenses could not be loaded: " + licenseError.message);
      setLoading(false);
      return;
    }

    const loadedLicenses = (licenseData || []) as License[];

    const licenseMap: Record<string, License> = {};

    loadedLicenses.forEach((license) => {
      licenseMap[license.shop_id] = license;
    });

    setLicenses(licenseMap);

    const licenseIds = loadedLicenses.map((license) => license.id);

    if (licenseIds.length === 0) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from("platform_payments")
      .select("*")
      .in("license_id", licenseIds)
      .order("created_at", { ascending: false });

    if (paymentError) {
      setMessage("Payments could not be loaded: " + paymentError.message);
    } else {
      setPayments((paymentData || []) as Payment[]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadOwnerPanel();
  }, [loadOwnerPanel]);

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
      setMessage("Shop update failed: " + error.message);
    } else {
      setMessage(`Shop ${status} successfully.`);
      await loadOwnerPanel(false);
    }

    setBusyId("");
  }

  async function createPendingPayment(
    shopId: string,
    formData: FormData
  ) {
    const amount = Number(formData.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Please enter a valid payment amount.");
      return;
    }

    const confirmed = window.confirm(
      "Create a pending payment for this shop?"
    );

    if (!confirmed) return;

    setBusyId(shopId);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "owner_create_pending_payment",
      {
        p_shop_id: shopId,
        p_amount: amount,
        p_payment_method: String(
          formData.get("payment_method") || ""
        ),
        p_transaction_reference: String(
          formData.get("transaction_reference") || ""
        ),
        p_notes: String(formData.get("notes") || ""),
      }
    );

    if (error) {
      setMessage("Payment creation failed: " + error.message);
    } else {
      setMessage(
        "Pending payment created successfully. Payment ID: " +
        data.payment_id
      );
      await loadOwnerPanel(false);
    }

    setBusyId("");
  }

  async function verifyPayment(paymentId: string) {
    const confirmed = window.confirm(
      "Have you checked the payment and confirmed that the money was received? Verify this payment?"
    );

    if (!confirmed) return;

    setBusyId(paymentId);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "owner_verify_payment",
      {
        p_payment_id: paymentId,
      }
    );

    if (error) {
      setMessage("Payment verification failed: " + error.message);
    } else {
      setMessage("Payment verified successfully.");
      await loadOwnerPanel(false);
    }

    setBusyId("");
  }


async function rejectPayment(paymentId: string) {
  const confirmed = window.confirm(
    "Are you sure you want to reject this payment?"
  );

  if (!confirmed) return;

  setBusyId(paymentId);
  setMessage("");

  const supabase = createClient();

  const { error } = await supabase.rpc(
    "owner_reject_payment",
    {
      p_payment_id: paymentId,
    }
  );

  if (error) {
    setMessage("Payment rejection failed: " + error.message);
  } else {
    setMessage("Payment rejected.");
    await loadOwnerPanel(false);
  }

  setBusyId("");
}

// IS FUNCTION KE BAAD AAPKA PURANA CODE JAISE KA TAISA RAHEGA

async function activatePaidLicense(
  paymentId: string,
  formData: FormData
) {

  async function activatePaidLicense(
    paymentId: string,
    formData: FormData
  ) {
    const duration = Number(formData.get("duration_months"));
    const adminDevices = Number(formData.get("max_admin_devices"));
    const cashierDevices = Number(formData.get("max_cashier_devices"));
    const graceDays = Number(formData.get("offline_grace_days"));

    if (![1, 3, 6, 12].includes(duration)) {
      setMessage("Invalid license duration.");
      return;
    }

    if (
      !Number.isInteger(adminDevices) ||
      adminDevices < 1 ||
      !Number.isInteger(cashierDevices) ||
      cashierDevices < 0 ||
      !Number.isInteger(graceDays) ||
      graceDays < 0
    ) {
      setMessage("Please enter valid device limits and grace days.");
      return;
    }

    const confirmed = window.confirm(
      `Activate Paid License for ${duration} month(s) using this verified payment?`
    );

    if (!confirmed) return;

    setBusyId(paymentId);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "owner_activate_paid_license",
      {
        p_payment_id: paymentId,
        p_duration_months: duration,
        p_max_admin_devices: adminDevices,
        p_max_cashier_devices: cashierDevices,
        p_offline_grace_days: graceDays,
      }
    );

    if (error) {
      setMessage("License activation failed: " + error.message);
    } else {
      setMessage(
        "Paid License activated successfully. Expiry: " +
        formatDate(data.expires_at)
      );
      await loadOwnerPanel(false);
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

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => loadOwnerPanel()}
            style={buttonStyle}
          >
            Refresh
          </button>

          <button onClick={handleLogout} style={buttonStyle}>
            Logout
          </button>
        </div>
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
          <p style={{
            marginBottom: "18px",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "7px",
            color: "#14213d",
            overflowWrap: "anywhere"
          }}>
            {message}
          </p>
        )}

        {shops.length === 0 ? (
          <p>No shop registrations found.</p>
        ) : (
          shops.map((shop) => {
            const license = licenses[shop.id];

            const shopPayments = license
              ? payments.filter(
                  (payment) => payment.license_id === license.id
                )
              : [];

            return (
              <div key={shop.id} style={cardStyle}>
                <h3 style={{ color: "#14213d" }}>
                  {shop.shop_name}
                </h3>

                <p>Contact: {shop.contact_name}</p>
                <p>Mobile: {shop.phone}</p>
                <p>WhatsApp: {shop.whatsapp || "Not provided"}</p>
                <p>Address: {shop.address}</p>

                <p style={{ marginTop: "8px" }}>
                  Shop Status: <strong>{shop.status}</strong>
                </p>

                {shop.status === "pending" && (
                  <div style={buttonRowStyle}>
                    <button
                      disabled={busyId === shop.id}
                      onClick={() =>
                        updateShopStatus(shop.id, "approved")
                      }
                      style={{
                        ...buttonStyle,
                        background: "#167a45"
                      }}
                    >
                      Approve
                    </button>

                    <button
                      disabled={busyId === shop.id}
                      onClick={() =>
                        updateShopStatus(shop.id, "rejected")
                      }
                      style={{
                        ...buttonStyle,
                        background: "#b42318"
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                <div style={panelBoxStyle}>
                  <h3 style={sectionTitleStyle}>
                    License Information
                  </h3>

                  {!license ? (
                    <p>License Status: <strong>Not Created</strong></p>
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

                {shop.status === "approved" && (
                  <div style={panelBoxStyle}>
                    <h3 style={sectionTitleStyle}>
                      Create Pending Payment
                    </h3>

                    <p style={{ marginBottom: "12px" }}>
                      Payment currency: PKR. New payment will remain pending
                      until you verify it.
                    </p>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void createPendingPayment(
                          shop.id,
                          new FormData(event.currentTarget)
                        );
                        event.currentTarget.reset();
                      }}
                      style={formStyle}
                    >
                      <label>
                        Payment Amount (PKR)
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          step="0.01"
                          required
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        Payment Method
                        <select
                          name="payment_method"
                          style={inputStyle}
                          defaultValue=""
                        >
                          <option value="">Select method</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="JazzCash">JazzCash</option>
                          <option value="EasyPaisa">EasyPaisa</option>
                          <option value="Cash">Cash</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      <label>
                        Transaction Reference
                        <input
                          name="transaction_reference"
                          type="text"
                          maxLength={200}
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        Notes
                        <textarea
                          name="notes"
                          maxLength={1000}
                          rows={2}
                          style={inputStyle}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={busyId === shop.id}
                        style={buttonStyle}
                      >
                        {busyId === shop.id
                          ? "Please wait..."
                          : "Create Pending Payment"}
                      </button>
                    </form>
                  </div>
                )}

                {shop.status === "approved" && (
                  <div style={panelBoxStyle}>
                    <h3 style={sectionTitleStyle}>
                      Payment Management
                    </h3>

                    {shopPayments.length === 0 ? (
                      <p>No payments found for this shop.</p>
                    ) : (
                      shopPayments.map((payment) => (
                        <div key={payment.id} style={paymentCardStyle}>
                          <p>
                            Amount:{" "}
                            <strong>
                              {payment.currency} {Number(payment.amount).toLocaleString("en-PK")}
                            </strong>
                          </p>

                          <p>
                            Payment Status:{" "}
                            <strong>{payment.status}</strong>
                          </p>

                          <p>
                            Method: {payment.payment_method || "Not provided"}
                          </p>

                          <p>
                            Reference:{" "}
                            {payment.transaction_reference || "Not provided"}
                          </p>

                          <p>
                            Created: {formatDate(payment.created_at)}
                          </p>

                          {payment.verified_at && (
                            <p>
                              Verified: {formatDate(payment.verified_at)}
                            </p>
                          )}

                          {payment.license_applied_at && (
                            <p>
                              License Applied:{" "}
                              {formatDate(payment.license_applied_at)}
                            </p>
                          )}

                          {payment.notes && (
                            <p>Notes: {payment.notes}</p>
                          )}

                          {payment.status === "pending" && (
                            <div style={buttonRowStyle}>
                              <button
                                disabled={busyId === payment.id}
                                onClick={() =>
                                  verifyPayment(payment.id)
                                }
                                style={{
                                  ...buttonStyle,
                                  background: "#167a45"
                                }}
                              >
                                Verify Payment
                              </button>

                              <button
                                disabled={busyId === payment.id}
                                onClick={() =>
                                  rejectPayment(payment.id)
                                }
                                style={{
                                  ...buttonStyle,
                                  background: "#b42318"
                                }}
                              >
                                Reject Payment
                              </button>
                            </div>
                          )}

                          {payment.status === "verified" &&
                            !payment.license_applied_at && (
                              <div style={{
                                marginTop: "16px",
                                padding: "14px",
                                background: "#fff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px"
                              }}>
                                <h4 style={{
                                  color: "#14213d",
                                  marginBottom: "12px"
                                }}>
                                  Activate Paid License
                                </h4>

                                <form
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    void activatePaidLicense(
                                      payment.id,
                                      new FormData(event.currentTarget)
                                    );
                                  }}
                                  style={formStyle}
                                >
                                  <label>
                                    License Duration
                                    <select
                                      name="duration_months"
                                      defaultValue="12"
                                      style={inputStyle}
                                    >
                                      <option value="1">1 Month</option>
                                      <option value="3">3 Months</option>
                                      <option value="6">6 Months</option>
                                      <option value="12">12 Months</option>
                                    </select>
                                  </label>

                                  <label>
                                    Maximum Admin Devices
                                    <input
                                      name="max_admin_devices"
                                      type="number"
                                      min="1"
                                      step="1"
                                      defaultValue="1"
                                      required
                                      style={inputStyle}
                                    />
                                  </label>

                                  <label>
                                    Maximum Cashier Devices
                                    <input
                                      name="max_cashier_devices"
                                      type="number"
                                      min="0"
                                      step="1"
                                      defaultValue="5"
                                      required
                                      style={inputStyle}
                                    />
                                  </label>

                                  <label>
                                    Offline Grace Days
                                    <input
                                      name="offline_grace_days"
                                      type="number"
                                      min="0"
                                      step="1"
                                      defaultValue="30"
                                      required
                                      style={inputStyle}
                                    />
                                  </label>

                                  <button
                                    type="submit"
                                    disabled={busyId === payment.id}
                                    style={{
                                      ...buttonStyle,
                                      background: "#167a45"
                                    }}
                                  >
                                    {busyId === payment.id
                                      ? "Please wait..."
                                      : "Activate Paid License"}
                                  </button>
                                </form>
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                )}
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

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  padding: "18px",
  marginBottom: "16px"
};

const panelBoxStyle: React.CSSProperties = {
  marginTop: "22px",
  padding: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px"
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#14213d",
  marginBottom: "12px"
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
  flexWrap: "wrap"
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  maxWidth: "500px"
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  marginTop: "6px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  background: "white",
  color: "#14213d"
};

const paymentCardStyle: React.CSSProperties = {
  padding: "14px",
  marginTop: "12px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "white",
  overflowWrap: "anywhere"
};
