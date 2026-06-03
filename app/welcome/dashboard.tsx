import { useState, useMemo, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, ReferenceLine
} from "recharts";
import { SIRGraphs } from "./sir-graphs";

const BLUE   = "#378ADD";
const CORAL  = "#D85A30";
const GREEN  = "#639922";
const PURPLE = "#7F77DD";

function runSIR(N: number, I0: number, beta: number, gamma: number, days: number) {
  const data: any[] = [];
  let S = N - I0, I = I0, R = 0;
  for (let t = 0; t < days; t++) {
    data.push({ day: t, S: Math.round(S), I: Math.round(I), R: Math.round(R) });
    const dS = (-beta * S * I) / N;
    const dI = (beta * S * I) / N - gamma * I;
    const dR = gamma * I;
    S = Math.max(0, S + dS);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);
  }
  return data;
}

function Slider({ label, id, min, max, step, value, onChange, format }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b6a66" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500, color: "#1a1a18" }}>{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: BLUE }}
      />
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{
      background: "#f5f4f0",
      borderRadius: 8,
      padding: "10px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      <div style={{ fontSize: 11, color: "#6b6a66", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#ffffff",
      border: "0.5px solid rgba(0,0,0,0.12)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 13,
    }}>
      <div style={{ marginBottom: 4, color: "#6b6a66" }}>Day {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 500 }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Results Dashboard Color Palette ───────────────────────────────────────
const C_NEW = {
  purple:  "#534AB7",
  teal:    "#1D9E75",
  coral:   "#D85A30",
  blue:    "#378ADD",
  amber:   "#BA7517",
  pink:    "#D4537E",
  green:   "#3B6D11",
  gray:    "#888780",
  red:     "#A32D2D",
};

const PT_COLORS = [
  C_NEW.purple, C_NEW.teal, C_NEW.coral, C_NEW.blue,
  C_NEW.amber, C_NEW.pink, C_NEW.green, C_NEW.gray, C_NEW.red,
];

// ─── Utility Functions ─────────────────────────────────────────────────────
const fmt  = (n: any, d = 1) => (typeof n === "number" ? n.toFixed(d) : "—");
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ─── UI Primitives ────────────────────────────────────────────────────────
const SectionLabel = ({ children }: any) => (
  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "#666", marginBottom: 8 }}>{children}</p>
);
const SectionTitle = ({ children }: any) => (
  <h2 style={{ fontSize: 18, fontWeight: 500, color: "#1a1a18", marginBottom: 4 }}>{children}</h2>
);
const SectionSub = ({ children }: any) => (
  <p style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>{children}</p>
);

const MetricCard = ({ label, value, sub }: any) => (
  <div style={{ background: "#f9f8f5", borderRadius: 8,
    padding: "14px 16px", flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a18" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{sub}</div>}
  </div>
);

const ChartCard = ({ title, sub, height = 220, children }: any) => (
  <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12, padding: 16, flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>{title}</div>
    <div style={{ height }}>{children}</div>
    {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>{sub}</div>}
  </div>
);

const Divider = () => (
  <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "28px 0" }} />
);

const Badge = ({ children, variant = "mid" }: any) => {
  const styles: any = {
    good: { background: "#EAF3DE", color: "#3B6D11" },
    mid:  { background: "#FAEEDA", color: "#854F0B" },
    low:  { background: "#FCEBEB", color: "#A32D2D" },
    info: { background: "#E6F1FB", color: "#185FA5" },
  };
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 99,
      fontSize: 10, fontWeight: 500, ...styles[variant] }}>{children}</span>
  );
};

const MiniBar = ({ value, max, color }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{ background: "#f0ebe5", borderRadius: 3, height: 6, width: 64 }}>
      <div style={{ height: 6, borderRadius: 3, background: color, width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
    <span style={{ fontSize: 11, color: "#666" }}>{fmtK(Math.round(value))}</span>
  </div>
);

const Table = ({ headers, rows }: any) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>{headers.map((h: string, i: number) => (
          <th key={i} style={{ textAlign: "left", fontSize: 11, fontWeight: 500,
            color: "#666", padding: "6px 8px",
            borderBottom: "1px solid rgba(0,0,0,0.08)", letterSpacing: "0.03em" }}
            dangerouslySetInnerHTML={{ __html: h }} />
        ))}</tr>
      </thead>
      <tbody>{rows.map((row: any, i: number) => (
        <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
          {row.map((cell: any, j: number) => (
            <td key={j} style={{ padding: "7px 8px", color: "#1a1a18", verticalAlign: "middle" }}>
              {cell}
            </td>
          ))}
        </tr>
      ))}</tbody>
    </table>
  </div>
);

