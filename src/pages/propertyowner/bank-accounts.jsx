import React, { useEffect, useState, useRef, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import {
  Building, ShieldCheck, Eye, EyeOff, Smartphone,
  Upload, FileCheck2, AlertCircle, Loader2, ImageIcon, X, FileBadge2
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskAccount(num) {
  if (!num) return "—";
  const s = String(num);
  return "xxxxx" + s.slice(-4);
}

const MAX_PX   = 800;
const QUALITY  = 0.82;
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB hard limit

async function compressImage(file) {
  if (file.type === "application/pdf") return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width <= MAX_PX && height <= MAX_PX) {
        // no resize needed
      } else if (width > height) {
        height = Math.round((height * MAX_PX) / width);
        width  = MAX_PX;
      } else {
        width  = Math.round((width  * MAX_PX) / height);
        height = MAX_PX;
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

function fmtBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── BankProofUploader ───────────────────────────────────────────────────────

function BankProofUploader({ ownerLoginId, onUploaded, existingUrl }) {
  const inputRef = useRef(null);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState("");
  const [status, setStatus]       = useState("idle");
  const [error, setError]         = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl || "");

  useEffect(() => { if (existingUrl && !uploadedUrl) setUploadedUrl(existingUrl); }, [existingUrl]);

  const handleFileChange = useCallback(async (raw) => {
    if (!raw) return;
    setError("");
    if (raw.size > MAX_SIZE) {
      setError(`File too large (${fmtBytes(raw.size)}). Maximum is 15 MB.`);
      return;
    }
    setStatus("compressing");
    try {
      const compressed = await compressImage(raw);
      const prev = compressed.type.startsWith("image/") ? URL.createObjectURL(compressed) : "";
      setFile(compressed);
      setPreview(prev);
      setStatus("idle");
    } catch (e) {
      setError(`Compression failed: ${e.message}`);
      setStatus("error");
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    if (!ownerLoginId) { setError("Owner session missing — please refresh."); return; }
    setStatus("uploading");
    setError("");
    try {
      const dataUrl  = await fileToDataUrl(file);
      const res  = await fetch("/api/checkin/owner/documents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ loginId: ownerLoginId, bankProof: { dataUrl, name: file.name, type: file.type } }),
      });
      const data = await res.json();
      if (!data.bankProofUrl) throw new Error(data.message || "Upload failed — no URL returned");
      setUploadedUrl(data.bankProofUrl);
      setStatus("success");
      onUploaded?.(data.bankProofUrl, file.name);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
    } catch (e) {
      setError(e.message || "Upload failed");
      setStatus("error");
    }
  }, [file, ownerLoginId, onUploaded, preview]);

  const handleRemovePending = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(""); setStatus("idle"); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const isPDF = file?.type === "application/pdf";

  return (
    <div className="mt-6 border-t border-border/60 pt-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Bank Proof Document</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Passbook, cancelled cheque, or bank statement (image or PDF · max 15 MB)</p>
        </div>
        {uploadedUrl && !file && (
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
            <FileCheck2 className="size-3.5" /> View current proof
          </a>
        )}
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11.5px] font-bold">
          <FileCheck2 className="size-4 shrink-0" />
          Bank proof uploaded.{" "}
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">View →</a>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[11.5px] font-bold">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      {!file && status !== "success" && (
        <label className="group relative flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-slate-50 hover:bg-white transition-all cursor-pointer">
          <Upload className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <p className="text-[11.5px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Click to browse or drag a file here
          </p>
          <input ref={inputRef} type="file" accept="image/*,application/pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
        </label>
      )}

      {status === "compressing" && (
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground font-medium py-2">
          <Loader2 className="size-4 animate-spin" /> Compressing image…
        </div>
      )}

      {file && status !== "compressing" && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-slate-50">
          <div className="size-16 rounded-lg border border-border bg-white overflow-hidden flex items-center justify-center shrink-0">
            {isPDF ? <FileBadge2 className="size-8 text-rose-500" />
              : preview ? <img src={preview} alt="Bank proof preview" className="object-cover w-full h-full" />
              : <ImageIcon className="size-8 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate">{file.name}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{fmtBytes(file.size)}</p>
            {!isPDF && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Compressed for faster upload</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleUpload} disabled={status === "uploading"}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-700 transition-all disabled:opacity-60">
              {status === "uploading" ? <><Loader2 className="size-3.5 animate-spin" /> Uploading…</> : <><Upload className="size-3.5" /> Upload</>}
            </button>
            {status !== "uploading" && (
              <button onClick={handleRemovePending} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200 transition-all">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankAccountsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [bank, setBank]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [isEditing, setIsEditing]         = useState(false);
  const [editData, setEditData]           = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg]       = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [bankProofUrl,  setBankProofUrl]  = useState("");
  const [bankProofName, setBankProofName] = useState("");

  useEffect(() => {
    fetchJson(`/api/owners/${encodeURIComponent(owner.loginId)}`)
      .then((data) => {
        const bankInfo = {
          accountHolder: data.checkinAccountHolderName || data.accountHolderName || "",
          bankName:      data.checkinBankName      || data.bankName      || "",
          branchName:    data.checkinBranchName    || data.branchName    || "",
          accountNumber: data.checkinBankAccountNumber || data.accountNumber || "",
          ifscCode:      data.checkinIfscCode      || data.ifscCode      || "",
          upiId:         data.checkinUpiId         || data.upiId         || "",
          locked:        !!data.bankLockedByVisit,
          proofUrl:      data.checkinBankProof     || "",
          proofName:     data.checkinBankProofName || "",
        };
        setBank(bankInfo);
        setBankProofUrl(bankInfo.proofUrl);
        setBankProofName(bankInfo.proofName);
        setEditData({
          checkinAccountHolderName: bankInfo.accountHolder,
          checkinBankName:          bankInfo.bankName,
          checkinBranchName:        bankInfo.branchName,
          checkinBankAccountNumber: bankInfo.accountNumber,
          checkinIfscCode:          bankInfo.ifscCode,
          checkinUpiId:             bankInfo.upiId,
        });
      })
      .catch(() => setBank(null))
      .finally(() => setLoading(false));
  }, [owner.loginId]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!bankProofUrl) {
      setErrorMsg("Please upload a bank proof document before submitting.");
      return;
    }
    setSubmitLoading(true);
    try {
      const data = await fetchJson("/api/owner-change-requests/submit", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          requestType: "bank_details",
          requestedChanges: editData,
          bankProofUrl,
          bankProofName,
        }),
      });
      if (data.success) {
        setSuccessMsg("Bank details submitted for Superadmin approval.");
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(data.message || "Failed to submit request.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Error submitting request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const hasBank = bank && (bank.bankName || bank.accountNumber || bank.accountHolder);
  const hasUpi  = bank?.upiId;

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Settlements Bank Accounts"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Bank Accounts</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Bank accounts linked to receive tenant rent settlements directly.</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card text-[12.5px] font-medium hover:border-primary/40 transition-colors self-start md:mt-2">
            Edit Bank Details
          </button>
        )}
      </div>

      {successMsg && (
        <div className="max-w-2xl rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 text-xs font-bold flex items-center gap-2 mb-6">
          <ShieldCheck size={16} /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-muted-foreground py-10 text-center">Loading…</div>
      ) : !hasBank && !hasUpi ? (
        <div className="max-w-2xl bg-card border border-dashed border-border rounded-2xl p-10 text-center shadow-soft">
          <Building className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-foreground mb-1">No bank account linked</p>
          <p className="text-[12.5px] text-muted-foreground mb-4">Complete your KYC to link a bank account for rent settlements.</p>
          <a href="/propertyowner/kyc-verification"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity">
            Complete KYC →
          </a>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {hasBank && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/60">
                <h3 className="font-serif text-[18px] text-foreground">Linked Accounts</h3>
                <div className="flex items-center gap-2">
                  {bank.proofUrl && (
                    <a href={bank.proofUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors">
                      <FileCheck2 className="size-3" /> Proof on file
                    </a>
                  )}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Primary Settlement
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Building size={20} />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      {bank.bankName || "Bank Account"}{bank.accountHolder ? ` (${bank.accountHolder})` : ""}
                    </p>
                    {bank.branchName && <p className="text-[12px] text-muted-foreground mt-0.5">{bank.branchName} Branch</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                    <div>
                      <p className="text-[10.5px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Account Number</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-mono font-semibold text-foreground">
                          {showFull ? bank.accountNumber : maskAccount(bank.accountNumber)}
                        </p>
                        {bank.accountNumber && (
                          <button onClick={() => setShowFull((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {showFull ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">IFSC Code</p>
                      <p className="text-[13px] font-mono font-semibold text-foreground">{bank.ifscCode || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
              {bank.locked && (
                <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11.5px] text-amber-600">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  Bank details are locked by your KYC submission. Contact support to update.
                </div>
              )}
            </div>
          )}

          {hasUpi && !isEditing && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mt-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
                <h3 className="font-serif text-[18px] text-foreground">UPI</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">Instant Transfer</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-[10.5px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">UPI ID</p>
                  <p className="text-[14px] font-semibold text-foreground">{bank.upiId}</p>
                </div>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mt-4">
              <h3 className="font-serif text-[18px] text-foreground border-b border-border/60 pb-3 mb-4">Edit Bank Details</h3>
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["Account Holder Name", "checkinAccountHolderName"],
                    ["Bank Name", "checkinBankName"],
                    ["Branch Name", "checkinBranchName"],
                    ["Account Number", "checkinBankAccountNumber"],
                    ["IFSC Code", "checkinIfscCode"],
                    ["UPI ID", "checkinUpiId"],
                  ].map(([lbl, key]) => (
                    <div key={key}>
                      <label className="text-[10px] font-black text-slate-800 uppercase mb-2 block">{lbl}</label>
                      <input type="text" value={editData[key] || ""}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all" />
                    </div>
                  ))}
                </div>

                <BankProofUploader
                  ownerLoginId={owner.loginId}
                  existingUrl={bankProofUrl}
                  onUploaded={(url, name) => { setBankProofUrl(url); setBankProofName(name); }}
                />

                {!bankProofUrl && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-semibold">
                    <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                    A bank proof document (passbook / cancelled cheque) must be uploaded before you can submit.
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[11.5px] font-bold">
                    <AlertCircle className="size-4 shrink-0" /> {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                  <button type="button" onClick={() => { setIsEditing(false); setErrorMsg(""); }}
                    className="px-5 h-9 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitLoading || !bankProofUrl}
                    className="px-5 h-9 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2">
                    {submitLoading ? "Submitting…" : "Submit for Approval"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
