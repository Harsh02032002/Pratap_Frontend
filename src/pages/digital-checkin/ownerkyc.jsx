import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useOwnerKyc } from "./useOwnerKyc";

export default function DigitalCheckinOwnerkyc() {
  useHtmlPage({
    title: "Owner Digital Check-In - KYC",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/ownerkyc.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
    loginId,
    setLoginId,
    ownerEmail,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    digilockerRef,
    setDigilockerRef,
    otpMsg,
    nextVisible,
    loadingStart,
    loadingComplete,
    handleStart,
    handleComplete,
    handleNext
  } = useOwnerKyc();

  return (
    <div className="html-page">
      <header className="dc-header">
        <div className="dc-header-inner">
          <img src="/website/roomhy_logo.jpeg" alt="Roomhy Logo" className="dc-logo" style={{ background: "#fff", padding: "4px 8px", borderRadius: 6 }} />
          <div>
            <p className="dc-eyebrow">Digital Check-In</p>
            <h1 className="dc-header-title">Owner KYC</h1>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="hero-card">
          <p className="hero-kicker">Identity Verification</p>
          <h2 className="hero-title">Aadhaar verification for secure owner access</h2>
          <p className="hero-copy muted">Verify your identity using Aadhaar for secure access.</p>
        </div>

        {ownerEmail && (
          <div
            id="emailInfo"
            style={{
              background: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px"
            }}
          >
            <p style={{ margin: "0", fontSize: "12px", color: "#1976d2" }}>
              <strong>Registered email for login details:</strong> <span>{ownerEmail}</span>
            </p>
          </div>
        )}

        <div className="grid">
          <div>
            <label>Login ID</label>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} readOnly />
          </div>
          <div>
            <label>Mobile Number (linked with Aadhaar)</label>
            <input
              value={aadhaarLinkedPhone}
              onChange={(e) => setAadhaarLinkedPhone(e.target.value)}
              type="text"
              placeholder="10-digit mobile like 9876543210"
              required
            />
            <div className="hint">Enter the 10-digit mobile number linked to your Aadhaar</div>
          </div>
          <div>
            <label>Aadhaar Number</label>
            <input
              value={aadhaarNumber}
              onChange={(e) => handleAadhaarChange(e.target.value)}
              type="text"
              placeholder="XXXX XXXX XXXX"
              required
            />
            <div className="hint">Format: XXXX XXXX XXXX (12 digits, spaces optional)</div>
          </div>
          <div>
            <label>DigiLocker Reference ID</label>
            <input
              value={digilockerRef}
              onChange={(e) => setDigilockerRef(e.target.value)}
              type="text"
              placeholder="Will auto-fill after start"
            />
            <div className="hint">Use the same reference after completing DigiLocker verification</div>
          </div>
        </div>
        <button onClick={handleStart} disabled={loadingStart} type="button">
          {loadingStart ? "Starting..." : "Start DigiLocker Verification"}
        </button>
        <button onClick={handleComplete} disabled={loadingComplete} type="button">
          {loadingComplete ? "Verifying..." : "Complete Verification"}
        </button>
        {otpMsg.text && <p className={`muted ${otpMsg.type}`}>{otpMsg.text}</p>}
        {nextVisible && (
          <button onClick={handleNext} type="button">
            Continue to Terms & Conditions
          </button>
        )}
      </div>
    </div>
  );
}

