import { useState, useEffect } from "react";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import ShortenForm from "./components/ShortenForm";
import UrlTable from "./components/UrlTable";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ClicksChart from "./components/ClicksChart";
import "./App.css";

const API = "https://url-shortener-production-3ff3.up.railway.app";

export default function App() {
  const [urls, setUrls] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUrls = async () => {
    try {
      const res = await fetch(`${API}/stats/all`);
      const data = await res.json();
      setUrls(data);
    } catch {
      console.error("API not reachable");
    }
  };

  const fetchAnalytics = async (code) => {
    setSelectedCode(code);
    try {
      const res = await fetch(`${API}/analytics/${code}`);
      const data = await res.json();
      setAnalytics(data);
    } catch {
      console.error("Failed to load analytics");
    }
  };

  useEffect(() => {
    fetchUrls();
    const interval = setInterval(fetchUrls, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalClicks = urls.reduce((s, u) => s + u.click_count, 0);
  const topLink = [...urls].sort((a, b) => b.click_count - a.click_count)[0];

  return (
    <div className="app">
      <div className="noise" />
      <div className="container">
        <Header />
        <StatsBar
          totalLinks={urls.length}
          totalClicks={totalClicks}
          topLink={topLink?.short_code}
        />
        <ShortenForm api={API} onShortened={fetchUrls} />
        <UrlTable
          urls={urls}
          onRefresh={fetchUrls}
          onAnalytics={fetchAnalytics}
          selectedCode={selectedCode}
        />
        {analytics && (
          <>
            <AnalyticsPanel analytics={analytics} />
            <ClicksChart analytics={analytics} />
          </>
        )}
      </div>
    </div>
  );
}
