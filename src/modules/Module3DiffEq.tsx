import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { ForceLaw } from '../types/physics';
import { Translations } from '../i18n/translations';
import { ProgressiveSlider } from '../components/ProgressiveSlider';
import {
  drawAnchorWall,
  drawHelicalSpring,
  drawMetallicBlock,
  drawScientificGrid,
  drawVectorArrow,
  prepareHighDPICanvas,
} from '../utils/canvasHelpers';

interface Module3Props {
  t: Translations;
  resetSignal: number;
}

interface TraceSample {
  time: number;
  x: number;
  a: number;
}

// Exact numerical period via Gauss-Chebyshev quadrature on Duffing quarter-period integral
function computeExactDuffingPeriod(A: number, omega: number, gamma: number): number {
  if (gamma <= 1e-6) return (2 * Math.PI) / omega;
  const N = 40;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    // u = sin(theta), du = cos(theta) dtheta, avoids 1/sqrt(1 - u^2) singularity at u=1
    const theta = ((i + 0.5) / N) * (Math.PI / 2);
    const u = Math.sin(theta);
    const denom = Math.sqrt(
      omega * omega + 0.5 * gamma * A * A * (1 + u * u)
    );
    sum += 1 / denom;
  }
  const quarterPeriod = (Math.PI / (2 * N)) * sum;
  return 4 * quarterPeriod;
}

