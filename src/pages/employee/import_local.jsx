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
    <div className="html-page">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-3">Import localStorage JSON to MongoDB</h1>
        <p className="text-sm text-gray-600 mb-4">
          Paste the exported localStorage JSON below (or drop a .json file) and provide the import secret.
          The server will upsert Owners, Visits, Tenants and Properties.
        </p>

        <textarea
          className="w-full h-56 p-3 border rounded mb-3 font-mono text-sm"
          placeholder="Paste localStorage JSON here"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
        />
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Import secret (x-import-secret)"
            className="border p-2 rounded flex-1"
            value={importSecret}
            onChange={(event) => setImportSecret(event.target.value)}
          />
          <input type="file" accept="application/json" className="border p-2 rounded" onChange={handleFile} />
        </div>
        <div className="flex gap-2">
          <button onClick={doImport} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded font-semibold">
            {loading ? "Importing..." : "Import"}
          </button>
          <button onClick={previewPayload} className="bg-gray-200 px-4 py-2 rounded">Preview Parsed</button>
          {status && <span className="text-sm text-gray-600 ml-3">{status}</span>}
        </div>

        {result && (
          <pre className="mt-4 p-3 bg-gray-50 border rounded text-sm max-h-72 overflow-auto">{result}</pre>
        )}
      </div>
    </div>
  );
}




