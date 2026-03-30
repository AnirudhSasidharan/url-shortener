export default function AnalyticsPanel({ analytics }) {
  const firstClick = analytics.click_history?.at(-1);
  const lastClick = analytics.click_history?.at(0);

  return (
    <div className="card">
      <div className="card-label">
        analytics —{" "}
        <span style={{ color: "var(--accent3)" }}>{analytics.short_code}</span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="analytics-stat-val">{analytics.total_clicks}</div>
          <div className="analytics-stat-label">total clicks</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-val" style={{ fontSize: "1rem", paddingTop: "6px", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            {analytics.original_url?.length > 40
              ? analytics.original_url.slice(0, 40) + "..."
              : analytics.original_url}
          </div>
          <div className="analytics-stat-label">destination</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-val" style={{ fontSize: "0.9rem", color: "var(--accent3)", fontFamily: "var(--mono)" }}>
            {firstClick ? new Date(firstClick.timestamp).toLocaleString() : "—"}
          </div>
          <div className="analytics-stat-label">first click</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-val" style={{ fontSize: "0.9rem", color: "var(--accent3)", fontFamily: "var(--mono)" }}>
            {lastClick ? new Date(lastClick.timestamp).toLocaleString() : "—"}
          </div>
          <div className="analytics-stat-label">last click</div>
        </div>
      </div>

      {analytics.click_history?.length > 0 && (
        <>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
            click history
          </div>
          <div className="click-list">
            {analytics.click_history.map((c, i) => (
              <div className="click-item" key={i}>
                <span className="click-time">
                  {new Date(c.timestamp).toLocaleString()}
                </span>
                <span className="click-ip">{c.ip_address}</span>
                <span className="click-ua">{c.user_agent}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
