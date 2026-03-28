import { useState, useMemo, useRef, useCallback } from "react";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const WORK_TYPES = {
  dev:      { label: "Development",  costRate: 360, icon: "⚡" },
  ops:      { label: "Operations",   costRate: 400, icon: "📋" },
  design:   { label: "Design",       costRate: 300, icon: "🎨" },
  strategy: { label: "Strategy",     costRate: 800, icon: "🧭" },
};

const MARKET      = { india: { label: "India", flag: "🇮🇳", mult: 1.0 }, gulf: { label: "Gulf", flag: "🇸🇦", mult: 1.8 } };
const CLIENT_TYPE = { family: { label: "Family Biz", mult: 1.0 }, sme: { label: "SME", mult: 1.1 }, mid: { label: "Mid-Market", mult: 1.25 }, group: { label: "Corp / Group", mult: 1.5 } };
const URGENCY     = { relaxed: { label: "Relaxed", mult: 0.9 }, normal: { label: "Normal", mult: 1.0 }, tight: { label: "Tight", mult: 1.2 }, fire: { label: "Urgent", mult: 1.4 } };
const IMPACT      = { operational: { label: "Ops Efficiency", mult: 1.0 }, revenue: { label: "Revenue Unlock", mult: 1.2 }, strategic: { label: "Strategic", mult: 1.4 } };
const MODEL_OPTS  = { fixed: { label: "🎯 Fixed", d: "One number" }, phased: { label: "📐 Phased", d: "50/50 split" }, retainer: { label: "🔄 Retainer", d: "Monthly" } };

const hrsToDays = (h) => {
  if (h <= 0) return "—";
  const d = +(h / 8).toFixed(1);
  const w = +(h / 40).toFixed(1);
  if (h < 40) return `${d}d`;
  return `${w}wk (${d}d)`;
};