export const Module3DiffEq: React.FC<Module3Props> = ({ t, resetSignal }) => {
  const [forceLaw, setForceLaw] = useState<ForceLaw>('linear');
  const [amplitudeA, setAmplitudeA] = useState<number>(1.2);
  const [omega, setOmega] = useState<number>(3.0);
  const [gamma, setGamma] = useState<number>(4.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const [telemetry, setTelemetry] = useState({
    x: 1.2,
    a: -10.8,
    omega2x: 10.8,
    sum: 0,
    residual: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const simRef = useRef<{
    time: number;
    x: number;
    v: number;
    ghostX: number;
    history: TraceSample[];
  }>({
    time: 0,
    x: 1.2,
    v: 0,
    ghostX: 1.2,
    history: [],
  });

  const paramsRef = useRef({
    forceLaw,
    amplitudeA,
    omega,
    gamma,
    isPlaying,
    t,
  });

  useEffect(() => {
    paramsRef.current = {
      forceLaw,
      amplitudeA,
      omega,
      gamma,
      isPlaying,
      t,
    };
  }, [forceLaw, amplitudeA, omega, gamma, isPlaying, t]);

  const resetOscillatorTo = (newA: number) => {
    simRef.current = {
      time: 0,
      x: newA,
      v: 0,
      ghostX: newA,
      history: [],
    };
  };

  useEffect(() => {
    if (resetSignal === 0) return;
    setForceLaw('linear');
    setAmplitudeA(1.2);
    setOmega(3.0);
    setGamma(4.0);
    setIsPlaying(true);
    resetOscillatorTo(1.2);
  }, [resetSignal]);

  const handleAmplitudeChange = (newA: number) => {
    setAmplitudeA(newA);
    resetOscillatorTo(newA);
  };

  const handleForceLawChange = (law: ForceLaw) => {
    setForceLaw(law);
    resetOscillatorTo(amplitudeA);
  };

  const stepPhysics = (dtTotal: number, law: ForceLaw, w: number, g: number, A: number) => {
    const subSteps = 14;
    const dt = dtTotal / subSteps;
    const sim = simRef.current;
    const w2 = w * w;
    const activeGamma = law === 'hard_spring' ? g : 0;

    const accel = (pos: number) => -w2 * pos - activeGamma * pos * pos * pos;

    for (let i = 0; i < subSteps; i++) {
      const x1 = sim.x;
      const v1 = sim.v;
      const a1 = accel(x1);

      const x2 = x1 + 0.5 * dt * v1;
      const v2 = v1 + 0.5 * dt * a1;
      const a2 = accel(x2);

      const x3 = x1 + 0.5 * dt * v2;
      const v3 = v1 + 0.5 * dt * a2;
      const a3 = accel(x3);

      const x4 = x1 + dt * v3;
      const v4 = v1 + dt * a3;
      const a4 = accel(x4);

      sim.x += (dt / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
      sim.v += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
      sim.time += dt;
    }

    sim.ghostX = A * Math.cos(w * sim.time);
    const currentA = accel(sim.x);
    sim.history.push({ time: sim.time, x: sim.x, a: currentA });
    // Keep last 8 seconds of history
    const cutoff = sim.time - 8.2;
    while (sim.history.length > 0 && sim.history[0].time < cutoff) {
      sim.history.shift();
    }
  };

  const handleStepFrame = () => {
    setIsPlaying(false);
    stepPhysics(1 / 60, forceLaw, omega, gamma, amplitudeA);
  };

  const handleClearTrace = () => {
    simRef.current.history = [];
  };

  useEffect(() => {
    let rafId = 0;
    let lastNow = performance.now();
    let lastUiSync = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - lastNow) / 1000);
      lastNow = now;

      const {
        forceLaw: law,
        amplitudeA: A,
        omega: w,
        gamma: g,
        isPlaying: playing,
        t: tr,
      } = paramsRef.current;

      const sim = simRef.current;
      if (playing) {
        stepPhysics(dt, law, w, g, A);
      }

      const activeGamma = law === 'hard_spring' ? g : 0;
      const omega2x = w * w * sim.x;
      const residual = -activeGamma * sim.x * sim.x * sim.x;
      const a = -omega2x + residual;
      const liveSum = a + omega2x;

      if (now - lastUiSync > 45) {
        lastUiSync = now;
        setTelemetry({
          x: sim.x,
          a,
          omega2x,
          sum: liveSum,
          residual,
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const prep = prepareHighDPICanvas(canvas);
        if (prep) {
          drawSplitWorkspace(
            prep.ctx,
            prep.width,
            prep.height,
            sim.x,
            a,
            sim.ghostX,
            sim.time,
            sim.history,
            A,
            w,
            activeGamma,
            law,
            tr
          );
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const drawSplitWorkspace = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      x: number,
      a: number,
      ghostX: number,
      time: number,
      history: TraceSample[],
      A: number,
      w: number,
      activeGamma: number,
      law: ForceLaw,
      tr: Translations
    ) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      drawScientificGrid(ctx, 0, 0, W, H, 28);

      const splitY = Math.round(H * 0.42);

      // Divider line
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, splitY);
      ctx.lineTo(W, splitY);
      ctx.stroke();

      // ==========================================================
      // TOP HALF: SYNCHRONIZED OSCILLATOR & a vs x OPPOSITION
      // ==========================================================
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tr.m3.oscillatorTitle, 18, 22);

      const wallX = 44;
      const trackY = Math.round(splitY * 0.7);
      const eqX = Math.round(wallX + (W - wallX - 36) * 0.52);
      const maxSpanPx = Math.min(eqX - wallX - 65, W - eqX - 65);
      const pxPerMeter = Math.max(48, maxSpanPx / 2.15);

      // Air-track rail
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(wallX, trackY, W - wallX - 24, 11, 3);
      ctx.fill();
      ctx.stroke();

      // Equilibrium vertical dashed line
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, 38);
      ctx.lineTo(eqX, trackY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#065f46';
      ctx.font = '700 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('x = 0', eqX, trackY + 25);

      // Amplitude bounds -A and +A
      [-A, A].forEach((bound, idx) => {
        const bx = eqX + bound * pxPerMeter;
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(bx, 48);
        ctx.lineTo(bx, trackY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10.5px "IBM Plex Mono", monospace';
        ctx.fillText(idx === 0 ? '-A' : '+A', bx, trackY + 24);
      });

      drawAnchorWall(ctx, wallX, trackY - 96, trackY + 11);

      const blockW = 54;
      const blockH = 44;

      // Pure Linear SHM Ghost reference in Hard Spring mode
      if (law === 'hard_spring') {
        const gx = eqX + ghostX * pxPerMeter;
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#0284c7';
        ctx.fillStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.roundRect(gx - blockW / 2, trackY - blockH, blockW, blockH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Legend at top right
        ctx.font = '600 11px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0284c7';
        ctx.fillText(`□ ${tr.m3.ghostLegend}`, W - 18, 22);
      }

      const blockCX = eqX + x * pxPerMeter;
      const springEnd = Math.max(wallX + 20, blockCX - blockW / 2);

      drawHelicalSpring(
        ctx,
        wallX,
        springEnd,
        trackY - blockH / 2,
        11,
        12,
        law === 'hard_spring' ? 3.2 : 2.5,
        law === 'hard_spring' ? '#be123c' : '#334155'
      );

      drawMetallicBlock(
        ctx,
        blockCX,
        trackY,
        blockW,
        blockH,
        law === 'hard_spring' ? 'Hard' : 'SHM',
        false,
        false
      );

      // Displacement x vector (Sky Blue) above block
      if (Math.abs(x) > 0.03) {
        drawVectorArrow(
          ctx,
          eqX,
          trackY - blockH - 18,
          blockCX,
          trackY - blockH - 18,
          '#0284c7',
          `x = ${x >= 0 ? '+' : ''}${x.toFixed(2)} m`,
          -14,
          2.8
        );
      }

      // Acceleration a vector (Rose Red) from block center, scaled cleanly
      const maxA = w * w * A + activeGamma * A * A * A;
      if (Math.abs(a) > 0.1 && maxA > 0) {
        const aPx = (a / maxA) * 115;
        drawVectorArrow(
          ctx,
          blockCX,
          trackY - blockH / 2,
          blockCX + aPx,
          trackY - blockH / 2,
          '#e11d48',
          `a = ${a >= 0 ? '+' : ''}${a.toFixed(1)} m/s²`,
          -19,
          3
        );
      }

      ctx.restore();

      // ==========================================================
      // BOTTOM HALF: LIVE DUAL-TRACE OSCILLOSCOPE x(t) & a(t)
      // ==========================================================
      ctx.save();
      const oscTop = splitY + 18;
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tr.m3.oscilloscopeTitle, 18, oscTop + 4);

      // Legend pills inside oscilloscope header
      ctx.font = '700 11px "IBM Plex Mono", "Hind Siliguri", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`━━ ${tr.m3.dispTrace}`, W - 180, oscTop + 4);
      ctx.fillStyle = '#e11d48';
      ctx.fillText(`━━ ${tr.m3.accTrace}`, W - 18, oscTop + 4);

      const padL = 52;
      const padR = 52;
      const plotW = W - padL - padR;
      const plotTop = oscTop + 26;
      const plotBottom = H - 36;
      const midY = (plotTop + plotBottom) / 2;
      const halfH = (plotBottom - plotTop) / 2 - 8;

      // Axes & Zero center line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, midY);
      ctx.lineTo(padL + plotW, midY);
      ctx.moveTo(padL, plotTop);
      ctx.lineTo(padL, plotBottom);
      ctx.moveTo(padL + plotW, plotTop);
      ctx.lineTo(padL + plotW, plotBottom);
      ctx.stroke();

      // Left axis labels (x in m)
      ctx.fillStyle = '#0284c7';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`+${A.toFixed(1)}m`, padL - 6, plotTop + 10);
      ctx.fillText(`0`, padL - 6, midY + 3);
      ctx.fillText(`-${A.toFixed(1)}m`, padL - 6, plotBottom - 4);

      // Right axis labels (a in m/s^2)
      const peakA = Math.max(1, w * w * A + activeGamma * A * A * A);
      ctx.fillStyle = '#e11d48';
      ctx.textAlign = 'left';
      ctx.fillText(`+${peakA.toFixed(1)}`, padL + plotW + 6, plotTop + 10);
      ctx.fillText(`0`, padL + plotW + 6, midY + 3);
      ctx.fillText(`-${peakA.toFixed(1)}`, padL + plotW + 6, plotBottom - 4);

      const windowSec = 8.0;
      const tStart = Math.max(0, time - windowSec);
      const tEnd = Math.max(windowSec, time);

      const mapT = (tVal: number) =>
        padL + ((tVal - tStart) / (tEnd - tStart)) * plotW;
      const mapX = (xVal: number) => midY - (xVal / A) * halfH;
      const mapAcc = (aVal: number) => midY - (aVal / peakA) * halfH;

      // Time ticks
      const firstTick = Math.ceil(tStart);
      for (let tt = firstTick; tt <= tEnd; tt += 1) {
        const tx = mapT(tt);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, plotTop);
        ctx.lineTo(tx, plotBottom);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${tt}s`, tx, plotBottom + 14);
      }

      if (history.length > 1) {
        // Plot Displacement x(t)
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        let started = false;
        for (const pt of history) {
          if (pt.time < tStart) continue;
          const px = mapT(pt.time);
          const py = mapX(pt.x);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Plot Acceleration a(t)
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        started = false;
        for (const pt of history) {
          if (pt.time < tStart) continue;
          const px = mapT(pt.time);
          const py = mapAcc(pt.a);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Live endpoint dots at current time
        const last = history[history.length - 1];
        const lx = mapT(last.time);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(lx, mapX(last.x), 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(lx, mapAcc(last.a), 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#475569';
      ctx.font = '500 11px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tr.m3.mirrorNote, W / 2, H - 7);

      ctx.restore();
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const linearPeriod = (2 * Math.PI) / omega;
  const actualPeriod = useMemo(
    () =>
      forceLaw === 'linear'
        ? linearPeriod
        : computeExactDuffingPeriod(amplitudeA, omega, gamma),
    [forceLaw, amplitudeA, omega, gamma, linearPeriod]
  );

  const isLinearSHM = forceLaw === 'linear';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] gap-4 items-stretch">
      {/* LEFT VERTICAL SIDEBAR (340px) */}
      <aside className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <h2 className="text-base font-bold text-slate-950">{t.common.controls}</h2>
          <span className="font-mono text-xs font-semibold text-emerald-700">
            {isPlaying ? t.common.running : t.common.paused}
          </span>
        </div>

        {/* Force Law Selector */}
        <div className="space-y-2">
          <span className="block text-sm font-bold text-slate-900">
            {t.m3.forceLawLabel}
          </span>

          <button
            type="button"
            onClick={() => handleForceLawChange('linear')}
            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
              forceLaw === 'linear'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-sky-50/70 text-slate-900 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{t.m3.linearLawTitle}</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  forceLaw === 'linear'
                    ? 'bg-emerald-700 text-emerald-50'
                    : 'bg-white text-emerald-700 border border-emerald-200'
                }`}
              >
                {t.m3.linearLawFormula}
              </span>
            </div>
            <p
              className={`text-xs mt-1 leading-snug ${
                forceLaw === 'linear' ? 'text-emerald-50' : 'text-slate-600'
              }`}
            >
              {t.m3.linearLawDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleForceLawChange('hard_spring')}
            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
              forceLaw === 'hard_spring'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-sky-50/70 text-slate-900 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{t.m3.hardSpringTitle}</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  forceLaw === 'hard_spring'
                    ? 'bg-rose-700 text-rose-50'
                    : 'bg-white text-rose-700 border border-rose-200'
                }`}
              >
                {t.m3.hardSpringFormula}
              </span>
            </div>
            <p
              className={`text-xs mt-1 leading-snug ${
                forceLaw === 'hard_spring' ? 'text-rose-50' : 'text-slate-600'
              }`}
            >
              {t.m3.hardSpringDesc}
            </p>
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-1 border-t border-sky-100">
          <ProgressiveSlider
            id="m3-amp"
            label={t.m3.amplitudeLabel}
            value={amplitudeA}
            min={0.2}
            max={2.0}
            step={0.1}
            unit="m"
            precision={1}
            onChange={handleAmplitudeChange}
          />

          <ProgressiveSlider
            id="m3-omega"
            label={t.m3.omegaLabel}
            value={omega}
            min={1.0}
            max={8.0}
            step={0.2}
            unit="rad/s"
            precision={1}
            onChange={setOmega}
          />

          {forceLaw === 'hard_spring' && (
            <ProgressiveSlider
              id="m3-gamma"
              label={t.m3.nonLinearityLabel}
              value={gamma}
              min={0.5}
              max={8.0}
              step={0.5}
              unit="m⁻²s⁻²"
              precision={1}
              onChange={setGamma}
            />
          )}
        </div>

        {/* Playback Controls */}
        <div className="space-y-2 pt-2 border-t border-sky-100 mt-auto">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? t.common.pause : t.common.play}</span>
            </button>

            <button
              type="button"
              onClick={handleStepFrame}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-sky-200 hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.common.stepFrame}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearTrace}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-sky-200 hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.m3.clearTrace}</span>
          </button>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE (Flexible) */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3 min-h-[580px]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-base font-bold text-slate-950">{t.m3.stageTitle}</h2>
          <span
            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
              isLinearSHM
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isLinearSHM ? 'd²x/dt² + ω²x = 0' : 'd²x/dt² + ω²x + γx³ = 0'}
          </span>
        </div>

        <div className="relative flex-1 min-h-[490px] rounded-xl border border-sky-200 overflow-hidden bg-white">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </section>

      {/* RIGHT TELEMETRY PANEL: LIVE DIFFERENTIAL EQUATION BALANCER (330px) */}
      <aside className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <div className="border-b border-sky-100 pb-3">
          <h2 className="text-base font-bold text-slate-950">{t.m3.balancerTitle}</h2>
        </div>

        {/* Live Equation Substituted Readout */}
        <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 space-y-2.5">
          <div className="text-center font-mono text-sm font-bold text-slate-950 pb-2 border-b border-sky-200">
            {t.m3.equationHeader}
          </div>

          <div className="space-y-1.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between items-center">
              <span className="text-rose-700 font-semibold">a(t) = d²x/dt²</span>
              <span className="font-bold text-rose-700">
                {telemetry.a >= 0 ? '+' : ''}
                {telemetry.a.toFixed(3)} m/s²
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sky-700 font-semibold">
                ω²x(t) ({(omega * omega).toFixed(1)} × {telemetry.x.toFixed(2)})
              </span>
              <span className="font-bold text-sky-700">
                {telemetry.omega2x >= 0 ? '+' : ''}
                {telemetry.omega2x.toFixed(3)} m/s²
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-sky-200">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">
              {t.m3.liveSumLabel}
            </div>
            <div
              className={`font-mono tabular-nums text-lg font-extrabold px-3 py-1.5 rounded-lg border text-center ${
                isLinearSHM
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-rose-50 border-rose-300 text-rose-700'
              }`}
            >
              [{telemetry.a >= 0 ? '+' : ''}
              {telemetry.a.toFixed(2)}] + [{telemetry.omega2x >= 0 ? '+' : ''}
              {telemetry.omega2x.toFixed(2)}] = {telemetry.sum >= 0 ? '+' : ''}
              {telemetry.sum.toFixed(3)} m/s²
            </div>
            <div
              className={`text-[11px] font-bold text-center mt-1.5 ${
                isLinearSHM ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isLinearSHM ? t.m3.balancedBadge : t.m3.violatedBadge}
            </div>
          </div>
        </div>

        {/* SHM Condition Verification Checklist */}
        <div className="space-y-2 pt-1 border-t border-sky-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.m3.checklistTitle}
          </h3>

          <div className="space-y-2 text-xs font-semibold">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t.m3.cond1}</span>
            </div>

            <div
              className={`flex items-start gap-2 p-2 rounded-lg border ${
                isLinearSHM
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {isLinearSHM ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{isLinearSHM ? t.m3.cond2 : t.m3.cond2Fail}</span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t.m3.cond3}</span>
            </div>
          </div>
        </div>

        {/* Isochronism Check */}
        <div className="space-y-2 pt-2 border-t border-sky-100 mt-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700">
            {t.m3.isochronismTitle}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[10.5px] text-slate-600">{t.m3.linearPeriod}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {linearPeriod.toFixed(3)} s
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                isLinearSHM
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              <div className="text-[10.5px] text-slate-600">{t.m3.actualPeriod}</div>
              <div
                className={`font-mono tabular-nums text-base font-bold ${
                  isLinearSHM ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {actualPeriod.toFixed(3)} s
              </div>
            </div>
          </div>
          <p
            className={`text-xs font-semibold leading-snug ${
              isLinearSHM ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isLinearSHM ? t.m3.isochronismTrue : t.m3.isochronismFalse}
          </p>
        </div>
      </aside>
    </div>
  );
};
