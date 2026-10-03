// The pour engine: path layout, caramel painter and scroll-driven motion.
// Ported from the approved prototype with its arithmetic kept exactly as written there
// (docs/superpowers/specs/2026-10-02-pour-prototype.html); typed surface in pour.d.ts.
// It knows nothing about React or the restaurant: it receives elements, a theme and callbacks.
import { clamp, smooth, stepPour } from "./math";

// The caramel material and its painter, shared by the page and the splash.
export function createPainter(theme, DPR) {
  /* ---------- material ---------- */
  var HW0 = theme.halfWidth,
    STEP = theme.step;
  var LX = theme.light.x,
    LY = theme.light.y; // unit vector toward the light
  var INS = theme.layerInsets.slice(),
    COL = theme.layerColors.slice(),
    OFS = theme.layerOffsets.slice();
  // pools: same skin as the ribbon for the first layers, then the body deepens toward the thick centre
  var INSB = INS.slice(),
    COLB = COL.slice(),
    OFSB = OFS.slice();
  (function () {
    var a = theme.poolBodyFrom,
      b = theme.poolBodyTo,
      n = theme.poolBodySteps;
    for (var i = 1; i <= n; i++) {
      var t = i / n,
        u = Math.pow(t, 0.8);
      INSB.push(7.5 + 26 * Math.pow(t, 1.15));
      COLB.push(
        "rgb(" +
          Math.round(a[0] + (b[0] - a[0]) * u) +
          "," +
          Math.round(a[1] + (b[1] - a[1]) * u) +
          "," +
          Math.round(a[2] + (b[2] - a[2]) * u) +
          ")",
      );
      OFSB.push(2.5 + 1.2 * t);
    }
  })();
  var FIL = theme.fillet; // fillet radius where the stream meets a pool
  /* ---------- strands (polyline paths with normals) ---------- */
  function mkStrand() {
    var X = [],
      Y = [];
    var o = {
      moveTo: function (x, y) {
        X.push(x);
        Y.push(y);
      },
      push: function (x, y) {
        var n = X.length,
          dx = x - X[n - 1],
          dy = y - Y[n - 1];
        if (dx * dx + dy * dy > 0.2) {
          X.push(x);
          Y.push(y);
        }
      },
      lineTo: function (x, y) {
        var n = X.length,
          x0 = X[n - 1],
          y0 = Y[n - 1],
          d = Math.hypot(x - x0, y - y0),
          k = Math.max(1, Math.ceil(d / STEP));
        for (var i = 1; i <= k; i++)
          o.push(x0 + ((x - x0) * i) / k, y0 + ((y - y0) * i) / k);
      },
      bez: function (x1, y1, x2, y2, x3, y3) {
        var n = X.length,
          x0 = X[n - 1],
          y0 = Y[n - 1];
        var len =
          (Math.hypot(x1 - x0, y1 - y0) +
            Math.hypot(x2 - x1, y2 - y1) +
            Math.hypot(x3 - x2, y3 - y2) +
            Math.hypot(x3 - x0, y3 - y0)) /
          2;
        var k = Math.max(2, Math.ceil(len / STEP));
        for (var i = 1; i <= k; i++) {
          var t = i / k,
            u = 1 - t,
            a = u * u * u,
            b = 3 * u * u * t,
            c = 3 * u * t * t,
            e = t * t * t;
          o.push(
            a * x0 + b * x1 + c * x2 + e * x3,
            a * y0 + b * y1 + c * y2 + e * y3,
          );
        }
      },
      arc: function (cx, cy, a, b, a0, a1) {
        var k = Math.max(
          2,
          Math.ceil((Math.abs(a1 - a0) * Math.max(a, b)) / STEP),
        );
        for (var i = 1; i <= k; i++) {
          var g = a0 + ((a1 - a0) * i) / k;
          o.push(cx + a * Math.cos(g), cy + b * Math.sin(g));
        }
      },
      mark: function () {
        return X.length - 1;
      },
      done: function (seed) {
        var n = X.length,
          st = {
            n: n,
            X: new Float32Array(X),
            Y: new Float32Array(Y),
            S: new Float32Array(n),
            NX: new Float32Array(n),
            NY: new Float32Array(n),
            HW: new Float32Array(n),
            MU: new Float32Array(n).fill(1),
            FD: new Float32Array(n).fill(1e6),
            E1: new Float32Array(n),
            E2: new Float32Array(n),
          };
        var i;
        for (i = 1; i < n; i++)
          st.S[i] = st.S[i - 1] + Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
        for (i = 0; i < n; i++) {
          var a = Math.max(0, i - 1),
            b = Math.min(n - 1, i + 1),
            tx = X[b] - X[a],
            ty = Y[b] - Y[a],
            l = Math.hypot(tx, ty) || 1;
          st.NX[i] = -ty / l;
          st.NY[i] = tx / l;
          var s = st.S[i];
          st.HW[i] = HW0;
          st.E1[i] = clamp(
            0.34 +
              0.62 * Math.sin(s * 0.021 + seed) +
              0.42 * Math.sin(s * 0.057 + seed * 2.3),
            0,
            1,
          );
          st.E2[i] = clamp(
            0.25 + 0.7 * Math.sin(s * 0.017 + seed * 1.7 + 2),
            0,
            1,
          );
        }
        st.len = st.S[n - 1];
        return st;
      },
    };
    return o;
  }
  function sAtY(st, y) {
    var Y = st.Y,
      lo = 0,
      hi = st.n - 1;
    if (y <= Y[0]) return 0;
    if (y >= Y[hi]) return st.len;
    while (lo < hi) {
      var m = (lo + hi) >> 1;
      if (Y[m] < y) lo = m + 1;
      else hi = m;
    }
    var d = Y[lo] - Y[lo - 1],
      t = d > 1e-6 ? (y - Y[lo - 1]) / d : 0;
    return st.S[lo - 1] + t * (st.S[lo] - st.S[lo - 1]);
  }
  function idxAtS(st, s) {
    var S = st.S,
      lo = 0,
      hi = st.n - 1;
    if (s <= 0) return 0;
    if (s >= st.len) return hi;
    while (lo < hi) {
      var m = (lo + hi) >> 1;
      if (S[m] < s) lo = m + 1;
      else hi = m;
    }
    var d = S[lo] - S[lo - 1];
    return lo - 1 + (d > 1e-6 ? (s - S[lo - 1]) / d : 0);
  }
  function yAtS(st, s) {
    var f = idxAtS(st, s),
      i = Math.floor(f),
      t = f - i;
    if (i >= st.n - 1) return st.Y[st.n - 1];
    return st.Y[i] + t * (st.Y[i + 1] - st.Y[i]);
  }

  /* sub-range geometry of a strand, optionally with a drip head at the end */
  function geom(st, sa, sb, head) {
    var fa = idxAtS(st, sa),
      fb = idxAtS(st, sb);
    if (fb < fa) fb = fa;
    var g = {
      px: [],
      py: [],
      nx: [],
      ny: [],
      hw: [],
      fd: [],
      e1: [],
      e2: [],
      r: [],
      sc: [],
      m: 0,
      head: head || null,
      R: 0,
    };
    function add(f) {
      var i = Math.floor(f),
        t = f - i;
      if (i >= st.n - 1) {
        i = st.n - 1;
        t = 0;
      }
      var j = t > 0 ? i + 1 : i,
        u = 1 - t;
      var nx = st.NX[i] * u + st.NX[j] * t,
        ny = st.NY[i] * u + st.NY[j] * t,
        l = Math.hypot(nx, ny) || 1;
      g.px.push(st.X[i] * u + st.X[j] * t);
      g.py.push(st.Y[i] * u + st.Y[j] * t);
      g.nx.push(nx / l);
      g.ny.push(ny / l);
      g.hw.push(st.HW[i] * u + st.HW[j] * t);
      g.fd.push(st.FD[i] * u + st.FD[j] * t);
      g.e1.push(st.E1[i] * u + st.E1[j] * t);
      g.e2.push(st.E2[i] * u + st.E2[j] * t);
      g.s = g.s || [];
      g.s.push(st.S[i] * u + st.S[j] * t);
    }
    add(fa);
    for (var i = Math.floor(fa) + 1; i < fb; i++) add(i);
    if (fb > fa) add(fb);
    g.m = g.px.length;
    if (head) {
      var base = Math.min(g.hw[g.m - 1], HW0 * 1.12),
        R = base * head.k,
        sig = R * 0.95;
      g.R = R;
      g.ff = [];
      for (var j = 0; j < g.m; j++) {
        var d = sb - g.s[j];
        g.ff.push(smooth(d, 3, 36)); // fillets only form once the head has moved on
        var nb = head.neck * smooth(d, 16, 62) * (1 - smooth(d, 62, 150));
        var w = g.hw[j] * (1 - nb);
        var q = Math.exp(-(d * d) / (2 * sig * sig));
        g.hw[j] = w + (R - w) * q;
        var fade = smooth(d, R * 1.3, R * 3.2);
        g.e1[j] *= fade;
        g.e2[j] *= fade;
      }
    }
    return g;
  }

  function pathStrand(ctx, g, k) {
    var m = g.m,
      j,
      w,
      sc,
      r,
      o = OFS[k];
    ctx.beginPath();
    for (j = 0; j < m; j++) {
      w = g.hw[j];
      sc = clamp(w / HW0, 0.5, 1.4);
      r = w - INS[k] * sc;
      if (r < 0) r = 0;
      var fl = g.ff ? FIL * g.ff[j] : FIL;
      if (fl > 0.5 && g.fd[j] < fl) {
        // concave fillet where the stream runs into a pool; inner layers follow as true offsets
        var q = fl - g.fd[j],
          Rk = fl + INS[k] * sc;
        r = q < Rk ? w + fl - Math.sqrt(Rk * Rk - q * q) : w + fl;
      }
      g.r[j] = r;
      g.sc[j] = sc;
      var x = g.px[j] + o * 0.62 * sc + g.nx[j] * r,
        y = g.py[j] + o * 0.78 * sc + g.ny[j] * r;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    j = m - 1;
    var a = Math.atan2(g.ny[j], g.nx[j]);
    ctx.arc(
      g.px[j] + o * 0.62 * g.sc[j],
      g.py[j] + o * 0.78 * g.sc[j],
      g.r[j],
      a,
      a - Math.PI,
      true,
    );
    for (j = m - 1; j >= 0; j--) {
      ctx.lineTo(
        g.px[j] + o * 0.62 * g.sc[j] - g.nx[j] * g.r[j],
        g.py[j] + o * 0.78 * g.sc[j] - g.ny[j] * g.r[j],
      );
    }
    a = Math.atan2(g.ny[0], g.nx[0]);
    ctx.arc(
      g.px[0] + o * 0.62 * g.sc[0],
      g.py[0] + o * 0.78 * g.sc[0],
      g.r[0],
      a + Math.PI,
      a,
      true,
    );
    ctx.closePath();
  }

  /* tapered highlight strokes along a strand: kind 0 bloom, 1 specular, 2 rim light */
  function hlStrand(ctx, g, kind) {
    var m = g.m,
      cx = [],
      cy = [],
      tt = [],
      nxs = [],
      nys = [];
    function flush() {
      var n = cx.length;
      if (n > 2) {
        ctx.beginPath();
        var i;
        for (i = 0; i < n; i++) {
          var x = cx[i] + nxs[i] * tt[i],
            y = cy[i] + nys[i] * tt[i];
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        for (i = n - 1; i >= 0; i--)
          ctx.lineTo(cx[i] - nxs[i] * tt[i], cy[i] - nys[i] * tt[i]);
        ctx.closePath();
        ctx.fill();
      }
      cx.length = cy.length = tt.length = nxs.length = nys.length = 0;
    }
    for (var j = 0; j < m; j++) {
      var nl = g.nx[j] * LX + g.ny[j] * LY,
        an = Math.abs(nl),
        w = g.hw[j],
        th,
        off;
      var ws = clamp(w / HW0, 0.55, 1.5);
      if (kind === 2) {
        th = 0.8 * g.e2[j] * an * ws;
        off = -nl * w * 0.7;
      } else {
        th = 1.3 * g.e1[j] * (0.38 + 0.62 * an) * ws;
        if (kind === 0) th *= 3.1;
        off = nl * w * 0.5;
      }
      if (th > 0.07) {
        cx.push(g.px[j] + g.nx[j] * off);
        cy.push(g.py[j] + g.ny[j] * off);
        tt.push(th);
        nxs.push(g.nx[j]);
        nys.push(g.ny[j]);
      } else flush();
    }
    flush();
  }
  function glint(ctx, g, al) {
    var j = g.m - 1,
      R = g.R,
      x = g.px[j],
      y = g.py[j];
    ctx.save();
    ctx.globalAlpha = al === undefined ? 1 : al;
    ctx.translate(x - R * 0.36, y - R * 0.42);
    ctx.rotate(-0.62);
    ctx.fillStyle = "rgba(255,226,160,.22)";
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.5, R * 0.32, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,230,.94)";
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.3, R * 0.16, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "rgba(255,214,140,.6)";
    ctx.beginPath();
    ctx.arc(R * 0.36 + R * 0.34, R * 0.42 + R * 0.42, R * 0.09, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- blobs (pools, the brand bead) ---------- */
  function mkBlob(cx, cy, rx, ry, seed, n, wob, pw) {
    var b = {
      n: n,
      x: new Float32Array(n),
      y: new Float32Array(n),
      nx: new Float32Array(n),
      ny: new Float32Array(n),
      cx: cx,
      cy: cy,
      rx: rx,
      ry: ry,
      rmin: Math.min(rx, ry),
    };
    var i;
    for (i = 0; i < n; i++) {
      var th = (i / n) * 6.283185,
        c = Math.cos(th),
        s = Math.sin(th);
      var r = Math.pow(
        Math.pow(Math.abs(c) / rx, pw) + Math.pow(Math.abs(s) / ry, pw),
        -1 / pw,
      );
      r *=
        1 +
        wob *
          (0.9 * Math.sin(3 * th + seed) +
            0.6 * Math.sin(5 * th + seed * 2.1) +
            0.5 * Math.sin(2 * th + seed * 0.7));
      b.x[i] = cx + c * r;
      b.y[i] = cy + s * r;
    }
    for (i = 0; i < n; i++) {
      var p = (i + n - 1) % n,
        q = (i + 1) % n,
        tx = b.x[q] - b.x[p],
        ty = b.y[q] - b.y[p],
        l = Math.hypot(tx, ty) || 1;
      b.nx[i] = ty / l;
      b.ny[i] = -tx / l;
    }
    var it = Math.round(n * 0.75),
      ib = Math.round(n * 0.25);
    b.topY = b.y[it];
    b.botY = b.y[ib];
    b.ax = cx;
    b.ay = b.topY;
    return b;
  }
  function shiftBlob(b, dy) {
    for (var i = 0; i < b.n; i++) b.y[i] += dy;
    b.cy += dy;
    b.topY += dy;
    b.botY += dy;
    b.ay += dy;
  }
  function pathBlob(ctx, b, e, k) {
    var sc = Math.min(1, (e * b.rmin) / 40),
      ins = INSB[k] * sc,
      ox = OFSB[k] * 0.62 * sc,
      oy = OFSB[k] * 0.78 * sc;
    ctx.beginPath();
    for (var i = 0; i < b.n; i++) {
      var x = b.ax + (b.x[i] - b.ax) * e - b.nx[i] * ins + ox,
        y = b.ay + (b.y[i] - b.ay) * e - b.ny[i] * ins + oy;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function blobStreak(ctx, b, e, t0, t1, inset, thick) {
    var sc = Math.min(1, (e * b.rmin) / 40),
      n = b.n,
      i0 = Math.round(t0 * n),
      i1 = Math.round(t1 * n),
      k = i1 - i0,
      i;
    if (k < 2) return;
    var xs = [],
      ys = [],
      ts = [],
      nxs = [],
      nys = [];
    for (i = 0; i <= k; i++) {
      var j = (i0 + i) % n,
        u = i / k,
        t = thick * sc * Math.pow(Math.sin(Math.PI * u), 0.75);
      xs.push(b.ax + (b.x[j] - b.ax) * e - b.nx[j] * inset * sc);
      ys.push(b.ay + (b.y[j] - b.ay) * e - b.ny[j] * inset * sc);
      ts.push(t);
      nxs.push(b.nx[j]);
      nys.push(b.ny[j]);
    }
    ctx.beginPath();
    for (i = 0; i <= k; i++) {
      if (i) ctx.lineTo(xs[i] + nxs[i] * ts[i], ys[i] + nys[i] * ts[i]);
      else ctx.moveTo(xs[i] + nxs[i] * ts[i], ys[i] + nys[i] * ts[i]);
    }
    for (i = k; i >= 0; i--)
      ctx.lineTo(xs[i] - nxs[i] * ts[i], ys[i] - nys[i] * ts[i]);
    ctx.closePath();
    ctx.fill();
  }
  function blobFinish(ctx, b, e) {
    var x0 = b.ax + (b.cx - b.rx - b.ax) * e,
      x1 = b.ax + (b.cx + b.rx - b.ax) * e,
      y0 = b.ay,
      y1 = b.ay + (b.botY - b.ay) * e;
    // depth: darker toward the light, glowing away from it
    ctx.save();
    pathBlob(ctx, b, e, 4);
    ctx.clip();
    var gr = ctx.createLinearGradient(
      x0 + (x1 - x0) * 0.2,
      y0,
      x0 + (x1 - x0) * 0.8,
      y1,
    );
    gr.addColorStop(0, "rgba(96,36,2,.36)");
    gr.addColorStop(0.5, "rgba(150,70,6,0)");
    gr.addColorStop(1, "rgba(255,216,132,.30)");
    ctx.fillStyle = gr;
    ctx.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
    // broad soft reflection of the light source
    if (b.rmin > 20) {
      var hx = x0 + (x1 - x0) * 0.3,
        hyy = y0 + (y1 - y0) * 0.27,
        hr = (x1 - x0) * 0.26;
      ctx.translate(hx, hyy);
      ctx.rotate(-0.1);
      ctx.scale(1, 0.3);
      var rg = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
      rg.addColorStop(0, "rgba(255,240,206,.34)");
      rg.addColorStop(0.55, "rgba(255,232,180,.12)");
      rg.addColorStop(1, "rgba(255,232,180,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, hr, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
    // specular streak along the upper-left shoulder, rim light bottom-right
    var si = b.rmin > 20 ? 8.2 : 9.5;
    ctx.fillStyle = "rgba(255,224,160,.16)";
    blobStreak(ctx, b, e, 0.525, 0.725, si, 6.5);
    ctx.fillStyle = "rgba(255,248,232,.95)";
    blobStreak(ctx, b, e, 0.54, 0.705, si, 2.5);
    ctx.fillStyle = "rgba(255,208,130,.55)";
    blobStreak(ctx, b, e, 0.03, 0.2, 4.6, 1.3);
    ctx.fillStyle = "rgba(255,208,130,.36)";
    blobStreak(ctx, b, e, 0.26, 0.44, 4.6, 1.1);
  }

  /* ---------- scene painter: layer by layer so every shape melts into one body ---------- */
  function drawScene(ctx, strands, blobs) {
    var i, k;
    // amber light transmitted onto the table, then the tight contact shadow
    for (var pass = 0; pass < 2; pass++) {
      ctx.save();
      if (pass === 0) {
        ctx.shadowColor = "rgba(255,140,30,.22)";
        ctx.shadowBlur = 22 * DPR;
        ctx.shadowOffsetX = 5 * DPR;
        ctx.shadowOffsetY = 9 * DPR;
      } else {
        ctx.shadowColor = "rgba(0,0,0,.7)";
        ctx.shadowBlur = 7 * DPR;
        ctx.shadowOffsetX = 2 * DPR;
        ctx.shadowOffsetY = 3.5 * DPR;
      }
      ctx.fillStyle = COL[0];
      for (i = 0; i < blobs.length; i++) {
        pathBlob(ctx, blobs[i].b, blobs[i].e, 0);
        ctx.fill();
      }
      for (i = 0; i < strands.length; i++) {
        pathStrand(ctx, strands[i], 0);
        ctx.fill();
      }
      ctx.restore();
    }
    for (k = 0; k < 6; k++) {
      ctx.fillStyle = COL[k];
      for (i = 0; i < blobs.length; i++) {
        pathBlob(ctx, blobs[i].b, blobs[i].e, k);
        ctx.fill();
      }
      for (i = 0; i < strands.length; i++) {
        pathStrand(ctx, strands[i], k);
        ctx.fill();
      }
    }
    for (k = 6; k < INSB.length; k++) {
      ctx.fillStyle = COLB[k];
      for (i = 0; i < blobs.length; i++) {
        pathBlob(ctx, blobs[i].b, blobs[i].e, k);
        ctx.fill();
      }
    }
    for (i = 0; i < strands.length; i++) {
      var g = strands[i];
      ctx.fillStyle = "rgba(255,221,150,.15)";
      hlStrand(ctx, g, 0);
      ctx.fillStyle = "rgba(255,205,125,.5)";
      hlStrand(ctx, g, 2);
      ctx.fillStyle = "rgba(255,247,228,.93)";
      hlStrand(ctx, g, 1);
    }
    for (i = 0; i < blobs.length; i++) blobFinish(ctx, blobs[i].b, blobs[i].e);
    for (i = 0; i < strands.length; i++)
      if (strands[i].head && strands[i].head.glint !== 0)
        glint(ctx, strands[i], strands[i].head.glint);
  }

  return {
    HW0: HW0,
    STEP: STEP,
    FIL: FIL,
    mkStrand: mkStrand,
    mkBlob: mkBlob,
    shiftBlob: shiftBlob,
    sAtY: sAtY,
    idxAtS: idxAtS,
    yAtS: yAtS,
    geom: geom,
    drawScene: drawScene,
  };
}

export function createPour(els, theme, cb, opts) {
  var D = document;
  var stage = els.stage,
    rib = els.rib,
    dyn = els.dyn,
    dctx = dyn.getContext("2d"),
    foot = els.foot;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = opts.reducedMotion;
  var dead = false,
    activeCat = -1,
    pastOpening = null;

  var P = createPainter(theme, DPR);
  var HW0 = P.HW0,
    mkStrand = P.mkStrand,
    mkBlob = P.mkBlob,
    shiftBlob = P.shiftBlob,
    sAtY = P.sAtY,
    idxAtS = P.idxAtS,
    yAtS = P.yAtS,
    geom = P.geom,
    drawScene = P.drawScene;
  var CH = 1024; // static chunk height (css px)
  var LINE = theme.pourLine; // pour front as a fraction of viewport height
  var BACK = 120; // rows above the head drawn dynamically
  var DH = 270; // dynamic canvas height

  var pools = els.pools.map(function (el) {
    return { el: el, lit: false, blob: null, sIn: 0, sOut: 0, y: 0 };
  });
  var dishes = els.dishes.map(function (d) {
    return {
      ci: d.category,
      side: d.side,
      el: d.el,
      ph: d.ph,
      tx: d.tx,
      lit: false,
      cx: 0,
      cy: 0,
      sTop: 0,
      sBot: 0,
      arc: null,
    };
  });
  function setActive(ci) {
    if (ci === activeCat) return;
    activeCat = ci;
    cb.onActiveCategory(ci);
  }
  // Anything the engine wrote inline is undone so the page can fall back to its plain list.
  function clearInline() {
    [els.tag, els.bye, els.sig, foot].forEach(function (el) {
      el.style.top = "";
    });
    pools.forEach(function (p) {
      p.el.style.top = "";
    });
    dishes.forEach(function (d) {
      d.el.style.top = "";
      d.ph.style.left = d.ph.style.width = d.ph.style.height = "";
      d.tx.style.left = d.tx.style.width = "";
    });
    stage.style.height = "";
    rib.style.height = "";
  }
  function fail(error) {
    if (dead) return;
    dead = true;
    running = false;
    try {
      chunks.forEach(function (c) {
        rib.removeChild(c.wrap);
      });
      chunks = [];
      stage.removeAttribute("data-pour");
      stage.removeAttribute("data-ready");
      clearInline();
    } catch {
      /* the fallback styles do not depend on this */
    }
    if (cb.onError) cb.onError(error);
  }

  /* ---------- layout + path ---------- */
  var W = 390,
    VH = 800,
    K = 1,
    main = null,
    bead = null,
    finalPool = null,
    endY = 0,
    docH = 0;
  var AP,
    BP,
    RA,
    RB,
    chunks = [];

  function layout() {
    W = stage.clientWidth;
    VH = window.innerHeight;
    K = W / 390;
    AP = Math.round(82 * K);
    BP = Math.round(72 * K);
    RA = AP + 8;
    RB = BP + 8;
    var cxR = W - Math.round(110 * K),
      cxL = Math.round(110 * K),
      P = Math.round(196 * K),
      mid = W / 2;
    var padX = Math.round(17 * K);

    var sr = stage.getBoundingClientRect(),
      dr = els.dot.getBoundingClientRect();
    var dx = dr.left - sr.left + dr.width / 2,
      dy = dr.top - sr.top + dr.height / 2;

    var st = mkStrand();
    st.moveTo(dx, dy);
    bead = mkBlob(dx, dy, 10, 10, 1, 30, 0, 2);
    bead.ay = dy;

    // hero bend: the tagline sits in its hollow
    var bx = Math.round(58 * K),
      by = dy + 150;
    st.bez(dx, dy + 78, bx, by - 66, bx, by);
    els.tag.style.top = Math.round(dy + 96) + "px";

    var ex = bx,
      ey = by,
      eKind = "v",
      eDir = 0; // exit point, tangent kind (v|h), horizontal direction
    function connect(x, y, kind, dir) {
      var ddx = Math.abs(x - ex),
        ddy = y - ey,
        x1,
        y1,
        x2,
        y2;
      if (eKind === "v" && kind === "v") {
        x1 = ex;
        y1 = ey + ddy * 0.46;
        x2 = x;
        y2 = y - ddy * 0.46;
      } else if (eKind === "h" && kind === "h") {
        x1 = ex + eDir * ddx * 0.5;
        y1 = ey;
        x2 = x - dir * ddx * 0.5;
        y2 = y;
      } else if (eKind === "h") {
        x1 = ex + eDir * ddx * 0.82;
        y1 = ey;
        x2 = x;
        y2 = y - ddy * 0.8;
      } else {
        x1 = ex;
        y1 = ey + ddy * 0.86;
        x2 = x - dir * ddx * 0.72;
        y2 = y;
      }
      st.bez(x1, y1, x2, y2, x, y);
    }

    var poolMarks = [],
      dishMarks = [];
    var yCursor = dy + 292,
      di = 0;
    pools.forEach(function (p, ci) {
      var b = mkBlob(
        mid,
        0,
        Math.round(110 * Math.min(K, 1.08)),
        54,
        2.1 + ci * 1.7,
        120,
        0.016,
        2.45,
      );
      shiftBlob(b, yCursor - b.topY);
      p.blob = b;
      p.y = b.cy;
      p.el.style.top = Math.round(b.cy + 1) + "px";
      connect(mid, b.topY, "v", 0);
      var mIn = st.mark();
      st.lineTo(mid, b.botY);
      var mOut = st.mark();
      poolMarks.push([mIn, mOut]);
      ex = mid;
      ey = b.botY;
      eKind = "v";
      eDir = 0;
      var cy = b.botY + 46 + RB,
        last = null;
      while (di < dishes.length && dishes[di].ci === ci) {
        var d = dishes[di],
          right = d.side === "R",
          cx = right ? cxR : cxL,
          dir = right ? 1 : -1;
        d.cx = cx;
        d.cy = cy;
        connect(cx, cy - RB, "h", dir);
        var m0 = st.mark();
        st.arc(cx, cy, RA, RB, -Math.PI / 2, -Math.PI / 2 + dir * Math.PI);
        var m1 = st.mark();
        dishMarks.push([m0, m1]);
        ex = cx;
        ey = cy + RB;
        eKind = "h";
        eDir = -dir;
        // the thin inner glaze arc closing the ring
        var as = mkStrand();
        as.moveTo(cx, cy - (BP + 3.5));
        as.arc(
          cx,
          cy,
          AP + 3.5,
          BP + 3.5,
          -Math.PI / 2,
          -Math.PI / 2 - dir * Math.PI,
        );
        var arc = as.done(di * 1.37 + 0.4);
        for (var q = 0; q < arc.n; q++) {
          var t = arc.S[q] / arc.len;
          arc.HW[q] = 4.7 + 1.9 * t * t;
        }
        d.arc = arc;
        // DOM
        d.el.style.top = Math.round(cy) + "px";
        d.ph.style.left = cx + "px";
        d.ph.style.width = AP * 2 + "px";
        d.ph.style.height = BP * 2 + "px";
        var tl, tw;
        if (right) {
          tl = padX;
          tw = cx - AP - 23 - padX;
        } else {
          tl = cx + AP + 23;
          tw = W - padX - tl;
        }
        d.tx.style.left = tl + "px";
        d.tx.style.width = tw + "px";
        last = d;
        cy += P;
        di++;
      }
      yCursor = last ? last.cy + RB + 60 : b.botY + 60; // a category may have no dishes
    });
    // final pool
    var fb = mkBlob(
      mid,
      0,
      Math.round(150 * Math.min(K, 1.1)),
      80,
      5.3,
      140,
      0.016,
      2.4,
    );
    shiftBlob(fb, yCursor + 8 - fb.topY);
    connect(mid, fb.topY, "v", 0);
    var mF = st.mark();
    st.lineTo(mid, fb.topY + 92);
    main = st.done(0.9);
    endY = main.Y[main.n - 1];
    finalPool = { blob: fb, sIn: main.S[mF], sOut: main.len, lit: false };
    pools.forEach(function (p, i) {
      p.sIn = main.S[poolMarks[i][0]];
      p.sOut = main.S[poolMarks[i][1]];
    });
    dishes.forEach(function (d, i) {
      d.sTop = main.S[dishMarks[i][0]];
      d.sBot = main.S[dishMarks[i][1]];
    });

    // width: slow natural variation, flare where the stream meets a pool; highlights fade inside pools
    var spans = pools.map(function (p) {
      return [p.sIn, p.sOut];
    });
    spans.push([finalPool.sIn, finalPool.sOut + 999]);
    for (var i = 0; i < main.n; i++) {
      var s = main.S[i],
        w =
          HW0 *
          (1 +
            0.085 * Math.sin(s * 0.0113 + 1) +
            0.05 * Math.sin(s * 0.037 + 2.3)),
        mute = 1;
      for (var j = 0; j < spans.length; j++) {
        var a = spans[j][0],
          b2_ = spans[j][1];
        var dd = s < a ? a - s : s > b2_ ? s - b2_ : -Math.min(s - a, b2_ - s);
        if (dd < main.FD[i]) main.FD[i] = dd;
        mute = Math.min(mute, smooth(dd, 6, 30));
      }
      w *= 1 - 0.25 * Math.exp(-s / 30); // thin neck right under the brand bead
      main.HW[i] = w;
      main.E1[i] *= mute;
      main.E2[i] *= mute;
      main.MU[i] = mute;
    }

    // footer + document height
    foot.style.top = "0px";
    els.bye.style.top = Math.round(fb.cy + 2) + "px";
    els.sig.style.top = Math.round(fb.botY + 44) + "px";
    docH = Math.ceil(
      Math.max(
        fb.botY + 44 + els.sig.offsetHeight + 44,
        endY + VH * (1 - LINE) + 24,
      ),
    );
    stage.style.height = docH + "px";
    rib.style.height = docH + "px";

    // faint dotted track of where the caramel will run
    var dstr = "M" + main.X[0].toFixed(1) + " " + main.Y[0].toFixed(1);
    for (i = 3; i < main.n; i += 3)
      dstr += "L" + main.X[i].toFixed(1) + " " + main.Y[i].toFixed(1);
    var tr = els.track;
    tr.setAttribute("width", W);
    tr.setAttribute("height", docH);
    els.trackPath.setAttribute("d", dstr);

    // static chunks
    chunks.forEach(function (c) {
      rib.removeChild(c.wrap);
    });
    chunks = [];
    for (var top = 0; top < docH; top += CH) {
      var wrap = D.createElement("div");
      wrap.className = "chunk";
      wrap.style.top = top + "px";
      wrap.style.height = CH + "px";
      var cv = D.createElement("canvas");
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(CH * DPR);
      cv.style.width = W + "px";
      cv.style.height = CH + "px";
      wrap.appendChild(cv);
      rib.insertBefore(wrap, dyn);
      chunks.push({ top: top, wrap: wrap, cv: cv, drawn: false, r: -1 });
    }
    dyn.width = Math.round(W * DPR);
    dyn.height = Math.round(DH * DPR);
    dyn.style.width = W + "px";
    dyn.style.height = DH + "px";
  }

  function drawChunk(c) {
    if (c.drawn) return;
    c.drawn = true;
    var ctx = c.cv.getContext("2d"),
      y0 = c.top,
      y1 = c.top + CH;
    ctx.setTransform(DPR, 0, 0, DPR, 0, -y0 * DPR);
    var strands = [],
      blobs = [];
    var sa = sAtY(main, y0 - 60),
      sb = sAtY(main, y1 + 60);
    if (sb > sa) strands.push(geom(main, sa, sb, null));
    dishes.forEach(function (d) {
      if (d.cy + RB + 50 > y0 && d.cy - RB - 50 < y1)
        strands.push(geom(d.arc, 0, d.arc.len, null));
    });
    pools.concat([finalPool]).forEach(function (p) {
      if (p.blob.botY + 50 > y0 && p.blob.topY - 50 < y1)
        blobs.push({ b: p.blob, e: 1 });
    });
    if (bead.cy + 60 > y0 && bead.cy - 60 < y1) blobs.push({ b: bead, e: 1 });
    drawScene(ctx, strands, blobs);
  }

  /* ---------- the pour ---------- */
  var sh = 0,
    sa1 = 0,
    sa2 = 0,
    slow = 0,
    stretch = 0,
    running = false,
    lastT = 0,
    intro = -1,
    INTRO = theme.introSeconds,
    started = false;
  function snap(v) {
    sh = sa1 = sa2 = slow = v;
  }

  function poolE(p, s) {
    var f = (s - p.sIn) / (p.sOut - p.sIn);
    if (f <= 0) return 0;
    var u = clamp(f / 0.7, 0, 1),
      e = 1 - Math.pow(1 - u, 3);
    return Math.max(0.2, e);
  }

  function render() {
    var hy = yAtS(main, sh),
      clipY = Math.floor(hy - BACK),
      i;
    var atEnd = sh >= main.len - 0.5;

    // static part: reveal rows above clipY with a compositor-only clip
    for (i = 0; i < chunks.length; i++) {
      var c = chunks[i],
        r = clamp(clipY - c.top, 0, CH);
      if (r === c.r) continue;
      c.r = r;
      if (r <= 0) {
        c.wrap.style.visibility = "hidden";
        continue;
      }
      drawChunk(c);
      c.wrap.style.visibility = "visible";
      if (r >= CH) {
        c.wrap.style.transform = "";
        c.cv.style.transform = "";
      } else {
        c.wrap.style.transform = "translate3d(0," + (r - CH) + "px,0)";
        c.cv.style.transform = "translate3d(0," + (CH - r) + "px,0)";
      }
    }

    // dynamic part: the last stretch of the stream and its drip head
    var top = clipY - 6,
      ctx = dctx;
    dyn.style.transform = "translate3d(0," + top + "px,0)";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, dyn.width, dyn.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, -top * DPR);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-50, clipY - 1, W + 100, DH + 50);
    ctx.clip();
    var strands = [],
      blobs = [];
    var sa = sAtY(main, clipY - 50);
    var head = atEnd
      ? null
      : {
          k: 1.72 - 0.5 * stretch,
          neck: 0.3 * stretch,
          glint: main.MU[Math.round(idxAtS(main, sh))],
        };
    if (sh > sa) strands.push(geom(main, sa, sh, head));
    else strands.push(geom(main, Math.max(0, sh - 0.01), sh, head));
    for (i = 0; i < dishes.length; i++) {
      var d = dishes[i];
      if (d.sTop >= sh || d.cy + RB + 55 < clipY || d.cy - RB - 20 > hy)
        continue;
      if (sh >= d.sBot) strands.push(geom(d.arc, 0, d.arc.len, null));
      else {
        var sy = sAtY(d.arc, hy);
        if (sy > 1) strands.push(geom(d.arc, 0, sy, { k: 1.5, neck: 0 }));
      }
    }
    var all = pools.concat([finalPool]);
    for (i = 0; i < all.length; i++) {
      var p = all[i];
      if (p.sIn >= sh || p.blob.botY + 55 < clipY) continue;
      blobs.push({ b: p.blob, e: poolE(p, sh) });
    }
    if (bead.cy + 60 > clipY) blobs.push({ b: bead, e: 1 });
    drawScene(ctx, strands, blobs);
    ctx.restore();

    // glaze state
    for (i = 0; i < dishes.length; i++) {
      var dd = dishes[i],
        want = sh > dd.sTop + 16;
      if (want !== dd.lit) {
        dd.lit = want;
        dd.el.toggleAttribute("data-lit", want);
      }
    }
    for (i = 0; i < pools.length; i++) {
      var pp = pools[i],
        w2 = (sh - pp.sIn) / (pp.sOut - pp.sIn) > 0.42;
      if (w2 !== pp.lit) {
        pp.lit = w2;
        pp.el.toggleAttribute("data-lit", w2);
      }
    }
    var wf = (sh - finalPool.sIn) / (finalPool.sOut - finalPool.sIn) > 0.45;
    if (wf !== finalPool.lit) {
      finalPool.lit = wf;
      foot.toggleAttribute("data-lit", wf);
    }
  }

  function target() {
    // Reduced motion: the whole stream is poured and every dish is lit.
    if (reduce) return main.len;
    var sy = window.scrollY || window.pageYOffset || 0;
    var maxS = Math.max(0, D.documentElement.scrollHeight - VH);
    if (sy >= maxS - 2) return main.len;
    return sAtY(main, sy + VH * LINE);
  }

  function tick(t) {
    if (!running || dead) return;
    try {
      tickStep(t);
    } catch (e) {
      fail(e);
    }
  }
  function tickStep(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    var sy = window.scrollY || 0,
      sT = target();
    // keep the head near the viewport after long jumps: it pours in from just above the screen
    var hy = yAtS(main, sh);
    if (hy < sy - 220) snap(sAtY(main, sy - 220));
    else if (hy > sy + VH + 220) snap(sAtY(main, sy + VH + 220));
    var prev = sh;
    if (reduce) snap(sT);
    else if (intro >= 0) {
      // first pour: one slow, heavy run from the brand bead down to the pour line
      intro += dt;
      var u = clamp(intro / INTRO, 0, 1),
        e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      snap(sT * e);
      if (u >= 1 || sy > 30) intro = -1;
    } else {
      var mo = stepPour(
        { sh: sh, sa1: sa1, sa2: sa2, slow: slow },
        sT,
        dt,
        main.len,
      );
      sh = mo.sh;
      sa1 = mo.sa1;
      sa2 = mo.sa2;
      slow = mo.slow;
    }
    var v = Math.abs(sh - prev) / dt;
    stretch += (clamp(v / 1500, 0, 1) - stretch) * (1 - Math.exp(-dt / 0.14));
    render();
    if (
      intro < 0 &&
      Math.abs(sT - sh) < 0.3 &&
      Math.abs(sT - sa1) < 0.3 &&
      Math.abs(sT - slow) < 0.5 &&
      stretch < 0.012
    ) {
      snap(sT);
      stretch = 0;
      render();
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  }
  function kick() {
    if (!started || dead || reduce) return;
    if (!running) {
      running = true;
      lastT = performance.now();
      requestAnimationFrame(tick);
    }
  }

  function onScroll() {
    var sy = window.scrollY || 0;
    var po = sy > 150;
    if (po !== pastOpening) {
      pastOpening = po;
      cb.onPastOpening(po);
    }
    var probe = sy + VH * 0.42,
      a = 0;
    for (var i = 0; i < pools.length; i++)
      if (pools[i].blob && pools[i].blob.topY - 30 <= probe) a = i;
    setActive(a);
    kick();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var rz = 0,
    lastW = 0;
  function onResize() {
    clearTimeout(rz);
    rz = setTimeout(function () {
      if (stage.clientWidth === lastW) {
        VH = window.innerHeight;
        kick();
        return;
      } // mobile URL bar show/hide
      lastW = stage.clientWidth;
      try {
        layout();
        snap(target());
        render();
        onScroll();
      } catch (e) {
        fail(e);
      }
    }, 180);
  }
  window.addEventListener("resize", onResize);

  /* ---------- boot ---------- */
  function boot() {
    if (started || dead) return;
    try {
      bootStep();
    } catch (e) {
      fail(e);
    }
  }
  function bootStep() {
    stage.setAttribute("data-pour", "on"); // switches the page from normal flow to the engine's absolute layout
    layout();
    lastW = stage.clientWidth;
    started = true;
    var sy = window.scrollY || 0;
    if (sy > 40 || reduce) snap(target());
    else {
      snap(0);
      intro = 0;
    }
    render();
    stage.setAttribute("data-ready", "");
    onScroll();
    setTimeout(kick, sy > 40 ? 0 : 350);
    // paint the remaining chunks while idle so scrolling never waits on them
    var i = 0;
    (function next() {
      while (i < chunks.length && chunks[i].drawn) i++;
      if (dead || i >= chunks.length) return;
      drawChunk(chunks[i]);
      setTimeout(next, 60);
    })();
  }
  var fr = D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve();
  Promise.race([
    fr,
    new Promise(function (r) {
      setTimeout(r, 1500);
    }),
  ]).then(function () {
    requestAnimationFrame(boot);
  });

  return {
    destroy: function () {
      dead = true;
      running = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(rz);
      chunks.forEach(function (c) {
        rib.removeChild(c.wrap);
      });
      chunks = [];
      stage.removeAttribute("data-pour");
      stage.removeAttribute("data-ready");
      clearInline();
    },
    relayout: function () {
      if (!started || dead) return;
      try {
        layout();
        snap(target());
        render();
        onScroll();
      } catch (e) {
        fail(e);
      }
    },
    categoryTop: function (index) {
      return pools[index] ? Math.max(0, pools[index].y - 132) : 0;
    },
  };
}