// ── UI ──
function Pill({ active, onClick, children, sub }) {
  return (
    <div onClick={onClick} style={{
      padding: "8px 13px", borderRadius: 7, cursor: "pointer", transition: "all 0.15s",
      border: `1.5px solid ${active ? "#C9F76F" : "#232325"}`, background: active ? "#C9F76F08" : "#111113",
      flex: "1 1 0", minWidth: 60,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#C9F76F" : "#888" }}>{children}</div>
      {sub && <div style={{ fontSize: 9, color: active ? "#8AB34A" : "#444", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function Card({ children, style }) { return <div style={{ background: "#111113", border: "1px solid #1E1E20", borderRadius: 11, padding: 20, marginBottom: 14, ...style }}>{children}</div>; }
function Lbl({ children }) { return <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 2, color: "#C9F76F", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>; }

// ══════════════════
// JPEG GENERATION
// ══════════════════
function generateQuoteJPEG({ calc, client, project, prepBy, isQuick, desc, marginX, market, clientType, urgency, impact, adjMult, model, retainerMonths, retainerMo }) {
  const W = 800, pad = 40;
  const lines = calc.lines;
  const lineCount = lines.length;
  const H = 580 + lineCount * 50;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // BG
  ctx.fillStyle = "#0C0C0E";
  ctx.fillRect(0, 0, W, H);

  // Helpers
  const mono = (s) => `${s}px 'Courier New', monospace`;
  const sans = (s, w = "normal") => `${w} ${s}px 'Segoe UI', 'Helvetica Neue', sans-serif`;
  const drawLine = (y, color = "#1E1E20") => { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); };
  const rightText = (text, y, font, color) => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "right"; ctx.fillText(text, W - pad, y); ctx.textAlign = "left"; };

  let y = pad + 10;

  // Header
  ctx.font = mono(10);
  ctx.fillStyle = "#C9F76F";
  ctx.letterSpacing = "3px";
  ctx.fillText("EMILDA & CO.", pad, y);
  ctx.letterSpacing = "0px";

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  rightText(today, y, mono(10), "#666");
  y += 18;

  ctx.font = mono(9);
  ctx.fillStyle = "#666";
  ctx.fillText(isQuick ? "SCOPE CHANGE / TASK QUOTE" : "PROJECT QUOTE", pad, y);
  if (prepBy) rightText(`Prepared by: ${prepBy}`, y, mono(9), "#555");
  y += 28;

  drawLine(y);
  y += 24;

  // Client & project
  ctx.font = sans(18, "bold");
  ctx.fillStyle = "#E8E6E3";
  ctx.fillText(client || "—", pad, y);
  y += 22;
  ctx.font = sans(13);
  ctx.fillStyle = "#888";
  ctx.fillText(isQuick ? (desc || "—") : (project || "—"), pad, y);
  y += 30;

  drawLine(y);
  y += 20;

  // Column headers
  ctx.font = mono(8);
  ctx.fillStyle = "#555";
  ctx.fillText("WORK TYPE", pad, y);
  rightText("AMOUNT", y, mono(8), "#555");
  ctx.textAlign = "left";
  ctx.fillText("HOURS", pad + 260, y);
  ctx.fillText("DURATION", pad + 340, y);
  ctx.fillText("RATE", pad + 440, y);
  y += 8;
  drawLine(y);
  y += 22;

  // Line items
  lines.forEach(l => {
    ctx.font = sans(13, "bold");
    ctx.fillStyle = "#E8E6E3";
    ctx.fillText(`${l.icon}  ${l.label}`, pad, y);

    ctx.font = mono(11);
    ctx.fillStyle = "#999";
    ctx.fillText(`${l.hours}h`, pad + 260, y);
    ctx.fillText(l.duration, pad + 340, y);
    ctx.fillText(`₹${l.effRate}/hr`, pad + 440, y);

    rightText(formatINR(l.price), y, mono(12), "#E8E6E3");

    y += 16;
    ctx.font = mono(9);
    ctx.fillStyle = "#444";
    ctx.fillText(`Cost ₹${l.costRate}/hr × ${marginX}× margin × ${adjMult.toFixed(2)}× adj = ₹${l.effRate}/hr`, pad + 26, y);
    y += 22;
    drawLine(y, "#131315");
    y += 14;
  });

  y += 6;

  // TOTAL BOX
  ctx.fillStyle = "#151815";
  const boxH = model === "phased" ? 70 : model === "retainer" ? 70 : 55;
  ctx.beginPath();
  ctx.roundRect(pad, y, W - pad * 2, boxH, 8);
  ctx.fill();
  ctx.strokeStyle = "#C9F76F25";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pad, y, W - pad * 2, boxH, 8);
  ctx.stroke();

  const boxPad = pad + 16;
  y += 22;
  ctx.font = mono(9);
  ctx.fillStyle = "#8AB34A";
  const modelLabel = model === "fixed" ? "TOTAL (FIXED PRICE)" : model === "phased" ? "TOTAL (PHASED — 50% ADVANCE, 50% DELIVERY)" : "TOTAL";
  ctx.fillText(modelLabel, boxPad, y);
  rightText(formatINR(calc.totalPrice), y + 8, `bold ${mono(24)}`, "#C9F76F");

  if (model === "retainer") {
    y += 20;
    ctx.font = mono(10);
    ctx.fillStyle = "#888";
    ctx.fillText(`${formatINR(retainerMo)}/mo × ${retainerMonths} months`, boxPad, y);
  }
  if (model === "phased") {
    y += 20;
    ctx.font = mono(10);
    ctx.fillStyle = "#888";
    const half = Math.round(calc.totalPrice / 2);
    ctx.fillText(`Advance: ${formatINR(half)}  ·  On delivery: ${formatINR(calc.totalPrice - half)}`, boxPad, y);
  }

  y += boxH - 10;

  // SETTINGS SUMMARY
  y += 20;
  drawLine(y);
  y += 20;

  ctx.font = mono(8);
  ctx.fillStyle = "#555";
  ctx.fillText("PRICING SETTINGS", pad, y);
  y += 18;

  const settingsCol1 = [
    { l: "Market", v: `${MARKET[market].flag} ${MARKET[market].label}${MARKET[market].mult > 1 ? ` (×${MARKET[market].mult})` : ""}` },
    { l: "Client Type", v: `${CLIENT_TYPE[clientType].label}${CLIENT_TYPE[clientType].mult > 1 ? ` (×${CLIENT_TYPE[clientType].mult})` : ""}` },
    { l: "Urgency", v: `${URGENCY[urgency].label}${URGENCY[urgency].mult !== 1 ? ` (×${URGENCY[urgency].mult})` : ""}` },
    { l: "Impact", v: `${IMPACT[impact].label}${IMPACT[impact].mult > 1 ? ` (×${IMPACT[impact].mult})` : ""}` },
  ];
  const settingsCol2 = [
    { l: "Cost Markup", v: `${marginX}×`, color: "#C9F76F" },
    { l: "Value Adjustment", v: `${adjMult.toFixed(2)}×`, color: adjMult > 1 ? "#C9F76F" : "#888" },
    { l: "Total Multiplier", v: `${(marginX * adjMult).toFixed(2)}× cost`, color: "#C9F76F" },
    { l: "Gross Margin", v: `${calc.margin.toFixed(0)}%`, color: calc.margin >= 50 ? "#C9F76F" : calc.margin >= 35 ? "#A8D84E" : "#F7D76F" },
  ];

  settingsCol1.forEach((s, i) => {
    ctx.font = sans(11);
    ctx.fillStyle = "#555";
    ctx.fillText(s.l, pad, y + i * 20);
    ctx.fillStyle = "#CCC";
    ctx.fillText(s.v, pad + 120, y + i * 20);
  });
  settingsCol2.forEach((s, i) => {
    ctx.font = sans(11);
    ctx.fillStyle = "#555";
    ctx.fillText(s.l, pad + 380, y + i * 20);
    ctx.font = mono(11);
    ctx.fillStyle = s.color || "#CCC";
    ctx.fillText(s.v, pad + 520, y + i * 20);
  });

  y += 90;

  // Summary boxes
  const boxW = (W - pad * 2 - 30) / 4;
  [
    { l: "TOTAL HOURS", v: `${calc.totalHrs}h`, s: hrsToDays(calc.totalHrs) },
    { l: "AVG EFF. RATE", v: `₹${calc.avgEffRate}/hr`, s: null },
    { l: "YOUR COST", v: formatINR(calc.totalCost), s: null },
    { l: "GROSS PROFIT", v: formatINR(calc.totalPrice - calc.totalCost), s: `${calc.margin.toFixed(0)}% margin` },
  ].forEach((b, i) => {
    const bx = pad + i * (boxW + 10);
    ctx.fillStyle = "#0D0D0F";
    ctx.beginPath(); ctx.roundRect(bx, y, boxW, 55, 6); ctx.fill();
    ctx.font = mono(7);
    ctx.fillStyle = "#444";
    ctx.fillText(b.l, bx + 10, y + 16);
    ctx.font = mono(12);
    ctx.fillStyle = "#E8E6E3";
    ctx.fillText(b.v, bx + 10, y + 34);
    if (b.s) { ctx.font = mono(8); ctx.fillStyle = "#555"; ctx.fillText(b.s, bx + 10, y + 47); }
  });

  y += 72;

  // Footer
  ctx.font = mono(9);
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.fillText("emilda.co  ·  Chaos to Control", W / 2, y);
  ctx.textAlign = "left";

  // Export
  return canvas.toDataURL("image/jpeg", 0.95);
}

// ══════════════════
// MAIN APP
// ══════════════════
export default function App() {
  const [tab, setTab] = useState("project");
  const [market, setMarket] = useState("india");
  const [clientType, setClientType] = useState("family");
  const [urgency, setUrgency] = useState("normal");
  const [impact, setImpact] = useState("operational");
  const [model, setModel] = useState("fixed");
  const [marginX, setMarginX] = useState(2.5); // cost multiplier

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [pEnabled, setPEnabled] = useState({ dev: true, ops: false, design: false, strategy: false });
  const [pHours, setPHours] = useState({ dev: 60, ops: 0, design: 0, strategy: 0 });
  const [retainerMonths, setRetainerMonths] = useState(3);

  const [qClient, setQClient] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qPrepBy, setQPrepBy] = useState("");
  const [qEnabled, setQEnabled] = useState({ dev: true, ops: false, design: false, strategy: false });
  const [qHours, setQHours] = useState({ dev: 4, ops: 0, design: 0, strategy: 0 });

  const [quoteImg, setQuoteImg] = useState(null);

  const adjMult = useMemo(() =>
    MARKET[market].mult * CLIENT_TYPE[clientType].mult * URGENCY[urgency].mult * IMPACT[impact].mult
  , [market, clientType, urgency, impact]);

  const calcLines = useCallback((enabled, hours) => {
    const lines = [];
    let totalHrs = 0, totalCost = 0, totalPrice = 0;
    Object.entries(WORK_TYPES).forEach(([k, wt]) => {
      if (enabled[k] && hours[k] > 0) {
        const h = hours[k];
        const effRate = Math.round(wt.costRate * marginX * adjMult);
        const cost = wt.costRate * h;
        const price = effRate * h;
        lines.push({ key: k, ...wt, hours: h, effRate, cost, price, duration: hrsToDays(h) });
        totalHrs += h; totalCost += cost; totalPrice += price;
      }
    });
    totalPrice = Math.round(totalPrice / 500) * 500;
    const margin = totalCost > 0 ? ((totalPrice - totalCost) / totalPrice * 100) : 0;
    const multiple = totalCost > 0 ? totalPrice / totalCost : 0;
    const avgEffRate = totalHrs > 0 ? Math.round(totalPrice / totalHrs) : 0;
    return { lines, totalHrs, totalCost, totalPrice, margin, multiple, avgEffRate };
  }, [marginX, adjMult]);

  const pCalc = useMemo(() => calcLines(pEnabled, pHours), [pEnabled, pHours, calcLines]);
  const qCalc = useMemo(() => calcLines(qEnabled, qHours), [qEnabled, qHours, calcLines]);

  const toggleP = k => setPEnabled(p => ({ ...p, [k]: !p[k] }));
  const setHP = (k, v) => setPHours(p => ({ ...p, [k]: v }));
  const toggleQ = k => setQEnabled(p => ({ ...p, [k]: !p[k] }));
  const setHQ = (k, v) => setQHours(p => ({ ...p, [k]: v }));

  const retainerMo = pCalc.totalPrice > 0 ? Math.round(pCalc.totalPrice / retainerMonths / 500) * 500 : 0;
  const mColor = (m) => m >= 55 ? "#C9F76F" : m >= 40 ? "#A8D84E" : m >= 25 ? "#F7D76F" : "#F76F6F";

  const doGenerate = (calc, client, project, prepBy, isQuick, desc) => {
    const img = generateQuoteJPEG({ calc, client, project, prepBy, isQuick, desc, marginX, market, clientType, urgency, impact, adjMult, model, retainerMonths, retainerMo });
    setQuoteImg(img);
  };

  const downloadImg = () => {
    if (!quoteImg) return;
    const a = document.createElement("a");
    a.href = quoteImg;
    const name = tab === "project" ? (clientName || "quote") : (qClient || "task");
    a.download = `emilda-quote-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.jpg`;
    a.click();
  };

  // ── VALUE FACTORS ──
  const ValueFactors = () => (
    <Card>
      <Lbl>Value Adjustments</Lbl>
      <p style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>Adjust from baseline. India + Family + Normal + Ops = 1.0× (no change).</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Market</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(MARKET).map(([k, v]) => <Pill key={k} active={market === k} onClick={() => setMarket(k)} sub={v.mult > 1 ? `×${v.mult}` : "base"}>{v.flag} {v.label}</Pill>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Client</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(CLIENT_TYPE).map(([k, v]) => <Pill key={k} active={clientType === k} onClick={() => setClientType(k)} sub={v.mult > 1 ? `×${v.mult}` : "base"}>{v.label}</Pill>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Urgency</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(URGENCY).map(([k, v]) => <Pill key={k} active={urgency === k} onClick={() => setUrgency(k)} sub={v.mult !== 1 ? `×${v.mult}` : "base"}>{v.label}</Pill>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Impact</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(IMPACT).map(([k, v]) => <Pill key={k} active={impact === k} onClick={() => setImpact(k)} sub={v.mult > 1 ? `×${v.mult}` : "base"}>{v.label}</Pill>)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, padding: "7px 10px", background: adjMult === 1 ? "#1A1A1C" : "#C9F76F08", border: `1px solid ${adjMult === 1 ? "#232325" : "#C9F76F15"}`, borderRadius: 5, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: adjMult === 1 ? "#666" : "#8AB34A" }}>{adjMult === 1 ? "No adjustment" : "Adjustment applied"}</span>
        <span style={{ fontSize: 13, fontFamily: "var(--mono)", fontWeight: 700, color: adjMult === 1 ? "#888" : "#C9F76F" }}>{adjMult.toFixed(2)}×</span>
      </div>
    </Card>
  );

  // ── WORK LINES ──
  const WorkLines = ({ enabled, hours, onToggle, onHours, calc }) => (
    <Card>
      <Lbl>Work Breakdown</Lbl>
      <p style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>Toggle types, enter hours. Client rate = cost × {marginX}× margin{adjMult > 1 ? ` × ${adjMult.toFixed(2)}× adj` : ""}.</p>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 600 }}>
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px 70px 90px 95px", gap: 6, padding: "4px 0", borderBottom: "1px solid #1E1E20", fontSize: 8, fontFamily: "var(--mono)", color: "#444", letterSpacing: 1 }}>
            <div></div><div>TYPE</div><div style={{ textAlign: "right" }}>HOURS</div><div style={{ textAlign: "center" }}>DURATION</div><div style={{ textAlign: "right" }}>RATE</div><div style={{ textAlign: "right" }}>AMOUNT</div>
          </div>
          {Object.entries(WORK_TYPES).map(([k, wt]) => {
            const on = enabled[k], h = hours[k];
            const effRate = Math.round(wt.costRate * marginX * adjMult);
            return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px 70px 90px 95px", alignItems: "center", gap: 6, padding: "10px 0", borderBottom: "1px solid #161618", opacity: on ? 1 : 0.3 }}>
                <input type="checkbox" checked={on} onChange={() => onToggle(k)} style={{ accentColor: "#C9F76F", width: 15, height: 15, cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: on ? "#E8E6E3" : "#666" }}>{wt.icon} {wt.label}</div>
                  <div style={{ fontSize: 9, color: "#444" }}>Cost ₹{wt.costRate} → ₹{effRate}/hr</div>
                </div>
                <input type="number" min={0} max={2000} value={h || ""} placeholder="0" onChange={e => onHours(k, Math.max(0, Number(e.target.value)))} disabled={!on}
                  style={{ width: "100%", padding: "7px 6px", borderRadius: 5, border: "1px solid #232325", background: "#0D0D0F", color: "#E8E6E3", fontSize: 13, fontFamily: "var(--mono)", outline: "none", textAlign: "right" }} />
                <div style={{ fontSize: 10, color: "#666", textAlign: "center" }}>{on && h > 0 ? hrsToDays(h) : "—"}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#888", textAlign: "right" }}>₹{effRate}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: on && h > 0 ? "#C9F76F" : "#333", textAlign: "right" }}>{on && h > 0 ? formatINR(effRate * h) : "—"}</div>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px 70px 90px 95px", gap: 6, padding: "10px 0", fontWeight: 700, borderTop: "1px solid #232325" }}>
            <div></div><div style={{ color: "#888", fontSize: 12 }}>Total</div>
            <div style={{ fontFamily: "var(--mono)", textAlign: "right", fontSize: 12 }}>{calc.totalHrs}h</div>
            <div style={{ fontSize: 10, textAlign: "center", color: "#666" }}>{hrsToDays(calc.totalHrs)}</div>
            <div style={{ fontFamily: "var(--mono)", textAlign: "right", fontSize: 10, color: "#888" }}>avg ₹{calc.avgEffRate}</div>
            <div style={{ fontFamily: "var(--mono)", textAlign: "right", color: "#C9F76F", fontSize: 12 }}>{formatINR(calc.totalPrice)}</div>
          </div>
        </div>
      </div>
    </Card>
  );

  const tabs = [
    { k: "project", l: "Project Quote", icon: "📐" },
    { k: "quick", l: "Quick Task", icon: "⚡" },
    { k: "ratecard", l: "Rate Card", icon: "📊" },
  ];

  // ── QUOTE IMAGE VIEW ──
  if (quoteImg) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090B", color: "#E8E6E3", fontFamily: "'DM Sans', system-ui, sans-serif", "--mono": "'Space Mono', monospace", padding: 20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div style={{ maxWidth: 850, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setQuoteImg(null)} style={{ padding: "10px 16px", borderRadius: 7, border: "1.5px solid #232325", background: "transparent", color: "#888", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Back</button>
            <button onClick={downloadImg} style={{ padding: "10px 20px", borderRadius: 7, border: "none", background: "#C9F76F", color: "#09090B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Download JPEG</button>
          </div>
          <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Right-click or long-press to save/share. Or use the download button above.</p>
          <img src={quoteImg} alt="Quote" style={{ width: "100%", borderRadius: 10, border: "1px solid #1E1E20" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#E8E6E3", fontFamily: "'DM Sans', system-ui, sans-serif", "--mono": "'Space Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .inp { width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid #232325; background: #0D0D0F; color: #E8E6E3; font-size: 13px; font-family: inherit; outline: none; }
        .inp:focus { border-color: #C9F76F40; }
        .inp::placeholder { color: #3A3A3A; }
        .btn { padding: 12px 20px; border-radius: 8px; border: none; background: #C9F76F; color: #09090B; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn:disabled { opacity: 0.3; cursor: not-allowed; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; background: linear-gradient(to right,#C9F76F var(--v),#1E1E20 var(--v)); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #C9F76F; border: 3px solid #09090B; cursor: pointer; }
      `}</style>

      <div style={{ borderBottom: "1px solid #1A1A1C", padding: "14px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 3, color: "#C9F76F" }}>EMILDA & CO.</span>
            <h1 style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>Pricing & Quote Generator</h1>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#0D0D0F", borderRadius: 8, padding: 3 }}>
            {tabs.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: tab === t.k ? "#1C1C1E" : "transparent", color: tab === t.k ? "#E8E6E3" : "#555",
                fontSize: 11, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
              }}><span style={{ fontSize: 13 }}>{t.icon}</span> {t.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PROJECT ═══ */}
      {tab === "project" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
          <Card>
            <Lbl>Client & Project</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input className="inp" placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)} />
              <input className="inp" placeholder="Project name" value={projectName} onChange={e => setProjectName(e.target.value)} />
              <input className="inp" placeholder="Your name" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} />
            </div>
          </Card>
          <WorkLines enabled={pEnabled} hours={pHours} onToggle={toggleP} onHours={setHP} calc={pCalc} />

          {/* MARGIN SLIDER */}
          <Card>
            <Lbl>Cost Markup</Lbl>
            <p style={{ fontSize: 10, color: "#555", marginBottom: 12 }}>How many × over your delivery cost. 2.5× = minimum viable. 4× = premium.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#555" }}>2.5×</span>
              <div style={{ flex: 1 }}>
                <input type="range" min={250} max={400} value={marginX * 100}
                  onChange={e => setMarginX(Number(e.target.value) / 100)}
                  style={{ "--v": `${((marginX - 2.5) / 1.5) * 100}%` }} />
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#555" }}>4×</span>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "#C9F76F" }}>{marginX.toFixed(1)}×</div>
                <div style={{ fontSize: 9, color: "#444" }}>cost markup</div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, fontSize: 10 }}>
              {[2.5, 3.0, 3.5, 4.0].map(v => (
                <button key={v} onClick={() => setMarginX(v)} style={{
                  padding: "4px 12px", borderRadius: 4, border: `1px solid ${marginX === v ? "#C9F76F" : "#232325"}`,
                  background: marginX === v ? "#C9F76F10" : "transparent", color: marginX === v ? "#C9F76F" : "#666",
                  fontFamily: "var(--mono)", cursor: "pointer", fontSize: 11,
                }}>{v}×</button>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: "6px 10px", background: "#0D0D0F", borderRadius: 5, fontSize: 10, color: "#555" }}>
              Dev: ₹{WORK_TYPES.dev.costRate} × {marginX}× = <span style={{ color: "#C9F76F" }}>₹{Math.round(WORK_TYPES.dev.costRate * marginX)}/hr</span> &nbsp;·&nbsp;
              Ops: ₹{WORK_TYPES.ops.costRate} × {marginX}× = <span style={{ color: "#C9F76F" }}>₹{Math.round(WORK_TYPES.ops.costRate * marginX)}/hr</span> &nbsp;·&nbsp;
              Strategy: ₹{WORK_TYPES.strategy.costRate} × {marginX}× = <span style={{ color: "#C9F76F" }}>₹{Math.round(WORK_TYPES.strategy.costRate * marginX)}/hr</span>
            </div>
          </Card>

          <ValueFactors />

          <Card>
            <Lbl>How to Charge</Lbl>
            <div style={{ display: "flex", gap: 6, marginBottom: model === "retainer" ? 14 : 0 }}>
              {Object.entries(MODEL_OPTS).map(([k, v]) => <Pill key={k} active={model === k} onClick={() => setModel(k)} sub={v.d}>{v.label}</Pill>)}
            </div>
            {model === "retainer" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#666" }}>Over</span>
                <button onClick={() => setRetainerMonths(Math.max(1, retainerMonths - 1))} style={{ width: 28, height: 28, borderRadius: 5, border: "1px solid #232325", background: "#0D0D0F", color: "#888", fontSize: 14, cursor: "pointer" }}>−</button>
                <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700 }}>{retainerMonths}</span>
                <button onClick={() => setRetainerMonths(Math.min(24, retainerMonths + 1))} style={{ width: 28, height: 28, borderRadius: 5, border: "1px solid #232325", background: "#0D0D0F", color: "#888", fontSize: 14, cursor: "pointer" }}>+</button>
                <span style={{ fontSize: 12, color: "#666" }}>mo</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontWeight: 700, color: "#C9F76F" }}>{formatINR(retainerMo)}/mo</span>
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1, background: "linear-gradient(160deg,#181C10 0%,#111113 35%)", border: "1px solid #252720", borderRadius: 10, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "#666", letterSpacing: 2 }}>CLIENT QUOTE</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: "#C9F76F", marginTop: 2 }}>{formatINR(pCalc.totalPrice)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: mColor(pCalc.margin) }}>{pCalc.margin.toFixed(0)}%</div>
                <div style={{ fontSize: 9, color: "#555" }}>{pCalc.multiple.toFixed(1)}× cost</div>
              </div>
            </div>
            <button className="btn" style={{ width: 220, padding: "14px 20px" }}
              disabled={!clientName || pCalc.lines.length === 0}
              onClick={() => doGenerate(pCalc, clientName, projectName, preparedBy, false, "")}>
              📸 Generate Quote Image
            </button>
          </div>
        </div>
      )}

      {/* ═══ QUICK TASK ═══ */}
      {tab === "quick" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
          <Card>
            <Lbl>⚡ Quick Task / Scope Change</Lbl>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>Extra feature, scope change, ad-hoc task — price it and generate a quote image.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input className="inp" placeholder="Client" value={qClient} onChange={e => setQClient(e.target.value)} />
              <input className="inp" placeholder="What's the task?" value={qDesc} onChange={e => setQDesc(e.target.value)} />
              <input className="inp" placeholder="Your name" value={qPrepBy} onChange={e => setQPrepBy(e.target.value)} />
            </div>
          </Card>
          <WorkLines enabled={qEnabled} hours={qHours} onToggle={toggleQ} onHours={setHQ} calc={qCalc} />

          <Card>
            <Lbl>Cost Markup</Lbl>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#555" }}>2.5×</span>
              <div style={{ flex: 1 }}>
                <input type="range" min={250} max={400} value={marginX * 100}
                  onChange={e => setMarginX(Number(e.target.value) / 100)}
                  style={{ "--v": `${((marginX - 2.5) / 1.5) * 100}%` }} />
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#555" }}>4×</span>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "#C9F76F" }}>{marginX.toFixed(1)}×</div>
              </div>
            </div>
          </Card>

          <ValueFactors />

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1, background: "linear-gradient(160deg,#181C10 0%,#111113 35%)", border: "1px solid #252720", borderRadius: 10, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "#666", letterSpacing: 2 }}>CHARGE</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: "#C9F76F", marginTop: 2 }}>{formatINR(qCalc.totalPrice)}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#888" }}>{qCalc.totalHrs}h · {hrsToDays(qCalc.totalHrs)}</div>
            </div>
            <button className="btn" style={{ width: 220, padding: "14px 20px" }}
              disabled={!qClient || qCalc.lines.length === 0}
              onClick={() => doGenerate(qCalc, qClient, "", qPrepBy, true, qDesc)}>
              📸 Generate Quote Image
            </button>
          </div>
        </div>
      )}

      {/* ═══ RATE CARD ═══ */}
      {tab === "ratecard" && (
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px" }}>
          <Card>
            <Lbl>Emilda Cost Base & Rate Card</Lbl>
            <p style={{ fontSize: 11, color: "#555", marginBottom: 14, lineHeight: 1.5 }}>
              Cost = what it costs Emilda per hour (loaded CTC ÷ 160hrs).<br />
              Client rate = cost × margin multiplier ({marginX}×) × value adjustments.
            </p>
            {Object.entries(WORK_TYPES).map(([k, wt]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #161618" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{wt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{wt.label}</div>
                    <div style={{ fontSize: 10, color: "#444" }}>Cost: ₹{wt.costRate}/hr</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "#C9F76F" }}>₹{Math.round(wt.costRate * marginX)}/hr</div>
                  <div style={{ fontSize: 9, color: "#555" }}>at {marginX}× · Gulf: ₹{Math.round(wt.costRate * marginX * 1.8)}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <Lbl>Hour References</Lbl>
            {[
              { h: 2, d: "Bug fix, tiny tweak" }, { h: 8, d: "1 day — small feature" },
              { h: 24, d: "3 days — module" }, { h: 40, d: "1 week — feature set" },
              { h: 80, d: "2 weeks — solid build" }, { h: 160, d: "1 month — full app" },
              { h: 400, d: "2.5 months — platform" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #131315", fontSize: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#C9F76F", minWidth: 36, textAlign: "right" }}>{r.h}h</span>
                  <span style={{ color: "#888" }}>{r.d}</span>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#555" }}>{hrsToDays(r.h)}</span>
              </div>
            ))}
          </Card>
          <div style={{ background: "#0D0D0F", border: "1px dashed #1E1E20", borderRadius: 10, padding: 14, fontSize: 11, color: "#555", lineHeight: 1.8 }}>
            <strong style={{ color: "#8AB34A", fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 1 }}>RULES</strong><br />
            🟢 Never below 2.5× cost<br />
            🟢 Gulf: always ×1.8 minimum on top<br />
            🟢 50% advance on all build work<br />
            🟢 Scope changes = new quotes, never absorb<br />
            🟢 Generate image → send to Paul → get approval → proceed
          </div>
        </div>
      )}
    </div>
  );
}
