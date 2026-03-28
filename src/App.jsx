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
const IMPACT      = { operational: { label: "Ops Efficiency", mult: 1.0 }, revenue: { label: "Revenue", mult: 1.2 }, strategic: { label: "Strategic", mult: 1.4 } };
const MODEL_OPTS  = { fixed: { label: "🎯 Fixed", d: "One number" }, phased: { label: "📐 Phased", d: "50/50 split" }, retainer: { label: "🔄 Retainer", d: "Monthly" } };

const hrsToDays = (h) => {
  if (h <= 0) return "—";
  const d = +(h / 8).toFixed(1);
  const w = +(h / 40).toFixed(1);
  if (h < 40) return `${d}d`;
  return `${w}wk`;
};

function generateQuoteJPEG({ calc, client, project, prepBy, isQuick, desc, marginX, market, clientType, urgency, impact, adjMult, model, retainerMonths, retainerMo }) {
  const W = 800, pad = 40;
  const lines = calc.lines;
  const H = 600 + lines.length * 52;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2; canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  ctx.fillStyle = "#0C0C0E"; ctx.fillRect(0, 0, W, H);
  const mn = (s) => `${s}px 'Courier New', monospace`;
  const sn = (sz, w = "normal") => `${w} ${sz}px 'Segoe UI', 'Helvetica Neue', sans-serif`;
  const ln = (y, c = "#1E1E20") => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); };
  const rT = (t, y, f, c) => { ctx.font = f; ctx.fillStyle = c; ctx.textAlign = "right"; ctx.fillText(t, W - pad, y); ctx.textAlign = "left"; };
  let y = pad + 12;
  ctx.font = mn(11); ctx.fillStyle = "#C9F76F"; ctx.fillText("EMILDA & CO.", pad, y);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  rT(today, y, mn(10), "#666"); y += 20;
  ctx.font = mn(9); ctx.fillStyle = "#666"; ctx.fillText(isQuick ? "SCOPE CHANGE / TASK QUOTE" : "PROJECT QUOTE", pad, y);
  if (prepBy) rT(`Prepared by: ${prepBy}`, y, mn(9), "#555"); y += 28; ln(y); y += 26;
  ctx.font = sn(20, "bold"); ctx.fillStyle = "#E8E6E3"; ctx.fillText(client || "—", pad, y); y += 24;
  ctx.font = sn(14); ctx.fillStyle = "#888"; ctx.fillText(isQuick ? (desc || "—") : (project || "—"), pad, y); y += 32; ln(y); y += 22;
  ctx.font = mn(8); ctx.fillStyle = "#555";
  ctx.fillText("WORK TYPE", pad, y); ctx.fillText("HOURS", pad + 280, y); ctx.fillText("DURATION", pad + 360, y); ctx.fillText("RATE", pad + 460, y);
  rT("AMOUNT", y, mn(8), "#555"); y += 10; ln(y); y += 24;
  lines.forEach(l => {
    ctx.font = sn(14, "bold"); ctx.fillStyle = "#E8E6E3"; ctx.fillText(`${l.icon}  ${l.label}`, pad, y);
    ctx.font = mn(11); ctx.fillStyle = "#999";
    ctx.fillText(`${l.hours}h`, pad + 280, y); ctx.fillText(l.duration, pad + 360, y); ctx.fillText(`₹${l.effRate}/hr`, pad + 460, y);
    rT(formatINR(l.price), y, `bold ${mn(13)}`, "#E8E6E3");
    y += 18; ctx.font = mn(9); ctx.fillStyle = "#444";
    ctx.fillText(`Cost ₹${l.costRate}/hr × ${marginX}× margin × ${adjMult.toFixed(2)}× adj`, pad + 28, y);
    y += 22; ln(y, "#131315"); y += 14;
  });
  y += 8;
  const boxH = model === "phased" || model === "retainer" ? 75 : 58;
  ctx.fillStyle = "#151815"; ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, boxH, 8); ctx.fill();
  ctx.strokeStyle = "#C9F76F25"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, boxH, 8); ctx.stroke();
  y += 24; ctx.font = mn(9); ctx.fillStyle = "#8AB34A";
  ctx.fillText(model === "fixed" ? "TOTAL (FIXED PRICE)" : model === "phased" ? "TOTAL (PHASED — 50% ADVANCE, 50% DELIVERY)" : "TOTAL", pad + 16, y);
  rT(formatINR(calc.totalPrice), y + 10, `bold ${mn(26)}`, "#C9F76F");
  if (model === "retainer") { y += 22; ctx.font = mn(10); ctx.fillStyle = "#888"; ctx.fillText(`${formatINR(retainerMo)}/mo × ${retainerMonths} months`, pad + 16, y); }
  if (model === "phased") { y += 22; ctx.font = mn(10); ctx.fillStyle = "#888"; const half = Math.round(calc.totalPrice / 2); ctx.fillText(`Advance: ${formatINR(half)}  ·  On delivery: ${formatINR(calc.totalPrice - half)}`, pad + 16, y); }
  y += boxH - 6; y += 22; ln(y); y += 22;
  ctx.font = mn(8); ctx.fillStyle = "#555"; ctx.fillText("PRICING SETTINGS", pad, y); y += 20;
  const sL = [
    { l: "Market", v: `${MARKET[market].flag} ${MARKET[market].label}${MARKET[market].mult > 1 ? ` (×${MARKET[market].mult})` : ""}` },
    { l: "Client Type", v: `${CLIENT_TYPE[clientType].label}${CLIENT_TYPE[clientType].mult > 1 ? ` (×${CLIENT_TYPE[clientType].mult})` : ""}` },
    { l: "Urgency", v: `${URGENCY[urgency].label}${URGENCY[urgency].mult !== 1 ? ` (×${URGENCY[urgency].mult})` : ""}` },
    { l: "Impact", v: `${IMPACT[impact].label}${IMPACT[impact].mult > 1 ? ` (×${IMPACT[impact].mult})` : ""}` },
  ];
  const sR = [
    { l: "Cost Markup", v: `${marginX}×`, c: "#C9F76F" },
    { l: "Value Adj.", v: `${adjMult.toFixed(2)}×`, c: adjMult > 1 ? "#C9F76F" : "#888" },
    { l: "Total Mult.", v: `${(marginX * adjMult).toFixed(2)}× cost`, c: "#C9F76F" },
    { l: "Gross Margin", v: `${calc.margin.toFixed(0)}%`, c: calc.margin >= 50 ? "#C9F76F" : calc.margin >= 35 ? "#A8D84E" : "#F7D76F" },
  ];
  sL.forEach((s, i) => { ctx.font = sn(11); ctx.fillStyle = "#555"; ctx.fillText(s.l, pad, y + i * 22); ctx.fillStyle = "#CCC"; ctx.fillText(s.v, pad + 120, y + i * 22); });
  sR.forEach((s, i) => { ctx.font = sn(11); ctx.fillStyle = "#555"; ctx.fillText(s.l, pad + 400, y + i * 22); ctx.font = mn(11); ctx.fillStyle = s.c; ctx.fillText(s.v, pad + 530, y + i * 22); });
  y += 100;
  const bW = (W - pad * 2 - 30) / 4;
  [
    { l: "TOTAL HOURS", v: `${calc.totalHrs}h`, sub: hrsToDays(calc.totalHrs) },
    { l: "AVG RATE", v: `₹${calc.avgEffRate}/hr` },
    { l: "YOUR COST", v: formatINR(calc.totalCost) },
    { l: "PROFIT", v: formatINR(calc.totalPrice - calc.totalCost), sub: `${calc.margin.toFixed(0)}% margin` },
  ].forEach((b, i) => {
    const bx = pad + i * (bW + 10);
    ctx.fillStyle = "#0D0D0F"; ctx.beginPath(); ctx.roundRect(bx, y, bW, 58, 6); ctx.fill();
    ctx.font = mn(7); ctx.fillStyle = "#444"; ctx.fillText(b.l, bx + 10, y + 18);
    ctx.font = `bold ${mn(12)}`; ctx.fillStyle = "#E8E6E3"; ctx.fillText(b.v, bx + 10, y + 36);
    if (b.sub) { ctx.font = mn(8); ctx.fillStyle = "#555"; ctx.fillText(b.sub, bx + 10, y + 50); }
  });
  y += 78; ctx.font = mn(9); ctx.fillStyle = "#333"; ctx.textAlign = "center"; ctx.fillText("emilda.co  ·  Chaos to Control", W / 2, y);
  return canvas.toDataURL("image/jpeg", 0.95);
}

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

  const adjMult = useMemo(() => MARKET[market].mult * CLIENT_TYPE[clientType].mult * URGENCY[urgency].mult * IMPACT[impact].mult, [market, clientType, urgency, impact]);

  const calcLines = useCallback((enabled, hours) => {
    const lines = []; let totalHrs = 0, totalCost = 0, totalPrice = 0;
    Object.entries(WORK_TYPES).forEach(([k, wt]) => {
      if (enabled[k] && hours[k] > 0) {
        const h = hours[k], effRate = Math.round(wt.costRate * marginX * adjMult), cost = wt.costRate * h, price = effRate * h;
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
  const downloadImg = () => { if (!quoteImg) return; const a = document.createElement("a"); a.href = quoteImg; a.download = `emilda-quote-${(tab === "project" ? clientName : qClient) || "quote"}-${Date.now()}.jpg`.replace(/\s+/g,"-"); a.click(); };

  if (quoteImg) return (
    <div className="app-root"><style>{CSS}</style>
      <div style={{maxWidth:850,margin:"0 auto",padding:20}}>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <button className="btn-outline" onClick={()=>setQuoteImg(null)}>← Back</button>
          <button className="btn-primary" onClick={downloadImg}>⬇ Download JPEG</button>
        </div>
        <p style={{fontSize:14,color:"#888",marginBottom:16}}>Long-press or right-click to save/share.</p>
        <img src={quoteImg} alt="Quote" style={{width:"100%",borderRadius:12,border:"1px solid #1E1E20"}} />
      </div>
    </div>
  );

  const ValueFactors = () => (
    <div className="card">
      <div className="lbl">Value Adjustments</div>
      <p className="hint">India + Family + Normal + Ops = 1.0× (no change).</p>
      <div className="factor-grid">
        <div><div className="factor-label">Market</div><div className="pill-row">{Object.entries(MARKET).map(([k,v])=><button key={k} className={`pill ${market===k?"active":""}`} onClick={()=>setMarket(k)}><span className="pill-main">{v.flag} {v.label}</span><span className="pill-sub">{v.mult>1?`×${v.mult}`:"base"}</span></button>)}</div></div>
        <div><div className="factor-label">Client</div><div className="pill-row">{Object.entries(CLIENT_TYPE).map(([k,v])=><button key={k} className={`pill ${clientType===k?"active":""}`} onClick={()=>setClientType(k)}><span className="pill-main">{v.label}</span><span className="pill-sub">{v.mult>1?`×${v.mult}`:"base"}</span></button>)}</div></div>
        <div><div className="factor-label">Urgency</div><div className="pill-row">{Object.entries(URGENCY).map(([k,v])=><button key={k} className={`pill ${urgency===k?"active":""}`} onClick={()=>setUrgency(k)}><span className="pill-main">{v.label}</span><span className="pill-sub">{v.mult!==1?`×${v.mult}`:"base"}</span></button>)}</div></div>
        <div><div className="factor-label">Impact</div><div className="pill-row">{Object.entries(IMPACT).map(([k,v])=><button key={k} className={`pill ${impact===k?"active":""}`} onClick={()=>setImpact(k)}><span className="pill-main">{v.label}</span><span className="pill-sub">{v.mult>1?`×${v.mult}`:"base"}</span></button>)}</div></div>
      </div>
      <div className={`adj-bar ${adjMult===1?"":"active"}`}><span>{adjMult===1?"No adjustment":"Adjustment applied"}</span><span className="adj-val">{adjMult.toFixed(2)}×</span></div>
    </div>
  );

  const WorkLines = ({enabled,hours,onToggle,onHours,calc}) => (
    <div className="card">
      <div className="lbl">Work Breakdown</div>
      <p className="hint">Toggle types, enter hours.</p>
      {Object.entries(WORK_TYPES).map(([k,wt])=>{const on=enabled[k],h=hours[k],effRate=Math.round(wt.costRate*marginX*adjMult);return(
        <div key={k} className={`work-row ${on?"on":"off"}`}>
          <div className="work-top">
            <label className="work-toggle"><input type="checkbox" checked={on} onChange={()=>onToggle(k)}/><span className="work-icon">{wt.icon}</span><span className="work-name">{wt.label}</span></label>
            <div className="work-price">{on&&h>0?formatINR(effRate*h):"—"}</div>
          </div>
          {on&&(<div className="work-detail">
            <div className="work-rate">₹{wt.costRate} → <span className="accent">₹{effRate}/hr</span></div>
            <div className="work-input-row">
              <button className="step-btn" onClick={()=>onHours(k,Math.max(0,h-8))}>−8h</button>
              <input type="number" className="hours-input" min={0} max={2000} value={h||""} placeholder="0" onChange={e=>onHours(k,Math.max(0,Number(e.target.value)))}/>
              <span className="hours-label">hours</span>
              <button className="step-btn" onClick={()=>onHours(k,h+8)}>+8h</button>
              <span className="duration-badge">{h>0?hrsToDays(h):"—"}</span>
            </div>
          </div>)}
        </div>
      );})}
      <div className="work-total"><div><span className="work-total-hrs">{calc.totalHrs}h</span><span className="work-total-dur">{hrsToDays(calc.totalHrs)}</span></div><div className="work-total-price">{formatINR(calc.totalPrice)}</div></div>
    </div>
  );

  const MarginSlider = () => (
    <div className="card">
      <div className="lbl">Cost Markup</div>
      <p className="hint">2.5× minimum → 4× premium.</p>
      <div className="margin-control">
        <div className="margin-display"><span className="margin-val">{marginX.toFixed(1)}×</span><span className="margin-sub">markup</span></div>
        <div className="margin-slider-wrap">
          <input type="range" className="range-input" min={250} max={400} value={marginX*100} onChange={e=>setMarginX(Number(e.target.value)/100)} style={{"--v":`${((marginX-2.5)/1.5)*100}%`}}/>
          <div className="margin-labels"><span>2.5×</span><span>4×</span></div>
        </div>
      </div>
      <div className="margin-presets">{[2.5,3.0,3.5,4.0].map(v=><button key={v} className={`preset-btn ${marginX===v?"active":""}`} onClick={()=>setMarginX(v)}>{v}×</button>)}</div>
      <div className="margin-preview">{Object.entries(WORK_TYPES).map(([k,wt])=><span key={k}>{wt.icon} ₹{Math.round(wt.costRate*marginX)}/hr</span>)}</div>
    </div>
  );

  const ModelPicker = () => (
    <div className="card">
      <div className="lbl">How to Charge</div>
      <div className="pill-row">{Object.entries(MODEL_OPTS).map(([k,v])=><button key={k} className={`pill ${model===k?"active":""}`} onClick={()=>setModel(k)}><span className="pill-main">{v.label}</span><span className="pill-sub">{v.d}</span></button>)}</div>
      {model==="retainer"&&<div className="retainer-row"><span>Over</span><button className="step-btn" onClick={()=>setRetainerMonths(Math.max(1,retainerMonths-1))}>−</button><span className="retainer-num">{retainerMonths}</span><button className="step-btn" onClick={()=>setRetainerMonths(Math.min(24,retainerMonths+1))}>+</button><span>mo</span><span className="retainer-price">{formatINR(retainerMo)}/mo</span></div>}
    </div>
  );

  const QuoteSummary = ({calc,onGenerate,disabled}) => (
    <div className="quote-summary">
      <div className="quote-left"><div className="quote-label">CLIENT QUOTE</div><div className="quote-amount">{formatINR(calc.totalPrice)}</div><div className="quote-meta"><span className="quote-margin" style={{color:mColor(calc.margin)}}>{calc.margin.toFixed(0)}% margin</span><span className="quote-mult">{calc.multiple.toFixed(1)}× cost</span></div></div>
      <button className="btn-generate" disabled={disabled} onClick={onGenerate}>📸 Generate<br/>Quote Image</button>
    </div>
  );

  const tabs = [{k:"project",l:"Project",icon:"📐"},{k:"quick",l:"Quick Task",icon:"⚡"},{k:"ratecard",l:"Rates",icon:"📊"}];

  return (
    <div className="app-root"><style>{CSS}</style>
      <header className="header">
        <div className="header-inner"><div className="brand">EMILDA & CO.</div><h1 className="title">Pricing & Quotes</h1></div>
        <nav className="tab-bar">{tabs.map(t=><button key={t.k} className={`tab ${tab===t.k?"active":""}`} onClick={()=>setTab(t.k)}><span className="tab-icon">{t.icon}</span><span className="tab-label">{t.l}</span></button>)}</nav>
      </header>
      <main className="main">
        {tab==="project"&&<>
          <div className="card"><div className="lbl">Client & Project</div><div className="form-stack"><input className="inp" placeholder="Client name" value={clientName} onChange={e=>setClientName(e.target.value)}/><input className="inp" placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)}/><input className="inp" placeholder="Your name" value={preparedBy} onChange={e=>setPreparedBy(e.target.value)}/></div></div>
          <WorkLines enabled={pEnabled} hours={pHours} onToggle={toggleP} onHours={setHP} calc={pCalc}/>
          <MarginSlider/><ValueFactors/><ModelPicker/>
          <QuoteSummary calc={pCalc} disabled={!clientName||pCalc.lines.length===0} onGenerate={()=>doGenerate(pCalc,clientName,projectName,preparedBy,false,"")}/>
        </>}
        {tab==="quick"&&<>
          <div className="card"><div className="lbl">⚡ Quick Task / Scope Change</div><p className="hint">Extra feature, scope change, ad-hoc work.</p><div className="form-stack"><input className="inp" placeholder="Client" value={qClient} onChange={e=>setQClient(e.target.value)}/><input className="inp" placeholder="What's the task?" value={qDesc} onChange={e=>setQDesc(e.target.value)}/><input className="inp" placeholder="Your name" value={qPrepBy} onChange={e=>setQPrepBy(e.target.value)}/></div></div>
          <WorkLines enabled={qEnabled} hours={qHours} onToggle={toggleQ} onHours={setHQ} calc={qCalc}/>
          <MarginSlider/><ValueFactors/>
          <QuoteSummary calc={qCalc} disabled={!qClient||qCalc.lines.length===0} onGenerate={()=>doGenerate(qCalc,qClient,"",qPrepBy,true,qDesc)}/>
        </>}
        {tab==="ratecard"&&<>
          <div className="card"><div className="lbl">Rate Card</div><p className="hint">Cost × {marginX}× markup = client rate.</p>
            {Object.entries(WORK_TYPES).map(([k,wt])=><div key={k} className="rate-row"><div className="rate-left"><span className="rate-icon">{wt.icon}</span><div><div className="rate-name">{wt.label}</div><div className="rate-cost">Cost: ₹{wt.costRate}/hr</div></div></div><div className="rate-right"><div className="rate-client">₹{Math.round(wt.costRate*marginX)}/hr</div><div className="rate-gulf">Gulf: ₹{Math.round(wt.costRate*marginX*1.8)}</div></div></div>)}
          </div>
          <div className="card"><div className="lbl">Hour References</div>
            {[{h:2,d:"Bug fix, tiny tweak"},{h:8,d:"1 day — small feature"},{h:24,d:"3 days — module"},{h:40,d:"1 week — feature set"},{h:80,d:"2 weeks — solid build"},{h:160,d:"1 month — full app"},{h:400,d:"2.5 months — platform"}].map((r,i)=><div key={i} className="hour-ref-row"><span className="hour-ref-h">{r.h}h</span><span className="hour-ref-desc">{r.d}</span><span className="hour-ref-dur">{hrsToDays(r.h)}</span></div>)}
          </div>
          <div className="rules-box"><strong>PRICING RULES</strong><br/>🟢 Never below 2.5× cost<br/>🟢 Gulf: always ×1.8 minimum<br/>🟢 50% advance on all build<br/>🟢 Scope changes = new quotes<br/>🟢 Generate image → send to Paul → approval</div>
        </>}
      </main>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090B;--card:#111113;--border:#1E1E20;--text:#E8E6E3;--muted:#888;--dim:#555;--faint:#333;--accent:#C9F76F;--accent-dim:#8AB34A;--mono:'Space Mono',monospace;--sans:'DM Sans',system-ui,sans-serif;--radius:12px}
.app-root{min-height:100vh;min-height:100dvh;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;-webkit-font-smoothing:antialiased}
.header{border-bottom:1px solid var(--border);padding:16px 20px 0;position:sticky;top:0;z-index:10;background:var(--bg)}
.header-inner{max-width:700px;margin:0 auto}
.brand{font-family:var(--mono);font-size:11px;letter-spacing:3px;color:var(--accent)}
.title{font-size:20px;font-weight:700;margin-top:2px}
.tab-bar{max-width:700px;margin:12px auto 0;display:flex;gap:4px}
.tab{flex:1;padding:14px 8px 12px;border:none;background:0;color:var(--dim);font-size:14px;font-weight:600;font-family:var(--sans);cursor:pointer;border-bottom:3px solid transparent;transition:.15s;display:flex;align-items:center;justify-content:center;gap:6px}
.tab.active{color:var(--text);border-bottom-color:var(--accent)}
.tab-icon{font-size:18px}
.main{max-width:700px;margin:0 auto;padding:16px 16px 100px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px}
.lbl{font-family:var(--mono);font-size:11px;letter-spacing:2px;color:var(--accent);text-transform:uppercase;margin-bottom:14px;font-weight:700}
.hint{font-size:13px;color:var(--dim);margin-bottom:16px;line-height:1.5}
.accent{color:var(--accent);font-weight:700}
.inp{width:100%;padding:14px 16px;border-radius:10px;border:1.5px solid var(--border);background:#0D0D0F;color:var(--text);font-size:16px;font-family:var(--sans);outline:0;transition:.15s}
.inp:focus{border-color:var(--accent)}
.inp::placeholder{color:var(--faint)}
.form-stack{display:flex;flex-direction:column;gap:12px}
@media(min-width:600px){.form-stack{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}}
.pill-row{display:flex;gap:8px;flex-wrap:wrap}
.pill{flex:1 1 0;min-width:70px;padding:12px 10px;border-radius:10px;border:2px solid var(--border);background:var(--card);cursor:pointer;transition:.15s;text-align:left;font-family:var(--sans);display:flex;flex-direction:column;gap:2px}
.pill:active{transform:scale(.97)}
.pill.active{border-color:var(--accent);background:rgba(201,247,111,.05)}
.pill-main{font-size:14px;font-weight:700;color:var(--muted)}
.pill.active .pill-main{color:var(--accent)}
.pill-sub{font-size:11px;color:var(--faint)}
.pill.active .pill-sub{color:var(--accent-dim)}
.factor-grid{display:flex;flex-direction:column;gap:16px}
@media(min-width:600px){.factor-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
.factor-label{font-size:12px;color:var(--dim);margin-bottom:8px;font-weight:600}
.adj-bar{margin-top:14px;padding:12px 14px;background:#1A1A1C;border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--dim)}
.adj-bar.active{background:rgba(201,247,111,.04);border-color:rgba(201,247,111,.15);color:var(--accent-dim)}
.adj-val{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--muted)}
.adj-bar.active .adj-val{color:var(--accent)}
.work-row{border-bottom:1px solid #161618;padding:14px 0;transition:.15s}
.work-row.off{opacity:.35}
.work-top{display:flex;justify-content:space-between;align-items:center}
.work-toggle{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:16px}
.work-toggle input{width:22px;height:22px;accent-color:var(--accent);cursor:pointer}
.work-icon{font-size:22px}
.work-name{font-size:16px;font-weight:700}
.work-price{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent)}
.work-row.off .work-price{color:var(--faint)}
.work-detail{margin-top:12px;padding-left:54px}
@media(max-width:500px){.work-detail{padding-left:0}}
.work-rate{font-size:12px;color:var(--dim);margin-bottom:10px}
.work-input-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hours-input{width:80px;padding:10px 8px;border-radius:8px;border:1.5px solid var(--border);background:#0D0D0F;color:var(--text);font-size:18px;font-family:var(--mono);font-weight:700;outline:0;text-align:center}
.hours-input:focus{border-color:var(--accent)}
.hours-label{font-size:14px;color:var(--dim)}
.step-btn{padding:8px 14px;border-radius:8px;border:1.5px solid var(--border);background:#0D0D0F;color:var(--muted);font-size:14px;font-weight:700;font-family:var(--mono);cursor:pointer;transition:.15s}
.step-btn:active{transform:scale(.95);border-color:var(--accent);color:var(--accent)}
.duration-badge{margin-left:auto;font-family:var(--mono);font-size:14px;font-weight:700;color:var(--muted);background:#1A1A1C;padding:6px 12px;border-radius:6px}
.work-total{display:flex;justify-content:space-between;align-items:center;padding:16px 0 4px;border-top:2px solid var(--border);margin-top:8px}
.work-total-hrs{font-family:var(--mono);font-size:20px;font-weight:700}
.work-total-dur{font-size:14px;color:var(--dim);margin-left:10px}
.work-total-price{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--accent)}
.margin-control{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.margin-display{text-align:center;min-width:80px}
.margin-val{font-family:var(--mono);font-size:32px;font-weight:700;color:var(--accent);display:block}
.margin-sub{font-size:12px;color:var(--dim)}
.margin-slider-wrap{flex:1;min-width:200px}
.range-input{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:4px;outline:0;cursor:pointer;background:linear-gradient(to right,var(--accent) var(--v),var(--border) var(--v))}
.range-input::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:var(--accent);border:4px solid var(--bg);cursor:pointer;box-shadow:0 0 0 2px rgba(201,247,111,.2)}
.margin-labels{display:flex;justify-content:space-between;font-size:12px;color:var(--faint);margin-top:6px}
.margin-presets{display:flex;gap:8px;margin-top:14px}
.preset-btn{flex:1;padding:10px;border-radius:8px;border:1.5px solid var(--border);background:0;color:var(--dim);font-family:var(--mono);font-size:15px;font-weight:700;cursor:pointer;transition:.15s}
.preset-btn:active{transform:scale(.95)}
.preset-btn.active{border-color:var(--accent);color:var(--accent);background:rgba(201,247,111,.05)}
.margin-preview{margin-top:12px;padding:10px 14px;background:#0D0D0F;border-radius:8px;display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--accent);font-family:var(--mono)}
.retainer-row{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:15px;color:var(--muted);flex-wrap:wrap}
.retainer-num{font-family:var(--mono);font-size:22px;font-weight:700;min-width:30px;text-align:center}
.retainer-price{margin-left:auto;font-family:var(--mono);font-weight:700;color:var(--accent);font-size:16px}
.quote-summary{background:linear-gradient(160deg,#181C10 0%,var(--card) 35%);border:2px solid #2A2C22;border-radius:14px;padding:20px;display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap}
.quote-label{font-family:var(--mono);font-size:10px;letter-spacing:2px;color:var(--dim)}
.quote-amount{font-family:var(--mono);font-size:32px;font-weight:700;color:var(--accent);margin-top:4px}
@media(max-width:500px){.quote-amount{font-size:24px}}
.quote-meta{display:flex;gap:12px;margin-top:6px;font-size:13px}
.quote-margin{font-family:var(--mono);font-weight:700}
.quote-mult{color:var(--dim)}
.btn-generate{padding:18px 24px;border-radius:12px;border:none;background:var(--accent);color:var(--bg);font-size:15px;font-weight:700;cursor:pointer;font-family:var(--sans);line-height:1.3;text-align:center;white-space:nowrap;min-width:140px;transition:.15s}
.btn-generate:active{opacity:.85;transform:scale(.97)}
.btn-generate:disabled{opacity:.3;cursor:not-allowed}
.btn-primary{padding:14px 24px;border-radius:10px;border:none;background:var(--accent);color:var(--bg);font-size:16px;font-weight:700;cursor:pointer;font-family:var(--sans)}
.btn-outline{padding:14px 20px;border-radius:10px;border:2px solid var(--border);background:0;color:var(--muted);font-size:15px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.rate-row{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #161618}
.rate-left{display:flex;align-items:center;gap:12px}
.rate-icon{font-size:28px}
.rate-name{font-size:16px;font-weight:700}
.rate-cost{font-size:12px;color:var(--dim)}
.rate-right{text-align:right}
.rate-client{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--accent)}
.rate-gulf{font-size:11px;color:var(--dim);margin-top:2px}
.hour-ref-row{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #131315;gap:12px}
.hour-ref-h{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent);min-width:50px;text-align:right}
.hour-ref-desc{font-size:14px;color:var(--muted);flex:1}
.hour-ref-dur{font-family:var(--mono);font-size:13px;color:var(--dim)}
.rules-box{background:#0D0D0F;border:2px dashed var(--border);border-radius:var(--radius);padding:18px;font-size:14px;color:var(--dim);line-height:2}
.rules-box strong{color:var(--accent-dim);font-family:var(--mono);font-size:11px;letter-spacing:1px}
`;
