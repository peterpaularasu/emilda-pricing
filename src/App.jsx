import { useState, useMemo, useCallback } from "react";

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
const URGENCY     = { relaxed: { label: "Relaxed", mult: 0.9 }, normal: { label: "Normal", mult: 1.0 }, tight: { label: "Tight", mult: 1.2 }, fire: { label: "🔥 Urgent", mult: 1.4 } };
const IMPACT      = { operational: { label: "Ops", mult: 1.0 }, revenue: { label: "Revenue", mult: 1.2 }, strategic: { label: "Strategic", mult: 1.4 } };
const MODEL_OPTS  = { fixed: { label: "🎯 Fixed", d: "One price" }, phased: { label: "📐 Phased", d: "50 / 50" }, retainer: { label: "🔄 Retainer", d: "Monthly" } };

const hrsToDays = (h) => {
  if (h <= 0) return "—";
  const d = +(h / 8).toFixed(1);
  const w = +(h / 40).toFixed(1);
  if (h < 40) return `${d}d`;
  return `${w}wk`;
};

// ══════════════════
// JPEG GENERATION
// ══════════════════
function generateQuoteJPEG({ calc, client, project, prepBy, isQuick, desc, marginX, market, clientType, urgency, impact, adjMult, model, retainerMonths, retainerMo }) {
  const W = 800, pad = 40;
  const lines = calc.lines;
  const H = 600 + lines.length * 52;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  ctx.fillStyle = "#0C0C0E";
  ctx.fillRect(0, 0, W, H);

  const mono = (s) => `${s}px 'Courier New', monospace`;
  const sans = (s, w = "normal") => `${w} ${s}px 'Segoe UI', 'Helvetica Neue', sans-serif`;
  const drawLine = (y, c = "#1E1E20") => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); };
  const rightText = (t, y, f, c) => { ctx.font = f; ctx.fillStyle = c; ctx.textAlign = "right"; ctx.fillText(t, W - pad, y); ctx.textAlign = "left"; };

  let y = pad + 12;
  ctx.font = mono(11); ctx.fillStyle = "#C9F76F"; ctx.fillText("EMILDA & CO.", pad, y);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  rightText(today, y, mono(10), "#666");
  y += 20;
  ctx.font = mono(9); ctx.fillStyle = "#666";
  ctx.fillText(isQuick ? "SCOPE CHANGE / TASK QUOTE" : "PROJECT QUOTE", pad, y);
  if (prepBy) rightText(`Prepared by: ${prepBy}`, y, mono(9), "#555");
  y += 28; drawLine(y); y += 26;

  ctx.font = sans(20, "bold"); ctx.fillStyle = "#E8E6E3"; ctx.fillText(client || "—", pad, y);
  y += 24; ctx.font = sans(14); ctx.fillStyle = "#888"; ctx.fillText(isQuick ? (desc || "—") : (project || "—"), pad, y);
  y += 32; drawLine(y); y += 22;

  ctx.font = mono(8); ctx.fillStyle = "#555";
  ctx.fillText("WORK TYPE", pad, y);
  ctx.fillText("HOURS", pad + 280, y); ctx.fillText("DURATION", pad + 350, y); ctx.fillText("RATE", pad + 450, y);
  rightText("AMOUNT", y, mono(8), "#555");
  y += 10; drawLine(y); y += 24;

  lines.forEach(l => {
    ctx.font = sans(14, "bold"); ctx.fillStyle = "#E8E6E3";
    ctx.fillText(`${l.icon}  ${l.label}`, pad, y);
    ctx.font = mono(12); ctx.fillStyle = "#999";
    ctx.fillText(`${l.hours}h`, pad + 280, y);
    ctx.fillText(l.duration, pad + 350, y);
    ctx.fillText(`₹${l.effRate}/hr`, pad + 450, y);
    rightText(formatINR(l.price), y, `bold ${mono(13)}`, "#E8E6E3");
    y += 18;
    ctx.font = mono(9); ctx.fillStyle = "#444";
    ctx.fillText(`Cost ₹${l.costRate}/hr × ${marginX}× margin × ${adjMult.toFixed(2)}× adj`, pad + 28, y);
    y += 22; drawLine(y, "#131315"); y += 14;
  });

  y += 8;
  const boxH = model === "phased" || model === "retainer" ? 75 : 58;
  ctx.fillStyle = "#151815";
  ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, boxH, 8); ctx.fill();
  ctx.strokeStyle = "#C9F76F25"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, boxH, 8); ctx.stroke();

  y += 24;
  ctx.font = mono(9); ctx.fillStyle = "#8AB34A";
  const ml = model === "fixed" ? "TOTAL (FIXED)" : model === "phased" ? "TOTAL (50% ADVANCE, 50% DELIVERY)" : "TOTAL";
  ctx.fillText(ml, pad + 16, y);
  rightText(formatINR(calc.totalPrice), y + 10, `bold ${mono(26)}`, "#C9F76F");
  if (model === "retainer") { y += 22; ctx.font = mono(10); ctx.fillStyle = "#888"; ctx.fillText(`${formatINR(retainerMo)}/mo × ${retainerMonths} months`, pad + 16, y); }
  if (model === "phased") { y += 22; ctx.font = mono(10); ctx.fillStyle = "#888"; const hf = Math.round(calc.totalPrice / 2); ctx.fillText(`Advance: ${formatINR(hf)}  ·  Delivery: ${formatINR(calc.totalPrice - hf)}`, pad + 16, y); }

  y += boxH - 6;
  y += 20; drawLine(y); y += 22;

  ctx.font = mono(8); ctx.fillStyle = "#555"; ctx.fillText("PRICING SETTINGS", pad, y); y += 20;

  const s1 = [
    { l: "Market", v: `${MARKET[market].flag} ${MARKET[market].label}${MARKET[market].mult > 1 ? ` (×${MARKET[market].mult})` : ""}` },
    { l: "Client", v: `${CLIENT_TYPE[clientType].label}${CLIENT_TYPE[clientType].mult > 1 ? ` (×${CLIENT_TYPE[clientType].mult})` : ""}` },
    { l: "Urgency", v: `${URGENCY[urgency].label}${URGENCY[urgency].mult !== 1 ? ` (×${URGENCY[urgency].mult})` : ""}` },
    { l: "Impact", v: `${IMPACT[impact].label}${IMPACT[impact].mult > 1 ? ` (×${IMPACT[impact].mult})` : ""}` },
  ];
  const s2 = [
    { l: "Cost Markup", v: `${marginX}×`, c: "#C9F76F" },
    { l: "Value Adj.", v: `${adjMult.toFixed(2)}×`, c: adjMult > 1 ? "#C9F76F" : "#888" },
    { l: "Total Mult.", v: `${(marginX * adjMult).toFixed(2)}× cost`, c: "#C9F76F" },
    { l: "Margin", v: `${calc.margin.toFixed(0)}%`, c: calc.margin >= 50 ? "#C9F76F" : calc.margin >= 35 ? "#A8D84E" : "#F7D76F" },
  ];
  s1.forEach((s, i) => { ctx.font = sans(11); ctx.fillStyle = "#555"; ctx.fillText(s.l, pad, y + i * 22); ctx.fillStyle = "#CCC"; ctx.fillText(s.v, pad + 120, y + i * 22); });
  s2.forEach((s, i) => { ctx.font = sans(11); ctx.fillStyle = "#555"; ctx.fillText(s.l, pad + 380, y + i * 22); ctx.font = mono(11); ctx.fillStyle = s.c || "#CCC"; ctx.fillText(s.v, pad + 510, y + i * 22); });

  y += 100;
  const bW = (W - pad * 2 - 30) / 4;
  [
    { l: "HOURS", v: `${calc.totalHrs}h`, s: hrsToDays(calc.totalHrs) },
    { l: "AVG RATE", v: `₹${calc.avgEffRate}/hr` },
    { l: "YOUR COST", v: formatINR(calc.totalCost) },
    { l: "PROFIT", v: formatINR(calc.totalPrice - calc.totalCost), s: `${calc.margin.toFixed(0)}%` },
  ].forEach((b, i) => {
    const bx = pad + i * (bW + 10);
    ctx.fillStyle = "#0D0D0F"; ctx.beginPath(); ctx.roundRect(bx, y, bW, 58, 6); ctx.fill();
    ctx.font = mono(7); ctx.fillStyle = "#444"; ctx.fillText(b.l, bx + 10, y + 18);
    ctx.font = mono(13); ctx.fillStyle = "#E8E6E3"; ctx.fillText(b.v, bx + 10, y + 36);
    if (b.s) { ctx.font = mono(9); ctx.fillStyle = "#555"; ctx.fillText(b.s, bx + 10, y + 50); }
  });

  y += 78;
  ctx.font = mono(9); ctx.fillStyle = "#333"; ctx.textAlign = "center";
  ctx.fillText("emilda.co  ·  Chaos to Control", W / 2, y); ctx.textAlign = "left";

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
  const [marginX, setMarginX] = useState(2.5);

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
    setQuoteImg(generateQuoteJPEG({ calc, client, project, prepBy, isQuick, desc, marginX, market, clientType, urgency, impact, adjMult, model, retainerMonths, retainerMo }));
  };

  const downloadImg = () => {
    if (!quoteImg) return;
    const a = document.createElement("a");
    a.href = quoteImg;
    const name = tab === "project" ? (clientName || "quote") : (qClient || "task");
    a.download = `emilda-quote-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.jpg`;
    a.click();
  };

  // ── QUOTE IMAGE VIEW ──
  if (quoteImg) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090B", color: "#E8E6E3", fontFamily: "var(--sans)", padding: 16 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
          :root { --sans: 'DM Sans', system-ui, sans-serif; --mono: 'Space Mono', monospace; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <div style={{ maxWidth: 850, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setQuoteImg(null)} className="btn-back">← Back</button>
            <button onClick={downloadImg} className="btn-green">⬇ Download JPEG</button>
          </div>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 14 }}>Long-press or right-click the image to save/share via WhatsApp.</p>
          <img src={quoteImg} alt="Quote" style={{ width: "100%", borderRadius: 12, border: "1px solid #1E1E20" }} />
        </div>
      </div>
    );
  }

  const tabs = [
    { k: "project", l: "Project", icon: "📐" },
    { k: "quick", l: "Quick Task", icon: "⚡" },
    { k: "ratecard", l: "Rates", icon: "📊" },
  ];

  // ── SHARED: Value Factors ──
  const ValueFactors = () => (
    <div className="card">
      <div className="lbl">Value Adjustments</div>
      <p className="hint">India + Family + Normal + Ops = no change from rate card.</p>
      <div className="factor-grid">
        <div>
          <div className="factor-label">Market</div>
          <div className="pill-row">
            {Object.entries(MARKET).map(([k, v]) => <button key={k} className={`pill ${market === k ? "on" : ""}`} onClick={() => setMarket(k)}>{v.flag} {v.label}{v.mult > 1 ? ` ×${v.mult}` : ""}</button>)}
          </div>
        </div>
        <div>
          <div className="factor-label">Client</div>
          <div className="pill-row">
            {Object.entries(CLIENT_TYPE).map(([k, v]) => <button key={k} className={`pill ${clientType === k ? "on" : ""}`} onClick={() => setClientType(k)}>{v.label}{v.mult > 1 ? ` ×${v.mult}` : ""}</button>)}
          </div>
        </div>
        <div>
          <div className="factor-label">Urgency</div>
          <div className="pill-row">
            {Object.entries(URGENCY).map(([k, v]) => <button key={k} className={`pill ${urgency === k ? "on" : ""}`} onClick={() => setUrgency(k)}>{v.label}{v.mult !== 1 ? ` ×${v.mult}` : ""}</button>)}
          </div>
        </div>
        <div>
          <div className="factor-label">Impact</div>
          <div className="pill-row">
            {Object.entries(IMPACT).map(([k, v]) => <button key={k} className={`pill ${impact === k ? "on" : ""}`} onClick={() => setImpact(k)}>{v.label}{v.mult > 1 ? ` ×${v.mult}` : ""}</button>)}
          </div>
        </div>
      </div>
      <div className={`adj-bar ${adjMult === 1 ? "" : "active"}`}>
        <span>{adjMult === 1 ? "No adjustment" : "Adjustment active"}</span>
        <span className="adj-val">{adjMult.toFixed(2)}×</span>
      </div>
    </div>
  );

  // ── SHARED: Work breakdown ──
  const WorkBlock = ({ enabled, hours, onToggle, onHours, calc }) => (
    <div className="card">
      <div className="lbl">Work Breakdown</div>
      <p className="hint">Toggle types, enter hours. Rate = cost × {marginX}×{adjMult > 1 ? ` × ${adjMult.toFixed(2)}×` : ""}.</p>
      {Object.entries(WORK_TYPES).map(([k, wt]) => {
        const on = enabled[k], h = hours[k];
        const effRate = Math.round(wt.costRate * marginX * adjMult);
        return (
          <div key={k} className={`work-row ${on ? "" : "off"}`}>
            <div className="work-top">
              <label className="work-toggle">
                <input type="checkbox" checked={on} onChange={() => onToggle(k)} />
                <span className="work-name">{wt.icon} {wt.label}</span>
              </label>
              <div className="work-rate">₹{effRate}/hr</div>
            </div>
            {on && (
              <div className="work-bottom">
                <div className="work-hours-wrap">
                  <button className="stepper" onClick={() => onHours(k, Math.max(0, h - 1))}>−</button>
                  <input type="number" min={0} max={2000} value={h || ""} placeholder="0"
                    onChange={e => onHours(k, Math.max(0, Number(e.target.value)))}
                    className="work-hours-input" />
                  <button className="stepper" onClick={() => onHours(k, h + 1)}>+</button>
                  <span className="work-hrs-label">hours</span>
                </div>
                <div className="work-meta">
                  <span>{hrsToDays(h)}</span>
                  <span className="work-line-total">{h > 0 ? formatINR(effRate * h) : "—"}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* Totals */}
      <div className="work-total-row">
        <div>
          <span className="total-label">Total</span>
          <span className="total-hrs">{calc.totalHrs}h · {hrsToDays(calc.totalHrs)}</span>
        </div>
        <div className="total-amount">{formatINR(calc.totalPrice)}</div>
      </div>
    </div>
  );

  // ── SHARED: Margin slider ──
  const MarginSlider = () => (
    <div className="card">
      <div className="lbl">Cost Markup</div>
      <p className="hint">Your delivery cost × this = client rate. 2.5× minimum, 4× premium.</p>
      <div className="margin-control">
        <div className="margin-slider-wrap">
          <span className="margin-bound">2.5×</span>
          <input type="range" min={250} max={400} value={marginX * 100}
            onChange={e => setMarginX(Number(e.target.value) / 100)}
            className="slider" style={{ "--v": `${((marginX - 2.5) / 1.5) * 100}%` }} />
          <span className="margin-bound">4×</span>
        </div>
        <div className="margin-value">{marginX.toFixed(1)}×</div>
      </div>
      <div className="margin-presets">
        {[2.5, 3.0, 3.5, 4.0].map(v => (
          <button key={v} className={`preset ${marginX === v ? "on" : ""}`} onClick={() => setMarginX(v)}>{v}×</button>
        ))}
      </div>
      <div className="margin-preview">
        {Object.entries(WORK_TYPES).map(([k, wt]) => (
          <span key={k}>{wt.icon} ₹{wt.costRate}→<b>₹{Math.round(wt.costRate * marginX)}</b></span>
        ))}
      </div>
    </div>
  );

  // ── SHARED: Price summary bar ──
  const PriceSummary = ({ calc, onGenerate, disabled, label = "CLIENT QUOTE" }) => (
    <div className="price-bar">
      <div className="price-left">
        <div className="price-label">{label}</div>
        <div className="price-amount">{formatINR(calc.totalPrice)}</div>
        <div className="price-sub">{calc.totalHrs}h · {hrsToDays(calc.totalHrs)} · {calc.margin.toFixed(0)}% margin</div>
      </div>
      <button className="btn-green generate-btn" disabled={disabled} onClick={onGenerate}>
        📸 Generate Quote
      </button>
    </div>
  );

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
        :root {
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'Space Mono', monospace;
          --bg: #09090B; --card: #111113; --border: #1E1E20;
          --lime: #C9F76F; --lime-dim: #8AB34A;
          --text: #E8E6E3; --muted: #888; --dim: #555; --faint: #333;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        .app { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--sans); }

        /* HEADER */
        .header { border-bottom: 1px solid var(--border); padding: 16px; }
        .header-inner { max-width: 720px; margin: 0 auto; }
        .brand { font-family: var(--mono); font-size: 11px; letter-spacing: 3px; color: var(--lime); }
        .header h1 { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .tab-bar { display: flex; gap: 4px; margin-top: 12px; background: #0D0D0F; border-radius: 10px; padding: 4px; }
        .tab-btn { flex: 1; padding: 12px 8px; border-radius: 8px; border: none; cursor: pointer;
          background: transparent; color: var(--dim); font-size: 14px; font-weight: 600;
          font-family: var(--sans); display: flex; align-items: center; justify-content: center; gap: 6px; }
        .tab-btn.active { background: #1C1C1E; color: var(--text); }

        /* CONTENT */
        .content { max-width: 720px; margin: 0 auto; padding: 16px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
        .lbl { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; color: var(--lime); text-transform: uppercase; margin-bottom: 12px; font-weight: 700; }
        .hint { font-size: 13px; color: var(--dim); margin-bottom: 16px; line-height: 1.5; }

        /* INPUTS */
        .field-grid { display: grid; gap: 12px; }
        @media (min-width: 500px) { .field-grid { grid-template-columns: 1fr 1fr; } }
        .field-grid.three { grid-template-columns: 1fr; }
        @media (min-width: 600px) { .field-grid.three { grid-template-columns: 1fr 1fr 1fr; } }
        .field label { font-size: 13px; color: var(--muted); display: block; margin-bottom: 6px; font-weight: 500; }
        .inp { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1.5px solid #232325;
          background: #0D0D0F; color: var(--text); font-size: 16px; font-family: var(--sans); outline: none; }
        .inp:focus { border-color: var(--lime); }
        .inp::placeholder { color: #3A3A3A; }

        /* PILLS */
        .pill-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .pill { padding: 12px 14px; border-radius: 10px; border: 2px solid #232325; background: var(--card);
          color: var(--muted); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--sans);
          flex: 1 1 0; min-width: 70px; text-align: center; transition: all 0.15s; }
        .pill.on { border-color: var(--lime); background: #C9F76F0A; color: var(--lime); }
        .pill:active { transform: scale(0.97); }

        /* FACTOR GRID */
        .factor-grid { display: grid; gap: 16px; }
        @media (min-width: 500px) { .factor-grid { grid-template-columns: 1fr 1fr; } }
        .factor-label { font-size: 13px; color: var(--dim); margin-bottom: 8px; font-weight: 500; }
        .adj-bar { margin-top: 14px; padding: 12px 14px; background: #1A1A1C; border: 1px solid #232325;
          border-radius: 8px; display: flex; justify-content: space-between; align-items: center;
          font-size: 14px; color: var(--dim); }
        .adj-bar.active { background: #C9F76F08; border-color: #C9F76F20; color: var(--lime-dim); }
        .adj-val { font-family: var(--mono); font-weight: 700; font-size: 16px; color: var(--muted); }
        .adj-bar.active .adj-val { color: var(--lime); }

        /* WORK ROWS */
        .work-row { padding: 14px 0; border-bottom: 1px solid #1A1A1C; transition: opacity 0.15s; }
        .work-row.off { opacity: 0.35; }
        .work-top { display: flex; justify-content: space-between; align-items: center; }
        .work-toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; font-size: 16px; font-weight: 700; }
        .work-toggle input { width: 22px; height: 22px; accent-color: var(--lime); cursor: pointer; }
        .work-name { color: var(--text); }
        .work-row.off .work-name { color: var(--dim); }
        .work-rate { font-family: var(--mono); font-size: 14px; color: var(--muted); font-weight: 600; }
        .work-bottom { margin-top: 12px; padding-left: 34px; display: flex; justify-content: space-between;
          align-items: center; gap: 12px; flex-wrap: wrap; }
        .work-hours-wrap { display: flex; align-items: center; gap: 8px; }
        .stepper { width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #232325;
          background: #0D0D0F; color: var(--muted); font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-family: var(--sans); }
        .stepper:active { border-color: var(--lime); color: var(--lime); }
        .work-hours-input { width: 80px; padding: 10px 8px; border-radius: 8px; border: 1.5px solid #232325;
          background: #0D0D0F; color: var(--text); font-size: 18px; font-family: var(--mono);
          text-align: center; outline: none; font-weight: 700; }
        .work-hours-input:focus { border-color: var(--lime); }
        .work-hrs-label { font-size: 14px; color: var(--dim); }
        .work-meta { display: flex; gap: 16px; font-size: 14px; color: var(--dim); font-family: var(--mono); align-items: center; }
        .work-line-total { font-weight: 700; color: var(--lime); font-size: 16px; }
        .work-total-row { display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0 4px; border-top: 2px solid #232325; margin-top: 8px; }
        .total-label { font-size: 16px; font-weight: 700; color: var(--muted); margin-right: 12px; }
        .total-hrs { font-size: 14px; color: var(--dim); font-family: var(--mono); }
        .total-amount { font-family: var(--mono); font-size: 20px; font-weight: 700; color: var(--lime); }

        /* MARGIN SLIDER */
        .margin-control { display: flex; align-items: center; gap: 16px; }
        .margin-slider-wrap { flex: 1; display: flex; align-items: center; gap: 10px; }
        .margin-bound { font-family: var(--mono); font-size: 13px; color: var(--dim); }
        .slider { -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; cursor: pointer;
          background: linear-gradient(to right, var(--lime) var(--v), #1E1E20 var(--v)); }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%;
          background: var(--lime); border: 4px solid var(--bg); cursor: pointer; }
        .margin-value { font-family: var(--mono); font-size: 28px; font-weight: 700; color: var(--lime);
          min-width: 70px; text-align: center; }
        .margin-presets { display: flex; gap: 8px; margin-top: 14px; }
        .preset { flex: 1; padding: 12px; border-radius: 8px; border: 1.5px solid #232325; background: transparent;
          color: var(--dim); font-family: var(--mono); font-size: 15px; font-weight: 700; cursor: pointer; }
        .preset.on { border-color: var(--lime); color: var(--lime); background: #C9F76F08; }
        .preset:active { transform: scale(0.97); }
        .margin-preview { margin-top: 12px; padding: 10px 14px; background: #0D0D0F; border-radius: 8px;
          display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: var(--dim); }
        .margin-preview b { color: var(--lime); font-weight: 700; }

        /* PRICING MODEL */
        .model-row { display: flex; gap: 6px; }
        .model-row .pill { padding: 14px 10px; }
        .retainer-ctrl { display: flex; align-items: center; gap: 10px; margin-top: 14px; font-size: 15px; color: var(--dim); flex-wrap: wrap; }
        .retainer-val { font-family: var(--mono); font-size: 20px; font-weight: 700; min-width: 30px; text-align: center; }
        .retainer-mo { margin-left: auto; font-family: var(--mono); font-weight: 700; color: var(--lime); font-size: 16px; }

        /* PRICE BAR */
        .price-bar { background: linear-gradient(160deg, #181C10 0%, var(--card) 35%); border: 1.5px solid #252720;
          border-radius: 14px; padding: 20px; margin-bottom: 16px; display: flex; justify-content: space-between;
          align-items: center; gap: 16px; flex-wrap: wrap; }
        .price-label { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; color: var(--dim); }
        .price-amount { font-family: var(--mono); font-size: 32px; font-weight: 700; color: var(--lime); margin: 4px 0; }
        @media (max-width: 500px) { .price-amount { font-size: 26px; } }
        .price-sub { font-size: 13px; color: var(--dim); font-family: var(--mono); }

        /* BUTTONS */
        .btn-green { padding: 16px 24px; border-radius: 12px; border: none; background: var(--lime);
          color: var(--bg); font-size: 16px; font-weight: 700; cursor: pointer; font-family: var(--sans);
          white-space: nowrap; }
        .btn-green:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-green:active:not(:disabled) { transform: scale(0.97); }
        .generate-btn { min-width: 180px; text-align: center; }
        @media (max-width: 500px) { .generate-btn { width: 100%; } }
        .btn-back { padding: 12px 20px; border-radius: 10px; border: 2px solid #232325; background: transparent;
          color: var(--muted); font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--sans); }

        /* RATE CARD */
        .rate-item { display: flex; justify-content: space-between; align-items: center;
          padding: 18px 0; border-bottom: 1px solid #1A1A1C; }
        .rate-left { display: flex; align-items: center; gap: 14px; }
        .rate-icon { font-size: 24px; }
        .rate-name { font-size: 16px; font-weight: 700; }
        .rate-cost { font-size: 12px; color: var(--dim); margin-top: 2px; }
        .rate-price { font-family: var(--mono); font-size: 18px; font-weight: 700; color: var(--lime); }
        .rate-gulf { font-size: 11px; color: var(--dim); margin-top: 2px; }

        .hour-ref { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #131315; }
        .hour-ref-h { font-family: var(--mono); font-weight: 700; color: var(--lime); font-size: 15px; min-width: 50px; }
        .hour-ref-d { font-size: 14px; color: var(--muted); }
        .hour-ref-dur { font-family: var(--mono); font-size: 13px; color: var(--dim); }

        .rules { background: #0D0D0F; border: 2px dashed #1E1E20; border-radius: 12px;
          padding: 18px; font-size: 14px; color: var(--dim); line-height: 2; }
        .rules strong { color: var(--lime-dim); font-family: var(--mono); font-size: 11px; letter-spacing: 1px; }
      `}</style>

      {/* HEADER */}
      <div className="header">
        <div className="header-inner">
          <div className="brand">EMILDA & CO.</div>
          <h1>Pricing & Quotes</h1>
          <div className="tab-bar">
            {tabs.map(t => (
              <button key={t.k} className={`tab-btn ${tab === t.k ? "active" : ""}`}
                onClick={() => setTab(t.k)}>
                <span>{t.icon}</span> {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PROJECT ═══ */}
      {tab === "project" && (
        <div className="content">
          <div className="card">
            <div className="lbl">Client & Project</div>
            <div className="field-grid three">
              <div className="field"><label>Client Name</label><input className="inp" placeholder="e.g. Dr. Mehboob" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
              <div className="field"><label>Project Name</label><input className="inp" placeholder="e.g. KMCT Nucleus" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
              <div className="field"><label>Prepared By</label><input className="inp" placeholder="Your name" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} /></div>
            </div>
          </div>

          <WorkBlock enabled={pEnabled} hours={pHours} onToggle={toggleP} onHours={setHP} calc={pCalc} />
          <MarginSlider />
          <ValueFactors />

          <div className="card">
            <div className="lbl">How to Charge</div>
            <div className="model-row">
              {Object.entries(MODEL_OPTS).map(([k, v]) => <button key={k} className={`pill ${model === k ? "on" : ""}`} onClick={() => setModel(k)}>{v.label}<br/><span style={{ fontSize: 12, fontWeight: 400 }}>{v.d}</span></button>)}
            </div>
            {model === "retainer" && (
              <div className="retainer-ctrl">
                <span>Spread over</span>
                <button className="stepper" onClick={() => setRetainerMonths(Math.max(1, retainerMonths - 1))}>−</button>
                <span className="retainer-val">{retainerMonths}</span>
                <button className="stepper" onClick={() => setRetainerMonths(Math.min(24, retainerMonths + 1))}>+</button>
                <span>months</span>
                <span className="retainer-mo">{formatINR(retainerMo)}/mo</span>
              </div>
            )}
          </div>

          <PriceSummary calc={pCalc} disabled={!clientName || pCalc.lines.length === 0}
            onGenerate={() => doGenerate(pCalc, clientName, projectName, preparedBy, false, "")} />
        </div>
      )}

      {/* ═══ QUICK TASK ═══ */}
      {tab === "quick" && (
        <div className="content">
          <div className="card">
            <div className="lbl">⚡ Quick Task / Scope Change</div>
            <p className="hint">Extra feature, scope change, ad-hoc task — price it and send for approval.</p>
            <div className="field-grid three">
              <div className="field"><label>Client</label><input className="inp" placeholder="Client name" value={qClient} onChange={e => setQClient(e.target.value)} /></div>
              <div className="field"><label>Task</label><input className="inp" placeholder="What's the work?" value={qDesc} onChange={e => setQDesc(e.target.value)} /></div>
              <div className="field"><label>Your Name</label><input className="inp" placeholder="Your name" value={qPrepBy} onChange={e => setQPrepBy(e.target.value)} /></div>
            </div>
          </div>

          <WorkBlock enabled={qEnabled} hours={qHours} onToggle={toggleQ} onHours={setHQ} calc={qCalc} />
          <MarginSlider />
          <ValueFactors />

          <PriceSummary calc={qCalc} label="CHARGE THE CLIENT" disabled={!qClient || qCalc.lines.length === 0}
            onGenerate={() => doGenerate(qCalc, qClient, "", qPrepBy, true, qDesc)} />
        </div>
      )}

      {/* ═══ RATE CARD ═══ */}
      {tab === "ratecard" && (
        <div className="content">
          <div className="card">
            <div className="lbl">Emilda Rate Card</div>
            <p className="hint">Cost = Emilda's loaded cost. Client rate = cost × {marginX}× markup.</p>
            {Object.entries(WORK_TYPES).map(([k, wt]) => (
              <div key={k} className="rate-item">
                <div className="rate-left">
                  <span className="rate-icon">{wt.icon}</span>
                  <div>
                    <div className="rate-name">{wt.label}</div>
                    <div className="rate-cost">Cost: ₹{wt.costRate}/hr</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="rate-price">₹{Math.round(wt.costRate * marginX)}/hr</div>
                  <div className="rate-gulf">Gulf: ₹{Math.round(wt.costRate * marginX * 1.8)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="lbl">Hour Reference</div>
            {[
              { h: 2, d: "Bug fix, tiny tweak" }, { h: 8, d: "1 day — small feature" },
              { h: 24, d: "3 days — module" }, { h: 40, d: "1 week — feature set" },
              { h: 80, d: "2 weeks — solid build" }, { h: 160, d: "1 month — full app" },
              { h: 400, d: "2.5 months — platform" },
            ].map((r, i) => (
              <div key={i} className="hour-ref">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="hour-ref-h">{r.h}h</span>
                  <span className="hour-ref-d">{r.d}</span>
                </div>
                <span className="hour-ref-dur">{hrsToDays(r.h)}</span>
              </div>
            ))}
          </div>

          <div className="rules">
            <strong>RULES</strong><br />
            🟢 Never below 2.5× cost<br />
            🟢 Gulf: always ×1.8 minimum on top<br />
            🟢 50% advance on all build work<br />
            🟢 Scope changes = new quotes, never absorb<br />
            🟢 Generate image → send to Paul → approval → proceed
          </div>
        </div>
      )}
    </div>
  );
}
