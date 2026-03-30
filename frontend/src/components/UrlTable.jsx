import { useState } from "react";

export default function UrlTable({ urls, onRefresh, onAnalytics, selectedCode }) {
  const [search, setSearch] = useState("");

  const filtered = urls.filter(
    (u) =>
      u.short_code.toLowerCase().includes(search.toLowerCase()) ||
      u.original_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-label">all links</div>
      <div className="table-header">
        <input
          className="input search"
          placeholder="filter links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-ghost" onClick={onRefresh}>↻ refresh</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No links yet. Shorten something above.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Short Code</th>
              <th>Original URL</th>
              <th>Clicks</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.short_code}
                className={selectedCode === u.short_code ? "row-selected" : ""}
              >
                <td>
                  <a
                    className="link-code"
                    href={`http://localhost:8000/${u.short_code}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {u.short_code}
                  </a>
                </td>
                <td>
                  <span className="original" title={u.original_url}>
                    {u.original_url}
                  </span>
                </td>
                <td>
                  <span className="badge">{u.click_count}</span>
                </td>
                <td>
                  <span className="date">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-ghost"
                    onClick={() => onAnalytics(u.short_code)}
                  >
                    analytics
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
