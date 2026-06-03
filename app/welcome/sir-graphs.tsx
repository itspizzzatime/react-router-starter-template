import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const C = {
  blue:   "#378ADD",
  coral:  "#D85A30",
  green:  "#639922",
  purple: "#7F77DD",
  amber:  "#EF9F27",
  border: "rgba(0,0,0,0.1)",
  muted:  "#888",
};

function parseSIR(text: string) {
  if (!text || !text.trim()) return {};
  try {
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    const map: any = {};
    if (!Array.isArray(data)) return map;
    for (const row of data) {
      if (!row || !row.post_id) continue;
      const id = String(row.post_id);
      if (!map[id]) map[id] = [];
      map[id].push({
        t:     row.t || 0,
        R_obs: row.R_obs || 0,
        R_fit: parseFloat((row.R_fit ?? 0).toFixed(2)),
        I_fit: parseFloat((row.I_fit ?? 0).toFixed(4)),
        S_fit: parseFloat((row.S_fit ?? 0).toFixed(2)),
      });
    }
    for (const id of Object.keys(map)) map[id].sort((a: any, b: any) => a.t - b.t);
    return map;
  } catch (err) {
    console.error("Error parsing SIR CSV:", err);
    return {};
  }
}

function parseMeta(text: string) {
  if (!text || !text.trim()) return {};
  try {
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    const map: any = {};
    if (!Array.isArray(data)) return map;
    for (const row of data) {
      if (!row || !row.post_id) continue;
      const id = String(row.post_id);
      if (!map[id]) {
        map[id] = {
          pageName:    row["Page Name"]      || "",
          pageUrl:     row["Page URL"]       || "",
          permalink:   row["Permalink"]      || "",
          caption:     row["Caption / Message"] || "",
          publishedAt: row["Published At"]   || "",
          followers:   row["PageFollower"]   || 0,
          likes:       row["Likes"]          || 0,
          comments:    row["Comments"]      || 0,
          shares:      row["Shares"]        || 0,
        };
      }
    }
    return map;
  } catch (err) {
    console.error("Error parsing meta CSV:", err);
    return {};
  }
}

function embedUrl(permalink: string) {
  if (!permalink) return null;
  const encoded = encodeURIComponent(permalink);
  return `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=500`;
}