const NavTab = ({ label, active, onClick }: any) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", fontSize: 13, fontWeight: active ? 500 : 400, cursor: "pointer",
    border: "none", borderBottom: active ? `2px solid ${C_NEW.purple}` : "2px solid transparent",
    background: "transparent", color: active ? C_NEW.purple : "#666",
    transition: "all 0.15s",
  }}>{label}</button>
);

const tt = {
  contentStyle: { background: "#ffffff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: "#1a1a18", fontWeight: 500 },
};

// ─── Data from sir_model_summary.csv ───────────────────────────────────────
const PAGE_DATA = [
  { name: "varsitarian",                posts: 60, r2: 0.9529, beta0: 2.840, kdecay: 0.282, capacity: 5857.6, followers: 302000, avgEng: 1120.9 },
  { name: "abtheflame",                posts: 55, r2: 0.9491, beta0: 2.078, kdecay: 0.135, capacity: 2190.6, followers: 60000,  avgEng: 401.0  },
  { name: "ustcsofficial",             posts: 23, r2: 0.9428, beta0: 2.068, kdecay: 0.136, capacity: 675.1,  followers: 22000,  avgEng: 124.4  },
  { name: "USTigerTV",                 posts: 17, r2: 0.9294, beta0: 1.986, kdecay: 0.088, capacity: 489.6,  followers: 103000, avgEng: 156.9  },
  { name: "ustmdblib",                 posts: 12, r2: 0.9441, beta0: 3.746, kdecay: 0.365, capacity: 42.6,   followers: 27000,  avgEng: 13.0   },
  { name: "USTESC",                    posts: 10, r2: 0.9437, beta0: 3.048, kdecay: 0.289, capacity: 167.6,  followers: 26000,  avgEng: 33.6   },
  { name: "USTCSSC",                   posts: 10, r2: 0.9420, beta0: 2.454, kdecay: 0.153, capacity: 182.4,  followers: 23000,  avgEng: 36.9   },
  { name: "USTH1946Official",          posts:  8, r2: 0.9429, beta0: 3.468, kdecay: 0.361, capacity: 356.6,  followers: 56000,  avgEng: 71.6   },
  { name: "USTFPSC",                   posts:  8, r2: 0.9402, beta0: 3.564, kdecay: 0.389, capacity: 127.1,  followers: 29000,  avgEng: 46.5   },
  { name: "ustgalingscience",          posts:  7, r2: 0.9310, beta0: 3.858, kdecay: 0.316, capacity: 52.3,   followers: 24000,  avgEng: 18.7   },
  { name: "USTMSC",                    posts:  5, r2: 0.9377, beta0: 1.265, kdecay: 0.000, capacity: 177.4,  followers: 21000,  avgEng: 32.4   },
  { name: "TOMCATust",                 posts:  4, r2: 0.9543, beta0: 1.350, kdecay: 0.000, capacity: 1434.0, followers: 61000,  avgEng: 239.0  },
  { name: "ustigeradio",               posts:  3, r2: 0.9178, beta0: 0.910, kdecay: 0.000, capacity: 366.0,  followers: 32000,  avgEng: 61.0   },
  { name: "USTGrowlingTigers",         posts:  2, r2: 0.9580, beta0: 5.490, kdecay: 0.785, capacity: 1937.5, followers: 105000, avgEng: 350.0  },
  { name: "USTOSAOfficial",            posts:  2, r2: 0.9340, beta0: 1.528, kdecay: 0.000, capacity: 102.5,  followers: 38000,  avgEng: 20.0   },
  { name: "USTMVT",                    posts:  1, r2: 0.9485, beta0: 1.253, kdecay: 0.000, capacity: 918.0,  followers: 68000,  avgEng: 153.0  },
  { name: "UST.Salinggawi",            posts:  1, r2: 0.9545, beta0: 1.088, kdecay: 0.000, capacity: 1110.0, followers: 94000,  avgEng: 185.0  },
];

const POST_TYPE_DATA = [
  { type: "Religious & Spiritual",  short: "Religious",     count: 76, r0: 6.28,  beta0: 2.41, gamma: 1.09, kdecay: 0.195, avgEng: 618.5, likes: 540.3, comments: 9.0,  shares: 69.1 },
  { type: "General Campus Life",    short: "Campus Life",   count: 37, r0: 6.23,  beta0: 2.40, gamma: 1.09, kdecay: 0.206, avgEng: 566.4, likes: 479.8, comments: 19.9, shares: 66.7 },
  { type: "Congratulations",        short: "Congrats",      count: 25, r0: 9.73,  beta0: 3.12, gamma: 0.88, kdecay: 0.316, avgEng: 319.3, likes: 290.8, comments: 6.7,  shares: 21.8 },
  { type: "Sports & Athletics",     short: "Sports",        count: 24, r0: 5.71,  beta0: 2.16, gamma: 0.97, kdecay: 0.128, avgEng: 724.6, likes: 654.2, comments: 45.7, shares: 24.8 },
  { type: "Announcements",          short: "Announcements", count: 22, r0: 3.91,  beta0: 1.79, gamma: 1.08, kdecay: 0.070, avgEng: 99.9,  likes: 79.3,  comments: 0.7,  shares: 19.9 },
  { type: "No Caption",             short: "No Caption",    count: 14, r0: 14.09, beta0: 3.87, gamma: 0.65, kdecay: 0.381, avgEng: 43.1,  likes: 39.7,  comments: 0.8,  shares: 2.6  },
  { type: "Birthdays & Anniv.",     short: "Birthdays",     count: 11, r0: 10.03, beta0: 2.86, gamma: 0.90, kdecay: 0.263, avgEng: 75.9,  likes: 59.5,  comments: 10.3, shares: 6.2  },
  { type: "Event Photos",           short: "Event Photos",  count: 10, r0: 1.18,  beta0: 1.28, gamma: 1.24, kdecay: 0.000, avgEng: 206.6, likes: 183.5, comments: 4.0,  shares: 19.1 },
  { type: "Library Features",       short: "Library",       count:  9, r0: 16.92, beta0: 4.49, gamma: 0.61, kdecay: 0.486, avgEng: 13.6,  likes: 10.7,  comments: 0.1,  shares: 2.8  },
];

const GROWTH_CURVES: any = {
  "Religious & Spiritual":  [0,472.8,522.4,557.4,578.9,593.0,602.3,608.3,612.5,615.0,616.8,617.9,618.5],
  "Sports & Athletics":     [0,550.5,605.5,655.0,679.8,695.8,706.3,713.1,717.7,720.5,722.6,723.8,724.6],
  "General Campus Life":    [0,431.4,476.4,510.9,530.8,543.4,551.9,557.4,560.8,563.2,564.8,565.8,566.4],
  "Congratulations":        [0,243.6,269.2,287.8,298.7,306.2,311.0,314.2,316.2,317.7,318.4,318.9,319.3],
  "Event Photos":           [0,157.5,174.3,186.1,193.4,198.1,201.2,203.2,204.6,205.6,206.2,206.5,206.6],
  "Birthdays & Anniv.":     [0, 56.5, 62.4, 68.8, 71.5, 73.1, 74.2, 75.1, 75.4, 75.7, 75.8, 75.9, 75.9],
  "Announcements":          [0, 77.1, 84.9, 90.3, 93.6, 96.0, 97.5, 98.5, 99.1, 99.5, 99.7, 99.9, 99.9],
  "No Caption":             [0, 32.6, 36.3, 38.8, 40.5, 41.1, 41.9, 42.6, 42.7, 42.9, 43.0, 43.1, 43.1],
  "Library Features":       [0, 10.6, 11.8, 12.3, 12.8, 13.1, 13.4, 13.4, 13.6, 13.6, 13.6, 13.6, 13.6],
};

const T_STEPS = [0,6,12,18,24,30,36,42,48,54,60,66,72];

const ENG_BUCKETS = [
  { label: "0 – 10",      count: 20 },
  { label: "11 – 50",     count: 66 },
  { label: "51 – 100",    count: 35 },
  { label: "101 – 500",   count: 63 },
  { label: "501 – 1 000", count: 20 },
  { label: "1 001+",      count: 24 },
];

const SIR_R2_HIST = [
  { bin: "0.81", count: 1 }, { bin: "0.83", count: 0 }, { bin: "0.85", count: 1 },
  { bin: "0.87", count: 1 }, { bin: "0.89", count: 1 }, { bin: "0.91", count: 3 },
  { bin: "0.93", count: 12 },{ bin: "0.94", count: 18 },{ bin: "0.945",count: 24 },
  { bin: "0.95", count: 62 },{ bin: "0.955",count: 60 },{ bin: "0.96", count: 30 },
  { bin: "0.965",count: 15 },
];

const MAE_RMSE_SCATTER = [
  {mae:0.9,rmse:1.1},{mae:1.1,rmse:1.4},{mae:0.8,rmse:1.0},{mae:2.4,rmse:2.8},{mae:1.1,rmse:1.4},
  {mae:1.5,rmse:1.9},{mae:1.9,rmse:2.4},{mae:0.6,rmse:0.7},{mae:0.6,rmse:0.7},{mae:1.7,rmse:2.1},
  {mae:3.5,rmse:4.2},{mae:1.0,rmse:1.2},{mae:5.2,rmse:6.1},{mae:2.1,rmse:2.6},{mae:4.4,rmse:5.2},
  {mae:8.1,rmse:9.8},{mae:0.3,rmse:0.5},{mae:3.3,rmse:3.9},{mae:0.8,rmse:1.0},
  {mae:7.2,rmse:8.7},{mae:2.9,rmse:3.5},{mae:0.5,rmse:0.6},{mae:1.8,rmse:2.2},{mae:0.4,rmse:0.5},
  {mae:6.0,rmse:7.3},{mae:1.2,rmse:1.5},{mae:0.7,rmse:0.9},{mae:2.6,rmse:3.2},
  {mae:0.9,rmse:1.1},{mae:0.1,rmse:0.1},{mae:3.8,rmse:4.6},{mae:1.5,rmse:1.8},{mae:0.6,rmse:0.7},
  {mae:0.5,rmse:0.6},{mae:4.7,rmse:5.7},{mae:0.8,rmse:1.0},{mae:2.3,rmse:2.8},
  {mae:1.0,rmse:1.2},{mae:0.6,rmse:0.7},{mae:4.5,rmse:5.5},{mae:1.1,rmse:1.3},{mae:0.2,rmse:0.3},
  {mae:3.1,rmse:3.7},{mae:0.8,rmse:1.0},{mae:6.5,rmse:7.9},{mae:1.3,rmse:1.6},
  {mae:12.0,rmse:14.5},{mae:18.0,rmse:21.9},{mae:0.04,rmse:0.10},
];

// ─── Section Components ───────────────────────────────────────────────────
function RawEDASection() {
  const growthData = T_STEPS.map((t, i) => {
    const row: any = { t };
    Object.entries(GROWTH_CURVES).forEach(([k, arr]: any) => { row[k] = arr[i]; });
    return row;
  });

  const pieData = [
    { name: "Likes",    value: 87.4 },
    { name: "Shares",   value: 9.7  },
    { name: "Comments", value: 2.9  },
  ];
  const pieColors = [C_NEW.blue, C_NEW.teal, C_NEW.coral];

  const followerScatter = PAGE_DATA.map(p => ({ followers: p.followers / 1000, avgEng: p.avgEng, name: p.name }));

  return (
    <div>
      <SectionLabel>Raw data EDA</SectionLabel>
      <SectionTitle>Classified posts — exploratory analysis</SectionTitle>
      <SectionSub>16,644 time-step records across 228 posts, 17 pages, 9 content categories. Each post tracked over 73 time steps (t = 0 to 72).</SectionSub>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Total records"       value="16,644"  sub="228 unique posts" />
        <MetricCard label="Pages tracked"       value="17"      sub="UST-affiliated channels" />
        <MetricCard label="Time steps / post"   value="73"      sub="t = 0 to 72 (uniform)" />
        <MetricCard label="Median final eng."   value="82"      sub="Mean 434.9" />
        <MetricCard label="Max final eng."      value="5,442"   sub="Single post peak" />
        <MetricCard label="Follower range"      value="21k–302k" sub="Across all pages" />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Posts per page" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...PAGE_DATA].sort((a,b) => b.posts - a.posts)} layout="vertical"
              margin={{ left: 70, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#888" }} width={68} />
              <Tooltip {...tt} formatter={(v: any) => [v, "Posts"]} />
              <Bar dataKey="posts" fill={C_NEW.purple} radius={[0, 3, 3, 0]} barSize={10}>
                {PAGE_DATA.map((_, i) => <Cell key={i} fill={i < 3 ? C_NEW.purple : "rgba(83,74,183,0.55)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Posts per content type" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.count - a.count)} layout="vertical"
              margin={{ left: 96, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} formatter={(v: any) => [v, "Posts"]} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={10}>
                {POST_TYPE_DATA.map((_, i) => <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Overall engagement composition" sub="Aggregated final values across all 228 posts">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name" label={({ name, value }) => `${name} ${value}%`}
                labelLine={{ stroke: "#888" }}>
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip {...tt} formatter={(v: any) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Final cumulative engagement distribution" sub="Across all 228 posts at t = 72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ENG_BUCKETS} margin={{ left: 0, right: 8, top: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#888" }}
                angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip {...tt} formatter={(v: any) => [v, "Posts"]} />
              <Bar dataKey="count" fill={C_NEW.teal} radius={[3, 3, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Avg final engagement by content type (stacked: likes / comments / shares)" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.avgEng - a.avgEng)} layout="vertical"
              margin={{ left: 96, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="likes"    name="Likes"    stackId="a" fill={C_NEW.blue}   barSize={12} />
              <Bar dataKey="comments" name="Comments" stackId="a" fill={C_NEW.coral}  barSize={12} />
              <Bar dataKey="shares"   name="Shares"   stackId="a" fill={C_NEW.teal}   barSize={12} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>
            Average cumulative engagement growth by content type (t = 0 to 72)
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#888" }} label={{ value: "Time step (t)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#999" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                {Object.keys(GROWTH_CURVES).map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} dot={false}
                    stroke={PT_COLORS[i % PT_COLORS.length]}
                    strokeWidth={i < 3 ? 2 : 1.5}
                    strokeDasharray={i >= 5 ? "4 2" : undefined} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
            Growth is front-loaded: ~75% of final engagement is captured within the first 6 time steps
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Page followers vs avg final engagement per post" sub="Larger follower count does not guarantee proportionally higher engagement">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="followers" name="Followers (k)" type="number"
                tick={{ fontSize: 10, fill: "#888" }}
                label={{ value: "Followers (k)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#999" }} />
              <YAxis dataKey="avgEng" name="Avg engagement"
                tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip {...tt} cursor={{ stroke: "rgba(0,0,0,0.08)" }}
                content={({ payload }: any) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ ...tt.contentStyle, padding: "8px 12px" }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: "#666" }}>Followers: {fmtK(d.followers * 1000)}</div>
                      <div style={{ color: "#666" }}>Avg eng: {fmt(d.avgEng, 1)}</div>
                    </div>
                  );
                }} />
              <Scatter data={followerScatter} fill={C_NEW.purple} opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Page follower count" sub="Followers at time of data collection">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...PAGE_DATA].sort((a,b) => b.followers - a.followers)} layout="vertical"
              margin={{ left: 80, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#888" }} width={78} />
              <Tooltip {...tt} formatter={(v: any) => [v.toLocaleString(), "Followers"]} />
              <Bar dataKey="followers" fill={C_NEW.amber} radius={[0, 3, 3, 0]} barSize={9}>
                {PAGE_DATA.map((_, i) => <Cell key={i} fill={i === 0 ? C_NEW.amber : "rgba(186,117,23,0.55)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>



      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>
          Content type engagement breakdown (avg at t = 72)
        </div>
        <Table
          headers={["Content type", "Posts", "Avg likes", "Avg comments", "Avg shares", "Avg total"]}
          rows={[...POST_TYPE_DATA].sort((a,b) => b.avgEng - a.avgEng).map((p, i) => [
            <span style={{ fontWeight: 500 }}>{p.type}</span>,
            p.count,
            fmt(p.likes, 1),
            fmt(p.comments, 1),
            fmt(p.shares, 1),
            <MiniBar value={p.avgEng} max={724.6} color={PT_COLORS[i]} />,
          ])}
        />
      </div>
    </div>
  );
}

function ModelPerformanceSection() {
  return (
    <div>
      <SectionLabel>Model performance</SectionLabel>
      <SectionTitle>Global fit diagnostics</SectionTitle>
      <SectionSub>Time-decaying SIR fitted across all 228 posts — R², MAE, and RMSE distributions</SectionSub>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Total posts modeled" value="228"   sub="17 unique pages" />
        <MetricCard label="Mean R² fit score"   value="0.945" sub="Range: 0.813 – 0.967" />
        <MetricCard label="Median beta₀"        value="1.274" sub="Initial transmission rate" />
        <MetricCard label="Median R₀"           value="0.947" sub="Basic reproduction number" />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="R² score distribution" sub="Most posts achieve excellent fit (R² > 0.94)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SIR_R2_HIST} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
              <XAxis dataKey="bin" tick={{ fontSize: 9, fill: "#888" }} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip {...tt} formatter={(v: any) => [v, "Posts"]} />
              <Bar dataKey="count" fill={C_NEW.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="MAE vs RMSE per post" sub="Points above the diagonal indicate variance-heavy outliers">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="mae"  name="MAE"  type="number" tick={{ fontSize: 10, fill: "#888" }}
                label={{ value: "MAE", position: "insideBottom", offset: -2, fontSize: 11, fill: "#999" }} />
              <YAxis dataKey="rmse" name="RMSE" type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip {...tt} formatter={(v: any, n: any) => [fmt(v, 2), n]} />
              <Scatter data={MAE_RMSE_SCATTER.filter(d => d.mae <= 22)} fill={C_NEW.purple} opacity={0.65} />
              <ReferenceLine segment={[{x:0,y:0},{x:22,y:22}]} stroke={C_NEW.coral} strokeDasharray="4 3" strokeWidth={1.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function PageAnalysisSection() {
  const maxCap = Math.max(...PAGE_DATA.map(p => p.capacity));

  return (
    <div>
      <SectionLabel>Page-level analysis</SectionLabel>
      <SectionTitle>Channel performance</SectionTitle>
      <SectionSub>Aggregated SIR parameters and fit quality per UST-affiliated Facebook page</SectionSub>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>
          Average R² by page
        </div>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...PAGE_DATA].sort((a,b) => b.r2 - a.r2)} layout="vertical"
              margin={{ left: 90, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" domain={[0.90, 0.97]} tickFormatter={v => v.toFixed(3)}
                tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#888" }} width={88} />
              <Tooltip {...tt} formatter={(v: any) => [v.toFixed(4), "Avg R²"]} />
              <ReferenceLine x={0.945} stroke={C_NEW.coral} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "mean", position: "top", fontSize: 10, fill: C_NEW.coral }} />
              <Bar dataKey="r2" radius={[0, 3, 3, 0]} barSize={11}>
                {[...PAGE_DATA].sort((a,b) => b.r2 - a.r2).map((p, i) => (
                  <Cell key={i} fill={p.r2 >= 0.95 ? C_NEW.teal : p.r2 >= 0.93 ? C_NEW.blue : C_NEW.gray} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>
          Page metrics table
        </div>
        <Table
          headers={["Page", "Posts", "Avg R²", "Avg β₀", "Avg k<sub>decay</sub>", "Avg capacity", "Fit quality"]}
          rows={[...PAGE_DATA].sort((a,b) => b.posts - a.posts).map(p => [
            <span style={{ fontWeight: 500 }}>{p.name}</span>,
            p.posts,
            p.r2.toFixed(4),
            p.beta0.toFixed(3),
            p.kdecay.toFixed(3),
            <MiniBar value={p.capacity} max={maxCap} color={C_NEW.blue} />,
            p.r2 >= 0.95 ? <Badge variant="good">Excellent</Badge>
              : p.r2 >= 0.93 ? <Badge variant="mid">Good</Badge>
              : <Badge variant="low">Fair</Badge>,
          ])}
        />
      </div>
    </div>
  );
}

function PostTypeSection() {
  return (
    <div>
      <SectionLabel>Post type analysis</SectionLabel>
      <SectionTitle>SIR parameter breakdown by content type</SectionTitle>
      <SectionSub>Posts with R² &gt; 0 — viral threshold at R₀ = 1 (dashed line)</SectionSub>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Mean R₀ by content type" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.r0 - a.r0)} layout="vertical"
              margin={{ left: 96, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} formatter={(v: any) => [fmt(v, 2), "Mean R₀"]} />
              <ReferenceLine x={1} stroke={C_NEW.coral} strokeDasharray="4 3" strokeWidth={1.5} />
              <Bar dataKey="r0" radius={[0, 3, 3, 0]} barSize={12}>
                {[...POST_TYPE_DATA].sort((a,b) => b.r0 - a.r0).map((p, i) => (
                  <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg beta₀ (initial transmission rate)" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.beta0 - a.beta0)} layout="vertical"
              margin={{ left: 96, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} formatter={(v: any) => [fmt(v, 3), "Avg β₀"]} />
              <Bar dataKey="beta0" radius={[0, 3, 3, 0]} barSize={12}>
                {[...POST_TYPE_DATA].sort((a,b) => b.beta0 - a.beta0).map((p, i) => (
                  <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <ChartCard title="Avg gamma — removal / recovery rate" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.gamma - a.gamma)} layout="vertical"
              margin={{ left: 96, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} formatter={(v: any) => [fmt(v, 3), "Avg γ"]} />
              <Bar dataKey="gamma" radius={[0, 3, 3, 0]} barSize={12}>
                {[...POST_TYPE_DATA].sort((a,b) => b.gamma - a.gamma).map((p, i) => (
                  <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg k_decay — time decay coefficient" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...POST_TYPE_DATA].sort((a,b) => b.kdecay - a.kdecay)} layout="vertical"
              margin={{ left: 96, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize: 10, fill: "#888" }} width={94} />
              <Tooltip {...tt} formatter={(v: any) => [fmt(v, 3), "Avg k_decay"]} />
              <Bar dataKey="kdecay" radius={[0, 3, 3, 0]} barSize={12}>
                {[...POST_TYPE_DATA].sort((a,b) => b.kdecay - a.kdecay).map((p, i) => (
                  <Cell key={i} fill={PT_COLORS[i % PT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 14 }}>
          Parameter comparison by content type
        </div>
        <Table
          headers={["Content type", "Count", "Mean R₀", "Viral (R₀ &gt; 1)", "Mean β₀", "Mean γ", "Mean k<sub>decay</sub>"]}
          rows={POST_TYPE_DATA.map(p => [
            <span style={{ fontWeight: 500 }}>{p.type}</span>,
            p.count,
            fmt(p.r0, 2),
            p.r0 > 1 ? <Badge variant="good">Yes</Badge> : <Badge variant="low">No</Badge>,
            fmt(p.beta0, 3),
            fmt(p.gamma, 3),
            fmt(p.kdecay, 3),
          ])}
        />
      </div>
    </div>
  );
}

const TABS = [
  { id: "eda",   label: "Raw data EDA" },
  { id: "model", label: "Model performance" },
  { id: "pages", label: "Page analysis" },
  { id: "types", label: "Post types" },
];

function ResultsDashboard() {
  const [tab, setTab] = useState("eda");

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 28, gap: 4 }}>
        {TABS.map(t => (
          <NavTab key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {tab === "eda"   && <RawEDASection />}
      {tab === "model" && <ModelPerformanceSection />}
      {tab === "pages" && <PageAnalysisSection />}
      {tab === "types" && <PostTypeSection />}
    </div>
  );
}


export function Dashboard() {
  const [beta, setBeta] = useState<number>(0.25);
  const [gamma, setGamma] = useState<number>(0.10);
  const [N, setN] = useState<number>(10000);
  const [I0, setI0] = useState<number>(10);
  const [days, setDays] = useState<number>(160);
  const [activeTab, setActiveTab] = useState("visualizer");
  const [sirCsv, setSirCsv] = useState<string>("");
  const [metaCsv, setMetaCsv] = useState<string>("");

  // Fetch CSV data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sirRes, metaRes] = await Promise.all([
          fetch("/sir_fitted_values.csv"),
          fetch("/classified_posts.csv"),
        ]);
        const [sirText, metaText] = await Promise.all([
          sirRes.text(),
          metaRes.text(),
        ]);
        setSirCsv(sirText);
        setMetaCsv(metaText);
      } catch (error) {
        console.error("Failed to load CSV data:", error);
      }
    };
    fetchData();
  }, []);

  const yAxisFormatter = (v: number): string => {
    return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  };

  const data = runSIR(N, I0, beta, gamma, days);
  const r0 = beta / gamma;
  const peakI = Math.max(...data.map(d => d.I));
  const peakDay = data.findIndex(d => d.I === peakI);
  const finalR = data[data.length - 1].R;
  const attack = ((finalR / N) * 100).toFixed(1);
  const isEpidemic = r0 > 1;

  return (
    <main style={{ background: "#ffffff", color: "#1a1a18", fontFamily: "system-ui, sans-serif", minHeight: "100vh", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Navigation Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { id: "visualizer", label: "SIR Visualizer", color: BLUE },
            { id: "graphs", label: "SIR Graphs", color: PURPLE },
            { id: "results", label: "Results Dashboards", color: GREEN }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveTab(btn.id)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                background: activeTab === btn.id ? btn.color : "#f5f4f0",
                color: activeTab === btn.id ? "#fff" : "#1a1a18",
                transition: "all 0.2s"
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* SIR Visualizer Tab */}
        {activeTab === "visualizer" && (
          <div style={{ background: "#f9f8f5", borderRadius: 12, padding: "2rem 1.5rem" }}>
            
            {/* R0 Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#6b6a66" }}>Basic reproduction number R₀ =</span>
              <strong style={{ fontSize: 18, color: "#1a1a18" }}>{r0.toFixed(2)}</strong>
              <span style={{
                padding: "4px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                background: isEpidemic ? "#FAECE7" : "#EAF3DE",
                color: isEpidemic ? "#993C1D" : "#3B6D11",
              }}>
                {isEpidemic ? "Epidemic likely" : "Contained"}
              </span>
            </div>

            {/* Controls Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Slider label="Transmission rate (β)" id="beta" min={0.01} max={1.0} step={0.01} value={beta} onChange={setBeta} format={(v: number) => v.toFixed(2)} />
                <Slider label="Recovery rate (γ)" id="gamma" min={0.01} max={0.5} step={0.01} value={gamma} onChange={setGamma} format={(v: number) => v.toFixed(2)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Slider label="Population (N)" id="pop" min={100} max={100000} step={100} value={N} onChange={(v: number) => setN(Math.round(v))} format={(v: number) => v.toLocaleString()} />
                <Slider label="Initial infected (I₀)" id="i0" min={1} max={500} step={1} value={I0} onChange={(v: number) => setI0(Math.round(v))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Slider label="Duration (days)" id="days" min={30} max={500} step={10} value={days} onChange={(v: number) => setDays(Math.round(v))} />
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: "2rem" }}>
              <StatCard label="Peak infected" value={Math.round(peakI).toLocaleString()} color={CORAL} />
              <StatCard label="Peak day" value={`Day ${peakDay}`} color="#1a1a18" />
              <StatCard label="Total recovered" value={Math.round(finalR).toLocaleString()} color={GREEN} />
              <StatCard label="Attack rate" value={`${attack}%`} color="#1a1a18" />
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#888" }}
                    label={{ value: "Days", position: "insideBottom", offset: -4, fontSize: 12, fill: "#888" }}
                    tickCount={8}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickFormatter={yAxisFormatter}
                    label={{ value: "People", angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "#888" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="S" name="Susceptible" stroke={BLUE} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="I" name="Infected" stroke={CORAL} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="R" name="Recovered" stroke={GREEN} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6b6a66", flexWrap: "wrap" }}>
              {[["Susceptible", BLUE], ["Infected", CORAL], ["Recovered", GREEN]].map(([label, color]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 24, height: 3, background: color, display: "inline-block", borderRadius: 2 }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SIR Graphs Tab */}
        {activeTab === "graphs" && (
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", minHeight: "60vh" }}>
            {sirCsv && metaCsv ? (
              <SIRGraphs sirCsv={sirCsv} metaCsv={metaCsv} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#6b6a66", fontSize: 14 }}>
                <span>Loading SIR graph data...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div style={{ background: "#ffffff", borderRadius: 12, padding: "2rem 1.5rem", minHeight: "70vh" }}>
            <ResultsDashboard />
          </div>
        )}

      </div>
    </main>
  );
}
