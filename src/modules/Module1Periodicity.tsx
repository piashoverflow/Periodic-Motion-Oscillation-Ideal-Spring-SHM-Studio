import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Snowflake, Ruler, CheckCircle2, AlertCircle } from 'lucide-react';
import { MotionType } from '../types/physics';
import { Translations } from '../i18n/translations';
import { ProgressiveSlider } from '../components/ProgressiveSlider';
import { drawScientificGrid, prepareHighDPICanvas } from '../utils/canvasHelpers';

interface Module1Props {
  t: Translations;
  resetSignal: number;
}

const WORLD_MAX_X = 16; // meters across spatial ruler

export const Module1Periodicity: React.FC<Module1Props> = ({ t, resetSignal }) => {
  const [periodT, setPeriodT] = useState<number>(2.0);
  const [wavelength, setWavelength] = useState<number>(4.0);
  const [motionType, setMotionType] = useState<MotionType>('circular');
  const [isTimeFrozen, setIsTimeFrozen] = useState<boolean>(false);
  const [cursor1, setCursor1] = useState<number>(2.5);
  const [cursor2, setCursor2] = useState<number>(6.5);

  const [telemetry, setTelemetry] = useState({
    elapsedTime: 0,
    cycles: 0,
    pulseActive: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingCursorRef = useRef<1 | 2 | null>(null);
  const simRef = useRef({
    time: 0,
    lastCycleIndex: 0,
    pulseAlpha: 0,
  });

  // Keep latest reactive params in refs for smooth 60fps loop
  const paramsRef = useRef({
    periodT,
    wavelength,
    motionType,
    isTimeFrozen,
    cursor1,
    cursor2,
    t,
  });

  useEffect(() => {
    paramsRef.current = {
      periodT,
      wavelength,
      motionType,
      isTimeFrozen,
      cursor1,
      cursor2,
      t,
    };
  }, [periodT, wavelength, motionType, isTimeFrozen, cursor1, cursor2, t]);

  // Handle global Reset button
  useEffect(() => {
    if (resetSignal === 0) return;
    setPeriodT(2.0);
    setWavelength(4.0);
    setMotionType('circular');
    setIsTimeFrozen(false);
    setCursor1(2.5);
    setCursor2(6.5);
    simRef.current = { time: 0, lastCycleIndex: 0, pulseAlpha: 0 };
    setTelemetry({ elapsedTime: 0, cycles: 0, pulseActive: false });
  }, [resetSignal]);

  // Helper to evaluate asymmetric heartbeat/sawtooth periodic waveform in [0, 1) phase
  const evalAsymmetric = (phase01: number): number => {
    // Sharp ECG-like heartbeat + sawtooth recovery within 1 period
    if (phase01 < 0.12) return (phase01 / 0.12) * 0.25;
    if (phase01 < 0.2) return 0.25 - ((phase01 - 0.12) / 0.08) * 0.45;
    if (phase01 < 0.3) return -0.2 + ((phase01 - 0.2) / 0.1) * 1.2;
    if (phase01 < 0.42) return 1.0 - ((phase01 - 0.3) / 0.12) * 1.45;
    if (phase01 < 0.56) return -0.45 + ((phase01 - 0.42) / 0.14) * 0.6;
    return 0.15 * (1 - (phase01 - 0.56) / 0.44);
  };

  // Main 60FPS animation loop
  useEffect(() => {
    let rafId = 0;
    let lastTimestamp = performance.now();
    let lastUiSync = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const {
        periodT: T,
        wavelength: lam,
        motionType: mType,
        isTimeFrozen: frozen,
        cursor1: c1,
        cursor2: c2,
        t: tr,
      } = paramsRef.current;

      const sim = simRef.current;
      if (!frozen) {
        sim.time += dt;
      }

      const currentCycle = Math.floor(sim.time / T);
      if (currentCycle > sim.lastCycleIndex && !frozen) {
        sim.lastCycleIndex = currentCycle;
        sim.pulseAlpha = 1.0;
      }
      if (sim.pulseAlpha > 0) {
        sim.pulseAlpha = Math.max(0, sim.pulseAlpha - dt * 1.5);
      }

      if (now - lastUiSync > 50) {
        lastUiSync = now;
        setTelemetry({
          elapsedTime: sim.time,
          cycles: currentCycle,
          pulseActive: sim.pulseAlpha > 0.15,
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const prepared = prepareHighDPICanvas(canvas);
        if (prepared) {
          const { ctx, width, height } = prepared;
          drawStage(ctx, width, height, sim.time, T, lam, mType, frozen, c1, c2, sim.pulseAlpha, tr);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    const drawStage = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      time: number,
      T: number,
      lam: number,
      mType: MotionType,
      frozen: boolean,
      c1: number,
      c2: number,
      pulseAlpha: number,
      tr: Translations
    ) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const splitY = Math.round(H * 0.49);
      drawScientificGrid(ctx, 0, 0, W, H, 28);

      // Divider between Top (Temporal) and Bottom (Spatial) stages
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, splitY);
      ctx.lineTo(W, splitY);
      ctx.stroke();

      const phase01 = ((time % T) + T) % T / T;
      const omega = (2 * Math.PI) / T;
      const theta = omega * time;

      // ==========================================================
      // TOP HALF: TEMPORAL PERIODICITY
      // ==========================================================
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tr.m1.temporalTitle, 18, 24);

      // Period Marker Pulse Badge (Flashes at every full period T)
      const pulseBoxX = W - 18;
      if (pulseAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, pulseAlpha);
        const badgeText = tr.m1.periodMarkerPulse;
        ctx.font = '700 12px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        const bw = ctx.measureText(badgeText).width + 24;
        ctx.fillStyle = '#d1fae5';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pulseBoxX - bw, 10, bw, 26, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#065f46';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, pulseBoxX - bw / 2, 23);
        ctx.restore();
      } else if (frozen) {
        const frozenTxt = tr.common.frozen;
        ctx.font = '600 11.5px "IBM Plex Mono", "Hind Siliguri", sans-serif';
        const bw = ctx.measureText(frozenTxt).width + 18;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pulseBoxX - bw, 11, bw, 24, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(frozenTxt, pulseBoxX - bw / 2, 23);
      }

      const topAreaTop = 44;
      const topAreaH = splitY - topAreaTop - 12;

      if (mType === 'circular') {
        // Side-by-side comparison: Left = Uniform Circular Motion, Right = Symmetrical Pendulum Oscillation
        const midX = W / 2;

        // Subtle center divider
        ctx.strokeStyle = '#e0f2fe';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(midX, topAreaTop + 6);
        ctx.lineTo(midX, splitY - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- LEFT: Uniform Circular Motion ---
        const cCenterX = midX * 0.5;
        const cCenterY = topAreaTop + topAreaH * 0.54;
        const orbitR = Math.min(midX * 0.28, topAreaH * 0.34, 72);

        // Label
        ctx.fillStyle = '#0284c7';
        ctx.font = '700 12.5px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tr.m1.circularLabel, cCenterX, topAreaTop + 14);
        ctx.fillStyle = '#475569';
        ctx.font = '500 11px "Hind Siliguri", sans-serif';
        ctx.fillText(tr.m1.circularSub, cCenterX, topAreaTop + 30);

        // Orbit circle
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cCenterX, cCenterY, orbitR, 0, Math.PI * 2);
        ctx.stroke();

        // Period T=0 reference marker on circle (top)
        const refX = cCenterX;
        const refY = cCenterY - orbitR;
        ctx.fillStyle = pulseAlpha > 0.1 ? `rgba(5, 150, 105, ${pulseAlpha})` : '#94a3b8';
        ctx.beginPath();
        ctx.arc(refX, refY, 4 + pulseAlpha * 7, 0, Math.PI * 2);
        ctx.fill();

        // Central planet / pivot
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cCenterX, cCenterY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting body (starts at top, goes clockwise like clock hand)
        const angle = -Math.PI / 2 + theta;
        const satX = cCenterX + orbitR * Math.cos(angle);
        const satY = cCenterY + orbitR * Math.sin(angle);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cCenterX, cCenterY);
        ctx.lineTo(satX, satY);
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(satX, satY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // --- RIGHT: Symmetrical Oscillation (Pendulum) ---
        const pPivotX = midX + midX * 0.5;
        const pPivotY = topAreaTop + 44;
        const rodLen = Math.min(topAreaH * 0.62, 118);
        const maxAngle = 0.42; // radians
        const swingAngle = maxAngle * Math.cos(theta);

        ctx.fillStyle = '#059669';
        ctx.font = '700 12.5px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tr.m1.oscillatoryLabel, pPivotX, topAreaTop + 14);
        ctx.fillStyle = '#475569';
        ctx.font = '500 11px "Hind Siliguri", sans-serif';
        ctx.fillText(tr.m1.oscillatorySub, pPivotX, topAreaTop + 30);

        // Swing arc track
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pPivotX, pPivotY, rodLen, Math.PI / 2 - maxAngle, Math.PI / 2 + maxAngle);
        ctx.stroke();

        // Mean equilibrium vertical dashed line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pPivotX, pPivotY);
        ctx.lineTo(pPivotX, pPivotY + rodLen + 14);
        ctx.stroke();
        ctx.setLineDash([]);

        // Bob position
        const bobX = pPivotX + rodLen * Math.sin(swingAngle);
        const bobY = pPivotY + rodLen * Math.cos(swingAngle);

        // Pulse ring at starting extreme when cycle completes
        if (pulseAlpha > 0.05) {
          const startBobX = pPivotX + rodLen * Math.sin(maxAngle);
          const startBobY = pPivotY + rodLen * Math.cos(maxAngle);
          ctx.strokeStyle = `rgba(5, 150, 105, ${pulseAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(startBobX, startBobY, 12 + (1 - pulseAlpha) * 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Pivot mount
        ctx.fillStyle = '#334155';
        ctx.fillRect(pPivotX - 18, pPivotY - 4, 36, 5);

        // Pendulum rod
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pPivotX, pPivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Pendulum bob
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bobX, bobY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (mType === 'oscillatory') {
        // Focused Symmetrical Pendulum + Live Harmonic x(t) Trace
        const leftX = W * 0.27;
        const pPivotY = topAreaTop + 44;
        const rodLen = Math.min(topAreaH * 0.64, 122);
        const maxAngle = 0.46;
        const swingAngle = maxAngle * Math.cos(theta);

        ctx.fillStyle = '#059669';
        ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tr.m1.oscillatoryLabel, leftX, topAreaTop + 14);
        ctx.fillStyle = '#475569';
        ctx.font = '500 11px "Hind Siliguri", sans-serif';
        ctx.fillText(tr.m1.oscillatorySub, leftX, topAreaTop + 30);

        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(leftX, pPivotY, rodLen, Math.PI / 2 - maxAngle, Math.PI / 2 + maxAngle);
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftX, pPivotY);
        ctx.lineTo(leftX, pPivotY + rodLen + 14);
        ctx.stroke();
        ctx.setLineDash([]);

        const bobX = leftX + rodLen * Math.sin(swingAngle);
        const bobY = pPivotY + rodLen * Math.cos(swingAngle);
        ctx.fillStyle = '#334155';
        ctx.fillRect(leftX - 20, pPivotY - 4, 40, 5);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(leftX, pPivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Right side: Time-domain Cosine Graph showing period T intervals
        const gX = W * 0.48;
        const gW = W * 0.47;
        const gMidY = topAreaTop + topAreaH * 0.56;
        const gAmp = topAreaH * 0.28;
        const timeSpan = Math.max(6, T * 2.5);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gX, gMidY);
        ctx.lineTo(gX + gW, gMidY);
        ctx.stroke();

        // Period T tick markers
        for (let n = 0; n * T <= timeSpan; n++) {
          const tx = gX + ((n * T) / timeSpan) * gW;
          ctx.strokeStyle = 'rgba(5, 150, 105, 0.35)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(tx, gMidY - gAmp - 10);
          ctx.lineTo(tx, gMidY + gAmp + 10);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#047857';
          ctx.font = '600 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(n === 0 ? '0' : `${n}T`, tx, gMidY + gAmp + 22);
        }

        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px <= gW; px += 2) {
          const localT = (px / gW) * timeSpan;
          const val = Math.cos(((2 * Math.PI) / T) * (time - localT));
          const py = gMidY - val * gAmp;
          if (px === 0) ctx.moveTo(gX + px, py);
          else ctx.lineTo(gX + px, py);
        }
        ctx.stroke();

        // Live dot at current time (left edge of scrolling trace)
        const curY = gMidY - Math.cos(theta) * gAmp;
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(gX, curY, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Asymmetric Periodic Pulse (Heartbeat / Sawtooth wave — non-SHM periodic)
        const pCenterX = W * 0.2;
        const pCenterY = topAreaTop + topAreaH * 0.56;
        const pulseVal = evalAsymmetric(phase01);

        ctx.fillStyle = '#e11d48';
        ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tr.m1.asymmetricLabel, pCenterX + 40, topAreaTop + 14);
        ctx.fillStyle = '#475569';
        ctx.font = '500 11px "Hind Siliguri", sans-serif';
        ctx.fillText(tr.m1.asymmetricSub, pCenterX + 40, topAreaTop + 30);

        // Pulsing beacon circle driven by asymmetric pulse
        const baseR = 26;
        const dynR = baseR + pulseVal * 18;
        ctx.fillStyle = 'rgba(225, 29, 72, 0.14)';
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, Math.max(10, dynR + 8), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, Math.max(8, dynR * 0.58), 0, Math.PI * 2);
        ctx.fill();

        // Scrolling asymmetric trace on right
        const gX = W * 0.36;
        const gW = W * 0.59;
        const gMidY = topAreaTop + topAreaH * 0.58;
        const gAmp = topAreaH * 0.28;
        const timeSpan = Math.max(5, T * 3);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gX, gMidY);
        ctx.lineTo(gX + gW, gMidY);
        ctx.stroke();

        for (let n = 0; n * T <= timeSpan; n++) {
          const tx = gX + ((n * T) / timeSpan) * gW;
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.25)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(tx, gMidY - gAmp - 8);
          ctx.lineTo(tx, gMidY + gAmp + 8);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#be123c';
          ctx.font = '600 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(n === 0 ? '0' : `${n}T`, tx, gMidY + gAmp + 20);
        }

        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px <= gW; px += 2) {
          const localT = (px / gW) * timeSpan;
          const pastT = time - localT;
          const ph = (((pastT % T) + T) % T) / T;
          const v = evalAsymmetric(ph);
          const py = gMidY - v * gAmp;
          if (px === 0) ctx.moveTo(gX + px, py);
          else ctx.lineTo(gX + px, py);
        }
        ctx.stroke();

        const dotY = gMidY - pulseVal * gAmp;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(gX, dotY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ==========================================================
      // BOTTOM HALF: SPATIAL PERIODICITY (Wave + 1D Atomic Lattice + Draggable Ruler)
      // ==========================================================
      ctx.save();
      const sTop = splitY + 18;
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tr.m1.spatialTitle, 18, sTop + 6);

      const padL = 44;
      const padR = 32;
      const plotW = W - padL - padR;
      const bottomH = H - splitY;
      const waveCenterY = splitY + bottomH * 0.49;
      const waveAmp = Math.min(39, bottomH * 0.145);

      const xToPx = (xm: number) => padL + (xm / WORLD_MAX_X) * plotW;

      // Wave baseline
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, waveCenterY);
      ctx.lineTo(padL + plotW, waveCenterY);
      ctx.stroke();

      // Wave profile (sinusoidal or asymmetric spatial train)
      const evalWaveY = (xm: number): number => {
        const kWave = (2 * Math.PI) / lam;
        const phi = kWave * xm - omega * time;
        if (mType === 'asymmetric') {
          const ph = (((phi / (2 * Math.PI)) % 1) + 1) % 1;
          return evalAsymmetric(ph);
        }
        return Math.sin(phi);
      };

      // Subtle filled area under wave
      ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
      ctx.beginPath();
      ctx.moveTo(padL, waveCenterY);
      for (let px = 0; px <= plotW; px += 2) {
        const xm = (px / plotW) * WORLD_MAX_X;
        const wy = waveCenterY - evalWaveY(xm) * waveAmp;
        ctx.lineTo(padL + px, wy);
      }
      ctx.lineTo(padL + plotW, waveCenterY);
      ctx.closePath();
      ctx.fill();

      // Crisp wave stroke
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let px = 0; px <= plotW; px += 2) {
        const xm = (px / plotW) * WORLD_MAX_X;
        const wy = waveCenterY - evalWaveY(xm) * waveAmp;
        if (px === 0) ctx.moveTo(padL + px, wy);
        else ctx.lineTo(padL + px, wy);
      }
      ctx.stroke();

      // Wavelength λ bracket near left side
      const lamPx = (lam / WORLD_MAX_X) * plotW;
      if (lamPx <= plotW - 10) {
        const bY = waveCenterY - waveAmp - 12;
        ctx.strokeStyle = '#0369a1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, bY - 4);
        ctx.lineTo(padL, bY + 4);
        ctx.moveTo(padL, bY);
        ctx.lineTo(padL + lamPx, bY);
        ctx.moveTo(padL + lamPx, bY - 4);
        ctx.lineTo(padL + lamPx, bY + 4);
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.font = '700 11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`λ = ${lam.toFixed(1)} m`, padL + lamPx / 2, bY - 7);
      }

      // 1D Crystalline Atomic Lattice directly aligned below wave
      const latticeY = splitY + bottomH * 0.78;
      ctx.fillStyle = '#475569';
      ctx.font = '600 11px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tr.m1.latticeLabel, padL, latticeY - 19);

      // Lattice axis bond line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, latticeY);
      ctx.lineTo(padL + plotW, latticeY);
      ctx.stroke();

      // Atoms placed at periodic lattice intervals (sub-period = lam / 2 or lam / 4, highlighting full λ sites)
      const subStep = lam / 4;
      for (let xm = 0; xm <= WORLD_MAX_X + 0.001; xm += subStep) {
        const ax = xToPx(xm);
        if (ax > padL + plotW + 2) break;
        const unitCellIndex = Math.round((xm / lam) * 4);
        const isPrimarySite = unitCellIndex % 4 === 0;
        const localDisp = evalWaveY(xm) * 4.5; // slight longitudinal phonon shimmer

        ctx.fillStyle = isPrimarySite ? '#059669' : '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ax + localDisp, latticeY, isPrimarySite ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Spatial X-axis Ruler at bottom
      const rulerY = H - 22;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, rulerY);
      ctx.lineTo(padL + plotW, rulerY);
      ctx.stroke();

      for (let m = 0; m <= WORLD_MAX_X; m += 1) {
        const tx = xToPx(m);
        const isMajor = m % 2 === 0;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(tx, rulerY - (isMajor ? 6 : 3));
        ctx.lineTo(tx, rulerY + (isMajor ? 5 : 2));
        ctx.stroke();
        if (isMajor) {
          ctx.fillStyle = '#334155';
          ctx.font = '500 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${m}m`, tx, rulerY + 14);
        }
      }

      // Interactive Draggable Measurement Cursors x1 & x2
      const dxMeters = Math.abs(c2 - c1);
      const ratio = dxMeters / lam;
      const nearestInt = Math.round(ratio);
      const isIdenticalState = nearestInt >= 1 && Math.abs(ratio - nearestInt) < 0.08;
      const cursorColor = isIdenticalState ? '#059669' : '#e11d48';

      const px1 = xToPx(c1);
      const px2 = xToPx(c2);

      // Highlight span between cursors
      ctx.fillStyle = isIdenticalState
        ? 'rgba(5, 150, 105, 0.09)'
        : 'rgba(225, 29, 72, 0.06)';
      ctx.fillRect(Math.min(px1, px2), waveCenterY - waveAmp - 8, Math.abs(px2 - px1), rulerY - (waveCenterY - waveAmp - 8));

      [
        { px: px1, val: c1, name: 'x₁' },
        { px: px2, val: c2, name: 'x₂' },
      ].forEach((cur) => {
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cur.px, waveCenterY - waveAmp - 10);
        ctx.lineTo(cur.px, rulerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wave intersection dot
        const wy = waveCenterY - evalWaveY(cur.val) * waveAmp;
        ctx.fillStyle = cursorColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cur.px, wy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draggable handle pill on ruler
        ctx.fillStyle = cursorColor;
        ctx.beginPath();
        ctx.roundRect(cur.px - 16, rulerY - 12, 32, 20, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cur.name, cur.px, rulerY - 2);
      });

      // Δx readout banner placed cleanly in the open space to the right and slightly lower
      const stateLabel = isIdenticalState
        ? `Δx = ${dxMeters.toFixed(2)}m (${nearestInt}λ) · ${tr.m1.identicalState}`
        : `Δx = ${dxMeters.toFixed(2)}m (${ratio.toFixed(2)}λ)`;
      ctx.font = '700 11.5px "IBM Plex Mono", "Hind Siliguri", sans-serif';
      const labelW = ctx.measureText(stateLabel).width + 18;
      const rightAnchorX = W - 18 - labelW / 2;
      const minRightX = Math.max(padL + labelW / 2, W * 0.56);
      const clampedLabelX = Math.min(rightAnchorX, Math.max(minRightX, (px1 + px2) / 2 + 90));
      const labelY = splitY + 44;

      ctx.fillStyle = isIdenticalState ? '#ecfdf5' : '#fff1f2';
      ctx.strokeStyle = cursorColor;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(clampedLabelX - labelW / 2, labelY - 11, labelW, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isIdenticalState ? '#065f46' : '#9f1239';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stateLabel, clampedLabelX, labelY);

      ctx.restore();
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Pointer drag handlers for x1 and x2 spatial ruler cursors
  const getWorldXFromPointer = (e: React.PointerEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const padL = 44;
    const padR = 32;
    const plotW = rect.width - padL - padR;
    if (plotW <= 0) return null;
    const localX = e.clientX - rect.left;
    const meters = ((localX - padL) / plotW) * WORLD_MAX_X;
    return Math.max(0.2, Math.min(WORLD_MAX_X - 0.2, meters));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const localY = e.clientY - rect.top;
    // Only grab cursors in the bottom spatial stage
    if (localY < rect.height * 0.48) return;

    const meters = getWorldXFromPointer(e);
    if (meters === null) return;

    const d1 = Math.abs(meters - cursor1);
    const d2 = Math.abs(meters - cursor2);
    const hitTolerance = 1.1;
    if (d1 <= hitTolerance || d2 <= hitTolerance) {
      draggingCursorRef.current = d1 <= d2 ? 1 : 2;
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingCursorRef.current) return;
    const meters = getWorldXFromPointer(e);
    if (meters === null) return;
    const rounded = Math.round(meters * 20) / 20;
    if (draggingCursorRef.current === 1) {
      setCursor1(rounded);
    } else {
      setCursor2(rounded);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingCursorRef.current && canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
      draggingCursorRef.current = null;
    }
  };

  // Telemetry derived calculations
  const freq = 1 / periodT;
  const omega = (2 * Math.PI) / periodT;
  const waveSpeed = wavelength / periodT;
  const deltaX = Math.abs(cursor2 - cursor1);
  const ratioLam = deltaX / wavelength;
  const nearestInt = Math.round(ratioLam);
  const isStateMatched = nearestInt >= 1 && Math.abs(ratioLam - nearestInt) < 0.08;
  const phaseDiffRad = (2 * Math.PI * deltaX) / wavelength;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] gap-4 items-stretch">
      {/* LEFT VERTICAL SIDEBAR (340px) */}
      <aside className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <h2 className="text-base font-bold text-slate-950">{t.common.controls}</h2>
          <span className="font-mono text-xs font-semibold text-sky-700">
            {isTimeFrozen ? t.common.frozen : t.common.running}
          </span>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <ProgressiveSlider
            id="m1-period"
            label={t.m1.timePeriodLabel}
            value={periodT}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="s"
            precision={1}
            onChange={setPeriodT}
          />

          <ProgressiveSlider
            id="m1-wavelength"
            label={t.m1.wavelengthLabel}
            value={wavelength}
            min={1.0}
            max={10.0}
            step={0.1}
            unit="m"
            precision={1}
            onChange={setWavelength}
          />
        </div>

        {/* Motion Type Switcher */}
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-slate-900">
            {t.m1.motionTypeLabel}
          </span>
          <div className="flex flex-col gap-1.5">
            {(['circular', 'oscillatory', 'asymmetric'] as MotionType[]).map((type) => {
              const active = motionType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMotionType(type)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-sky-50/70 text-slate-800 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  {t.m1.motionOptions[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Freeze Time & Snap Ruler Buttons */}
        <div className="space-y-2.5 pt-1 border-t border-sky-100">
          <button
            type="button"
            onClick={() => setIsTimeFrozen((f) => !f)}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
              isTimeFrozen
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-900 border-sky-300 hover:bg-sky-50'
            }`}
          >
            {isTimeFrozen ? (
              <>
                <Play className="w-4 h-4" />
                <span>{t.m1.unfreezeTime}</span>
              </>
            ) : (
              <>
                <Snowflake className="w-4 h-4 text-sky-600" />
                <span>{t.m1.freezeTime}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const nextC2 = Math.min(WORLD_MAX_X - 0.5, cursor1 + wavelength);
              if (nextC2 - cursor1 < wavelength - 0.05) {
                setCursor1(2.0);
                setCursor2(Math.min(WORLD_MAX_X - 0.5, 2.0 + wavelength));
              } else {
                setCursor2(Number(nextC2.toFixed(2)));
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Ruler className="w-4 h-4" />
            <span>{t.m1.snapLambda}</span>
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-2 pt-2 border-t border-sky-100">
          <span className="block text-xs font-bold text-slate-600">
            {t.m1.presetsLabel}
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPeriodT(1.0);
                setIsTimeFrozen(false);
              }}
              className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-sky-50 border border-sky-200 text-slate-800 cursor-pointer"
            >
              {t.m1.presetFast}
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodT(4.0);
                setIsTimeFrozen(false);
              }}
              className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-sky-50 border border-sky-200 text-slate-800 cursor-pointer"
            >
              {t.m1.presetSlow}
            </button>
            <button
              type="button"
              onClick={() => {
                setWavelength(2.0);
              }}
              className="text-left px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-sky-50 border border-sky-200 text-slate-800 cursor-pointer"
            >
              {t.m1.presetShortWave}
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE (Flexible) */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3 min-h-[580px]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-950">{t.m1.stageTitle}</h2>
            <p className="text-xs font-medium text-sky-800 mt-0.5">{t.m1.pedagogicalRule}</p>
          </div>
          <span className="text-xs font-medium text-slate-600">{t.m1.rulerHint}</span>
        </div>

        <div className="relative flex-1 min-h-[490px] rounded-xl border border-sky-200 overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block touch-none cursor-ew-resize"
          />
        </div>
      </section>

      {/* RIGHT TELEMETRY PANEL (330px) */}
      <aside className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-5 flex flex-col gap-5">
        <div className="border-b border-sky-100 pb-3">
          <h2 className="text-base font-bold text-slate-950">{t.common.telemetry}</h2>
        </div>

        {/* Temporal Telemetry */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700">
            {t.m1.telemetryTemporal}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] font-medium text-slate-600">{t.m1.elapsedTime}</div>
              <div className="font-mono tabular-nums text-lg font-bold text-slate-950">
                {telemetry.elapsedTime.toFixed(2)} <span className="text-xs font-normal text-slate-500">s</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] font-medium text-slate-600">{t.m1.completedCycles}</div>
              <div className="font-mono tabular-nums text-lg font-bold text-emerald-700">
                {telemetry.cycles}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] font-medium text-slate-600">{t.m1.frequency}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {freq.toFixed(2)} <span className="text-xs font-normal text-slate-500">Hz</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] font-medium text-slate-600">{t.m1.angularFreq}</div>
              <div className="font-mono tabular-nums text-base font-bold text-slate-950">
                {omega.toFixed(2)} <span className="text-xs font-normal text-slate-500">rad/s</span>
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">{t.m1.waveSpeed}</span>
            <span className="font-mono tabular-nums text-sm font-bold text-sky-700">
              {waveSpeed.toFixed(2)} m/s
            </span>
          </div>
        </div>

        {/* Spatial Ruler Telemetry */}
        <div className="space-y-2.5 pt-2 border-t border-sky-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700">
            {t.m1.telemetrySpatial}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{t.m1.cursor1}</span>
              <span className="font-mono tabular-nums font-semibold text-slate-950">
                {cursor1.toFixed(2)} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.m1.cursor2}</span>
              <span className="font-mono tabular-nums font-semibold text-slate-950">
                {cursor2.toFixed(2)} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.m1.deltaX}</span>
              <span className="font-mono tabular-nums font-bold text-slate-950">
                {deltaX.toFixed(2)} m ({ratioLam.toFixed(2)} λ)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.m1.phaseDiff}</span>
              <span className="font-mono tabular-nums font-semibold text-slate-950">
                {phaseDiffRad.toFixed(2)} rad
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-semibold ${
              isStateMatched
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {isStateMatched ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{isStateMatched ? t.m1.identicalState : t.m1.differentPhase}</span>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-2 pt-2 border-t border-sky-100 mt-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t.m1.keyInsightsTitle}
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
            <li>• {t.m1.insight1}</li>
            <li>• {t.m1.insight2}</li>
            <li>• {t.m1.insight3}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
