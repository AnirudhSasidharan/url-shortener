import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function buildChartData(clickHistory) {
  const counts = {};
  clickHistory.forEach((c) => {
    const date = new Date(c.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    counts[date] = (counts[date] || 0) + 1;
  });
  return Object.entries(counts).map(([date, clicks]) => ({ date, clicks }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#151c24",
        border: "1px solid #1f2d3d",
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "var(--mono)",
        fontSize: "0.78rem",
        color: "#e2eaf2",
      }}>
        <div style={{ color: "#5a7a96", marginBottom: "4px" }}>{label}</div>
        <div style={{ color: "#00d4ff" }}>{payload[0].value} clicks</div>
      </div>
    );
  }
  return null;
};

export default function ClicksChart({ analytics }) {
  const data = buildChartData(analytics.click_history || []);
  if (data.length === 0) return null;

  return (
    <div className="card">
      <div className="card-label">clicks over time</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(31,45,61,0.8)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontFamily: "DM Mono", fontSize: 11, fill: "#5a7a96" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "DM Mono", fontSize: 11, fill: "#5a7a96" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,212,255,0.05)" }} />
            <Bar
              dataKey="clicks"
              fill="#00d4ff"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
