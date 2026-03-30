import { useState } from "react";

let toastTimeout;
function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => (el.className = "toast"), 2600);
}

export default function ShortenForm({ api, onShortened }) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleShorten = async () => {
    if (!url.trim()) return showToast("Paste a URL first", "error");
    setLoading(true);
    try {
      const res = await fetch(`${api}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_url: url, custom_alias: alias || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setResult(data.short_url);
      showToast("Link shortened!", "success");
      onShortened();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    showToast("Copied!", "success");
  };

  return (
    <>
      <div className="card">
        <div className="card-label">shorten a url</div>
        <div className="form-row">
          <input
            className="input"
            type="url"
            placeholder="https://your-very-long-url.com/goes/here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleShorten()}
          />
          <input
            className="input input-alias"
            type="text"
            placeholder="custom alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <button className="btn-primary" onClick={handleShorten} disabled={loading}>
            {loading ? "Shortening..." : "Shorten →"}
          </button>
        </div>
        {result && (
          <div className="result">
            <span className="result-url">{result}</span>
            <button className="btn-ghost" onClick={copy}>copy</button>
          </div>
        )}
      </div>
      <div className="toast" id="toast" />
    </>
  );
}
