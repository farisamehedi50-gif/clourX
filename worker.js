/* ==========================================================================
   ColorX Daily Predictor — Cloudflare Worker (Full Website + Prediction Engine)
   ========================================================================== */

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?ts=";
const BIG_POOL = [5, 6, 7, 8, 9];
const SMALL_POOL = [0, 1, 2, 3, 4];
const BS = (n) => (Number(n) >= 5 ? "B" : "S");
const SZ = (c) => (c === "B" ? "BIG" : "SMALL");

const SIGS = [
  { n: "Dragon Big Break",   s: "BBBBB", x: "S", c: 90, g: "DRAGON" },
  { n: "Dragon Small Break", s: "SSSSS", x: "B", c: 90, g: "DRAGON" },
  { n: "Quad Big Run",       s: "BBBB",  x: "S", c: 82, g: "DRAGON" },
  { n: "Quad Small Run",     s: "SSSS",  x: "B", c: 82, g: "DRAGON" },
  { n: "Triple Big Push",    s: "BBB",   x: "S", c: 71, g: "STREAK" },
  { n: "Triple Small Push",  s: "SSS",   x: "B", c: 71, g: "STREAK" },
  { n: "Mirror Chain BSBSB", s: "BSBSB", x: "S", c: 87, g: "MIRROR" },
  { n: "Mirror Chain SBSBS", s: "SBSBS", x: "B", c: 87, g: "MIRROR" },
  { n: "Zigzag BSBS",        s: "BSBS",  x: "B", c: 78, g: "MIRROR" },
  { n: "Zigzag SBSB",        s: "SBSB",  x: "S", c: 78, g: "MIRROR" },
  { n: "Single Alternate",   s: "BSB",   x: "S", c: 64, g: "MIRROR" },
  { n: "Single Alternate R", s: "SBS",   x: "B", c: 64, g: "MIRROR" },
  { n: "Double Trend BBSS",  s: "BBSS",  x: "B", c: 76, g: "DOUBLE" },
  { n: "Double Trend SSBB",  s: "SSBB",  x: "S", c: 76, g: "DOUBLE" },
  { n: "Double Cycle BBSSB", s: "BBSSB", x: "B", c: 80, g: "DOUBLE" },
  { n: "Double Cycle SSBBS", s: "SSBBS", x: "S", c: 80, g: "DOUBLE" },
  { n: "Pair Open B",        s: "SBB",   x: "S", c: 62, g: "DOUBLE" },
  { n: "Pair Open S",        s: "BSS",   x: "B", c: 62, g: "DOUBLE" },
  { n: "Three in One B",     s: "BBBSB", x: "B", c: 79, g: "GROUP" },
  { n: "Three in One S",     s: "SSSBS", x: "S", c: 79, g: "GROUP" },
  { n: "Two in One B",       s: "BBSBB", x: "S", c: 75, g: "GROUP" },
  { n: "Two in One S",       s: "SSBSS", x: "B", c: 75, g: "GROUP" },
  { n: "Three in Two B",     s: "BBBSS", x: "B", c: 77, g: "GROUP" },
  { n: "Three in Two S",     s: "SSSBB", x: "S", c: 77, g: "GROUP" },
  { n: "Big Wall Break",     s: "BBBBS", x: "S", c: 74, g: "BREAK" },
  { n: "Small Wall Break",   s: "SSSSB", x: "B", c: 74, g: "BREAK" },
  { n: "Trap Reversal B",    s: "SBBBS", x: "B", c: 72, g: "BREAK" },
  { n: "Trap Reversal S",    s: "BSSSB", x: "S", c: 72, g: "BREAK" },
  { n: "Snap Back B",        s: "BSSB",  x: "S", c: 68, g: "BREAK" },
  { n: "Snap Back S",        s: "SBBS",  x: "B", c: 68, g: "BREAK" },
  { n: "Sandwich B-S-B",     s: "BBSBS", x: "B", c: 73, g: "TRAP" },
  { n: "Sandwich S-B-S",     s: "SSBSB", x: "S", c: 73, g: "TRAP" },
  { n: "Ladder Up",          s: "SSBBB", x: "S", c: 70, g: "TRAP" },
  { n: "Ladder Down",        s: "BBSSS", x: "B", c: 70, g: "TRAP" },
  { n: "Doublet Big",        s: "BB",    x: "S", c: 58, g: "BASE" },
  { n: "Doublet Small",      s: "SS",    x: "B", c: 58, g: "BASE" },
  { n: "Flip Big",           s: "B",     x: "S", c: 53, g: "BASE" },
  { n: "Flip Small",         s: "S",     x: "B", c: 53, g: "BASE" }
];

const TURNS = [
  { k: "STREAK",    label: "📈 DRIFT EXTENSION · trend replication" },
  { k: "ALTERNATE", label: "🔄 INVERSION DYNAMICS · trend flip" },
  { k: "ZIGZAG",    label: "⚡ DUAL CHRONO · periodic alternate" },
  { k: "GROUP",     label: "📦 CLUSTERED SEQUENCES · block repeats" },
  { k: "REVERSE",   label: "🔁 ANOMALY SHIFT · reverse prediction" }
];

const LIB = [
  { name: "Single Trend", seq: "BSBSB" }, { name: "Double Trend", seq: "SSBBS" },
  { name: "Triple Trend", seq: "BBBS" },  { name: "Quadra Trend", seq: "SSSSBBB" },
  { name: "Three in One", seq: "BBBSBBB" }, { name: "Two in One", seq: "SSBSSBSS" },
  { name: "Three in Two", seq: "BBBSSBBB" }, { name: "Four in One", seq: "SSSSBSSSS" },
  { name: "Long Small",   seq: "SSSSSSSS" }, { name: "Long Big", seq: "BBBBBBBB" },
  { name: "Opp Single",   seq: "SBSBS" }, { name: "Opp Double", seq: "BBSSB" },
  { name: "Opp Triple",   seq: "SSSB" },  { name: "Opp Quadra", seq: "BBBBSSS" },
  { name: "Strong B",     seq: "BBBB" },  { name: "Strong S", seq: "SSSS" },
  { name: "Alternation",  seq: "BSBS" },  { name: "Doublet-B", seq: "BB" }, { name: "Doublet-S", seq: "SS" }
].map((p) => ({ ...p, arr: p.seq.split("") }));

function chrono(h, n) {
  return h.slice(0, n).reverse().join("");
}

