
export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f6fa",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <h1 style={{ color: "#14213d", fontSize: "28px" }}>
          BOORSHAY <span style={{ color: "#c49a45" }}>APPS</span>
        </h1>
        <span style={{ color: "#64748b" }}>
          Software Solutions
        </span>
      </header>

      <section style={{
        maxWidth: "1100px",
        margin: "90px auto",
        textAlign: "center"
      }}>
        <p style={{
          color: "#b58a36",
          fontWeight: "bold",
          letterSpacing: "3px"
        }}>
          WELCOME TO BOORSHAY APPS
        </p>

        <h2 style={{
          fontSize: "clamp(32px, 6vw, 54px)",
          color: "#14213d",
          margin: "22px 0"
        }}>
          Smart Software for Your Business
        </h2>

        <p style={{
          color: "#64748b",
          fontSize: "18px",
          lineHeight: 1.7,
          maxWidth: "650px",
          margin: "0 auto"
        }}>
          Manage your software products, shop registration,
          and licenses through one central platform.
        </p>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginTop: "35px"
        }}>
          <a href="/signup" style={{
            background: "#14213d",
            color: "white",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none"
          }}>
            Create Account
          </a>

          <a href="/login" style={{
            border: "1px solid #14213d",
            color: "#14213d",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none"
          }}>
            Customer Login
          </a>
        </div>
      </section>

      <footer style={{
        textAlign: "center",
        color: "#64748b",
        padding: "25px"
      }}>
        © 2026 BOORSHAY APPS. All rights reserved.
      </footer>
    </main>
  );
}
