import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setToken, setOfficer } from "../../api/client";
import StandardUtilityBar from "./StandardUtilityBar";
import StandardBranding from "./StandardBranding";
import StandardFooter from "./StandardFooter";
import { Notice } from "./StandardUI";

/** Standard Mode sign-in page. Same credentials flow as the Analysis Mode login. */
export default function StandardLogin() {
  const navigate = useNavigate();
  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !password.trim()) {
      setError("Please enter your Officer ID and password.");
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
        throw new Error("Invalid response from authorization server");
      }
    } catch (err) {
      let msg = err.message || "Authentication failed. Check your badge ID and password.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err.name === "TypeError") {
        msg = "Unable to connect to TraceX backend. Please verify the server is running on localhost:8000.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="std-shell">
      <StandardUtilityBar />
      <div className="std-identity">
        <div className="std-container std-identity__inner">
          <StandardBranding to="/login" />
        </div>
      </div>

      <main id="std-main" className="std-main">
        <div className="std-container">
          <div className="std-pagehead">
            <div>
              <h1>Officer Sign-In</h1>
              <p>Authorised investigating officers only.</p>
            </div>
          </div>

          <div className="std-login">
            <section className="std-panel" aria-labelledby="std-notice-title">
              <div className="std-panel__head">
                <h2 className="std-panel__title" id="std-notice-title">Important Notice</h2>
              </div>
              <div className="std-panel__body">
                <ul className="std-list">
                  <li>This system contains sensitive investigative information and is restricted to authorised officers.</li>
                  <li>All access and activity is logged and monitored.</li>
                  <li>Unauthorised access, disclosure or misuse is punishable under applicable law.</li>
                  <li>Sign out and close the browser when you leave your workstation.</li>
                </ul>
              </div>
            </section>

            <section className="std-panel" aria-labelledby="std-login-title">
              <div className="std-panel__head">
                <h2 className="std-panel__title" id="std-login-title">Sign in to your account</h2>
              </div>
              <form className="std-panel__body" onSubmit={handleSubmit} noValidate>
                {error && <Notice tone="danger" inline title="Sign-in failed">{error}</Notice>}
                <div className="std-field">
                  <label className="std-label" htmlFor="std-badge">Officer / Badge ID</label>
                  <input id="std-badge" className="std-input std-mono" autoComplete="username" placeholder="Enter Officer ID" value={badgeId} onChange={(e) => setBadgeId(e.target.value)} />
                </div>
                <div className="std-field">
                  <label className="std-label" htmlFor="std-password">Password</label>
                  <input id="std-password" type="password" className="std-input" autoComplete="current-password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="std-btn" disabled={isLoading}>
                  {isLoading ? "Authenticating…" : "Secure sign-in"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>

      <StandardFooter />
    </div>
  );
}