function Stat({ label, value, color }: any) {
  return (
    <div style={{
      background: "#f5f4f0", borderRadius: 8, padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 3, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, color: color || "#1a1a18" }}>{value}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ marginBottom: 4, color: C.muted }}>Hour {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, display: "flex", gap: 12, justifyContent: "space-between" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 500 }}>{typeof p.value === "number" ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Chart({ title, series, lines, height = 210 }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: C.muted }}>{title}</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={series} margin={{ top: 4, right: 12, bottom: 12, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" />
          <XAxis dataKey="t" tick={{ fontSize: 11, fill: C.muted }} label={{ value: "Hours", position: "insideBottom", offset: -4, fontSize: 11, fill: C.muted }} />
          <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={(v: number): string => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l: any) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name}
              stroke={l.color} dot={l.dot ?? false} strokeWidth={l.width ?? 2}
              strokeDasharray={l.dash} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PostCard({ meta }: any) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const iframeRef = useRef(null);
  const url = embedUrl(meta.permalink);

  useEffect(() => { setEmbedFailed(false); setShowCaption(false); }, [meta.permalink]);

  const isReel = meta.permalink?.includes("/reel/");

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, padding: "16px 18px", marginBottom: 24, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 600, color: "#185FA5", flexShrink: 0,
        }}>
          {meta.pageName?.[0]?.toUpperCase() || "F"}
        </div>
        <div style={{ minWidth: 0 }}>
          <a href={meta.pageUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: "#185FA5", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {meta.pageName}
          </a>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {meta.publishedAt ? new Date(meta.publishedAt).toLocaleString() : ""}
            {meta.followers ? ` · ${Number(meta.followers).toLocaleString()} followers` : ""}
          </div>
        </div>
        <a href={meta.permalink} target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: C.blue, display: "flex", alignItems: "center", gap: 4, textDecoration: "none", flexShrink: 0, transition: "color 0.2s" }}
          onMouseEnter={(e: any) => e.target.style.color = "#185FA5"}
          onMouseLeave={(e: any) => e.target.style.color = C.blue}
        >
          View post
        </a>
      </div>


      {!embedFailed && url && !isReel ? (
        <div style={{ borderRadius: 10, overflow: "hidden", background: "#fff", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <iframe
            ref={iframeRef}
            src={url}
            width="100%"
            height="650"
            style={{ border: "none", display: "block" }}
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onError={() => setEmbedFailed(true)}
            title="Facebook post embed"
          />
        </div>
      ) : (
        <div style={{ background: "#fbfaf9", borderRadius: 10, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
          {isReel && (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              ⓘ This post is a Facebook Reel — embeds are not supported.
            </div>
          )}
          <button onClick={() => setShowCaption(v => !v)}
            style={{ fontSize: 13, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 500, transition: "color 0.2s" }}
            onMouseEnter={(e: any) => e.target.style.color = "#185FA5"}
            onMouseLeave={(e: any) => e.target.style.color = C.blue}
          >
            {showCaption ? "▼" : "▶"} {showCaption ? "Hide caption" : "Show caption"}
          </button>
          {showCaption && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#2a2a28", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: 300, overflowY: "auto", background: "#fbfaf9", padding: "10px 12px", borderRadius: 6 }}>
              {meta.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SIRGraphs({ sirCsv, metaCsv }: any) {
  const [sirData, setSirData] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // Load CSVs on mount
  useEffect(() => {
    if (!sirCsv || !metaCsv) return;
    
    try {
      const parsed = parseSIR(sirCsv);
      setSirData(parsed);
      const postIds = Object.keys(parsed);
      if (postIds.length > 0) {
        setSelected(postIds[0]);
      } else {
        setError("No valid SIR data found in CSV");
      }
    } catch (err: any) {
      setError("SIR CSV error: " + (err.message || String(err)));
    }
    
    try {
      const meta = parseMeta(metaCsv);
      setMetaData(meta);
    } catch (err: any) {
      setError((prev: any) => (prev ? prev + "; " : "") + "Meta CSV error: " + (err.message || String(err)));
    }
  }, [sirCsv, metaCsv]);

  const postIds = useMemo(() => {
    if (!sirData) return [];
    let ids = Object.keys(sirData);
    if (!search.trim()) {
      // Shuffle the array for randomized sequence on every load
      ids = ids.sort(() => Math.random() - 0.5);
      return ids;
    }
    const q = search.toLowerCase();
    return ids.filter(id => {
      if (id.toLowerCase().includes(q)) return true;
      const m = metaData?.[id];
      return m && (m.pageName.toLowerCase().includes(q) || m.caption.toLowerCase().includes(q));
    });
  }, [sirData, metaData, search]);

  const handleRandomize = useCallback(() => {
    if (postIds.length > 0) {
      const randomId = postIds[Math.floor(Math.random() * postIds.length)];
      setSelected(randomId);
    }
  }, [postIds]);

  const series = selected && sirData ? sirData[selected] : null;
  const meta = selected && metaData ? metaData[selected] : null;

  const stats = useMemo(() => {
    if (!series?.length) return null;
    const peakI = Math.max(...series.map((d: any) => d.I_fit));
    const peakDay = series.find((d: any) => d.I_fit === peakI)?.t ?? "—";
    const finalR = series[series.length - 1].R_fit;
    const finalObs = series[series.length - 1].R_obs;
    const N = series[0].S_fit + series[0].I_fit + (series[0].R_fit || 0);
    const maxRes = Math.max(...series.map((d: any) => Math.abs(d.R_obs - d.R_fit)));
    const attackRate = ((finalR / N) * 100).toFixed(1);
    return { peakI, peakDay, finalR, finalObs, N: Math.round(N), maxRes, attackRate };
  }, [series]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: 600, overflow: "hidden", color: "#1a1a18" }}>
      {/* Sidebar */}
      <div style={{ width: 280, flexShrink: 0, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", background: "#fafaf8" }}>
        <div style={{ padding: "14px 12px 10px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a18" }}>Posts</div>
            <button onClick={handleRandomize}
              disabled={!postIds || postIds.length === 0}
              style={{
                fontSize: 11, fontWeight: 500, padding: "4px 8px", border: `0.5px solid ${C.blue}`,
                borderRadius: 4, background: "#E6F1FB", color: C.blue, cursor: "pointer",
                transition: "all 0.2s", opacity: !postIds || postIds.length === 0 ? 0.5 : 1,
              }}
              onMouseEnter={(e: any) => e.target.style.background = "#D0E5F7"}
              onMouseLeave={(e: any) => e.target.style.background = "#E6F1FB"}
            >
              Random Post
            </button>
          </div>
          {sirData && (
            <input type="search" placeholder="Search page, caption…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", fontSize: 12, padding: "7px 10px", border: `0.5px solid ${C.border}`, borderRadius: 5, background: "#fff" }} />
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {error && <div style={{ padding: "12px 12px", fontSize: 11, color: "#B23C1D", background: "#FEE5E0", borderRadius: 4, margin: "8px 8px 0" }}>{error}</div>}
          {!sirData && (
            <div style={{ padding: "20px 12px", fontSize: 12, color: C.muted, lineHeight: 1.7, textAlign: "center" }}>
              Loading posts…
            </div>
          )}
          {postIds.map(id => {
            const m = metaData?.[id];
            const isActive = selected === id;
            const displayText = m?.pageName ? `${m.pageName}` : id;
            const captionPreview = m?.caption ? m.caption.substring(0, 70) : id;
            return (
              <button key={id} onClick={() => setSelected(id)} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "12px 12px", fontSize: 12, border: "none", cursor: "pointer",
                background: isActive ? "#E6F1FB" : "transparent",
                color: isActive ? "#185FA5" : "#555",
                fontWeight: isActive ? 500 : 400,
                borderLeft: isActive ? `3px solid ${C.blue}` : "3px solid transparent",
                transition: "background 0.15s",
                margin: "0 6px",
                borderRadius: "0 4px 4px 0",
              }}
              onMouseEnter={(e: any) => {
                if (!isActive) e.target.style.background = "#f0ede9";
              }}
              onMouseLeave={(e: any) => {
                if (!isActive) e.target.style.background = "transparent";
              }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, fontSize: 13 }}>
                  {displayText}
                </div>
                <div style={{ fontSize: 11, color: isActive ? "#555" : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2, fontWeight: 400 }}>
                  {captionPreview}
                </div>
              </button>
            );
          })}
          {sirData && postIds.length === 0 && <div style={{ padding: "16px 12px", fontSize: 12, color: C.muted, textAlign: "center" }}>No matches found.</div>}
        </div>

        {sirData && (
          <div style={{ padding: "8px 12px", borderTop: `0.5px solid ${C.border}`, fontSize: 11, color: C.muted, textAlign: "center", background: "#fbfaf9" }}>
            {postIds.length} of {Object.keys(sirData).length} posts
          </div>
        )}
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
        {!series ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.muted }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>👈 Select a post to analyze</span>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {meta && <PostCard meta={meta} />}

            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
                <Stat label="Population (N)" value={stats.N.toLocaleString()} color="#1a1a18" />
                <Stat label="Peak infected" value={stats.peakI.toFixed(1)} color={C.coral} />
                <Stat label="Peak hour" value={`Hour ${stats.peakDay}`} color="#1a1a18" />
                <Stat label="Total recovered" value={stats.finalR.toFixed(0)} color={C.green} />
                <Stat label="Attack rate" value={`${stats.attackRate}%`} color={C.blue} />
                <Stat label="Max |residual|" value={stats.maxRes.toFixed(2)} color={C.amber} />
              </div>
            )}

            <div style={{ marginBottom: 4, paddingBottom: 20, borderBottom: `0.5px solid ${C.border}` }}>
              <Chart title="Combined — S, I, R (fitted) + R observed" series={series} height={260} lines={[
                { key: "S_fit", name: "S fitted", color: C.green },
                { key: "I_fit", name: "I fitted", color: C.coral },
                { key: "R_fit", name: "R fitted", color: C.blue },
                { key: "R_obs", name: "R observed", color: C.purple, dot: { r: 2 }, width: 1.5, dash: "4 3" },
              ]} />
            </div>

            <Chart title="Recovered — observed vs fitted" series={series} lines={[
              { key: "R_obs", name: "R observed", color: C.purple, dot: { r: 2 }, width: 1.5 },
              { key: "R_fit", name: "R fitted", color: C.blue },
            ]} />
            <Chart title="Infected — fitted curve" series={series} lines={[
              { key: "I_fit", name: "I fitted", color: C.coral },
            ]} />
            <Chart title="Susceptible — fitted curve" series={series} lines={[
              { key: "S_fit", name: "S fitted", color: C.green },
            ]} />
          </div>
        )}
      </div>
    </div>
  );
}