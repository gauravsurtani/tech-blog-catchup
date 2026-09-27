export type MotionPalette = {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  line: string;
};
export const DURATION = 22000;
export const CHAPTERS = [
  { label: "Source", at: 2400 },
  { label: "Outline", at: 7200 },
  { label: "Conversation", at: 13200 },
  { label: "Episode", at: 19800 },
];

type Ctx = CanvasRenderingContext2D;
type Rule = { x0: number; x1: number; y: number };
type Seg = { s: string; tok: number };
type Turn = { v: number; s: string; a: number; z: number };

// Logical stage. Everything below is authored in this space and scaled to fit.
const W = 1000,
  H = 620,
  M = 70;

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ioCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const oCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const ioSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

const font = (w: number, s: number) =>
  `${Math.round(w / 100) * 100} ${s.toFixed(2)}px "DM Sans", ui-sans-serif, system-ui, sans-serif`;
function measure(ctx: Ctx, s: string, w: number, size: number) {
  ctx.font = font(w, size);
  return ctx.measureText(s).width;
}
function fit(ctx: Ctx, s: string, w: number, max: number, limit: number) {
  const m = measure(ctx, s, w, max);
  return m > limit ? (max * limit) / m : max;
}
function track(ctx: Ctx, v: string) {
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = v;
}

// Original sample source. Tokens 0–2 carry the idea, 3–4 carry the caveat.
const SRC: Seg[][] = [
  [
    { s: "A ", tok: -1 },
    { s: "cache", tok: 0 },
    { s: " keeps", tok: -1 },
  ],
  [
    { s: "useful data", tok: 1 },
    { s: " ", tok: -1 },
    { s: "close", tok: 2 },
    { s: ".", tok: -1 },
  ],
  [
    { s: "The ", tok: -1 },
    { s: "trade-off", tok: 3 },
    { s: " is ", tok: -1 },
    { s: "freshness", tok: 4 },
    { s: ".", tok: -1 },
  ],
];
const LINE_Y = [212, 306, 398];
const SCAN = [
  [900, 1450],
  [1450, 2050],
  [2700, 3550],
];
const RULES: Rule[] = [
  { x0: M, x1: 600, y: 312 },
  { x0: 390, x1: 930, y: 540 },
];
const LABELS: [string, string, number, number][] = [
  ["01", "Core idea", M, 146],
  ["02", "Caveat", 390, 378],
];
const KICK: [string, string][] = [
  ["01", "Source text"],
  ["02", "Outline"],
  ["03", "Two-voice script"],
  ["04", "Episode"],
];
const BOUNDS = [4900, 9700, 15900];
const TURNS: Turn[] = [
  { v: 0, s: "So what does a cache keep close?", a: 10900, z: 13700 },
  { v: 1, s: "Useful data, right where it’s needed.", a: 12000, z: 14500 },
  { v: 0, s: "And what’s the trade-off?", a: 13900, z: 16000 },
  { v: 1, s: "Freshness. A kept copy can go stale.", a: 14700, z: 16000 },
];
const BASE = [250, 450],
  LN = 7,
  CY = 236;

// Ribbon centreline during the conversation; e grows it out of the outline rule.
function center(v: number, x: number, t: number, e: number) {
  return (
    lerp(RULES[v].y, BASE[v], e) +
    22 * e * Math.sin(x * 0.0085 + t * 0.0011 + v * 1.9)
  );
}

// Illustrative episode envelope — a fixed authored shape, not audio levels.
function env(u: number) {
  const w = Math.pow(Math.sin(Math.PI * u), 1.3);
  return (
    w *
    (0.52 +
      0.26 * Math.sin(u * 11 + 0.7) +
      0.16 * Math.sin(u * 29 + 2.1) +
      0.06 * Math.sin(u * 71 + 0.4))
  );
}