function scanPatterns(h) {
  const win = chrono(h, 5);
  const hits = [];
  for (const p of SIGS) {
    if (p.s.length > win.length) continue;
    if (win.endsWith(p.s)) {
      hits.push({ ...p, score: p.c + p.s.length * 4 });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits;
}

function E_signature(h) {
  if (h.length < 2) return null;
  const hits = scanPatterns(h);
  if (!hits.length) return null;
  const top = hits[0];
  const agree = hits.slice(0, 3).filter((x) => x.x === top.x).length;
  const conf = Math.min(96, top.c + (agree - 1) * 3);
  return { c: top.x, conf, name: top.n, group: top.g, hits, w: 2.4 };
}

function matchScore(hist, pat) {
  if (!pat.length || hist.length < 2) return 0;
  let score = 0;
  const max = pat.length * 2;
  const sl = Math.min(5, pat.length, hist.length);
  const hS = hist.slice(0, sl);
  const pS = pat.slice(-sl).reverse();
  for (let i = 0; i < sl; i++) {
    if (hS[i] === pS[i]) score += 2.2 - i * 0.3;
  }
  let lcs = 0, j = 0;
  for (let i = 0; i < hist.length && j < pat.length; i++) {
    if (hist[i] === pat[j]) { lcs++; j++; }
  }
  score += lcs * 0.7;
  if (pat.length > hist.length + 3) score *= 0.4;
  return Math.min(score / max, 1.2);
}

function E_library(h) {
  if (h.length < 3) return null;
  let best = null, bs = -1;
  for (const p of LIB) {
    const sc = matchScore(h, p.arr);
    if (sc > bs) { bs = sc; best = p; }
  }
  if (!best) return null;
  let ch;
  if (bs > 0.35) {
    let m = 0;
    for (let i = 0; i < best.arr.length; i++) {
      if (i >= h.length) break;
      if (h[i] === best.arr[best.arr.length - 1 - i]) m++;
      else break;
    }
    const ni = best.arr.length - 1 - m;
    ch = ni >= 0 && ni < best.arr.length ? best.arr[ni] : (h[0] === "B" ? "S" : "B");
  } else {
    const r8 = h.slice(0, 8), b = r8.filter((x) => x === "B").length, s = r8.length - b;
    ch = b >= s + 2 ? "S" : (s >= b + 2 ? "B" : (h[0] === "B" ? "S" : "B"));
  }
  return { c: ch, conf: Math.min(94, Math.max(54, Math.round(bs * 100))), name: best.name, w: 1.5 };
}

function E_markov(h) {
  const s = chrono(h, 24);
  if (s.length < 5) return null;
  const key = s.slice(-2);
  let cb = 0, cs = 0;
  for (let i = 0; i < s.length - 2; i++) {
    if (s.slice(i, i + 2) === key) { s[i + 2] === "B" ? cb++ : cs++; }
  }
  const tot = cb + cs;
  if (tot < 2) return null;
  const pb = cb / tot;
  if (pb > 0.58) return { c: "B", conf: Math.min(92, Math.round(pb * 100)), name: `Markov Chain [${key}→B]`, w: 1.8 };
  if (pb < 0.42) return { c: "S", conf: Math.min(92, Math.round((1 - pb) * 100)), name: `Markov Chain [${key}→S]`, w: 1.8 };
  return { c: pb >= 0.5 ? "B" : "S", conf: 56, name: "Markov Neutral", w: 0.8 };
}

function E_weighted(h) {
  if (h.length < 3) return null;
  let same = 1;
  for (let i = 1; i < Math.min(h.length, 6); i++) {
    if (h[i] === h[0]) same++;
    else break;
  }
  if (same >= 3) return { c: h[0] === "B" ? "S" : "B", conf: Math.min(93, 68 + same * 5), name: "🐉 Dragon Breaker ×" + same, w: 2.2 };
  let mirror = true;
  for (let i = 1; i < Math.min(h.length, 5); i++) {
    if (h[i] === h[i - 1]) { mirror = false; break; }
  }
  if (mirror && h.length >= 4) return { c: h[0] === "B" ? "S" : "B", conf: 84, name: "🪞 Mirror Track", w: 2.0 };
  let bw = 0, tw = 0;
  for (let i = 0; i < Math.min(h.length, 12); i++) {
    const w = 12 - i;
    if (h[i] === "B") bw += w;
    tw += w;
  }
  const ratio = tw ? bw / tw : 0.5;
  const c = ratio > 0.58 ? "B" : (ratio < 0.42 ? "S" : (h[0] === "B" ? "S" : "B"));
  return {
    c,
    conf: Math.min(90, Math.max(56, Math.round(Math.abs(ratio - 0.5) * 180 + 56))),
    name: "📊 Weight Ratio B:" + Math.round(ratio * 100) + "%",
    w: 1.6
  };
}

function E_entropy(h) {
  if (h.length < 4) return null;
  let bScore = 0, sScore = 0;
  h.slice(0, 30).forEach((x, i) => {
    const w = i < 5 ? 3 : (i < 12 ? 2 : 1);
    x === "B" ? bScore += w : sScore += w;
  });
  let c = bScore > sScore ? "B" : "S";
  const l5 = h.slice(0, 5);
  if (l5[0] === l5[1] && l5[2] === l5[3] && l5[0] !== l5[2]) c = l5[0];
  let run = 0;
  for (const x of h) { if (x === h[0]) run++; else break; }
  let name = "Entropy Balance";
  if (run > 5) { c = h[0] === "B" ? "S" : "B"; name = "Entropy Overload ×" + run; }
  const spread = Math.abs(bScore - sScore) / Math.max(1, bScore + sScore);
  return { c, conf: Math.min(94, Math.round(60 + spread * 70)), name, w: 1.4 };
}

function E_turn(h, turn = 0, turnIdx = 0) {
  if (!h.length) return null;
  const k = TURNS[turnIdx % TURNS.length].k;
  const last = h[0], l2 = h.slice(0, 2);
  let c;
  switch (k) {
    case "ALTERNATE": c = last; break;
    case "ZIGZAG":    c = l2.length >= 2 && l2[0] !== l2[1] ? (l2[1] === "B" ? "S" : "B") : last; break;
    case "GROUP":     c = h.length >= 4 && h[0] === h[2] ? (h[0] === "B" ? "S" : "B") : last; break;
    case "REVERSE":   c = last; break;
    default:          c = last === "B" ? "S" : "B";
  }
  return { c, conf: 65 + (turn % 5) * 3, name: `🔄 ${k} (turn ${turn})`, w: 1.1 };
}

function E_guard(h) {
  if (h.length < 3) return null;
  let st = 1;
  for (let i = 1; i < h.length; i++) { if (h[i] === h[0]) st++; else break; }
  if (st >= 3) return { c: h[0] === "B" ? "S" : "B", conf: Math.min(92, 70 + st * 4), name: "🛡 Streak Guard ×" + st, w: 2.0 };
  const l10 = h.slice(0, 10), b = l10.filter((x) => x === "B").length, s = l10.length - b;
  return { c: b > s ? "B" : "S", conf: Math.min(84, 55 + Math.abs(b - s) * 5), name: `Majority Window ${b}B/${s}S`, w: 1.2 };
}

const ENGINES = [
  { id: "SIG",     ico: "🎯", label: "SIGNATURE", fn: (h) => E_signature(h) },
  { id: "LIB",     ico: "📚", label: "LIBRARY",   fn: (h) => E_library(h) },
  { id: "MARKOV",  ico: "🧬", label: "MARKOV",    fn: (h) => E_markov(h) },
  { id: "WEIGHT",  ico: "📊", label: "WEIGHTED",  fn: (h) => E_weighted(h) },
  { id: "ENTROPY", ico: "🌀", label: "ENTROPY",   fn: (h) => E_entropy(h) },
  { id: "TURN",    ico: "🔄", label: "TURN",      fn: (h, ctx) => E_turn(h, ctx.turn, ctx.turnIdx) },
  { id: "GUARD",   ico: "🛡", label: "GUARD",     fn: (h) => E_guard(h) }
];

function fuse(h, opts = {}) {
  const mode = opts.mode || "ALL";
  const guardEnabled = opts.guard !== false;
  const ctx = { turn: opts.turn || 0, turnIdx: opts.turnIdx || 0 };

  const votes = ENGINES.map((e) => {
    try {
      const r = e.fn(h, ctx);
      return r ? { ...e, ...r } : { ...e, c: null, conf: 0, name: "—", w: 0 };
    } catch (_) {
      return { ...e, c: null, conf: 0, name: "—", w: 0 };
    }
  });

  const active = votes.filter((v) => v.c);
  if (!active.length) {
    return { pred: "BIG", conf: 52, name: "Initial Scanning Matrix", group: "INIT", votes, hits: [], agree: 0, total: 0 };
  }

  const sig = votes.find((v) => v.id === "SIG");
  const solo = { SIG: "SIG", MARKOV: "MARKOV", TREND: "WEIGHT", GUARD: "GUARD", TURN: "TURN" }[mode];
  if (solo) {
    const v = votes.find((x) => x.id === solo && x.c) || active[0];
    return { pred: SZ(v.c), conf: v.conf, name: v.name, group: v.group || mode, votes, hits: (sig && sig.hits) || [], agree: 1, total: active.length };
  }

  let B = 0, Sc = 0;
  active.forEach((v) => {
    const p = v.w * (v.conf / 100);
    v.c === "B" ? B += p : Sc += p;
  });

  let c = B >= Sc ? "B" : "S";
  const totalW = B + Sc;
  const dom = totalW ? Math.max(B, Sc) / totalW : 0.5;
  let conf = Math.round(48 + dom * 46);
  let name = sig && sig.c ? sig.name : active[0].name;
  let group = sig && sig.c ? sig.group : "FUSION";

  if (sig && sig.c && sig.hits.length && sig.hits[0].s.length >= 5 && sig.conf >= 85) {
    c = sig.c;
    conf = Math.max(conf, sig.conf);
    name = sig.name + " ⚡";
  }

  if (guardEnabled) {
    const w5 = chrono(h, 5);
    if (w5 === "BBBBB") { c = "S"; conf = 91; name = "🐉 Dragon Big Break"; group = "DRAGON"; }
    if (w5 === "SSSSS") { c = "B"; conf = 91; name = "🐉 Dragon Small Break"; group = "DRAGON"; }
  }

  if (!(sig && sig.c === c)) {
    const alt = active.filter((v) => v.c === c).sort((a, b) => b.w * b.conf - a.w * a.conf)[0];
    if (alt) { name = alt.name; group = alt.group || "FUSION"; }
    if (sig && sig.c) name += " · counter " + sig.group;
  }

  const agree = active.filter((v) => v.c === c).length;
  conf = Math.min(97, Math.max(54, conf + (agree >= 5 ? 4 : 0)));
  if (h.length < 5) conf = Math.min(conf, 52 + h.length * 6);

  return { pred: SZ(c), conf, name, group, votes, hits: (sig && sig.hits) || [], agree, total: active.length };
}

function makeSeeds(pred, period, feed = [], lastSeeds = []) {
  const pool = pred === "BIG" ? BIG_POOL : SMALL_POOL;
  const cnt = Array(10).fill(0);
  feed.slice(0, 40).forEach((r) => {
    if (r.number >= 0 && r.number <= 9) cnt[r.number]++;
  });
  const ranked = pool.slice().sort((a, b) => cnt[b] - cnt[a]);
  const seed = parseInt(String(period).slice(-3), 10) || 0;
  let n1 = ranked[0], n2 = ranked[1];
  if (lastSeeds.length && (n1 === lastSeeds[0] || n2 === lastSeeds[1])) {
    n1 = ranked[seed % ranked.length];
    n2 = ranked[(seed + 2) % ranked.length];
    if (n1 === n2) n2 = ranked[(seed + 3) % ranked.length];
  }
  if (!pool.includes(n1)) n1 = ranked[0];
  if (!pool.includes(n2) || n2 === n1) n2 = ranked.find((x) => x !== n1);
  return { n1, n2, pool, heat: cnt, list: [n1, n2] };
}

async function handleApiPredict(url) {
  const mode = (url.searchParams.get("mode") || "ALL").toUpperCase();
  const turn = parseInt(url.searchParams.get("turn") || "0", 10) || 0;
  const turnIdx = parseInt(url.searchParams.get("turnIdx") || "0", 10) || 0;

  const res = await fetch(API_URL + Date.now(), {
    headers: { "User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache" }
  });
  const json = await res.json();
  const list = json?.data?.list || [];
  if (!list.length) {
    return new Response(JSON.stringify({ ok: false, error: "Upstream feed empty" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const feed = list.slice(0, 60).map((it) => ({
    period: String(it.issueNumber),
    number: parseInt(it.number, 10) % 10,
    size: (parseInt(it.number, 10) % 10) >= 5 ? "BIG" : "SMALL"
  }));
  const hist = feed.map((x) => BS(x.number));
  const nextPeriod = (BigInt(feed[0].period) + 1n).toString();
  const fused = fuse(hist, { mode, turn, turnIdx, guard: true });
  const seeds = makeSeeds(fused.pred, nextPeriod, feed);

  return new Response(JSON.stringify({
    ok: true,
    latestPeriod: feed[0].period,
    nextPeriod,
    prediction: fused.pred,
    confidence: fused.conf,
    pattern: fused.name,
    group: fused.group,
    seeds: seeds.list,
    pool: seeds.pool,
    votes: fused.votes.map((v) => ({
      id: v.id,
      label: v.label,
      choice: v.c ? SZ(v.c) : null,
      conf: v.conf,
      weight: v.w
    })),
    feed: feed.slice(0, 15)
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function renderHtmlPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#030108">
<title>ColorX Daily Predictor — QUANTUM MATRIX PRO</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --primary: #00f2fe; --primary2: #4facfe; --accent: #f59e0b; --glow: rgba(0, 242, 254, 0.45);
  --bg0: #030108; --bg1: #070314; --win: #00ff87; --loss: #ff0055; --jack: #ffd700;
  --ink: #ffffff; --dim: rgba(255, 255, 255, 0.65); --dim2: rgba(255, 255, 255, 0.25);
  --glass: rgba(255, 255, 255, 0.03); --glass-card: rgba(14, 10, 26, 0.7);
  --stroke: rgba(255, 255, 255, 0.08); --radius: 24px;
}
[data-theme="cyber-emerald"] { --primary: #00ff87; --primary2: #60efff; --glow: rgba(0, 255, 135, 0.4); --bg0: #010804; --bg1: #02140a; }
[data-theme="hyper-neon"]    { --primary: #00f2fe; --primary2: #4facfe; --glow: rgba(0, 242, 254, 0.45); --bg0: #030108; --bg1: #070314; }
[data-theme="royal-gold"]    { --primary: #ffd700; --primary2: #ff8800; --glow: rgba(255, 215, 0, 0.4); --bg0: #080501; --bg1: #140d02; }
[data-theme="toxic-violet"]  { --primary: #d946ef; --primary2: #8b5cf6; --glow: rgba(217, 70, 239, 0.45); --bg0: #06010a; --bg1: #12031a; }
[data-theme="solar-flare"]   { --primary: #ff416c; --primary2: #ff4b2b; --glow: rgba(255, 65, 108, 0.45); --bg0: #080103; --bg1: #1a0308; }
[data-theme="arctic-glaze"]  { --primary: #e0f2fe; --primary2: #38bdf8; --glow: rgba(56, 189, 248, 0.35); --bg0: #02060a; --bg1: #09131d; }

* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent }
html, body { height:100% }
body {
  background: var(--bg0); color: var(--ink); font-family: 'Plus Jakarta Sans', sans-serif;
  overflow-x: hidden; user-select: none; -webkit-user-select: none;
  transition: background 0.6s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease;
}
.font-d { font-family: 'Orbitron', sans-serif }
#mesh { position:fixed; inset:0; z-index:0; opacity:.35; pointer-events:none }
.aurora { position:fixed; inset:-20%; z-index:0; pointer-events:none; filter:blur(110px); opacity:.65; mix-blend-mode:screen }
.aurora i { position:absolute; display:block; border-radius:50%; animation:drift 22s ease-in-out infinite alternate }
.aurora i:nth-child(1) { width:65vw; height:65vw; left:-10%; top:-10%; background:radial-gradient(circle,var(--primary),transparent 75%) }
.aurora i:nth-child(2) { width:55vw; height:55vw; right:-5%; bottom:-5%; background:radial-gradient(circle,var(--primary2),transparent 75%); animation-delay:-8s }
.aurora i:nth-child(3) { width:50vw; height:50vw; left:25%; top:35%; background:radial-gradient(circle,var(--primary),transparent 75%); animation-delay:-15s; opacity:.4 }
@keyframes drift { 0% { transform:translate3d(0,0,0) scale(1) } 100% { transform:translate3d(12%,14%,0) scale(1.18) } }
.grid-lines {
  position:fixed; inset:0; z-index:0; pointer-events:none; opacity:.07;
  background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:32px 32px; mask-image:radial-gradient(circle at 50% 40%,#000 20%,transparent 80%)
}

.glass {
  background: var(--glass-card); border: 1px solid var(--stroke); border-radius: var(--radius);
  backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); position: relative; overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
}
.glass::before {
  content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background: linear-gradient(135deg, var(--primary), transparent 45%, transparent 60%, var(--primary2));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0.4; pointer-events: none;
}
.glass:hover { border-color: rgba(255,255,255,.18); box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px var(--glow); }
.eyebrow { font-family:'Orbitron'; font-size:9.5px; letter-spacing:3px; color:var(--dim); font-weight:800; text-transform:uppercase }
.sec-title {
  font-family:'Orbitron'; font-size:10.5px; letter-spacing:3px; color:var(--primary); font-weight:900;
  margin:24px 4px 14px; display:flex; align-items:center; gap:12px; text-shadow:0 0 18px var(--glow)
}
.sec-title::after { content:''; flex:1; height:1px; background:linear-gradient(90deg, var(--stroke), transparent) }
.big-btn {
  width:100%; padding:17px; font-size:12.5px; font-weight:900; letter-spacing:2px; border-radius:18px; border:none; cursor:pointer;
  background: linear-gradient(100deg, var(--primary), var(--primary2)); color:#000000; box-shadow:0 8px 30px var(--glow); transition:.2s; font-family:'Plus Jakarta Sans'
}
.big-btn:active { transform:scale(.97) }

#gate { position:fixed; inset:0; z-index:900; display:flex; align-items:center; justify-content:center; padding:18px; background: radial-gradient(circle at 50% 20%, #120426, #030108 85%) }
#gate.hide { display:none }
.gate-card { width:100%; max-width:400px; padding:38px 24px; text-align:center; border-radius:32px }
.gate-badge { display:inline-block; padding:6px 18px; border-radius:30px; font-size:9.5px; letter-spacing:3px; font-weight:900; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.3); color:var(--accent); font-family:'Orbitron' }
.gate-orb { width:104px; height:104px; margin:24px auto 16px; border-radius:50%; background: conic-gradient(from 0deg, var(--primary), var(--primary2), var(--accent), var(--primary)); display:flex; align-items:center; justify-content:center; animation:spinSlow 9s linear infinite; box-shadow:0 0 50px var(--glow) }
.gate-orb b { width:84px; height:84px; border-radius:50%; background:#05020c; display:flex; align-items:center; justify-content:center; animation:spinSlowR 9s linear infinite }
@keyframes spinSlow { to { transform:rotate(360deg) } }
@keyframes spinSlowR { to { transform:rotate(-360deg) } }
.gate-card h1 { font-family:'Orbitron'; font-size:22px; font-weight:900; letter-spacing:1.5px; background: linear-gradient(100deg, var(--primary), #ffffff); -webkit-background-clip:text; background-clip:text; color:transparent }
.gate-card p { font-size:12.5px; color:var(--dim); line-height:1.75; margin:14px 4px 24px }
.verify-btn { width:100%; padding:16px; margin-top:8px; border-radius:18px; font-size:12px; font-weight:900; letter-spacing:2px; background: linear-gradient(100deg, #00ff87, #60efff); color:#000; border:none; box-shadow:0 8px 30px rgba(0,255,135,.4); cursor:pointer }
.gate-note { font-size:10px; color:var(--dim2); margin-top:16px; letter-spacing:1px }

#admin { position:fixed; inset:0; z-index:950; display:none; overflow-y:auto; padding:18px 14px 50px; background:#020106 }
#admin.on { display:block }
.ahead { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--stroke) }
.ahead h2 { font-family:'Orbitron'; font-size:13px; color:var(--primary); font-weight:900; letter-spacing:1.2px }
.acard { padding:18px; border-radius:18px; margin-bottom:12px; background:rgba(255,255,255,.015); border:1px solid var(--stroke) }
.acard h4 { font-family:'Orbitron'; font-size:10px; letter-spacing:2px; color:var(--accent); margin-bottom:14px; font-weight:900 }
.arow { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px }
.abtn { flex:1; min-width:90px; padding:12px 10px; font-size:10px; font-weight:800; border-radius:13px; cursor:pointer; letter-spacing:.8px; border:1px solid var(--stroke); background:var(--glass); color:var(--ink); font-family:'Plus Jakarta Sans' }
.abtn.pri { background: linear-gradient(100deg, var(--primary), var(--primary2)); color:#000000; border:none }
.abtn.ok { background:rgba(0,255,135,.1); color:var(--win); border-color:rgba(0,255,135,.3) }
.abtn.bad { background:rgba(255,0,85,.1); color:var(--loss); border-color:rgba(255,0,85,.3) }
.ainp { width:100%; padding:14px 16px; border-radius:14px; font-size:12px; outline:none; margin-bottom:10px; font-family:'Plus Jakarta Sans'; background:rgba(255,255,255,.03); border:1px solid var(--stroke); color:#fff }
.keyitem { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; margin-bottom:8px; background:rgba(0,0,0,.5); border:1px solid var(--stroke) }
.keycode { font-family:'Orbitron'; font-size:11px; color:var(--accent); letter-spacing:1px }

#app { display:none; flex-direction:column; max-width:480px; margin:0 auto; min-height:100vh; position:relative; z-index:2 }
.topbar { position:sticky; top:0; z-index:60; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 18px; background:rgba(3,1,8,.85); backdrop-filter:blur(24px); border-bottom:1px solid var(--stroke) }
.topbar::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent); opacity:.8 }
.brand { display:flex; align-items:center; gap:12px }
.brand-mark { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background: linear-gradient(135deg, var(--primary), var(--primary2)); box-shadow: 0 0 20px var(--glow) }
.brand-mark svg { width:24px; height:24px; fill:#000 }
.brand-title { font-family:'Orbitron'; font-size:13.5px; font-weight:900; letter-spacing:.8px; background: linear-gradient(100deg, #ffffff, var(--primary)); -webkit-background-clip:text; background-clip:text; color:transparent }
.brand-sub { font-size:8px; letter-spacing:2.5px; color:var(--dim); margin-top:3px; font-weight:800; font-family:'Orbitron' }

.timer-ring { position:relative; width:62px; height:62px; flex-shrink:0 }
.timer-ring svg { transform:rotate(-90deg) }
.timer-ring .tv { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center }
.timer-ring .tv b { font-family:'Orbitron'; font-size:17px; font-weight:900; line-height:1; color:#fff }
.timer-ring .tv i { font-size:6.5px; letter-spacing:1.5px; color:var(--dim); font-style:normal; margin-top:2px; font-family:'Orbitron' }
@keyframes alertGlow { 0%, 100% { filter: drop-shadow(0 0 4px var(--loss)); transform: scale(1); } 50% { filter: drop-shadow(0 0 14px var(--loss)); transform: scale(1.06); } }
.timer-ring.warning-pulse { animation: alertGlow 1s infinite }

#ann { display:none; padding:10px 16px; font-size:11px; font-weight:700; text-align:center; letter-spacing:.8px; cursor:pointer; background:rgba(0,0,0,.7) }
.feed-chip { display:flex; align-items:center; justify-content:center; gap:8px; font-size:9.5px; letter-spacing:2px; font-weight:800; padding:10px; font-family:'Orbitron'; color:var(--dim); background:rgba(0,0,0,.5); border-bottom:1px solid var(--stroke) }
.dot { width:8px; height:8px; border-radius:50%; background:var(--win); box-shadow:0 0 12px var(--win); animation:blink 1.5s infinite }
.dot.off { background:var(--loss); box-shadow:0 0 12px var(--loss) }
@keyframes blink { 0%,100% { opacity:.35; transform:scale(.8) } 50% { opacity:1; transform:scale(1.2) } }

.content { flex:1; padding:16px 16px 130px }
.page { display:none; animation:fadeUp .4s cubic-bezier(.16, 1, 0.3, 1) }
.page.on { display:block }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

.hero { padding:26px 20px 24px; text-align:center; border-radius:28px; margin-bottom:14px }
.hero-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
.pill { padding:6px 14px; border-radius:30px; font-size:8.5px; letter-spacing:2px; font-weight:900; font-family:'Orbitron'; background:rgba(255,255,255,.03); border:1px solid var(--stroke); color:var(--dim) }
.pill.live { color:var(--primary); border-color:var(--primary); box-shadow:0 0 16px var(--glow) }
.period-big { font-family:'Orbitron'; font-size:13px; letter-spacing:2px; color:var(--accent); margin:8px 0 4px; font-weight:800 }
.pred-orb { position:relative; margin:16px auto 10px; width:220px; height:130px; display:flex; align-items:center; justify-content:center; border-radius:50% }
.pred-orb::after { content:''; position:absolute; width:140px; height:140px; border:1px dashed var(--primary); border-radius:50%; animation:spinSlow 12s linear infinite; opacity:.45 }
.pred-orb::before { content:''; position:absolute; width:180px; height:180px; border:1px solid var(--primary2); border-radius:50%; animation:spinSlowR 20s linear infinite; opacity:.25 }
.scan-line { position:absolute; left:10%; width:80%; height:2px; background:linear-gradient(90deg, transparent, var(--primary), transparent); animation:laserScan 2.5s ease-in-out infinite; opacity:.8; z-index:1 }
@keyframes laserScan { 0%, 100% { transform:translateY(-45px); opacity:.2; } 50% { transform:translateY(45px); opacity:1; } }
#predText { position:relative; font-family:'Orbitron'; font-size:52px; font-weight:900; letter-spacing:2px; line-height:1; color:var(--pc,var(--primary)); text-shadow:0 0 34px currentColor; transition:.35s; z-index:2 }
.pattern-chip { display:inline-flex; align-items:center; gap:8px; margin-top:4px; padding:10px 18px; border-radius:30px; font-size:10px; font-weight:800; letter-spacing:1px; background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.25); color:var(--accent) }
.pattern-chip .sp { width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 10px var(--accent); animation:blink 1.3s infinite }
.seeds { margin-top:20px; padding:16px; border-radius:20px; background:rgba(0,0,0,.5); border:1px solid var(--stroke) }
.seeds-lbl { font-family:'Orbitron'; font-size:9px; letter-spacing:2.5px; color:var(--accent); font-weight:900; margin-bottom:12px; text-transform:uppercase }
.seed-row { display:flex; justify-content:center; gap:16px; align-items:center }
.seed { width:60px; height:60px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-family:'Orbitron'; font-size:28px; font-weight:900; color:var(--accent); background:rgba(8,4,12,.95); border:2px solid var(--accent); box-shadow:0 0 20px rgba(245,158,11,.25); transition:.3s }
.fever-only { margin-top:14px; font-family:'Orbitron'; font-size:8.5px; letter-spacing:2px; font-weight:900; color:var(--accent); padding:8px 12px; border-radius:12px; background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.2) }
.fever-heat { display:flex; justify-content:center; gap:8px; margin-top:14px; flex-wrap:wrap }
.fh { width:36px; padding:8px 0; border-radius:11px; text-align:center; font-family:'Orbitron'; font-size:14px; font-weight:900; background:rgba(255,255,255,.02); border:1px solid var(--stroke); color:var(--dim); transition:.3s }
.fh b { display:block; font-size:7px; font-weight:700; color:var(--dim2); margin-top:3px; letter-spacing:.5px }
.fh.pick { color:var(--accent); border-color:var(--accent); background:rgba(245,158,11,.12); box-shadow:0 0 14px rgba(245,158,11,.25) }
.fh.top { color:var(--ink); border-color:rgba(255,255,255,.2) }
.seed.hit { animation:jackPulse .55s 4; border-color:#fff }
@keyframes jackPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.22); box-shadow:0 0 40px var(--accent) } }
.seed-cap { font-size:8px; letter-spacing:1.5px; color:var(--dim2); margin-top:8px; font-family:'Orbitron' }

.conf { display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:18px; margin-bottom:14px }
.conf-body { flex:1 }
.conf-name { font-size:11px; font-weight:700; color:var(--ink); margin-bottom:8px; opacity:.85 }
.bar { height:8px; border-radius:20px; background:rgba(255,255,255,.05); overflow:hidden }
.bar i { display:block; height:100%; border-radius:20px; background:linear-gradient(90deg, var(--primary), var(--accent), var(--win)); transition:width .8s cubic-bezier(.4,0,.2,1); box-shadow:0 0 12px var(--glow) }
.conf-pct { font-family:'Orbitron'; font-size:18px; font-weight:900; color:var(--primary); text-shadow:0 0 14px var(--glow) }

.mode-scroll { display:flex; gap:10px; overflow-x:auto; padding:2px 2px 10px; scrollbar-width:none }
.mode-scroll::-webkit-scrollbar { display:none }
.mode-btn { flex:0 0 auto; padding:12px 18px; border-radius:16px; font-size:10px; font-weight:800; letter-spacing:1px; cursor:pointer; background:var(--glass); border:1px solid var(--stroke); color:var(--dim); transition:.25s; white-space:nowrap; font-family:'Plus Jakarta Sans' }
.mode-btn.on { background: linear-gradient(100deg, var(--primary), var(--primary2)); color:#000000; border-color:transparent; box-shadow:0 6px 20px var(--glow); transform:translateY(-2px) }
.mode-desc { font-size:11px; color:var(--dim); text-align:center; padding:10px 8px 4px; line-height:1.7 }

.radar { padding:18px; border-radius:22px; margin-bottom:14px }
.radar-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px }
.radar-name { font-family:'Orbitron'; font-size:13px; font-weight:900; color:var(--accent); letter-spacing:.8px; text-shadow:0 0 14px rgba(245,158,11,.35) }
.radar-tag { font-size:8px; letter-spacing:2px; padding:5px 12px; border-radius:20px; font-weight:900; font-family:'Orbitron'; background:rgba(0,255,135,.1); border:1px solid rgba(0,255,135,.3); color:var(--win) }
.seq { display:flex; align-items:center; justify-content:center; gap:10px; margin:8px 0 4px; flex-wrap:wrap }
.node { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-family:'Orbitron'; font-size:16px; font-weight:900; position:relative; transition:.3s }
.node.B { background:rgba(255,136,0,.15); border:1.5px solid rgba(255,136,0,.65); color:#ffa733; box-shadow:0 0 14px rgba(255,136,0,.2) }
.node.S { background:rgba(0,242,254,.15); border:1.5px solid rgba(0,242,254,.65); color:#3cc9ff; box-shadow:0 0 14px rgba(0,242,254,.2) }
.node .idx { position:absolute; bottom:-14px; font-size:7px; color:var(--dim2); font-family:'Orbitron' }
.node.next { border-style:dashed; animation:blink 1.4s infinite }
.arrow { color:var(--dim2); font-size:18px }
.radar-foot { display:flex; gap:8px; margin-top:22px }
.rf-box { flex:1; padding:12px 8px; border-radius:14px; text-align:center; background:rgba(255,255,255,.015); border:1px solid var(--stroke) }
.rf-box b { display:block; font-family:'Orbitron'; font-size:15px; font-weight:900; color:var(--primary) }
.rf-box small { display:block; font-size:7px; letter-spacing:1.5px; color:var(--dim2); font-family:'Orbitron'; text-transform:uppercase }

.council { display:grid; grid-template-columns:repeat(2,1fr); gap:10px }
.eng { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:18px; background:rgba(255,255,255,.015); border:1px solid var(--stroke); transition:.3s }
.eng.big { border-color:rgba(255,136,0,.4); background:rgba(255,136,0,.05) }
.eng.small { border-color:rgba(0,242,254,.4); background:rgba(0,242,254,.05) }
.eng-ico { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; background:rgba(255,255,255,.03); border:1px solid var(--stroke) }
.eng-b { flex:1; min-width:0 }
.eng-n { font-size:9.5px; font-weight:800; letter-spacing:.7px; color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.eng-v { font-family:'Orbitron'; font-size:12px; font-weight:900; margin-top:3px }
.eng-v.B { color:#ffa733 }.eng-v.S { color:#3cc9ff }
.eng-w { font-size:8px; color:var(--dim2); font-family:'Orbitron' }

.stat3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px }
.stat2 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px }
.sbox { padding:16px 8px; border-radius:18px; text-align:center; background:rgba(255,255,255,.015); border:1px solid var(--stroke) }
.sbox b { display:block; font-family:'Orbitron'; font-size:24px; font-weight:900; line-height:1; text-shadow:0 0 14px currentColor }
.sbox small { display:block; font-size:8px; letter-spacing:2px; color:var(--dim2); margin-top:8px; font-weight:800; font-family:'Orbitron'; text-transform:uppercase }
.c-win { color:var(--win) }.c-loss { color:var(--loss) }.c-gold { color:var(--accent) }.c-pri { color:var(--primary) }

.h-row { display:flex; align-items:stretch; border-radius:18px; margin-bottom:10px; overflow:hidden; background:rgba(255,255,255,.015); border:1px solid var(--stroke) }
.h-bar { width:5px; flex-shrink:0 }
.h-bar.win { background:var(--win); box-shadow:0 0 12px var(--win) }
.h-bar.loss { background:var(--loss); box-shadow:0 0 12px var(--loss) }
.h-bar.jackpot { background:var(--jack); box-shadow:0 0 14px var(--jack) }
.h-bar.pending { background:var(--primary); box-shadow:0 0 12px var(--primary) }
.h-mid { flex:1; min-width:0; padding:14px 16px }
.h-per { font-family:'Orbitron'; font-size:9px; letter-spacing:1px; color:var(--dim2); margin-bottom:6px }
.h-pred { font-family:'Orbitron'; font-size:17px; font-weight:900; letter-spacing:1px }
.h-act { font-size:10.5px; color:var(--dim); margin-top:5px; font-weight:600 }
.h-right { display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:6px; padding:14px 16px 14px 0; flex-shrink:0 }
.badge { padding:5px 12px; border-radius:20px; font-size:8px; font-weight:900; letter-spacing:1px; white-space:nowrap; font-family:'Orbitron' }
.badge.win { background:rgba(0,255,135,.1); border:1px solid rgba(0,255,135,.35); color:var(--win) }
.badge.loss { background:rgba(255,0,85,.1); border:1px solid rgba(255,0,85,.35); color:var(--loss) }
.badge.jackpot { background:rgba(255,215,0,.12); border:1px solid rgba(255,215,0,.45); color:var(--jack) }
.badge.pending { background:rgba(255,255,255,.04); border:1px solid var(--stroke); color:var(--dim) }
.h-conf { font-family:'Orbitron'; font-size:9.5px; color:var(--dim2); font-weight:700 }
.empty { padding:36px 14px; text-align:center; font-size:11px; letter-spacing:2px; color:var(--dim2); font-family:'Orbitron' }
.act-row { display:flex; gap:10px; margin-bottom:14px }
.act-row button { flex:1; padding:14px; font-size:11px; font-weight:800; border-radius:16px; cursor:pointer; letter-spacing:1px; border:1px solid var(--stroke); background:var(--glass); color:var(--ink); font-family:'Plus Jakarta Sans'; transition:.2s }
.act-row button:active { transform:scale(.96) }
.act-row .danger { color:var(--loss); border-color:rgba(255,0,85,.3); background:rgba(255,0,85,.05) }

.bars { display:flex; align-items:flex-end; justify-content:space-between; gap:6px; height:84px; padding:10px 4px 0 }
.bcol { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px }
.bfill { width:100%; border-radius:8px 8px 4px 4px; min-height:8px; transition:height .5s }
.bfill.B { background:linear-gradient(180deg,#ffa733,rgba(255,136,0,.25)) }
.bfill.S { background:linear-gradient(180deg,#00f2fe,rgba(0,242,254,.25)) }
.blbl { font-family:'Orbitron'; font-size:9px; color:var(--dim2); font-weight:700 }
.dots { display:flex; gap:6px; justify-content:center; margin-top:14px; flex-wrap:wrap }
.pdot { width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'Orbitron'; font-size:10.5px; font-weight:900 }
.pdot.B { background:rgba(255,136,0,.15); color:#ffa733; border:1px solid rgba(255,136,0,.4) }
.pdot.S { background:rgba(0,242,254,.15); color:#3cc9ff; border:1px solid rgba(0,242,254,.4) }
.pdot.q { background:rgba(255,255,255,.04); color:var(--dim2); border:1px dashed var(--stroke) }

.srow { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:15px 16px; border-radius:18px; background:rgba(255,255,255,.015); border:1px solid var(--stroke); margin-bottom:10px }
.srow .t { font-size:12px; font-weight:700 }
.srow .d { font-size:9.5px; color:var(--dim2); margin-top:4px }
.tgl { width:48px; height:26px; border-radius:20px; border:1px solid var(--stroke); background:rgba(255,255,255,.05); position:relative; cursor:pointer; flex-shrink:0; transition:.3s }
.tgl i { position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:var(--dim); transition:.3s }
.tgl.on { background:linear-gradient(100deg, var(--primary), var(--primary2)); border-color:transparent }
.tgl.on i { left:24px; background:#000 }
.theme-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px }
.tbtn { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:18px; cursor:pointer; font-size:11px; font-weight:800; letter-spacing:1px; background:rgba(255,255,255,.015); border:1px solid var(--stroke); color:var(--ink); transition:.25s; font-family:'Plus Jakarta Sans' }
.tbtn:active { transform:scale(.97) }
.tbtn.on { border-color:var(--primary); background:rgba(255,255,255,.05); box-shadow:0 0 18px var(--glow) }
.tdot { width:16px; height:16px; border-radius:50%; flex-shrink:0 }
.warn { font-size:10px; color:var(--loss); text-align:center; line-height:1.9; padding:16px; border-radius:18px; margin-top:12px; background:rgba(255,0,85,.04); border:1px solid rgba(255,0,85,.2); font-weight:600 }
.trow { display:flex; justify-content:space-between; font-size:11.5px; padding:12px 2px; border-bottom:1px solid var(--stroke); color:var(--dim) }
.trow:last-child { border:none }
.trow b { color:var(--ink); font-weight:700 }

.nav {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%); width:min(90%, 420px); z-index:100;
  display:flex; justify-content:space-around; padding:10px; border-radius:30px;
  background: rgba(10, 6, 20, 0.88); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  border:1px solid rgba(255,255,255,0.08); box-shadow:0 16px 40px rgba(0,0,0,0.9), 0 0 24px var(--glow)
}
.nbtn { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border:none; background:none; cursor:pointer; color:var(--dim2); border-radius:20px; transition:all 0.3s cubic-bezier(.16, 1, 0.3, 1) }
.nbtn svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; transition:transform 0.3s ease }
.nbtn span { font-size:8px; letter-spacing:1px; font-weight:800; font-family:'Orbitron', sans-serif; opacity:0.7; transition:opacity 0.3s ease }
.nbtn.on { color:var(--primary); background:rgba(255,255,255,0.05); transform:translateY(-4px); filter:drop-shadow(0 0 8px var(--primary)) }
.nbtn.on svg { transform:scale(1.1) }
.nbtn.on span { opacity:1 }

#popup { position:fixed; inset:0; z-index:800; display:none; align-items:center; justify-content:center; padding:20px; background:rgba(2,1,6,0.94); backdrop-filter:blur(14px) }
#popup.on { display:flex; animation:fadeIn .3s ease }
.pop { width:100%; max-width:360px; padding:32px 24px; border-radius:32px; text-align:center; position:relative; overflow:hidden; background:linear-gradient(170deg, rgba(255,255,255,.08), rgba(7,3,15,.98)); box-shadow:0 24px 60px rgba(0,0,0,0.8); animation:popIn .5s cubic-bezier(.16, 1.4, .3, 1) }
@keyframes popIn { from { opacity:0; transform:scale(.8) translateY(30px) } to { opacity:1; transform:scale(1) translateY(0) } }
.pop.win { border:1.5px solid var(--win); box-shadow:0 0 50px rgba(0,255,135,.3), inset 0 0 15px rgba(0,255,135,.1) }
.pop.loss { border:1.5px solid var(--loss); box-shadow:0 0 50px rgba(255,0,85,.3), inset 0 0 15px rgba(255,0,85,.1) }
.pop.jackpot { border:1.5px solid var(--jack); box-shadow:0 0 60px rgba(255,215,0,.4), inset 0 0 20px rgba(255,215,0,.2) }
.pop-shine { position:absolute; inset:0; pointer-events:none; background:linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 48%, transparent 62%); animation:shine 2.5s infinite }
@keyframes shine { 0% { transform:translateX(-100%) } 100% { transform:translateX(100%) } }
.pop-ico { font-size:56px; display:block; margin-bottom:8px; animation:bounceIn .6s }
@keyframes bounceIn { 0% { transform:scale(0) } 60% { transform:scale(1.2) } 100% { transform:scale(1) } }
.pop h2 { font-family:'Orbitron'; font-size:26px; font-weight:900; letter-spacing:2px; margin-bottom:6px }
.pop .sub { font-size:9px; letter-spacing:2.5px; color:var(--dim); font-family:'Orbitron'; margin-bottom:18px }
.pop-io { display:flex; gap:12px; margin:16px 0 }
.pop-io > div { flex:1; padding:14px 8px; border-radius:16px; background:rgba(0,0,0,.5); border:1px solid var(--stroke) }
.pop-io small { display:block; font-size:7.5px; letter-spacing:2px; color:var(--dim2); margin-bottom:6px; font-family:'Orbitron'; text-transform:uppercase }
.pop-io b { font-family:'Orbitron'; font-size:16px; font-weight:900 }
.pop-note { font-size:10.5px; padding:11px; border-radius:14px; margin-top:8px; background:rgba(255,215,0,.1); border:1px solid rgba(255,215,0,.3); color:var(--jack); font-weight:700 }
.pop-desc { font-size:11.5px; color:var(--dim); line-height:1.8; margin:14px 4px 18px }

#toast {
  position:fixed; left:50%; bottom:116px; transform:translateX(-50%) translateY(20px); z-index:1300; padding:12px 24px; border-radius:30px;
  font-size:12px; font-weight:800; letter-spacing:.8px; opacity:0; pointer-events:none; transition:.35s;
  background:rgba(8,4,14,.98); border:1px solid var(--primary); color:var(--primary); box-shadow:0 0 26px var(--glow); white-space:nowrap
}
#toast.on { opacity:1; transform:translateX(-50%) translateY(0) }
footer { text-align:center; font-size:9.5px; letter-spacing:2px; color:var(--dim2); padding:24px 10px 8px; line-height:1.9; font-family:'Orbitron' }
</style>
</head>
<body data-theme="hyper-neon">
<canvas id="mesh"></canvas>
<div class="aurora"><i></i><i></i><i></i></div>
<div class="grid-lines"></div>
<div id="toast"></div>

<div id="gate">
  <div class="gate-card glass">
    <span class="gate-badge">PREMIUM ACCESS</span>
    <div class="gate-orb">
      <b>
        <svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:var(--primary)">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </b>
    </div>
    <h1>ColorX Daily Predictor</h1>
    <p>Synchronize with next-gen algorithmic prediction engines and high-frequency analytical matrices.</p>
    <button class="verify-btn" id="verifyBtn" onclick="Gate.verify()">✦ ENTER ColorX Daily Predictor</button>
    <div class="gate-note">Cloudflare Worker Quantum Edge Ready →</div>
  </div>
</div>

<div id="admin">
  <div class="ahead">
    <h2>🔧 ColorX Daily Predictor — HUB</h2>
    <button class="abtn bad" style="flex:0;min-width:44px" onclick="Admin.close()">✕</button>
  </div>
  <div class="stat3" style="margin-bottom:12px">
    <div class="sbox"><b class="c-pri" id="aUsers">0</b><small>ACTIVE SESSIONS</small></div>
    <div class="sbox"><b class="c-win" id="aKeys">0</b><small>KEYS STORED</small></div>
    <div class="sbox"><b class="c-gold" id="aRounds">0</b><small>EXECUTIONS</small></div>
  </div>
  <div class="acard">
    <h4>🎟 ISSUE ACCESS TOKEN</h4>
    <select id="keyType" class="ainp">
      <option value="1day">1 DAY METRIC</option>
      <option value="3day">3 DAY METRICS</option>
      <option value="7day">7 DAY METRICS</option>
      <option value="life">INFINITE ACCESS</option>
    </select>
    <button class="abtn pri" style="width:100%" onclick="Admin.genKey()">🔑 GENERATE TOKEN</button>
    <div id="genOut" style="margin-top:10px;font-size:12px;font-weight:800;color:var(--accent);word-break:break-all"></div>
  </div>
  <div class="acard"><h4>📋 TOKEN REGISTRY</h4><div id="keyList"></div></div>
  <div class="acard">
    <h4>⚙️ MANUAL OVERRIDE</h4>
    <div class="arow">
      <button class="abtn" onclick="Admin.mode('AUTO')">DYNAMIC</button>
      <button class="abtn" onclick="Admin.mode('BIG')">FORCE BIG</button>
      <button class="abtn" onclick="Admin.mode('SMALL')">FORCE SMALL</button>
    </div>
    <div class="arow">
      <button class="abtn bad" onclick="Admin.maint(true)">🔧 LOCKDOWN CONSOLE</button>
      <button class="abtn ok" onclick="Admin.maint(false)">✅ RESTORE LIVE</button>
    </div>
    <input class="ainp" id="annInput" placeholder="System Broadcast Message...">
    <div class="arow">
      <button class="abtn pri" onclick="Admin.ann('info')">INFO</button>
      <button class="abtn" style="background:#ffaa00;color:#000;border:none" onclick="Admin.ann('warn')">WARN</button>
      <button class="abtn ok" onclick="Admin.ann('success')">STABLE</button>
      <button class="abtn bad" onclick="Admin.ann('danger')">ALERT</button>
      <button class="abtn" style="flex:0;min-width:44px" onclick="Admin.clearAnn()">✕</button>
    </div>
  </div>
  <div class="acard"><h4>⚠️ CRITICAL FLUSH</h4>
    <button class="abtn bad" style="width:100%" onclick="Admin.resetAll()">🗑️ FACTORY RESET ALL DATA</button>
  </div>
  <button class="big-btn" style="margin-top:8px" onclick="Admin.close()">← FLIGHT TERMINAL</button>
</div>

<div id="app">
  <div class="topbar">
    <div class="brand">
      <div class="brand-mark">
        <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div>
        <div class="brand-title">ColorX Daily Predictor</div>
        <div class="brand-sub">CLOUDFLARE EDGE CORE</div>
      </div>
    </div>
    <div class="timer-ring">
      <svg width="58" height="58">
        <circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,.06)" stroke-width="4" fill="none"/>
        <circle id="tArc" cx="29" cy="29" r="25" stroke="var(--primary)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="157" stroke-dashoffset="0" style="transition:stroke-dashoffset .4s linear; filter:drop-shadow(0 0 6px var(--primary))"/>
      </svg>
      <div class="tv"><b id="tVal">60</b><i>SEC</i></div>
    </div>
  </div>
  <div id="ann" onclick="this.style.display='none'"></div>
  <div class="feed-chip"><span class="dot" id="feedDot"></span><span id="feedTxt">CONNECTING TO QUANTUM CORES...</span></div>

  <div class="content">
    <div class="page on" id="pg-terminal">
      <div class="hero glass">
        <div class="hero-top">
          <span class="pill live"><span id="modePill">DYNAMIC MATRIX</span></span>
          <span class="pill" id="accPill">RATIO --%</span>
        </div>
        <div class="period-big">TARGET SEQUENCE · <span id="periodNum">------</span></div>
        <div class="pred-orb">
          <div class="scan-line"></div>
          <div id="predText">SCANNING</div>
        </div>
        <div class="pattern-chip"><span class="sp"></span><span id="patChip">Initiating core system diagnostic...</span></div>
        <div class="seeds">
          <div class="seeds-lbl">🔥 HOT SEED NUMBERS · 9× MATRIX</div>
          <div class="seed-row">
            <div><div class="seed" id="seed1">?</div><div class="seed-cap">SEED 1</div></div>
            <div><div class="seed" id="seed2">?</div><div class="seed-cap">SEED 2</div></div>
          </div>
          <div class="fever-only">🔥 TARGET POOL · <span id="feverPool">—</span></div>
        </div>
      </div>

      <div class="conf glass">
        <div style="font-size:20px">⚙️</div>
        <div class="conf-body">
          <div class="conf-name" id="confName">Calibrating matrix window...</div>
          <div class="bar"><i id="confBar" style="width:0%"></i></div>
        </div>
        <div class="conf-pct" id="confPct">--</div>
      </div>

      <div class="act-row">
        <button onclick="App.copySignal()">📋 EXPORT METRICS</button>
        <button onclick="App.go('history',null)">📊 SYSTEM REGISTRY</button>
      </div>

      <div class="sec-title">🔬 ALGORITHMIC RADAR · TARGET SEQUENCE</div>
      <div class="radar glass">
        <div class="radar-head">
          <div class="radar-name" id="radarName">—</div>
          <div class="radar-tag" id="radarTag">COMPUTING</div>
        </div>
        <div class="seq" id="seqRow"></div>
        <div class="radar-foot">
          <div class="rf-box"><b id="rfMatch">0</b><small>MATCHES</small></div>
          <div class="rf-box"><b id="rfStreak">0</b><small>STREAK</small></div>
          <div class="rf-box"><b id="rfRatio">0/0</b><small>B / S</small></div>
          <div class="rf-box"><b id="rfLib">0</b><small>INDEXED</small></div>
        </div>
      </div>

      <div class="sec-title">🔥 REGISTRATION MAP · POOL EXCLUSION</div>
      <div class="radar glass">
        <div class="radar-head">
          <div class="radar-name" id="feverSide">—</div>
          <div class="radar-tag" style="background:rgba(245,158,11,.1); border-color:rgba(245,158,11,.3); color:var(--accent)">HOT ONLY</div>
        </div>
        <div class="fever-heat" id="feverHeat"></div>
        <div style="font-size:10px; color:var(--dim2); text-align:center; margin-top:12px; line-height:1.7">Algorithmic safety block active. Non-conforming value subsets excluded.</div>
      </div>

      <div class="sec-title">🧠 SYNAPSE MATRIX · 7-ENGINE ALIGNMENT</div>
      <div class="council" id="council"></div>

      <div class="sec-title">📈 LIVE TREND DRIFT · TARGET 10</div>
      <div class="glass" style="padding:16px">
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--dim); margin-bottom:6px; font-family:'Orbitron'; letter-spacing:1.5px">
          <span>HISTORICAL DRIFT</span><span id="trendRatio">B:- / S:-</span>
        </div>
        <div class="bars" id="bars"></div>
        <div class="dots" id="dots"></div>
      </div>

      <div class="sec-title">🏆 ACTIVE EVALUATION STATS</div>
      <div class="stat3">
        <div class="sbox"><b class="c-win" id="tWins">0</b><small>VICTORIES</small></div>
        <div class="sbox"><b class="c-loss" id="tLoss">0</b><small>DEFEATS</small></div>
        <div class="sbox"><b class="c-gold" id="tJack">0</b><small>JACKPOTS</small></div>
      </div>
      <footer>ColorX Daily Predictor · CLOUDFLARE WORKER ENGINE<br>ENFORCE DISCIPLINED ALLOCATION MATRIX</footer>
    </div>

    <div class="page" id="pg-patterns">
      <div class="sec-title" style="margin-top:2px">🎛 DECISION MATRIX MODE</div>
      <div class="mode-scroll" id="modeScroll"></div>
      <div class="mode-desc glass" id="modeDesc" style="padding:14px; border-radius:18px"></div>
      <div class="sec-title">📚 ALGORITHMIC REGISTRY · SYSTEM WEIGHTS</div>
      <div class="glass" style="padding:10px"><div id="patLib"></div></div>
      <div class="sec-title">🔄 SHIFT ROTATION METRICS</div>
      <div class="glass" style="padding:18px">
        <div class="srow" style="margin:0; background:transparent; border:none; padding:0 0 12px">
          <div><div class="t" id="turnPat">—</div><div class="d">Rotational core parameters shift automatically</div></div>
        </div>
        <div class="stat3">
          <div class="sbox"><b class="c-pri" id="turnCount">0</b><small>SHIFTS</small></div>
          <div class="sbox"><b class="c-win" id="curStreak">0</b><small>V-STREAK</small></div>
          <div class="sbox"><b class="c-loss" id="maxLoss">0</b><small>MAX DRIFT</small></div>
        </div>
      </div>
    </div>

    <div class="page" id="pg-history">
      <div class="sec-title" style="margin-top:2px">📜 VERIFIED SIGNAL LOGS</div>
      <div class="act-row">
        <button onclick="App.copyHistory()">📋 COMPILE GLOBAL REPORT</button>
        <button class="danger" onclick="App.clearHistory()">🗑 CLEAR CORES LOGS</button>
      </div>
      <div class="stat3" style="margin-bottom:16px">
        <div class="sbox"><b class="c-win" id="hWins">0</b><small>VICTORIES</small></div>
        <div class="sbox"><b class="c-loss" id="hLoss">0</b><small>DEFEATS</small></div>
        <div class="sbox"><b class="c-gold" id="hAcc">--%</b><small>SUCCESS RATIO</small></div>
      </div>
      <div id="hList"></div>
    </div>

    <div class="page" id="pg-stats">
      <div class="sec-title" style="margin-top:2px">📊 PERFORMANCE PARAMETERS</div>
      <div class="glass" style="padding:24px 18px; text-align:center">
        <div class="eyebrow">GLOBAL MATRIX SUCCESS RATIO</div>
        <div class="font-d" id="bigAcc" style="font-size:52px; font-weight:900; color:var(--primary); text-shadow:0 0 30px var(--glow); line-height:1.1; margin:8px 0">--%</div>
        <div class="bar" style="height:10px"><i id="accBar" style="width:0%"></i></div>
        <div style="font-size:10px; color:var(--dim2); margin-top:14px">Verified operational outputs indexation only</div>
      </div>
      <div class="sec-title">⚔️ OPERATIONAL RECORD</div>
      <div class="stat2">
        <div class="sbox"><b class="c-win" id="sWins">0</b><small>TOTAL VICTORIES</small></div>
        <div class="sbox"><b class="c-loss" id="sLoss">0</b><small>TOTAL DEFEATS</small></div>
        <div class="sbox"><b class="c-gold" id="sJack">0</b><small>JACKPOT EVENTS</small></div>
        <div class="sbox"><b class="c-pri" id="sRounds">0</b><small>TOTAL ROUNDS</small></div>
        <div class="sbox"><b class="c-win" id="sBest">0</b><small>MAX STREAK</small></div>
        <div class="sbox"><b class="c-loss" id="sMaxL">0</b><small>MAX DEVIATION</small></div>
      </div>
      <div class="sec-title">🎯 METRIC SUCCESS INDEX</div>
      <div class="glass" style="padding:12px"><div id="patScore"></div></div>
    </div>

    <div class="page" id="pg-profile">
      <div class="sec-title" style="margin-top:2px">👑 PRESTIGE ARCHITECTURE VIP</div>
      <div class="glass" style="padding:22px; text-align:center">
        <div class="font-d" style="font-size:18px; font-weight:900; color:var(--accent)" id="planName">ColorX Daily Predictor VIP</div>
        <div style="font-size:10.5px; color:var(--dim); margin-top:6px" id="planMeta">Cloudflare Worker Edge · Core Link Stabilized</div>
        <div id="planKey" style="display:none"></div>
        <div id="planExp" style="margin-top:12px"><div style="font-size:10.5px; color:var(--win); font-weight:700">♾ Unlocked Access Active</div></div>
      </div>
      <div class="sec-title">🎨 QUANTUM UI THEMES</div>
      <div class="theme-grid" id="themeGrid"></div>
      <div class="sec-title">⚙️ INTEGRAL SWITCHES</div>
      <div class="srow"><div><div class="t">Acoustic Feedback</div><div class="d">Synthesized sound profiles on events</div></div><div class="tgl on" id="tglSound" onclick="App.toggle('sound')"><i></i></div></div>
      <div class="srow"><div><div class="t">Celebration FX</div><div class="d">Atmospheric visual feedback animations</div></div><div class="tgl on" id="tglFx" onclick="App.toggle('fx')"><i></i></div></div>
      <div class="srow"><div><div class="t">Drift Mitigation System</div><div class="d">Automatic reversal during sequence deviation</div></div><div class="tgl on" id="tglGuard" onclick="App.toggle('guard')"><i></i></div></div>
      <div class="srow"><div><div class="t">Quantum Vector Mesh</div><div class="d">Compiles real-time backdrop particle array</div></div><div class="tgl on" id="tglMesh" onclick="App.toggle('mesh')"><i></i></div></div>
      <button class="big-btn" style="margin-top:14px" onclick="Admin.show()">🔧 OPEN CONTROL HUB</button>
    </div>
  </div>

  <div class="nav">
    <button class="nbtn on" onclick="App.go('terminal',this)"><svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><span>HOME</span></button>
    <button class="nbtn" onclick="App.go('patterns',this)"><svg viewBox="0 0 24 24"><path d="M3 17l5-6 4 4 5-8 4 5"/><path d="M3 21h18"/></svg><span>PATTERNS</span></button>
    <button class="nbtn" onclick="App.go('history',this)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>HISTORY</span></button>
    <button class="nbtn" onclick="App.go('stats',this)"><svg viewBox="0 0 24 24"><path d="M5 19V9M12 19V5M19 19v-8"/><path d="M3 21h18"/></svg><span>STATS</span></button>
    <button class="nbtn" onclick="App.go('profile',this)"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span>PROFILE</span></button>
  </div>
</div>

<div id="popup" onclick="if(event.target===this)App.closePopup()">
  <div class="pop" id="popBox">
    <div class="pop-shine" id="popShine"></div>
    <span class="pop-ico" id="popIco">🎯</span>
    <h2 id="popTitle">VICTORY</h2>
    <div class="sub" id="popSub">WINGO 1 MINUTE · PERIOD MATRIX</div>
    <div class="font-d" id="popPeriod" style="font-size:13.5px; color:var(--accent); letter-spacing:1.5px">#----</div>
    <div class="pop-io">
      <div><small>COMPUTED EXPECTATION</small><b id="popPred">--</b></div>
      <div><small>MATRIX VERIFICATION</small><b id="popActual">--</b></div>
    </div>
    <div class="pop-note" id="popNote" style="display:none"></div>
    <div class="pop-desc" id="popDesc"></div>
    <button class="big-btn" onclick="App.closePopup()">DISMISS OVERLAY</button>
  </div>
</div>

<script>
const ENGINE_BUNDLE = {
  API: ${JSON.stringify(API_URL)},
  BIG_POOL: ${JSON.stringify(BIG_POOL)},
  SMALL_POOL: ${JSON.stringify(SMALL_POOL)},
  SIGS: ${JSON.stringify(SIGS)},
  TURNS: ${JSON.stringify(TURNS)},
  LIB: ${JSON.stringify(LIB)}
};
</script>
<script>
(function(){
"use strict";
const { API, BIG_POOL, SMALL_POOL, SIGS, TURNS, LIB } = ENGINE_BUNDLE;
const LS = k => "COLORX_CF_PREDICTOR_" + k;
const BS = n => Number(n) >= 5 ? "B" : "S";
const SZ = c => c === "B" ? "BIG" : "SMALL";
const $ = id => document.getElementById(id);
const store = {
  get: (k, d) => { try { const v = localStorage.getItem(LS(k)); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set: (k, v) => { try { localStorage.setItem(LS(k), JSON.stringify(v)); } catch (_) {} },
  del: k => { try { localStorage.removeItem(LS(k)); } catch (_) {} }
};

const MODES = [
  { k: "ALL",    n: "ALL PATTERNS", d: "Multi-core quantum synthesis across all 38 signature parameters." },
  { k: "SIG",    n: "SIGNATURE",    d: "Prioritizes chronological core templates and dragon/mirror breaks." },
  { k: "MARKOV", n: "MARKOV AI",    d: "Probabilistic chain formulation using recent sequence transitions." },
  { k: "TREND",  n: "TREND WEIGHT", d: "Weighted time-series evaluation of Big vs Small momentum." },
  { k: "GUARD",  n: "ANTI-STREAK",  d: "Reversal protection against extended streaks." },
  { k: "TURN",   n: "TURN ROTATE",  d: "Rotates active decision strategy every resolved period." }
];
const THEMES = [
  { k: "hyper-neon",    n: "HYPER NEON",    c: "#00f2fe" },
  { k: "cyber-emerald", n: "CYBER EMERALD", c: "#00ff87" },
  { k: "royal-gold",    n: "ROYAL GOLD",    c: "#ffd700" },
  { k: "toxic-violet",  n: "TOXIC VIOLET",  c: "#d946ef" },
  { k: "solar-flare",   n: "SOLAR FLARE",   c: "#ff416c" },
  { k: "arctic-glaze",  n: "ARCTIC GLAZE",  c: "#38bdf8" }
];

const S = {
  feed: [], hist: [], logs: [], pending: null, lastRes: null,
  wins: 0, losses: 0, jackpots: 0, best: 0, streak: 0, lossRun: 0, maxLoss: 0,
  turn: 0, turnIdx: 0, mode: "ALL", lastPeriod: null, lastSeeds: [],
  patScore: {}, online: false, page: "terminal",
  sound: true, fx: true, guard: true, meshOn: true
};

function chrono(h, n) { return h.slice(0, n).reverse().join(""); }
function scanPatterns(h) {
  const win = chrono(h, 5);
  return SIGS.filter(p => p.s.length <= win.length && win.endsWith(p.s))
    .map(p => ({ ...p, score: p.c + p.s.length * 4 }))
    .sort((a, b) => b.score - a.score);
}
function E_signature(h) {
  if (h.length < 2) return null;
  const hits = scanPatterns(h);
  if (!hits.length) return null;
  const top = hits[0];
  const agree = hits.slice(0, 3).filter(x => x.x === top.x).length;
  return { c: top.x, conf: Math.min(96, top.c + (agree - 1) * 3), name: top.n, group: top.g, hits, w: 2.4 };
}
function matchScore(hist, pat) {
  if (!pat.length || hist.length < 2) return 0;
  let score = 0;
  const max = pat.length * 2, sl = Math.min(5, pat.length, hist.length);
  const hS = hist.slice(0, sl), pS = pat.slice(-sl).reverse();
  for (let i = 0; i < sl; i++) if (hS[i] === pS[i]) score += 2.2 - i * 0.3;
  let lcs = 0, j = 0;
  for (let i = 0; i < hist.length && j < pat.length; i++) if (hist[i] === pat[j]) { lcs++; j++; }
  score += lcs * 0.7;
  if (pat.length > hist.length + 3) score *= 0.4;
  return Math.min(score / max, 1.2);
}
function E_library(h) {
  if (h.length < 3) return null;
  let best = null, bs = -1;
  for (const p of LIB) { const sc = matchScore(h, p.arr); if (sc > bs) { bs = sc; best = p; } }
  if (!best) return null;
  let ch;
  if (bs > 0.35) {
    let m = 0;
    for (let i = 0; i < best.arr.length; i++) { if (i < h.length && h[i] === best.arr[best.arr.length - 1 - i]) m++; else break; }
    const ni = best.arr.length - 1 - m;
    ch = ni >= 0 && ni < best.arr.length ? best.arr[ni] : (h[0] === "B" ? "S" : "B");
  } else {
    const r8 = h.slice(0, 8), b = r8.filter(x => x === "B").length, s = r8.length - b;
    ch = b >= s + 2 ? "S" : (s >= b + 2 ? "B" : (h[0] === "B" ? "S" : "B"));
  }
  return { c: ch, conf: Math.min(94, Math.max(54, Math.round(bs * 100))), name: best.name, w: 1.5 };
}
function E_markov(h) {
  const s = chrono(h, 24);
  if (s.length < 5) return null;
  const key = s.slice(-2);
  let cb = 0, cs = 0;
  for (let i = 0; i < s.length - 2; i++) if (s.slice(i, i + 2) === key) s[i + 2] === "B" ? cb++ : cs++;
  const tot = cb + cs;
  if (tot < 2) return null;
  const pb = cb / tot;
  if (pb > 0.58) return { c: "B", conf: Math.min(92, Math.round(pb * 100)), name: "Markov Chain [" + key + "→B]", w: 1.8 };
  if (pb < 0.42) return { c: "S", conf: Math.min(92, Math.round((1 - pb) * 100)), name: "Markov Chain [" + key + "→S]", w: 1.8 };
  return { c: pb >= 0.5 ? "B" : "S", conf: 56, name: "Markov Neutral", w: 0.8 };
}
function E_weighted(h) {
  if (h.length < 3) return null;
  let same = 1;
  for (let i = 1; i < Math.min(h.length, 6); i++) { if (h[i] === h[0]) same++; else break; }
  if (same >= 3) return { c: h[0] === "B" ? "S" : "B", conf: Math.min(93, 68 + same * 5), name: "🐉 Dragon Breaker ×" + same, w: 2.2 };
  let mirror = true;
  for (let i = 1; i < Math.min(h.length, 5); i++) if (h[i] === h[i - 1]) { mirror = false; break; }
  if (mirror && h.length >= 4) return { c: h[0] === "B" ? "S" : "B", conf: 84, name: "🪞 Mirror Track", w: 2.0 };
  let bw = 0, tw = 0;
  for (let i = 0; i < Math.min(h.length, 12); i++) { const w = 12 - i; if (h[i] === "B") bw += w; tw += w; }
  const ratio = tw ? bw / tw : 0.5;
  const c = ratio > 0.58 ? "B" : (ratio < 0.42 ? "S" : (h[0] === "B" ? "S" : "B"));
  return { c, conf: Math.min(90, Math.max(56, Math.round(Math.abs(ratio - 0.5) * 180 + 56))), name: "📊 Weight Ratio B:" + Math.round(ratio * 100) + "%", w: 1.6 };
}
function E_entropy(h) {
  if (h.length < 4) return null;
  let bScore = 0, sScore = 0;
  h.slice(0, 30).forEach((x, i) => { const w = i < 5 ? 3 : (i < 12 ? 2 : 1); x === "B" ? bScore += w : sScore += w; });
  let c = bScore > sScore ? "B" : "S";
  const l5 = h.slice(0, 5);
  if (l5[0] === l5[1] && l5[2] === l5[3] && l5[0] !== l5[2]) c = l5[0];
  let run = 0;
  for (const x of h) { if (x === h[0]) run++; else break; }
  let name = "Entropy Balance";
  if (run > 5) { c = h[0] === "B" ? "S" : "B"; name = "Entropy Overload ×" + run; }
  const spread = Math.abs(bScore - sScore) / Math.max(1, bScore + sScore);
  return { c, conf: Math.min(94, Math.round(60 + spread * 70)), name, w: 1.4 };
}
function E_turn(h) {
  if (!h.length) return null;
  const k = TURNS[S.turnIdx % TURNS.length].k;
  const last = h[0], l2 = h.slice(0, 2);
  let c;
  switch (k) {
    case "ALTERNATE": c = last; break;
    case "ZIGZAG":    c = l2.length >= 2 && l2[0] !== l2[1] ? (l2[1] === "B" ? "S" : "B") : last; break;
    case "GROUP":     c = h.length >= 4 && h[0] === h[2] ? (h[0] === "B" ? "S" : "B") : last; break;
    case "REVERSE":   c = last; break;
    default:          c = last === "B" ? "S" : "B";
  }
  return { c, conf: 65 + (S.turn % 5) * 3, name: "🔄 " + k + " (turn " + S.turn + ")", w: 1.1 };
}
function E_guard(h) {
  if (h.length < 3) return null;
  let st = 1;
  for (let i = 1; i < h.length; i++) { if (h[i] === h[0]) st++; else break; }
  if (st >= 3) return { c: h[0] === "B" ? "S" : "B", conf: Math.min(92, 70 + st * 4), name: "🛡 Streak Guard ×" + st, w: 2.0 };
  const l10 = h.slice(0, 10), b = l10.filter(x => x === "B").length, s = l10.length - b;
  return { c: b > s ? "B" : "S", conf: Math.min(84, 55 + Math.abs(b - s) * 5), name: "Majority Window " + b + "B/" + s + "S", w: 1.2 };
}

const ENGINES = [
  { id: "SIG", ico: "🎯", label: "SIGNATURE", fn: E_signature },
  { id: "LIB", ico: "📚", label: "LIBRARY", fn: E_library },
  { id: "MARKOV", ico: "🧬", label: "MARKOV", fn: E_markov },
  { id: "WEIGHT", ico: "📊", label: "WEIGHTED", fn: E_weighted },
  { id: "ENTROPY", ico: "🌀", label: "ENTROPY", fn: E_entropy },
  { id: "TURN", ico: "🔄", label: "TURN", fn: E_turn },
  { id: "GUARD", ico: "🛡", label: "GUARD", fn: E_guard }
];

function fuse(h) {
  const votes = ENGINES.map(e => {
    try { const r = e.fn(h); return r ? { ...e, ...r } : { ...e, c: null, conf: 0, name: "—", w: 0 }; }
    catch (_) { return { ...e, c: null, conf: 0, name: "—", w: 0 }; }
  });
  const active = votes.filter(v => v.c);
  if (!active.length) return { pred: Math.random() < 0.5 ? "BIG" : "SMALL", conf: 52, name: "Initial Scanning Matrix", group: "INIT", votes, hits: [] };
  const sig = votes.find(v => v.id === "SIG");
  const solo = { SIG: "SIG", MARKOV: "MARKOV", TREND: "WEIGHT", GUARD: "GUARD", TURN: "TURN" }[S.mode];
  if (solo) {
    const v = votes.find(x => x.id === solo && x.c) || active[0];
    return { pred: SZ(v.c), conf: v.conf, name: v.name, group: v.group || S.mode, votes, hits: (sig && sig.hits) || [], agree: 1, total: active.length };
  }
  let B = 0, Sc = 0;
  active.forEach(v => { const p = v.w * (v.conf / 100); v.c === "B" ? B += p : Sc += p; });
  let c = B >= Sc ? "B" : "S";
  const totalW = B + Sc, dom = totalW ? Math.max(B, Sc) / totalW : 0.5;
  let conf = Math.round(48 + dom * 46);
  let name = sig && sig.c ? sig.name : active[0].name;
  let group = sig && sig.c ? sig.group : "FUSION";
  if (sig && sig.c && sig.hits.length && sig.hits[0].s.length >= 5 && sig.conf >= 85) {
    c = sig.c; conf = Math.max(conf, sig.conf); name = sig.name + " ⚡";
  }
  if (S.guard) {
    const w5 = chrono(h, 5);
    if (w5 === "BBBBB") { c = "S"; conf = 91; name = "🐉 Dragon Big Break"; group = "DRAGON"; }
    if (w5 === "SSSSS") { c = "B"; conf = 91; name = "🐉 Dragon Small Break"; group = "DRAGON"; }
  }
  if (!(sig && sig.c === c)) {
    const alt = active.filter(v => v.c === c).sort((a, b) => b.w * b.conf - a.w * a.conf)[0];
    if (alt) { name = alt.name; group = alt.group || "FUSION"; }
    if (sig && sig.c) name += " · counter " + sig.group;
  }
  const agree = active.filter(v => v.c === c).length;
  conf = Math.min(97, Math.max(54, conf + (agree >= 5 ? 4 : 0)));
  if (h.length < 5) conf = Math.min(conf, 52 + h.length * 6);
  return { pred: SZ(c), conf, name, group, votes, hits: (sig && sig.hits) || [], agree, total: active.length };
}

function feverHeat() {
  const cnt = Array(10).fill(0);
  S.feed.slice(0, 40).forEach(r => { if (r.number >= 0 && r.number <= 9) cnt[r.number]++; });
  return cnt;
}
function makeSeeds(pred, period) {
  const pool = pred === "BIG" ? BIG_POOL : SMALL_POOL;
  const cnt = feverHeat();
  const ranked = pool.slice().sort((a, b) => cnt[b] - cnt[a]);
  const seed = parseInt(String(period).slice(-3), 10) || 0;
  let n1 = ranked[0], n2 = ranked[1];
  if (S.lastSeeds.length && (n1 === S.lastSeeds[0] || n2 === S.lastSeeds[1])) {
    n1 = ranked[seed % ranked.length];
    n2 = ranked[(seed + 2) % ranked.length];
    if (n1 === n2) n2 = ranked[(seed + 3) % ranked.length];
  }
  if (!pool.includes(n1)) n1 = ranked[0];
  if (!pool.includes(n2) || n2 === n1) n2 = ranked.find(x => x !== n1);
  S.lastSeeds = [n1, n2];
  return { n1, n2, pool, heat: cnt, list: [n1, n2] };
}

let actx = null;
function beep(type) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const tone = (f, wave, dur, vol, delay) => setTimeout(() => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.connect(g); g.connect(actx.destination); o.frequency.value = f; o.type = wave;
      g.gain.setValueAtTime(vol, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + dur);
      o.start(); o.stop(actx.currentTime + dur);
    }, delay);
    if (type === "win") { tone(880, "sine", .28, .13, 0); tone(1180, "sine", .25, .10, 110); }
    else if (type === "loss") tone(320, "sawtooth", .26, .09, 0);
    else if (type === "jackpot") { tone(1200, "square", .4, .13, 0); tone(1500, "sine", .3, .12, 130); tone(1900, "sine", .35, .11, 270); }
    else tone(660, "sine", .1, .06, 0);
  } catch (_) {}
}
function confetti(n, gold) {
  if (!S.fx) return;
  const cols = gold ? ["#ffd700", "#ffe680", "#fff", "#ffaa00"] : ["#00f2fe", "#00ff87", "#ffd700", "#3ce8ff", "#ff0055"];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    p.style.cssText = "left:" + (Math.random() * 100) + "vw;background:" + cols[i % cols.length] + ";animation:fall " + (1.4 + Math.random() * 1.8) + "s linear " + (Math.random() * .5) + "s forwards;border-radius:" + (Math.random() > .5 ? "50%" : "2px") + ";position:fixed;top:-10px;width:8px;height:8px;z-index:9999;pointer-events:none;";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3600);
  }
}
function toast(msg, col) {
  const t = $("toast");
  t.textContent = msg; t.style.color = col || "var(--primary)"; t.style.borderColor = col || "var(--primary)";
  t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2400);
}

const cv = $("mesh"), cx = cv.getContext("2d");
let pts = [], rafOn = false;
function initMesh() {
  cv.width = innerWidth; cv.height = innerHeight;
  const d = Math.min(58, Math.floor(cv.width * cv.height / 19000));
  pts = [];
  for (let i = 0; i < d; i++) pts.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .8 });
}
function drawMesh() {
  if (!S.meshOn) { cx.clearRect(0, 0, cv.width, cv.height); rafOn = false; return; }
  cx.clearRect(0, 0, cv.width, cv.height);
  const col = getComputedStyle(document.body).getPropertyValue("--primary").trim() || "#00f2fe";
  cx.lineWidth = .55;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
      if (d < 118) { cx.strokeStyle = col; cx.globalAlpha = (1 - d / 118) * .14; cx.beginPath(); cx.moveTo(pts[i].x, pts[i].y); cx.lineTo(pts[j].x, pts[j].y); cx.stroke(); }
    }
  }
  cx.globalAlpha = .75; cx.fillStyle = col;
  pts.forEach(p => {
    cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832); cx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > cv.width) p.vx *= -1;
    if (p.y < 0 || p.y > cv.height) p.vy *= -1;
  });
  cx.globalAlpha = 1;
  requestAnimationFrame(drawMesh);
}
addEventListener("resize", initMesh);

const Gate = {
  verify() {
    $("gate").classList.add("hide");
    store.set("gate", true);
    $("app").style.display = "flex";
    store.set("sessions", (store.get("sessions", 0) | 0) + 1);
    App.boot();
  }
};

const Admin = {
  show() { $("admin").classList.add("on"); this.render(); },
  close() { $("admin").classList.remove("on"); },
  render() {
    const keys = store.get("keys", []);
    $("aUsers").textContent = store.get("sessions", 0);
    $("aKeys").textContent = keys.length;
    $("aRounds").textContent = S.wins + S.losses;
    $("keyList").innerHTML = keys.length ? keys.map((k, i) =>
      '<div class="keyitem"><div><div class="keycode">' + k.key + '</div><div style="font-size:9px;color:var(--dim2)">' + k.type + '</div></div><button style="background:none;border:none;color:#ff0055;cursor:pointer" onclick="Admin.delKey(' + i + ')">✕</button></div>'
    ).join("") : '<div style="color:var(--dim2);font-size:11px;padding:6px">No keys generated</div>';
  },
  genKey() {
    const type = $("keyType").value, keys = store.get("keys", []), ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "COLORX";
    for (let i = 0; i < 3; i++) { key += "-"; for (let j = 0; j < 4; j++) key += ch[Math.floor(Math.random() * ch.length)]; }
    keys.push({ key, type }); store.set("keys", keys);
    $("genOut").textContent = "✅ Compiled Token: " + key;
    this.render();
  },
  delKey(i) { const k = store.get("keys", []); k.splice(i, 1); store.set("keys", k); this.render(); },
  mode(m) { store.set("force", m); $("genOut").textContent = "✅ Override forced: " + m; },
  maint(on) { store.set("maint", on); applyAdmin(); $("genOut").textContent = on ? "🔧 Lockdown active" : "✅ Live active"; },
  ann(type) {
    const t = $("annInput").value.trim();
    if (!t) { toast("Provide notification text!", "#ff0055"); return; }
    store.set("ann", { text: t, type }); applyAdmin(); $("annInput").value = "";
  },
  clearAnn() { store.set("ann", { text: "", type: "info" }); applyAdmin(); },
  resetAll() {
    if (!confirm("Reset all local stats and logs?")) return;
    ["keys", "logs", "stats", "sessions", "force", "ann", "maint", "turn", "turnIdx", "patScore"].forEach(store.del);
    location.reload();
  }
};

function applyAdmin() {
  const a = store.get("ann", { text: "", type: "info" }), el = $("ann");
  if (a.text) {
    const cols = { info: "#00f2fe", warn: "#ffd700", success: "#00ff87", danger: "#ff0055" };
    el.textContent = a.text + "   ✕";
    el.style.color = cols[a.type] || "#00f2fe";
    el.style.borderBottom = "1px solid " + (cols[a.type] || "#00f2fe");
    el.style.display = "block";
  } else el.style.display = "none";
}

const App = {
  boot() {
    this.loadState(); initMesh(); if (!rafOn) { rafOn = true; drawMesh(); }
    this.buildModes(); this.buildThemes(); applyAdmin(); this.renderAll();
    this.sync(); setInterval(() => this.sync(), 3000); setInterval(() => this.tick(), 500);
  },
  loadState() {
    const st = store.get("stats", null);
    if (st) Object.assign(S, st);
    S.logs = store.get("logs", []); S.turn = store.get("turn", 0); S.turnIdx = store.get("turnIdx", 0);
    S.mode = store.get("mode", "ALL"); S.patScore = store.get("patScore", {});
    const cfg = store.get("cfg", {});
    S.sound = cfg.sound !== false; S.fx = cfg.fx !== false; S.guard = cfg.guard !== false; S.meshOn = cfg.mesh !== false;
    ["sound", "fx", "guard", "mesh"].forEach(k => {
      $("tgl" + k[0].toUpperCase() + k.slice(1)).classList.toggle("on", k === "mesh" ? S.meshOn : S[k]);
    });
    document.body.setAttribute("data-theme", store.get("theme", "hyper-neon"));
  },
  saveState() {
    store.set("stats", { wins: S.wins, losses: S.losses, jackpots: S.jackpots, best: S.best, streak: S.streak, maxLoss: S.maxLoss, lossRun: S.lossRun });
    store.set("logs", S.logs.slice(0, 40)); store.set("turn", S.turn); store.set("turnIdx", S.turnIdx); store.set("patScore", S.patScore);
  },
  async sync() {
    if (store.get("maint", false)) return;
    try {
      const r = await fetch(API + Date.now(), { cache: "no-store" });
      const j = await r.json();
      const list = j && j.data && j.data.list;
      if (!list || !list.length) throw new Error("empty");
      S.online = true;
      $("feedDot").classList.remove("off");
      $("feedTxt").textContent = "● LIVE QUANTUM STREAM · WINGO 1 MIN · SYNCED";
      S.feed = list.slice(0, 60).map(it => ({
        period: String(it.issueNumber),
        number: parseInt(it.number, 10) % 10,
        size: (parseInt(it.number, 10) % 10) >= 5 ? "BIG" : "SMALL"
      }));
      S.hist = S.feed.map(x => BS(x.number));
      S.logs.forEach(l => {
        if (l.status !== "PENDING") return;
        const m = S.feed.find(x => x.period === l.period);
        if (m) this.resolve(l, m);
      });
      const cur = S.feed[0];
      if (cur.period !== S.lastPeriod) { S.lastPeriod = cur.period; this.predict(cur); }
      this.renderAll();
    } catch (_) {
      S.online = false;
      $("feedDot").classList.add("off");
      $("feedTxt").textContent = "● RECONNECTING TO QUANTUM CORES...";
    }
  },
  predict(cur) {
    const next = (BigInt(cur.period) + 1n).toString();
    const res = fuse(S.hist);
    const force = store.get("force", "AUTO");
    let pred = res.pred, name = res.name;
    if (force === "BIG") { pred = "BIG"; name = "⚙ CORES INTERVENTION: BIG"; }
    if (force === "SMALL") { pred = "SMALL"; name = "⚙ CORES INTERVENTION: SMALL"; }
    const seeds = makeSeeds(pred, next);
    const log = { period: next, pred, conf: res.conf, name, group: res.group || "FUSION", n1: seeds.n1, n2: seeds.n2, pool: seeds.pool, status: "PENDING", mode: S.mode, t: Date.now() };
    S.logs.unshift(log); if (S.logs.length > 40) S.logs.pop();
    S.pending = log; this.lastRes = res;
    this.saveState(); this.renderSignal(log, res);
  },
  resolve(l, m) {
    l.realN = m.number; l.realS = m.size;
    const exact = m.number === l.n1 || m.number === l.n2;
    const sideWin = m.size === l.pred;
    const win = exact || sideWin;
    if (exact) { l.status = "JACKPOT"; S.jackpots++; } else if (sideWin) { l.status = "WIN"; } else { l.status = "LOSS"; }
    if (win) { S.wins++; S.streak++; S.lossRun = 0; if (S.streak > S.best) S.best = S.streak; }
    else { S.losses++; S.streak = 0; S.lossRun++; if (S.lossRun > S.maxLoss) S.maxLoss = S.lossRun; }
    const ps = S.patScore[l.name || "—"] || { w: 0, l: 0 };
    win ? ps.w++ : ps.l++; S.patScore[l.name || "—"] = ps;
    S.turnIdx = (S.turnIdx + 1) % TURNS.length; S.turn++;
    this.saveState();
    if (exact) { beep("jackpot"); confetti(140, true); } else if (sideWin) { beep("win"); confetti(70, false); } else beep("loss");
    setTimeout(() => this.showPopup(l), 700);
  },
  renderAll() {
    this.renderStats(); this.renderHistory(); this.renderTrend(); this.renderRadar(); this.renderCouncil(); this.renderPatLib(); this.renderScoreboard();
    $("turnPat").textContent = TURNS[S.turnIdx % TURNS.length].label;
    $("turnCount").textContent = S.turn; $("curStreak").textContent = S.streak; $("maxLoss").textContent = S.maxLoss;
  },
  renderSignal(log, res) {
    const isBig = log.pred === "BIG", pt = $("predText");
    pt.textContent = log.pred; pt.style.color = isBig ? "#ffa733" : "#00f2fe";
    $("periodNum").textContent = String(log.period).slice(-6);
    $("patChip").textContent = log.name;
    $("confBar").style.width = log.conf + "%"; $("confPct").textContent = log.conf + "%";
    $("confName").textContent = log.name + " · " + (res.agree || 0) + "/" + (res.total || 0) + " synapsed";
    $("seed1").textContent = log.n1; $("seed2").textContent = log.n2;
    $("modePill").textContent = (MODES.find(m => m.k === S.mode) || MODES[0]).n;
    $("feverPool").textContent = (isBig ? BIG_POOL : SMALL_POOL).join(" · ") + " (" + log.pred + " ONLY)";
    this.renderFever(log);
  },
  renderFever(log) {
    const isBig = log.pred === "BIG", pool = isBig ? BIG_POOL : SMALL_POOL, cnt = feverHeat();
    const max = Math.max(1, ...pool.map(n => cnt[n]));
    $("feverSide").textContent = log.pred + " TARGET EXCLUSION";
    $("feverSide").style.color = isBig ? "#ffa733" : "#00f2fe";
    $("feverHeat").innerHTML = pool.map(n => {
      const pick = n === log.n1 || n === log.n2, hot = cnt[n] >= max && !pick;
      return '<div class="fh ' + (pick ? "pick" : hot ? "top" : "") + '">' + n + '<b>' + cnt[n] + 'x</b></div>';
    }).join("");
  },
  renderStats() {
    const tot = S.wins + S.losses, acc = tot ? Math.round(S.wins / tot * 100) : 0;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set("tWins", S.wins); set("tLoss", S.losses); set("tJack", S.jackpots);
    set("hWins", S.wins); set("hLoss", S.losses); set("hAcc", tot ? acc + "%" : "--%");
    set("sWins", S.wins); set("sLoss", S.losses); set("sJack", S.jackpots); set("sRounds", tot); set("sBest", S.best); set("sMaxL", S.maxLoss);
    set("bigAcc", tot ? acc + "%" : "--%"); set("accPill", "SUCCESS " + (tot ? acc + "%" : "--%"));
    $("accBar").style.width = acc + "%";
  },
  renderHistory() {
    const el = $("hList");
    if (!S.logs.length) { el.innerHTML = '<div class="empty">NO SIGNALS EXPORTED YET</div>'; return; }
    el.innerHTML = S.logs.slice(0, 25).map(l => {
      const st = (l.status || "PENDING").toLowerCase(), pc = l.pred === "BIG" ? "#ffa733" : "#00f2fe";
      const badge = { pending: '<span class="badge pending">◌ COMPILING</span>', win: '<span class="badge win">✓ STABLE</span>', loss: '<span class="badge loss">✗ DEVIATED</span>', jackpot: '<span class="badge jackpot">🏆 APEX EVENT</span>' }[st];
      const actual = l.status === "PENDING" ? '<div class="h-act">◌ Validating drift parameters…</div>' : '<div class="h-act" style="color:' + (l.realS === "BIG" ? "#ffa733" : "#00f2fe") + '">' + l.realS + ' (' + l.realN + ')</div>';
      return '<div class="h-row"><div class="h-bar ' + st + '"></div><div class="h-mid"><div class="h-per">#' + String(l.period).slice(-6) + ' · ' + (l.name || "—") + '</div><div class="h-pred" style="color:' + pc + '">' + l.pred + ' <span style="font-size:11px;color:var(--dim)">[' + l.n1 + ', ' + l.n2 + ']</span></div>' + actual + '</div><div class="h-right">' + badge + '<div class="h-conf">' + (l.conf || "--") + '%</div></div></div>';
    }).join("");
  },
  renderTrend() {
    const l10 = S.feed.slice(0, 10); if (!l10.length) return;
    const b = l10.filter(r => r.number >= 5).length;
    $("trendRatio").textContent = "B:" + b + " / S:" + (l10.length - b);
    $("bars").innerHTML = l10.slice().reverse().map(r => '<div class="bcol"><div class="bfill ' + (r.number >= 5 ? "B" : "S") + '" style="height:' + Math.max(10, (r.number + 1) * 7.5) + 'px"></div><div class="blbl">' + r.number + '</div></div>').join("");
    $("dots").innerHTML = l10.slice(0, 8).reverse().map(r => '<div class="pdot ' + (r.number >= 5 ? "B" : "S") + '">' + (r.number >= 5 ? "B" : "S") + '</div>').join("") + '<div class="pdot q">?</div>';
  },
  renderRadar() {
    if (!S.hist.length) return;
    const last5 = S.hist.slice(0, 5).reverse(), nextC = S.pending ? (S.pending.pred === "BIG" ? "B" : "S") : "?";
    $("seqRow").innerHTML = last5.map((c, i) => '<div class="node ' + c + '">' + c + '<span class="idx">' + (last5.length - i) + '</span></div>').join("") + '<span class="arrow">→</span><div class="node ' + (nextC === "?" ? "B" : nextC) + ' next">' + nextC + '<span class="idx">NEXT</span></div>';
    const hits = scanPatterns(S.hist);
    $("radarName").textContent = hits.length ? hits[0].n : "Matrix Drift Stable";
    $("radarTag").textContent = hits.length ? hits[0].g : "MONITORING";
    $("rfMatch").textContent = hits.length;
    let st = 1; for (let i = 1; i < S.hist.length; i++) { if (S.hist[i] === S.hist[0]) st++; else break; }
    $("rfStreak").textContent = st;
    const b = S.hist.slice(0, 10).filter(x => x === "B").length;
    $("rfRatio").textContent = b + "/" + (Math.min(10, S.hist.length) - b);
    $("rfLib").textContent = SIGS.length;
  },
  renderCouncil() {
    if (!this.lastRes) return;
    $("council").innerHTML = this.lastRes.votes.map(v => '<div class="eng ' + (v.c === "B" ? "big" : v.c === "S" ? "small" : "") + '"><div class="eng-ico">' + v.ico + '</div><div class="eng-b"><div class="eng-n">' + v.label + '</div><div class="eng-v ' + (v.c || "") + '">' + (v.c ? SZ(v.c) : "IDLE") + '</div><div class="eng-w">' + (v.c ? v.conf + "% · w" + v.w : "standby") + '</div></div></div>').join("");
  },
  renderPatLib() {
    if (!S.hist.length) return;
    const hits = scanPatterns(S.hist), map = {}; hits.forEach(h => map[h.n] = h.score);
    const rows = SIGS.map(p => ({ ...p, live: map[p.n] || 0 })).sort((a, b) => b.live - a.live || b.c - a.c).slice(0, 14);
    $("patLib").innerHTML = rows.map(p => {
      const on = p.live > 0, pct = Math.min(100, on ? p.live / 1.4 : p.c * 0.5);
      return '<div style="padding:9px 2px;border-bottom:1px solid var(--stroke)"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px"><span style="font-size:10.5px;font-weight:' + (on ? 800 : 600) + ';color:' + (on ? "var(--primary)" : "var(--dim)") + '">' + (on ? "⚡ " : "") + p.n + '</span><span style="font-family:Orbitron;font-size:9.5px;color:' + (p.x === "B" ? "#ffa733" : "#00f2fe") + '">' + p.s + ' → ' + SZ(p.x) + '</span></div><div class="bar" style="height:4px"><i style="width:' + pct + '%;' + (on ? "" : "opacity:.3") + '"></i></div></div>';
    }).join("");
  },
  renderScoreboard() {
    const ks = Object.keys(S.patScore);
    if (!ks.length) { $("patScore").innerHTML = '<div class="empty">NO HISTORICAL PERFORMANCE RECORDED</div>'; return; }
    const rows = ks.map(k => ({ k, ...S.patScore[k], t: S.patScore[k].w + S.patScore[k].l })).sort((a, b) => b.t - a.t).slice(0, 12);
    $("patScore").innerHTML = rows.map(r => {
      const acc = r.t ? Math.round(r.w / r.t * 100) : 0;
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 2px;border-bottom:1px solid var(--stroke)"><span style="font-size:10.5px;color:var(--ink);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.k + '</span><span style="font-family:Orbitron;font-size:9.5px;color:var(--win)">' + r.w + 'V</span><span style="font-family:Orbitron;font-size:9.5px;color:var(--loss)">' + r.l + 'D</span><span style="font-family:Orbitron;font-size:10.5px;font-weight:900;color:' + (acc >= 60 ? "var(--win)" : acc >= 45 ? "var(--accent)" : "var(--loss)") + ';min-width:34px;text-align:right">' + acc + '%</span></div>';
    }).join("");
  },
  buildModes() {
    $("modeScroll").innerHTML = MODES.map(m => '<button class="mode-btn ' + (S.mode === m.k ? "on" : "") + '" data-m="' + m.k + '" onclick="App.setMode(\'' + m.k + '\',this)">' + m.n + '</button>').join("");
    $("modeDesc").textContent = (MODES.find(m => m.k === S.mode) || MODES[0]).d;
  },
  setMode(k, btn) {
    S.mode = k; store.set("mode", k);
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("on", b.dataset.m === k));
    $("modeDesc").textContent = (MODES.find(m => m.k === k) || MODES[0]).d;
    $("modePill").textContent = (MODES.find(m => m.k === k) || MODES[0]).n;
    if (S.pending && S.hist.length) {
      const res = fuse(S.hist), sd = makeSeeds(res.pred, S.pending.period);
      Object.assign(S.pending, { pred: res.pred, conf: res.conf, name: res.name, mode: k, n1: sd.n1, n2: sd.n2, pool: sd.pool });
      this.lastRes = res; this.renderSignal(S.pending, res); this.renderAll(); this.saveState();
    }
    beep("tick"); toast("MODE → " + (MODES.find(m => m.k === k) || {}).n);
  },
  buildThemes() {
    const cur = store.get("theme", "hyper-neon");
    $("themeGrid").innerHTML = THEMES.map(t => '<button class="tbtn ' + (cur === t.k ? "on" : "") + '" data-t="' + t.k + '" onclick="App.setTheme(\'' + t.k + '\',this)"><span class="tdot" style="background:' + t.c + ';box-shadow:0 0 10px ' + t.c + '"></span>' + t.n + '</button>').join("");
  },
  setTheme(k) {
    document.body.setAttribute("data-theme", k); store.set("theme", k);
    document.querySelectorAll(".tbtn").forEach(b => b.classList.toggle("on", b.dataset.t === k)); beep("tick");
  },
  toggle(k) {
    const map = { sound: "sound", fx: "fx", guard: "guard", mesh: "meshOn" };
    S[map[k]] = !S[map[k]];
    $("tgl" + k[0].toUpperCase() + k.slice(1)).classList.toggle("on", S[map[k]]);
    store.set("cfg", { sound: S.sound, fx: S.fx, guard: S.guard, mesh: S.meshOn });
    if (k === "mesh" && S.meshOn && !rafOn) { rafOn = true; initMesh(); drawMesh(); }
    if (k === "mesh" && !S.meshOn) rafOn = false;
    beep("tick");
  },
  go(page, btn) {
    S.page = page;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
    $("pg-" + page).classList.add("on");
    document.querySelectorAll(".nbtn").forEach(b => b.classList.remove("on"));
    if (btn) btn.classList.add("on");
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  tick() {
    const sec = 59 - new Date().getSeconds();
    $("tVal").textContent = String(sec).padStart(2, "0");
    $("tArc").style.strokeDashoffset = 157 * (1 - sec / 59);
    $("tVal").style.color = sec <= 10 ? "var(--loss)" : sec <= 25 ? "var(--accent)" : "#fff";
    const ring = document.querySelector(".timer-ring");
    if (ring) ring.classList.toggle("warning-pulse", sec <= 10);
  },
  showPopup(l) {
    if (!S.fx) return;
    const jp = l.status === "JACKPOT", w = l.status === "WIN";
    $("popBox").className = "pop " + (jp ? "jackpot" : w ? "win" : "loss");
    $("popShine").style.display = jp ? "block" : "none";
    $("popIco").textContent = jp ? "🏆" : w ? "🎯" : "💀";
    $("popTitle").textContent = jp ? "QUANTUM JACKPOT!" : w ? "VICTORY" : "DEVIATION";
    $("popTitle").style.color = jp ? "var(--jack)" : w ? "var(--win)" : "var(--loss)";
    $("popSub").textContent = "WINGO 1 MINUTE · " + (l.name || "");
    $("popPeriod").textContent = "#" + String(l.period).slice(-6);
    $("popPred").textContent = l.pred + " [" + l.n1 + "," + l.n2 + "]";
    $("popPred").style.color = l.pred === "BIG" ? "#ffa733" : "#00f2fe";
    $("popActual").textContent = l.realS + " (" + l.realN + ")";
    $("popActual").style.color = l.realS === "BIG" ? "#ffa733" : "#00f2fe";
    $("popNote").style.display = jp ? "block" : "none";
    if (jp) $("popNote").textContent = "⚡ APEX HIT: Exact Number " + l.realN;
    $("popDesc").textContent = jp ? "Apex compilation hit confirmed." : w ? "Matrix successfully verified expectation parameters." : "System trajectory deviated from expectation.";
    $("popup").classList.add("on");
  },
  closePopup() { $("popup").classList.remove("on"); },
  copySignal() {
    const l = S.pending || S.logs[0];
    if (!l) { toast("No active signals", "#ff0055"); return; }
    const t = "⚡ ColorX Daily Predictor ⚡\\nPeriod: " + l.period + "\\nPred: " + l.pred + " [" + l.n1 + ", " + l.n2 + "]\\nPattern: " + l.name + "\\nConf: " + l.conf + "%";
    navigator.clipboard.writeText(t).then(() => toast("✅ Signal copied!", "var(--win)")).catch(() => toast("Copy failed", "#ff0055"));
  },
  copyHistory() {
    if (!S.logs.length) { toast("No logs", "#ff0055"); return; }
    const t = S.logs.map(l => "#" + String(l.period).slice(-6) + " " + l.pred + "[" + l.n1 + "," + l.n2 + "] → " + l.status).join("\\n");
    navigator.clipboard.writeText(t).then(() => toast("✅ Report copied!", "var(--win)")).catch(() => toast("Copy failed", "#ff0055"));
  },
  clearHistory() {
    if (!confirm("Erase all logs and stats?")) return;
    S.logs = []; S.wins = 0; S.losses = 0; S.jackpots = 0; S.streak = 0; S.best = 0; S.lossRun = 0; S.maxLoss = 0; S.patScore = {};
    this.saveState(); this.renderAll(); toast("🗑 Logs cleared");
  }
};
window.App = App; window.Admin = Admin; window.Gate = Gate;
(function init() {
  initMesh(); rafOn = true; drawMesh(); applyAdmin();
  document.body.setAttribute("data-theme", store.get("theme", "hyper-neon"));
  if (store.get("gate", false)) { $("gate").classList.add("hide"); $("app").style.display = "flex"; App.boot(); }
})();
})();
</script>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname === "/api/predict") {
      return handleApiPredict(url);
    }
    return new Response(renderHtmlPage(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  }
};
