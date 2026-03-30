export default function StatsBar({ totalLinks, totalClicks, topLink }) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <div className="stat-value">{totalLinks}</div>
        <div className="stat-label">total links</div>
      </div>
      <div className="stat">
        <div className="stat-value">{totalClicks}</div>
        <div className="stat-label">total clicks</div>
      </div>
      <div className="stat">
        <div className="stat-value">{topLink || "—"}</div>
        <div className="stat-label">top link</div>
      </div>
    </div>
  );
}