function drawChrome(ctx: Ctx, t: number, P: MotionPalette) {
  ctx.save();
  ctx.strokeStyle = P.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, 88);
  ctx.lineTo(W - M, 88);
  ctx.stroke();
  track(ctx, "0.16em");
  ctx.font = font(700, 12.5);
  KICK.forEach(([n, l], i) => {
    const a =
      (i ? ioCubic(prog(t, BOUNDS[i - 1], BOUNDS[i - 1] + 450)) : 1) *
      (i < 3 ? 1 - ioCubic(prog(t, BOUNDS[i] - 300, BOUNDS[i])) : 1);
    if (a <= 0.001) return;
    const y = 66 + (1 - a) * 6,
      num = `${n} / 04`;
    ctx.globalAlpha = a;
    ctx.fillStyle = P.accent;
    ctx.fillText(num, M, y);
    ctx.fillStyle = P.muted;
    ctx.fillText(l.toUpperCase(), M + ctx.measureText(num).width + 18, y);
  });
  ctx.restore();
}

function drawSource(ctx: Ctx, t: number, P: MotionPalette) {
  const big = Math.min(
    fit(ctx, "useful data close.", 800, 86, 860),
    fit(ctx, "A cache keeps", 800, 86, 860),
  );
  const small = fit(ctx, "The trade-off is freshness.", 500, 46, 860);
  const head = fit(ctx, "trade-off", 800, 96, 520),
    sub = 34;
  const udW = measure(ctx, "useful data", 700, sub),
    glueW = measure(ctx, ", kept ", 500, sub);
  const TGT = [
    { x: M, y: 226, size: head, w: 800 },
    { x: M, y: 284, size: sub, w: 700 },
    { x: M + udW + glueW, y: 284, size: sub, w: 700 },
    { x: 390, y: 458, size: head, w: 800 },
    { x: 390, y: 514, size: sub, w: 700 },
  ];
  let ri = 0;
  SRC.forEach((segs, li) => {
    const size = li < 2 ? big : small,
      wt = li < 2 ? 800 : 500,
      y = LINE_Y[li];
    const x1 = M + measure(ctx, segs.map((g) => g.s).join(""), wt, size);
    const rev = oCubic(prog(t, 100 + li * 170, 950 + li * 170)),
      dy = (1 - rev) * size * 0.95;
    const sp = prog(t, SCAN[li][0], SCAN[li][1]),
      caret = lerp(M - 10, x1 + 10, ioSine(sp));
    const dim = ioCubic(prog(t, SCAN[li][1], SCAN[li][1] + 350));
    const col = li < 2 ? P.foreground : P.muted;
    ctx.save();
    if (rev < 1) {
      ctx.beginPath();
      ctx.rect(0, y - size * 1.02, W, size * 1.3);
      ctx.clip();
    }
    let pre = "";
    segs.forEach((g) => {
      const gx = M + measure(ctx, pre, wt, size);
      pre += g.s;
      const ink = measure(ctx, g.s.trim(), wt, size);
      if (g.tok < 0) {
        // Unselected words flatten into hairlines, which slide into the outline rules.
        const lead =
          measure(ctx, g.s, wt, size) - measure(ctx, g.s.trimStart(), wt, size);
        const c = ioCubic(prog(t, 4700 + li * 90, 5500 + li * 90)),
          r = ioCubic(prog(t, 5600 + ri * 80, 6700 + ri * 80));
        ri++;
        const my = y - size * 0.34;
        if (c < 0.995) {
          ctx.save();
          ctx.globalAlpha = (1 - 0.72 * dim) * (1 - c * 0.5);
          ctx.translate(0, my + dy);
          ctx.scale(1, 1 - c);
          ctx.font = font(wt, size);
          ctx.fillStyle = col;
          ctx.fillText(g.s, gx, size * 0.34);
          ctx.restore();
        }
        if (c > 0 && r < 1 && ink > 0) {
          const R = RULES[li < 2 ? 0 : 1],
            yy = lerp(my, R.y, r);
          ctx.save();
          ctx.globalAlpha = Math.min(c, 1 - r) * 0.7;
          ctx.strokeStyle = P.foreground;
          ctx.lineWidth = lerp(2.2, 1.2, r);
          ctx.beginPath();
          ctx.moveTo(lerp(gx + lead, R.x0, r), yy);
          ctx.lineTo(lerp(gx + lead + ink, R.x1, r), yy);
          ctx.stroke();
          ctx.restore();
        }
        return;
      }
      // Selected words keep their identity and arc into the outline.
      const i = g.tok,
        T = TGT[i];
      const mv = ioCubic(prog(t, 5000 + i * 110, 6600 + i * 110)),
        q = 1 - mv;
      const ex = ioCubic(prog(t, 9400 + i * 60, 10100 + i * 60));
      const cx = (gx + T.x) / 2 + 40,
        cy = Math.min(y, T.y) - 70;
      const x = q * q * gx + 2 * q * mv * cx + mv * mv * T.x;
      const ty = q * q * (y + dy) + 2 * q * mv * cy + mv * mv * T.y - 26 * ex;
      const fs = lerp(size, T.size, mv),
        fw = lerp(wt, T.w, mv),
        hl = clamp((caret - gx) / Math.max(1, ink));
      const tw = measure(ctx, g.s, fw, fs);
      ctx.save();
      ctx.globalAlpha = 1 - ex;
      if (hl > 0) {
        if (i < 3) {
          ctx.fillStyle = P.accent;
          ctx.fillRect(
            x,
            ty + fs * 0.13,
            tw * hl,
            Math.max(2.5, lerp(fs * 0.09, 3, mv)),
          );
        } else {
          ctx.strokeStyle = P.foreground;
          ctx.lineWidth = 1.6;
          ctx.lineCap = "butt";
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(x, ty + fs * 0.2);
          ctx.lineTo(x + tw * hl, ty + fs * 0.2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.font = font(fw, fs);
      if (i < 3) {
        ctx.fillStyle = P.foreground;
        ctx.fillText(g.s, x, ty);
      } else {
        const fillA = i === 3 ? 1 - mv : 1;
        ctx.globalAlpha = (1 - ex) * fillA * (1 - hl);
        ctx.fillStyle = P.muted;
        ctx.fillText(g.s, x, ty);
        ctx.globalAlpha = (1 - ex) * fillA * hl;
        ctx.fillStyle = P.foreground;
        ctx.fillText(g.s, x, ty);
        if (i === 3 && mv > 0) {
          ctx.globalAlpha = (1 - ex) * mv;
          ctx.strokeStyle = P.foreground;
          ctx.lineWidth = 1.6;
          ctx.strokeText(g.s, x, ty);
        }
      }
      ctx.restore();
    });
    if (sp > 0 && sp < 1) {
      ctx.globalAlpha = Math.pow(Math.sin(Math.PI * sp), 0.35);
      ctx.fillStyle = P.accent;
      ctx.fillRect(caret - 1.5, y - size * 0.8 + dy, 3, size * 1.02);
    }
    ctx.restore();
  });

  // Outline glue and section labels.
  const ga = ioCubic(prog(t, 6400, 7000)) * (1 - ioCubic(prog(t, 9400, 10100)));
  if (ga > 0) {
    const lift = (1 - ga) * 8 - 26 * ioCubic(prog(t, 9400, 10100));
    ctx.save();
    ctx.globalAlpha = ga;
    ctx.font = font(500, sub);
    ctx.fillStyle = P.muted;
    ctx.fillText(", kept", M + udW, 284 + lift);
    track(ctx, "0.16em");
    ctx.font = font(700, 12.5);
    LABELS.forEach(([n, l, x, y]) => {
      ctx.fillStyle = P.accent;
      ctx.fillText(n, x, y + lift);
      ctx.fillStyle = P.muted;
      ctx.fillText(
        " — " + l.toUpperCase(),
        x + ctx.measureText(n).width,
        y + lift,
      );
    });
    ctx.restore();
  }

  const ca = prog(t, 600, 1200) * (1 - prog(t, 4500, 5100));
  if (ca > 0) {
    ctx.save();
    ctx.globalAlpha = ca;
    track(ctx, "0.16em");
    ctx.font = font(700, 12.5);
    ctx.fillStyle = P.muted;
    ctx.fillText("ORIGINAL SAMPLE TEXT", M, 566);
    ctx.restore();
  }
}

function drawRules(ctx: Ctx, t: number, P: MotionPalette, k: number) {
  const g = ioCubic(prog(t, 5700, 7000)) * (1 - clamp(k * 3));
  if (g <= 0) return;
  ctx.save();
  ctx.globalAlpha = g;
  ctx.lineCap = "butt";
  RULES.forEach((R, v) => {
    ctx.strokeStyle = v ? P.foreground : P.accent;
    ctx.lineWidth = v ? 1.5 : 3;
    ctx.setLineDash(v ? [7, 6] : []);
    ctx.beginPath();
    ctx.moveTo(R.x0, R.y);
    ctx.lineTo(R.x1, R.y);
    ctx.stroke();
  });
  ctx.restore();
}

function turnWeight(t: number, i: number) {
  const q = TURNS[i],
    n = TURNS[i + 1];
  return (
    (1 - prog(t, q.z - 350, q.z)) *
    (n ? 1 - 0.38 * ioCubic(prog(t, n.a, n.a + 450)) : 1)
  );
}

function voiceActivity(t: number) {
  const cw = prog(t, 10700, 11300) * (1 - prog(t, 15600, 16000));
  return [0, 1].map((v) => {
    let a = 0;
    TURNS.forEach((q, i) => {
      if (q.v === v && t >= q.a && t < q.z)
        a = Math.max(a, prog(t, q.a, q.a + 300) * turnWeight(t, i));
    });
    return lerp(1, 0.3 + 0.7 * a, cw);
  });
}

// Two hairline ribbons: grown from the outline rules, braided as voices, then turned into one lathe-like form.
function drawBands(
  ctx: Ctx,
  t: number,
  P: MotionPalette,
  k: number,
  m: number,
  act: number[],
) {
  const e = ioCubic(k),
    fade = clamp(k * 3),
    rot = t * 0.00022,
    amp = 138 * (1 + 0.025 * Math.sin(t * 0.0021));
  ctx.save();
  if (m > 0) {
    ctx.globalAlpha = m;
    ctx.strokeStyle = P.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, CY);
    ctx.lineTo(960, CY);
    ctx.stroke();
    ctx.fillStyle = P.accent;
    [60, 940].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, CY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  for (let v = 0; v < 2; v++) {
    const x0 = lerp(RULES[v].x0, 40, e),
      x1 = lerp(RULES[v].x1, 960, e);
    for (let j = 0; j < LN; j++) {
      const s = (j / (LN - 1)) * 2 - 1,
        ph = Math.PI * 2 * ((v + 2 * j) / (2 * LN)) + rot,
        front = Math.sin(ph) * 0.5 + 0.5;
      ctx.globalAlpha =
        fade *
        lerp(
          (0.35 + 0.65 * (1 - Math.abs(s))) * act[v],
          0.22 + 0.78 * front,
          m,
        );
      ctx.lineWidth = lerp(
        lerp(1, 1.8, (act[v] - 0.3) / 0.7),
        lerp(0.7, 1.6, front),
        m,
      );
      ctx.strokeStyle = v ? P.foreground : P.accent;
      ctx.beginPath();
      for (let i = 0; i <= 128; i++) {
        const u = i / 128,
          xc = lerp(x0, x1, u);
        const yc =
          center(v, xc, t, e) +
          s * 15 * e * Math.cos(xc * 0.011 - t * 0.0014 + v * 1.6);
        const xd = lerp(60, 940, u),
          yd = CY + Math.cos(ph) * env(u) * amp;
        const x = lerp(xc, xd, m),
          y = lerp(yc, yd, m);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Script lines ride their voice ribbon; one voice leads, the other recedes.
function drawTurns(ctx: Ctx, t: number, P: MotionPalette, act: number[]) {
  const cw = prog(t, 10700, 11300) * (1 - prog(t, 15600, 16000));
  ctx.save();
  track(ctx, "0.16em");
  ctx.font = font(700, 12.5);
  ["Voice 1 · asks", "Voice 2 · explains"].forEach((l, v) => {
    ctx.globalAlpha = cw * (0.35 + 0.65 * act[v]);
    ctx.fillStyle = v ? P.foreground : P.accent;
    ctx.fillText(l.toUpperCase(), M, center(v, M, t, 1) - 88);
  });
  track(ctx, "0px");
  TURNS.forEach((q, i) => {
    const dt = t - q.a;
    if (dt < 0 || t >= q.z) return;
    const k = turnWeight(t, i),
      wt = q.v ? 800 : 500,
      size = fit(ctx, q.s, wt, 40, 860);
    ctx.font = font(wt, size);
    ctx.fillStyle = P.foreground;
    for (let c = 0; c < q.s.length; c++) {
      const ch = q.s[c];
      if (ch === " ") continue;
      const p = oCubic(prog(dt, c * 18, c * 18 + 380));
      if (p <= 0) break;
      const cw2 = ctx.measureText(ch).width,
        mx = M + ctx.measureText(q.s.slice(0, c)).width + cw2 / 2;
      const yb = center(q.v, mx, t, 1) - 30;
      const ang = Math.atan2(
        center(q.v, mx + 3, t, 1) - center(q.v, mx - 3, t, 1),
        6,
      );
      ctx.save();
      ctx.globalAlpha = p * k;
      ctx.translate(mx, yb + (1 - p) * 18);
      ctx.rotate(ang);
      ctx.fillText(ch, -cw2 / 2, 0);
      ctx.restore();
    }
  });
  ctx.restore();
}

function drawEpisode(ctx: Ctx, t: number, P: MotionPalette) {
  const hs = fit(ctx, "Ready to listen.", 800, 96, 880),
    y = 510;
  ctx.save();
  ctx.font = font(800, hs);
  const x0 = (W - ctx.measureText("Ready to listen.").width) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - hs * 0.98, W, hs * 1.28);
  ctx.clip();
  ["Ready ", "to ", "listen", "."].reduce((pre, wd, i) => {
    const p = oCubic(prog(t, 17300 + i * 140, 18150 + i * 140));
    if (p > 0) {
      ctx.globalAlpha = p;
      ctx.fillStyle = i === 3 ? P.accent : P.foreground;
      ctx.fillText(
        wd,
        x0 + ctx.measureText(pre).width,
        y + (1 - p) * hs * 0.95,
      );
    }
    return pre + wd;
  }, "");
  ctx.restore();
  const ca = oCubic(prog(t, 18300, 18950));
  if (ca > 0) {
    ctx.globalAlpha = ca;
    track(ctx, "0.02em");
    ctx.font = font(500, 15.5);
    ctx.fillStyle = P.muted;
    ctx.textAlign = "center";
    ctx.fillText(
      "Private preview · human review before publication",
      W / 2,
      560 + (1 - ca) * 8,
    );
  }
  ctx.restore();
}

export function drawWordSound(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeMs: number,
  palette: MotionPalette,
): void {
  if (!(width > 0 && height > 0)) return;
  const t = clamp(Number.isFinite(timeMs) ? timeMs : 0, 0, DURATION);
  const P = palette;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = P.background;
  ctx.fillRect(0, 0, width, height);
  const s = Math.min(width / W, height / H);
  ctx.translate((width - W * s) / 2, (height - H * s) / 2);
  ctx.scale(s, s);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  track(ctx, "0px");

  const k = prog(t, 9500, 11000),
    m = ioCubic(prog(t, 15900, 18000)),
    act = voiceActivity(t);
  drawChrome(ctx, t, P);
  if (t < 10400) drawSource(ctx, t, P);
  drawRules(ctx, t, P, k);
  if (k > 0) drawBands(ctx, t, P, k, m, act);
  if (t > 10600 && t < 16100) drawTurns(ctx, t, P, act);
  if (t > 16800) drawEpisode(ctx, t, P);
  ctx.restore();
}
