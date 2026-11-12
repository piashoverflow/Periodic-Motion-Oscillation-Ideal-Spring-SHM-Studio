import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Square, Weight, RotateCcw } from 'lucide-react';
import { SpringConfig } from '../types/physics';
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

interface Module2Props {
  t: Translations;
  resetSignal: number;
}

const MAX_DISP = 2.2; // meters physical limit on track

export const Module2SpringMass: React.FC<Module2Props> = ({ t, resetSignal }) => {
  const [springK, setSpringK] = useState<number>(60);
  const [massM, setMassM] = useState<number>(2.0);
  const [amplitudeA, setAmplitudeA] = useState<number>(1.2);
  const [springConfig, setSpringConfig] = useState<SpringConfig>('single');
  const [extraMass, setExtraMass] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDraggingBlock, setIsDraggingBlock] = useState<boolean>(false);

  const [showVecX, setShowVecX] = useState<boolean>(true);
  const [showVecF, setShowVecF] = useState<boolean>(true);
  const [showVecV, setShowVecV] = useState<boolean>(true);

  const [telemetry, setTelemetry] = useState({
    x: 1.2,
    v: 0,
    F: -72,
    a: -36,
    ke: 0,
    pe: 43.2,
  });

  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const physRef = useRef({
    x: 1.2,
    v: 0,
    dragging: false,
    blockPixelCenterX: 0,
    blockPixelY: 0,
    blockWidth: 64,
    blockHeight: 52,
    eqPixelX: 0,
    pxPerMeter: 110,
  });

  const effectiveK =
    springConfig === 'parallel'
      ? springK * 2
      : springConfig === 'series'
      ? springK * 0.5
      : springK;

  const totalMass = massM + (extraMass ? 1.0 : 0);

  const paramsRef = useRef({
    effectiveK,
    totalMass,
    amplitudeA,
    springConfig,
    extraMass,
    isPlaying,
    showVecX,
    showVecF,
    showVecV,
    t,
  });

  useEffect(() => {
    paramsRef.current = {
      effectiveK,
      totalMass,
      amplitudeA,
      springConfig,
      extraMass,
      isPlaying,
      showVecX,
      showVecF,
      showVecV,
      t,
    };
  }, [
    effectiveK,
    totalMass,
    amplitudeA,
    springConfig,
    extraMass,
    isPlaying,
    showVecX,
    showVecF,
    showVecV,
    t,
  ]);

  // Global reset
  useEffect(() => {
    if (resetSignal === 0) return;
    setSpringK(60);
    setMassM(2.0);
    setAmplitudeA(1.2);
    setSpringConfig('single');
    setExtraMass(false);
    setIsPlaying(true);
    setShowVecX(true);
    setShowVecF(true);
    setShowVecV(true);
    physRef.current.x = 1.2;
    physRef.current.v = 0;
    physRef.current.dragging = false;
  }, [resetSignal]);

  // Update simulation amplitude when user adjusts the Initial Amplitude slider directly
  const handleAmplitudeChange = (newA: number) => {
    setAmplitudeA(newA);
    // Rescale current energy cleanly or reset to new amplitude if paused/near equilibrium
    const p = physRef.current;
    const sign = p.x >= 0 ? 1 : -1;
    p.x = sign * newA;
    p.v = 0;
  };

  // Inelastic mass drop: conserve momentum p = m * v instantaneously!
  const handleToggleExtraMass = () => {
    const p = physRef.current;
    const oldMass = totalMass;
    const newMass = extraMass ? massM : massM + 1.0;
    if (!extraMass) {
      // Dropping +1kg onto moving block conserves horizontal momentum
      p.v = (oldMass * p.v) / newMass;
    }
    setExtraMass((prev) => !prev);
  };

  const stepPhysics = (dtTotal: number, k: number, m: number) => {
    const subSteps = 12;
    const dt = dtTotal / subSteps;
    const p = physRef.current;
    for (let i = 0; i < subSteps; i++) {
      // RK4 integration for x'' = -(k/m) * x
      const omega2 = k / m;
      const x1 = p.x;
      const v1 = p.v;
      const a1 = -omega2 * x1;

      const x2 = x1 + 0.5 * dt * v1;
      const v2 = v1 + 0.5 * dt * a1;
      const a2 = -omega2 * x2;

      const x3 = x1 + 0.5 * dt * v2;
      const v3 = v1 + 0.5 * dt * a2;
      const a3 = -omega2 * x3;

      const x4 = x1 + dt * v3;
      const v4 = v1 + dt * a3;
      const a4 = -omega2 * x4;

      p.x += (dt / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
      p.v += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    }
  };

  const handleStepFrame = () => {
    setIsPlaying(false);
    stepPhysics(1 / 60, effectiveK, totalMass);
  };

  const handleStopAtEquilibrium = () => {
    setIsPlaying(false);
    physRef.current.x = 0;
    physRef.current.v = 0;
  };

  // 60FPS animation loop for both main Stage Canvas and F-x Graph Canvas
  useEffect(() => {
    let rafId = 0;
    let lastNow = performance.now();
    let lastUiSync = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - lastNow) / 1000);
      lastNow = now;

      const {
        effectiveK: k,
        totalMass: m,
        amplitudeA: A,
        springConfig: sCfg,
        extraMass: hasExtra,
        isPlaying: playing,
        showVecX: vx,
        showVecF: vf,
        showVecV: vv,
        t: tr,
      } = paramsRef.current;

      const p = physRef.current;
      if (playing && !p.dragging) {
        stepPhysics(dt, k, m);
      }

      const x = p.x;
      const v = p.dragging ? 0 : p.v;
      const F = -k * x;
      const a = F / m;
      const ke = 0.5 * m * v * v;
      const pe = 0.5 * k * x * x;

      if (now - lastUiSync > 45) {
        lastUiSync = now;
        setTelemetry({ x, v, F, a, ke, pe });
      }

      const stageCanvas = stageCanvasRef.current;
      if (stageCanvas) {
        const prep = prepareHighDPICanvas(stageCanvas);
        if (prep) {
          drawSpringStage(
            prep.ctx,
            prep.width,
            prep.height,
            x,
            v,
            F,
            k,
            m,
            A,
            sCfg,
            hasExtra,
            p.dragging,
            vx,
            vf,
            vv,
            tr
          );
        }
      }

      const graphCanvas = graphCanvasRef.current;
      if (graphCanvas) {
        const prepG = prepareHighDPICanvas(graphCanvas);
        if (prepG) {
          drawFxGraph(prepG.ctx, prepG.width, prepG.height, x, F, k, A);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const drawSpringStage = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      x: number,
      v: number,
      F: number,
      k: number,
      m: number,
      A: number,
      sCfg: SpringConfig,
      hasExtra: boolean,
      dragging: boolean,
      showX: boolean,
      showF: boolean,
      showV: boolean,
      tr: Translations
    ) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      drawScientificGrid(ctx, 0, 0, W, H, 28);

      const wallX = 48;
      const trackY = Math.round(H * 0.64);
      const eqX = Math.round(wallX + (W - wallX - 40) * 0.52);
      const maxSpanPx = Math.min(eqX - wallX - 75, W - eqX - 75);
      const pxPerMeter = Math.max(55, maxSpanPx / MAX_DISP);

      // Block dimensions scale smoothly with mass m
      const sizeScale = 0.82 + Math.min(1.0, (m - 0.5) / 10) * 0.48;
      const blockW = Math.round(62 * sizeScale);
      const blockH = Math.round(52 * sizeScale);

      const blockCenterX = eqX + x * pxPerMeter;
      const blockLeftX = blockCenterX - blockW / 2;
      const blockCenterY = trackY - blockH / 2;

      // Store geometry for hit-testing drag
      physRef.current.blockPixelCenterX = blockCenterX;
      physRef.current.blockPixelY = trackY;
      physRef.current.blockWidth = blockW;
      physRef.current.blockHeight = blockH;
      physRef.current.eqPixelX = eqX;
      physRef.current.pxPerMeter = pxPerMeter;

      // Frictionless Air-Track Rail
      ctx.save();
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(wallX, trackY, W - wallX - 24, 14, 4);
      ctx.fill();
      ctx.stroke();

      // Air-track ruler ticks in meters (-2.0 to +2.0)
      for (let dm = -2.0; dm <= 2.001; dm += 0.5) {
        const tx = eqX + dm * pxPerMeter;
        if (tx < wallX + 12 || tx > W - 32) continue;
        const isZero = Math.abs(dm) < 0.01;
        const isWhole = Math.abs(dm - Math.round(dm)) < 0.01;
        ctx.strokeStyle = isZero ? '#059669' : '#64748b';
        ctx.lineWidth = isZero ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(tx, trackY);
        ctx.lineTo(tx, trackY + (isWhole ? 10 : 6));
        ctx.stroke();

        if (isWhole) {
          ctx.fillStyle = isZero ? '#047857' : '#334155';
          ctx.font = '600 10.5px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${dm > 0 ? '+' : ''}${dm.toFixed(1)}m`, tx, trackY + 26);
        }
      }

      ctx.fillStyle = '#0369a1';
      ctx.font = '600 11px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(tr.m2.frictionlessTrack, W - 28, trackY + 42);
      ctx.restore();

      // Equilibrium Line (x = 0)
      ctx.save();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, 46);
      ctx.lineTo(eqX, trackY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1;
      ctx.font = '700 11px "Hind Siliguri", "IBM Plex Mono", sans-serif';
      const eqTxt = tr.m2.equilibrium;
      const eqTxtW = ctx.measureText(eqTxt).width + 14;
      ctx.beginPath();
      ctx.roundRect(eqX - eqTxtW / 2, 22, eqTxtW, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#065f46';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(eqTxt, eqX, 33);
      ctx.restore();

      // Turning points -A and +A markers (based on current physical amplitude or slider A)
      const currentAmp = Math.max(A, Math.abs(x));
      if (currentAmp > 0.08) {
        [-currentAmp, currentAmp].forEach((bound, idx) => {
          const bx = eqX + bound * pxPerMeter;
          if (bx <= wallX + 16 || bx >= W - 26) return;
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(bx, trackY - blockH - 30);
          ctx.lineTo(bx, trackY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#475569';
          ctx.font = '700 11px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(idx === 0 ? `-A` : `+A`, bx, trackY - blockH - 38);
          ctx.restore();
        });
      }

      // Anchor Wall
      drawAnchorWall(ctx, wallX, trackY - 125, trackY + 14);

      // Helical Spring Rendering (thickness scales with k)
      const wireThickness = 2.0 + Math.min(1, (k - 10) / 190) * 3.2;
      const safeSpringEnd = Math.max(wallX + 26, blockLeftX);

      if (sCfg === 'single') {
        drawHelicalSpring(
          ctx,
          wallX,
          safeSpringEnd,
          blockCenterY,
          12,
          15,
          wireThickness
        );
      } else if (sCfg === 'parallel') {
        // Two parallel springs anchored from wall to block
        drawHelicalSpring(
          ctx,
          wallX,
          safeSpringEnd,
          blockCenterY - 13,
          11,
          10,
          Math.max(1.8, wireThickness * 0.85),
          '#0369a1'
        );
        drawHelicalSpring(
          ctx,
          wallX,
          safeSpringEnd,
          blockCenterY + 13,
          11,
          10,
          Math.max(1.8, wireThickness * 0.85),
          '#0369a1'
        );
      } else {
        // Series: Two springs connected in series via a coupler ring
        const midSpringX = (wallX + safeSpringEnd) / 2;
        drawHelicalSpring(
          ctx,
          wallX,
          midSpringX - 4,
          blockCenterY,
          7,
          13,
          Math.max(1.8, wireThickness * 0.85),
          '#047857'
        );
        // Coupler ring
        ctx.save();
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(midSpringX, blockCenterY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawHelicalSpring(
          ctx,
          midSpringX + 4,
          safeSpringEnd,
          blockCenterY,
          7,
          13,
          Math.max(1.8, wireThickness * 0.85),
          '#047857'
        );
      }

      // Metallic Block
      drawMetallicBlock(
        ctx,
        blockCenterX,
        trackY,
        blockW,
        blockH,
        `${m.toFixed(1)} kg`,
        dragging,
        hasExtra
      );

      // High-Contrast Vector Arrows anchored to block's center of mass / track
      const vecBaseY1 = trackY - blockH - 22; // Displacement x above block
      const vecBaseY2 = blockCenterY; // Restoring force F from center of mass
      const vecBaseY3 = trackY + 46; // Velocity v below track

      if (showX && Math.abs(x) > 0.03) {
        drawVectorArrow(
          ctx,
          eqX,
          vecBaseY1,
          blockCenterX,
          vecBaseY1,
          '#0284c7',
          `x = ${x >= 0 ? '+' : ''}${x.toFixed(2)} m`,
          -14,
          3
        );
      }

      if (showF && Math.abs(F) > 0.5) {
        const maxForcePx = 140;
        const forceScale = 0.72;
        const fPx = Math.max(-maxForcePx, Math.min(maxForcePx, F * forceScale));
        drawVectorArrow(
          ctx,
          blockCenterX,
          vecBaseY2,
          blockCenterX + fPx,
          vecBaseY2,
          '#e11d48',
          `F = ${F >= 0 ? '+' : ''}${F.toFixed(1)} N`,
          -20,
          3.2
        );
      }

      if (showV && Math.abs(v) > 0.04) {
        const maxVelPx = 120;
        const velScale = 18;
        const vPx = Math.max(-maxVelPx, Math.min(maxVelPx, v * velScale));
        drawVectorArrow(
          ctx,
          blockCenterX,
          vecBaseY3,
          blockCenterX + vPx,
          vecBaseY3,
          '#059669',
          `v = ${v >= 0 ? '+' : ''}${v.toFixed(2)} m/s`,
          16,
          3
        );
      }

      // Dragging / Static hold indicator
      if (dragging) {
        ctx.save();
        ctx.fillStyle = '#0369a1';
        ctx.font = '700 12px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tr.m2.holdingBlock, W / 2, H - 16);
        ctx.restore();
      }
    };

    const drawFxGraph = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      x: number,
      F: number,
      k: number,
      A: number
    ) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const pad = 28;
      const cx = W / 2;
      const cy = H / 2;
      const maxPlotX = Math.max(2.0, A + 0.2);
      const maxPlotF = Math.max(40, k * maxPlotX);

      // Subtle quadrant grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        const gx = cx + (i / 2) * (W / 2 - pad);
        const gy = cy + (i / 2) * (H / 2 - pad);
        ctx.beginPath();
        ctx.moveTo(gx, pad * 0.5);
        ctx.lineTo(gx, H - pad * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad * 0.5, gy);
        ctx.lineTo(W - pad * 0.5, gy);
        ctx.stroke();
      }

      // Main Coordinate Axes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad * 0.6, cy);
      ctx.lineTo(W - pad * 0.6, cy);
      ctx.moveTo(cx, pad * 0.6);
      ctx.lineTo(cx, H - pad * 0.6);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = '#334155';
      ctx.font = '700 10.5px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('+x (m)', W - 8, cy - 6);
      ctx.textAlign = 'left';
      ctx.fillText('-x', 8, cy - 6);
      ctx.textAlign = 'center';
      ctx.fillText('+F (N)', cx + 22, 14);
      ctx.fillText('-F', cx + 16, H - 8);

      const mapX = (valX: number) => cx + (valX / maxPlotX) * (W / 2 - pad);
      const mapF = (valF: number) => cy - (valF / maxPlotF) * (H / 2 - pad);

      // Theoretical Hooke's Law straight line F = -k*x (negative slope through origin)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(mapX(-maxPlotX), mapF(k * maxPlotX));
      ctx.lineTo(mapX(maxPlotX), mapF(-k * maxPlotX));
      ctx.stroke();

      // Live tracking point (x, F)
      const px = mapX(x);
      const py = mapF(F);

      // Dashed projections to axes
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, cy);
      ctx.moveTo(px, py);
      ctx.lineTo(cx, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Halo + dot
      ctx.fillStyle = 'rgba(225, 29, 72, 0.2)';
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Direct mouse & touch drag-and-release handlers on stage canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = stageCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const p = physRef.current;
    const withinX = Math.abs(localX - p.blockPixelCenterX) <= p.blockWidth * 0.75;
    const withinY =
      localY >= p.blockPixelY - p.blockHeight - 24 && localY <= p.blockPixelY + 14;

    if (withinX && withinY) {
      p.dragging = true;
      p.v = 0;
      setIsDraggingBlock(true);
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = physRef.current;
    if (!p.dragging) return;
    const canvas = stageCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const newMeters = (localX - p.eqPixelX) / p.pxPerMeter;
    const clamped = Math.max(-MAX_DISP, Math.min(MAX_DISP, newMeters));
    p.x = clamped;
    p.v = 0;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = physRef.current;
    if (!p.dragging) return;
    p.dragging = false;
    p.v = 0;
    setIsDraggingBlock(false);
    setAmplitudeA(Number(Math.max(0.1, Math.min(2.0, Math.abs(p.x))).toFixed(2)));
    setIsPlaying(true);
    if (stageCanvasRef.current) {
      stageCanvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Derived Telemetry formulas
  const omega = Math.sqrt(effectiveK / totalMass);
  const periodT = (2 * Math.PI) / omega;
  const freq = 1 / periodT;
  const totalE = telemetry.ke + telemetry.pe;
  const keRatio = totalE > 1e-5 ? (telemetry.ke / totalE) * 100 : 0;
  const peRatio = totalE > 1e-5 ? (telemetry.pe / totalE) * 100 : 0;

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

        <div className="space-y-4">
          <ProgressiveSlider
            id="m2-k"
            label={t.m2.springConstant}
            value={springK}
            min={10}
            max={200}
            step={5}
            unit="N/m"
            precision={0}
            onChange={setSpringK}
          />

          <ProgressiveSlider
            id="m2-m"
            label={t.m2.blockMass}
            value={massM}
            min={0.5}
            max={10.0}
            step={0.1}
            unit="kg"
            precision={1}
            onChange={setMassM}
          />

          <ProgressiveSlider
            id="m2-amp"
            label={t.m2.initialAmplitude}
            value={amplitudeA}
            min={0.1}
            max={2.0}
            step={0.05}
            unit="m"
            precision={2}
            onChange={handleAmplitudeChange}
          />
        </div>

        {/* Spring Configuration Quick Test */}
        <div className="space-y-1.5 pt-2 border-t border-sky-100">
          <span className="block text-xs font-bold text-slate-700">
            {t.m2.springConfigLabel}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'single', label: t.m2.configSingle },
                { id: 'parallel', label: t.m2.configParallel },
                { id: 'series', label: t.m2.configSeries },
              ] as { id: SpringConfig; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSpringConfig(item.id)}
                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  springConfig === item.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-sky-50 text-slate-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="space-y-2 pt-2 border-t border-sky-100">
          <span className="block text-xs font-bold text-slate-700">
            {t.m2.playbackLabel}
          </span>
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
              <span>{isPlaying ? t.common.pause : t.m2.releasePlay}</span>
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
            onClick={handleStopAtEquilibrium}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-800 border border-sky-200 hover:bg-sky-50 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.m2.stopAtEquilibrium}</span>
          </button>
        </div>

        {/* Mass Drop Experiment */}
        <div className="space-y-1.5 pt-2 border-t border-sky-100">
          <button
            type="button"
            onClick={handleToggleExtraMass}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              extraMass
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700'
            }`}
          >
            {extraMass ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.m2.massResetBtn}</span>
              </>
            ) : (
              <>
                <Weight className="w-3.5 h-3.5" />
                <span>{t.m2.massDropBtn}</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-600 leading-snug">{t.m2.massDropNote}</p>
        </div>

        {/* Vector Overlays */}
        <div className="space-y-1.5 pt-2 border-t border-sky-100">
          <span className="block text-xs font-bold text-slate-700">
            {t.m2.vectorsTitle}
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-sky-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showVecX}
              onChange={(e) => setShowVecX(e.target.checked)}
              className="accent-sky-600 rounded"
            />
            <span>{t.m2.vecDisplacement}</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showVecF}
              onChange={(e) => setShowVecF(e.target.checked)}
              className="accent-rose-600 rounded"
            />
            <span>{t.m2.vecRestoringForce}</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showVecV}
              onChange={(e) => setShowVecV(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span>{t.m2.vecVelocity}</span>
          </label>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE (Flexible) */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3 min-h-[580px]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-950">{t.m2.stageTitle}</h2>
            <p className="text-xs font-medium text-sky-800 mt-0.5">{t.m2.dragHint}</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <span className="text-sky-700">kₑ = {effectiveK.toFixed(0)} N/m</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700">T = {periodT.toFixed(2)} s</span>
          </div>
        </div>

        <div className="relative flex-1 min-h-[430px] rounded-xl border border-sky-200 overflow-hidden bg-white">
          <canvas
            ref={stageCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full h-full block touch-none ${
              isDraggingBlock ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          />
        </div>

        {/* Mechanical Energy Split Strip below canvas */}
        <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-slate-900">{t.m2.energyTitle}</span>
            <div className="flex items-center gap-4 font-mono tabular-nums">
              <span className="text-emerald-700">
                {t.m2.kineticEnergy}: {telemetry.ke.toFixed(2)} J
              </span>
              <span className="text-sky-700">
                {t.m2.potentialEnergy}: {telemetry.pe.toFixed(2)} J
              </span>
              <span className="text-slate-950 font-bold">
                {t.m2.totalEnergy}: {totalE.toFixed(2)} J
              </span>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-emerald-600 transition-all duration-75"
              style={{ width: `${keRatio}%` }}
            />
            <div
              className="h-full bg-sky-500 transition-all duration-75"
              style={{ width: `${peRatio}%` }}
            />
          </div>
        </div>
      </section>

      {/* RIGHT TELEMETRY & GRAPH PANEL (330px) */}
      <aside className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        {/* Live F-x Graph */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-950">{t.m2.graphTitle}</h2>
          </div>
          <p className="text-[11px] font-medium text-slate-600">
            {t.m2.graphSubtitle} ({(-effectiveK).toFixed(0)} N/m)
          </p>
          <div className="h-[200px] w-full rounded-xl border border-sky-200 overflow-hidden bg-white">
            <canvas ref={graphCanvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Digital Readouts */}
        <div className="space-y-2.5 pt-2 border-t border-sky-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700">
            {t.m2.readoutsTitle}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] text-slate-600">{t.m2.angularFreq}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {omega.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">rad/s</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] text-slate-600">{t.m2.timePeriod}</div>
              <div className="font-mono tabular-nums text-base font-bold text-emerald-700">
                {periodT.toFixed(3)} <span className="text-[11px] font-normal text-slate-500">s</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] text-slate-600">{t.m2.frequency}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {freq.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">Hz</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] text-slate-600">{t.m2.totalMass}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {totalMass.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">kg</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-sky-700">{t.m2.displacement}</span>
              <span className="font-mono tabular-nums font-bold text-slate-950">
                {telemetry.x >= 0 ? '+' : ''}
                {telemetry.x.toFixed(3)} m
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-emerald-700">{t.m2.velocity}</span>
              <span className="font-mono tabular-nums font-bold text-slate-950">
                {telemetry.v >= 0 ? '+' : ''}
                {telemetry.v.toFixed(3)} m/s
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-rose-700">{t.m2.restoringForce}</span>
              <span className="font-mono tabular-nums font-bold text-rose-700">
                {telemetry.F >= 0 ? '+' : ''}
                {telemetry.F.toFixed(2)} N
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700">{t.m2.acceleration}</span>
              <span className="font-mono tabular-nums font-bold text-slate-950">
                {telemetry.a >= 0 ? '+' : ''}
                {telemetry.a.toFixed(2)} m/s²
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
