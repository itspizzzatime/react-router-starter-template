import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

export function Dashboard() {
  const [beta, setBeta] = useState<number>(0.25);
  const [gamma, setGamma] = useState<number>(0.10);
  const [N, setN] = useState<number>(10000);
  const [I0, setI0] = useState<number>(10);
  const [days, setDays] = useState<number>(160);
  const [activeTab, setActiveTab] = useState("visualizer");

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
        
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 0.5rem 0", color: "#1a1a18" }}>
            SIR Epidemic Model Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#6b6a66", margin: 0 }}>
            Interactive visualization and simulation tools
          </p>
        </header>

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
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()}
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

        {/* Placeholder for other tabs */}
        {activeTab !== "visualizer" && (
          <div style={{ background: "#f9f8f5", borderRadius: 12, padding: "3rem 1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#6b6a66", margin: 0 }}>
              {activeTab === "graphs" ? "SIR Graphs" : "Results Dashboards"} coming soon!
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
