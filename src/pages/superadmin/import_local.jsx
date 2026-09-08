import React, { useEffect, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

export default function ImportLocal() {
  useHtmlPage({
    title: "Import LocalStorage ? MongoDB",
    bodyClass: "bg-gray-50 p-8",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: []
  });

  const [payloadText, setPayloadText] = useState("");
  const [importSecret, setImportSecret] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus("");
  }, [payloadText, importSecret]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPayloadText(String(reader.result || ""));
    };
    reader.readAsText(file);
  };

  const parsePayload = () => {
    if (!payloadText.trim()) return null;
    try {
      return JSON.parse(payloadText);
    } catch (err) {
      setStatus("Invalid JSON. Please fix the payload.");
      return null;
    }
  };

  const previewPayload = () => {
    const parsed = parsePayload();
    if (!parsed) return;
    setResult(JSON.stringify(parsed, null, 2));
    setStatus("Parsed JSON preview generated.");
  };

  const doImport = async () => {
    const parsed = parsePayload();
    if (!parsed) return;
    setLoading(true);
    setStatus("");
    try {
      const headers = importSecret ? { "x-import-secret": importSecret } : {};
      const data = await fetchJson("/api/admin/import-local", {
        method: "POST",
        headers,
        body: JSON.stringify(parsed)
      });
      setResult(JSON.stringify(data, null, 2));
      setStatus("Import completed.");
    } catch (err) {
      setStatus(err?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 bg-slate-50/50 min-h-full">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Import LocalStorage → MongoDB</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Paste the exported localStorage JSON below (or drop a .json file) and provide the import secret.
              The server will upsert Owners, Visits, Tenants and Properties into the database.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Payload JSON</label>
              <textarea
                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none"
                placeholder='{ "owners": [...], "visits": [...] }'
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Import Secret</label>
                <input
                  type="password"
                  placeholder="x-import-secret"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none text-sm"
                  value={importSecret}
                  onChange={(event) => setImportSecret(event.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload File</label>
                <input 
                  type="file" 
                  accept="application/json" 
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer" 
                  onChange={handleFile} 
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-50">
              <button 
                onClick={doImport} 
                disabled={loading} 
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <i data-lucide="upload-cloud" className="w-4 h-4"></i>
                    Start Import
                  </>
                )}
              </button>
              <button onClick={previewPayload} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                Preview Parsed
              </button>
              {status && (
                <div className="ml-auto px-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100 animate-pulse">
                  {status}
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="mt-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Server Response</label>
              <pre className="p-5 bg-slate-900 text-emerald-400 rounded-2xl text-[10px] font-mono overflow-auto max-h-80 shadow-inner">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


