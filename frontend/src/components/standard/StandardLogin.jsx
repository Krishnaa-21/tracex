import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setToken, setOfficer } from "../../api/client";
import { useMode } from "../../context/ModeContext";
import { t } from "../../config/standardPortal";
import StandardUtilityBar from "./StandardUtilityBar";
import StandardBranding from "./StandardBranding";
import StandardFooter from "./StandardFooter";
import { Notice } from "./StandardUI";

/** Standard Mode sign-in page. Same credentials flow as the Analysis Mode login. */
export default function StandardLogin() {
  const navigate = useNavigate();
  const { language } = useMode();
  const s = t(language);

  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !password.trim()) {
      setError(s.loginEmptyError);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.post("auth/login", { badge_id: badgeId.trim(), password: password.trim() });
      if (data.access_token) {
        setToken(data.access_token);
        if (data.officer) setOfficer(data.officer);
        navigate("/", { replace: true });
      } else {
        throw new Error(s.loginDefaultError);
      }
    } catch (err) {
      let msg = err.message || s.loginDefaultError;
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err.name === "TypeError") {
        msg = s.loginNetworkError;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="std-shell">
      {/* Top popup notification when Forgot Password is clicked */}
      {showForgotPassword && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(92vw, 540px)",
            backgroundColor: "#FFFFFF",
            border: "2px solid #0B3B60",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(11, 42, 69, 0.25)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#E6F0FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#0B3B60",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            ℹ
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "14px",
                fontWeight: "700",
                color: "#0B3B60",
              }}
            >
              {s.forgotPasswordTitle}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "12.5px",
                color: "#334155",
                lineHeight: "1.5",
              }}
            >
              {s.forgotPasswordMsg}
            </p>
          </div>
          <button
            type="button"
            id="close-forgot-password-popup"
            onClick={() => setShowForgotPassword(false)}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <a className="std-skip" href="#std-main">{s.skip}</a>
      <StandardUtilityBar />
      <div className="std-identity">
        <div className="std-container std-identity__inner">
          <StandardBranding to="/login" />
        </div>
      </div>

      <main id="std-main" tabIndex={-1} className="std-main">
        <div className="std-container">
          <div className="std-pagehead">
            <div>
              <h1>{s.loginTitle}</h1>
              <p>{s.loginSub}</p>
            </div>
          </div>

          <div className="std-login">
            <section className="std-panel" aria-labelledby="std-notice-title">
              <div className="std-panel__head">
                <h2 className="std-panel__title" id="std-notice-title">{s.loginNoticeTitle}</h2>
              </div>
              <div className="std-panel__body">
                <ul className="std-list">
                  {s.loginNoticeList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="std-panel std-login__signin" aria-labelledby="std-login-title">
              <div className="std-panel__head">
                <h2 className="std-panel__title" id="std-login-title">{s.loginPanelTitle}</h2>
              </div>
              <form className="std-panel__body" onSubmit={handleSubmit} noValidate>
                {error && <Notice tone="danger" inline title={s.loginFailedTitle}>{error}</Notice>}
                <div className="std-field">
                  <label className="std-label" htmlFor="std-badge">{s.loginOfficerIdLabel}</label>
                  <input id="std-badge" className="std-input std-mono" autoComplete="username" value={badgeId} onChange={(e) => setBadgeId(e.target.value)} />
                </div>
                <div className="std-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="std-label" htmlFor="std-password">{s.loginPasswordLabel}</label>
                    <button
                      type="button"
                      id="std-forgot-password-btn"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--std-link, #0B5CAD)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      {s.loginForgotPassword}
                    </button>
                  </div>
                  <input id="std-password" type="password" className="std-input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="std-btn" disabled={isLoading}>
                  {isLoading ? s.loginAuthenticating : s.loginSubmit}
                </button>
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="std-linkbtn"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    Need help accessing your account? {s.loginForgotPassword}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>

      <StandardFooter />
    </div>
  );
}