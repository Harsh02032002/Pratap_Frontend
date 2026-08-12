import { useCallback, useMemo, useRef, useState } from "react";
import { setWebsiteSession } from "../utils/websiteSession";

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : window.location.origin);

export function useWebsiteLogin() {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toastTimer = useRef(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedEmail, password: trimmedPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.token && data.user) {
        setWebsiteSession(data.user, data.token);
        window.location.href = "/website/index";
        return;
      }

      // A failed login must fail. This used to fabricate a session with a fake
      // "demo_token_<timestamp>" whenever the backend rejected the credentials,
      // which meant ANY email with ANY password appeared to sign in — and every
      // authenticated request then 401'd on the bogus token, so pages like
      // /website/chat silently rendered empty.
      setError(data.message || "Invalid email or password.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, email, password]);

  const handleForgot = useCallback(() => {
    window.location.href = "/website/forgot-password";
  }, []);

  return {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    handleSubmit,
    handleForgot
  };
}
