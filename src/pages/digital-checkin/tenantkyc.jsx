import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useTenantKyc } from "./useTenantKyc";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Inline validation error message
const FieldError = ({ msg }) =>
  msg ? (
    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#b71c1c", fontWeight: 600 }}>{msg}</p>
  ) : null;

// OCR result badge shown under each Aadhaar image upload
const OcrBadge = ({ ocr }) => {
  if (!ocr || ocr.status === "idle") return null;
  const s = {
    display: "inline-flex", alignItems: "center", gap: "4px",
    marginTop: "6px", fontSize: "11px", fontWeight: 600, borderRadius: "6px",
    padding: "3px 8px"
  };
  if (ocr.status === "loading")
    return <span style={{ ...s, background: "#e3f2fd", color: "#1565c0" }}>⏳ {ocr.message || "Scanning image…"}</span>;
  if (ocr.status === "verified")
    return (
      <span style={{ ...s, background: "#e8f5e9", color: "#2e7d32" }}>
        ✓ Aadhaar verified
        {ocr.aadhaarNumber ? ` — ${ocr.aadhaarNumber.slice(0, 4)} **** ${ocr.aadhaarNumber.slice(-4)}` : ""}
      </span>
    );
  if (ocr.status === "unreadable")
    return <span style={{ ...s, background: "#fff8e1", color: "#e65100" }}>⚠ {ocr.message || "Unclear — try a clearer photo"}</span>;
  if (ocr.status === "rejected")
    return <span style={{ ...s, background: "#fce4ec", color: "#b71c1c" }}>✗ {ocr.message || "Doesn't appear to be an Aadhaar card"}</span>;
  if (ocr.status === "error")
    return <span style={{ ...s, background: "#fce4ec", color: "#b71c1c" }}>✗ {ocr.message || "Verification failed — please try again"}</span>;
  return null;
};

const CameraSelfieModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [stream, setStream] = React.useState(null);
  const [cameraError, setCameraError] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setCameraError("");
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setCameraError("Camera permission denied or camera not found. Please upload a photo file instead.");
        });
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", maxWidth: "440px", width: "100%",
        padding: "20px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>🤳 Take Live Selfie</h3>
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
          >
            ✕
          </button>
        </div>

        {cameraError ? (
          <div style={{ padding: "16px", background: "#fef2f2", color: "#991b1b", borderRadius: "10px", fontSize: "13px", marginBottom: "16px" }}>
            {cameraError}
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", borderRadius: "12px", overflow: "hidden", background: "#000", marginBottom: "16px", aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {!cameraError && (
            <button
              type="button"
              onClick={handleCapture}
              style={{
                background: "#7c3aed", color: "#fff", border: "none", padding: "12px 24px",
                borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px",
                display: "inline-flex", alignItems: "center", gap: "8px"
              }}
            >
              📸 Capture Photo
            </button>
          )}
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            style={{
              background: "#e2e8f0", color: "#334155", border: "none", padding: "12px 20px",
              borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AadhaarUpload = ({ label, side, value, onChange, ocrStatus, error, onOpenCamera }) => {
  const inputRef = React.useRef(null);

  const borderColor =
    ocrStatus?.status === "verified"   ? "#4caf50" :
    ocrStatus?.status === "rejected"   ? "#f44336" :
    ocrStatus?.status === "unreadable" ? "#ff9800" :
    error                              ? "#f44336" : "#b0bec5";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please upload an image file (JPG, PNG, etc.)"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB"); return; }
    try {
      const b64 = await fileToBase64(file);
      onChange(b64, file); // base64 for preview/upload, File for Tesseract OCR
    } catch {
      alert("Failed to read file. Please try again.");
    }
    e.target.value = "";
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ marginBottom: "8px" }}>
        {label} <span style={{ color: "#f44336" }}>*</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: "10px",
          minHeight: "110px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: value ? "#f0f4f8" : "#f8fafc",
          overflow: "hidden",
          transition: "border-color 0.15s"
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#546e7a"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; }}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            style={{ maxWidth: "100%", maxHeight: "120px", objectFit: "contain", padding: "6px" }}
          />
        ) : (
          <>
            <div style={{ fontSize: "28px", marginBottom: "6px", lineHeight: 1 }}>
              {side === "front" ? "🪪" : side === "selfie" ? "🤳" : "↩️"}
            </div>
            <div style={{ fontSize: "12px", color: "#546e7a", fontWeight: 600 }}>Click to upload</div>
            <div style={{ fontSize: "11px", color: "#90a4ae", marginTop: "2px" }}>JPG / PNG — max 5 MB</div>
          </>
        )}
      </div>

      {side === "selfie" && !value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenCamera && onOpenCamera(); }}
          style={{
            marginTop: "8px", width: "100%", padding: "8px 12px", fontSize: "12px",
            background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px",
            fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: "6px", boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)"
          }}
        >
          📷 Take Live Selfie (Camera)
        </button>
      )}

      <OcrBadge ocr={ocrStatus} />
      {error && !ocrStatus?.status && <FieldError msg={error} />}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            marginTop: "5px", fontSize: "11px", background: "none", border: "none",
            color: "#dc2626", cursor: "pointer", padding: 0, fontWeight: 600,
            boxShadow: "none", minHeight: "auto", width: "auto"
          }}
        >
          Remove
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={side === "selfie" ? "user" : "environment"}
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default function DigitalCheckinTenantkyc() {
  useHtmlPage({
    title: "Tenant Digital Check-In - KYC",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenantkyc.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
    loginId, setLoginId,
    aadhaarNumber, setAadhaarNumber,
    aadhaarLinkedPhone,
    tenantPhone,
    tenantProfile,
    fetchingProfile,
    otp, setOtp,
    otpMsg, nextVisible, otpSent, otpLoading, uploading,
    uploadedUrls, setUploadedUrls, mismatchDetails,
    frontOcr, backOcr, handleImageOcr,
    errors, setErrors,
    handleStart, handleComplete, handleNext
  } = useTenantKyc();

  const [aadhaarFront, setAadhaarFront] = React.useState("");
  const [aadhaarBack, setAadhaarBack]   = React.useState("");
  const [tenantPhoto, setTenantPhoto]   = React.useState("");
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);

  // Run OCR and clear field error when an image is selected
  const onFrontChange = (base64, file) => {
    setAadhaarFront(base64);
    if (!base64 && setUploadedUrls) {
      setUploadedUrls((prev) => ({ ...prev, aadhaarFrontUrl: "" }));
    }
    setErrors((prev) => ({ ...prev, aadhaarFront: "" }));
    if (base64) handleImageOcr(file || base64, "front");
    else handleImageOcr(null, "front");
  };
  const onBackChange = (base64, file) => {
    setAadhaarBack(base64);
    if (!base64 && setUploadedUrls) {
      setUploadedUrls((prev) => ({ ...prev, aadhaarBackUrl: "" }));
    }
    setErrors((prev) => ({ ...prev, aadhaarBack: "" }));
    if (base64) handleImageOcr(file || base64, "back");
    else handleImageOcr(null, "back");
  };
  const onPhotoChange = (base64) => {
    setTenantPhoto(base64);
    if (!base64 && setUploadedUrls) {
      setUploadedUrls((prev) => ({ ...prev, tenantPhotoUrl: "" }));
    }
  };

  // OTP button is disabled while loading or OCR scanning
  const sendOtpDisabled =
    otpLoading ||
    uploading ||
    frontOcr.status === "loading" ||
    backOcr.status === "loading";

  const sendOtpLabel =
    otpLoading  ? "Sending OTP…" :
    uploading   ? "Uploading documents…" :
    otpSent     ? "Resend OTP" : "Send OTP";

  return (
    <div className="html-page">
      <div className="wrap">
        <h2>Tenant Digital Onboarding — Aadhaar KYC</h2>
        <p style={{ fontSize: "13px", color: "#546e7a", marginTop: "-12px", marginBottom: "20px" }}>
          Verify identity documents for seamless check-in. All pre-filled details are synced from your owner booking.
        </p>
        <div className="grid">

          {/* Login ID — read-only, from URL */}
          <div>
            <label>Login ID</label>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} readOnly />
          </div>

          {/* Aadhaar Number */}
          <div>
            <label>
              Aadhaar Number <span style={{ color: "#f44336" }}>*</span>
            </label>
            <input
              value={aadhaarNumber}
              onChange={(e) => {
                setAadhaarNumber(e.target.value);
                if (errors.aadhaarNumber) setErrors((p) => ({ ...p, aadhaarNumber: "" }));
              }}
              pattern="\d{12}"
              maxLength="12"
              placeholder="12-digit Aadhaar number"
              required
              style={errors.aadhaarNumber ? { borderColor: "#f44336" } : {}}
            />
            <FieldError msg={errors.aadhaarNumber} />
          </div>

          {/* Mobile Number — read-only, auto-filled from tenant record */}
          <div>
            <label>
              Mobile Number <span style={{ color: "#f44336" }}>*</span>
              <span style={{ fontSize: "10px", color: "#78909c", marginLeft: "6px", fontWeight: 400 }}>
                (linked to Aadhaar, set by owner — read-only)
              </span>
            </label>
            <input
              value={fetchingProfile ? "Loading…" : aadhaarLinkedPhone}
              readOnly
              disabled
              placeholder={fetchingProfile ? "Loading mobile number…" : "Auto-filled from your tenant record"}
              style={{
                background: "#f5f5f5",
                color: "#546e7a",
                cursor: "not-allowed",
                ...(errors.aadhaarLinkedPhone ? { borderColor: "#f44336" } : {})
              }}
            />
            <FieldError msg={errors.aadhaarLinkedPhone} />
          </div>

          {/* OTP */}
          <div>
            <label>OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP from Aadhaar-linked mobile"
              disabled={!otpSent}
            />
          </div>
        </div>

        {/* Aadhaar Card Photos — both are required */}
        <div style={{ marginTop: "20px" }}>
          <label style={{ marginBottom: "4px" }}>
            Aadhaar Card Photos <span style={{ color: "#f44336" }}>*</span>
          </label>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#7a8fa6" }}>
            Upload clear photos of the front and back of your Aadhaar card. The number will be verified automatically.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <AadhaarUpload
              label="Front Side"
              side="front"
              value={aadhaarFront}
              onChange={onFrontChange}
              ocrStatus={frontOcr}
              error={errors.aadhaarFront}
            />
            <AadhaarUpload
              label="Back Side"
              side="back"
              value={aadhaarBack}
              onChange={onBackChange}
              ocrStatus={backOcr}
              error={errors.aadhaarBack}
            />
          </div>
        </div>

        {/* Tenant Selfie / Photo */}
        <div style={{ marginTop: "24px" }}>
          <label style={{ marginBottom: "4px" }}>Tenant Selfie / Photo</label>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#7a8fa6" }}>
            Take a live face selfie using your camera or upload a clear photo file.
          </p>
          <div style={{ maxWidth: "220px" }}>
            <AadhaarUpload
              label="Tenant Photo"
              side="selfie"
              value={tenantPhoto}
              onChange={onPhotoChange}
              onOpenCamera={() => setIsCameraOpen(true)}
            />
          </div>
        </div>

        <CameraSelfieModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(capturedBase64) => onPhotoChange(capturedBase64)}
        />

        {/* Send OTP button — disabled while loading or already sent */}
        <button
          type="button"
          onClick={() => handleStart(aadhaarFront, aadhaarBack, tenantPhoto)}
          disabled={sendOtpDisabled}
          style={sendOtpDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}}
        >
          {sendOtpLabel}
        </button>

        {/* Verify OTP button — only active after OTP sent */}
        <button
          type="button"
          onClick={() => handleComplete(aadhaarFront, aadhaarBack, tenantPhoto)}
          disabled={!otpSent || !otp.trim()}
          style={(!otpSent || !otp.trim()) ? { opacity: 0.6, cursor: "not-allowed" } : {}}
        >
          Verify OTP &amp; Complete KYC
        </button>

        {/* Status / error messages */}
        {otpMsg && (
          <div style={{ marginTop: "14px" }}>
            {otpMsg.startsWith("Data mismatch detected") ? (
              <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: "10px", padding: "14px 16px", color: "#991b1b", fontSize: "13px", fontWeight: 600, lineHeight: "1.5" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>⚠️ Data Mismatch Detected</div>
                {otpMsg}
              </div>
            ) : (
              <p
                className="muted"
                style={{
                  color: otpMsg.startsWith("Failed") || otpMsg.startsWith("Verification failed")
                    ? "#b71c1c"
                    : otpMsg.startsWith("KYC verification completed")
                    ? "#2e7d32"
                    : "#546e7a",
                  fontWeight: 600,
                  margin: "0 0 6px"
                }}
              >
                {otpMsg}
              </p>
            )}
            {mismatchDetails && !otpMsg.startsWith("Data mismatch detected") && (
              <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#856404", fontWeight: 500, marginTop: "8px" }}>
                <strong>⚠️ Mismatch Reason:</strong> {mismatchDetails}
              </div>
            )}
          </div>
        )}

        {nextVisible && (
          <button type="button" onClick={handleNext}>
            Continue to Rental Agreement →
          </button>
        )}
      </div>
    </div>
  );
}
