import React, { useEffect, useRef } from 'react';

/**
 * Real-time animated HTML5 Canvas ECG Waveform (P-QRS-T morphology)
 * Dynamically scales rate to live BPM and morphs waveform for Tachycardia,
 * Prolonged QTc / Arrhythmia, or Ventricular Arrest / Flatline.
 */
export const LiveECGWaveform = ({
  heartRate = 68,
  ecgQtc = 415,
  rhythm = 'Normal Sinus',
  isEmergency = false,
  height = 56
}) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ heartRate, ecgQtc, rhythm, isEmergency });

  useEffect(() => {
    stateRef.current = { heartRate, ecgQtc, rhythm, isEmergency };
  }, [heartRate, ecgQtc, rhythm, isEmergency]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const width = canvas.width;
    const h = canvas.height;
    const midY = h * 0.56;
    const points = new Array(width).fill(midY);
    let x = 0;
    let phase = 0;
    let lastTime = performance.now();

    const getPQRST = (p, qtcVal, isFlatline, isArrhythmic) => {
      if (isFlatline) {
        return Math.sin(p * 12) * 1.1; // Slight agonal / sensor noise baseline
      }
      const qtStretch = Math.max(0.85, Math.min(1.45, qtcVal / 415));
      // Normalized heartbeat phase 0..1
      let y = 0;
      if (p >= 0.08 && p < 0.18) {
        // P-wave
        const t = (p - 0.08) / 0.10;
        y = -Math.sin(t * Math.PI) * 5.0;
      } else if (p >= 0.22 && p < 0.25) {
        // Q dip
        const t = (p - 0.22) / 0.03;
        y = Math.sin(t * Math.PI) * 5.5;
      } else if (p >= 0.25 && p < 0.30) {
        // R spike
        const t = (p - 0.25) / 0.05;
        y = -Math.sin(t * Math.PI) * (h * 0.44);
      } else if (p >= 0.30 && p < 0.34) {
        // S dip
        const t = (p - 0.30) / 0.04;
        y = Math.sin(t * Math.PI) * 8.5;
      } else if (p >= 0.40 && p < Math.min(0.82, 0.40 + 0.16 * qtStretch)) {
        // T wave (stretched when QTc is prolonged)
        const dur = 0.16 * qtStretch;
        const t = (p - 0.40) / dur;
        y = -Math.sin(t * Math.PI) * (isArrhythmic ? 9.5 : 6.5);
      }
      return y;
    };

    const draw = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const { heartRate: hr, ecgQtc: qtc, isEmergency: emerg } = stateRef.current;
      const isFlatline = emerg || hr < 25;
      const isArrhythmic = qtc >= 450;
      const isHigh = hr > 100;

      const effectiveBpm = isFlatline ? 60 : Math.max(30, Math.min(200, hr));
      const beatsPerSec = effectiveBpm / 60;
      const pxPerSec = 95;
      const stepPx = Math.max(1, Math.round(pxPerSec * dt));

      for (let i = 0; i < stepPx; i++) {
        const speedMult = isArrhythmic ? 1 + 0.15 * Math.sin(now * 0.004) : 1;
        phase = (phase + (beatsPerSec * speedMult * (dt / stepPx))) % 1;
        const offset = getPQRST(phase, qtc, isFlatline, isArrhythmic);
        points[x] = midY + offset;
        x = (x + 1) % width;
      }

      // Clear & draw monitor grid
      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, width, h);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 0.7;
      for (let gx = 0; gx < width; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 14) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Stroke color based on clinical state
      const strokeColor = isFlatline
        ? '#EF4444'
        : isArrhythmic || isHigh
        ? '#F59E0B'
        : '#10B981';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 6;
      ctx.shadowColor = strokeColor;

      // Draw trace with sweep gap
      const gap = 8;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < width; i++) {
        const dist = (i - x + width) % width;
        if (dist < gap) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(i, points[i]);
          started = true;
        } else {
          ctx.lineTo(i, points[i]);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sweep cursor dot
      const cursorX = (x - 1 + width) % width;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cursorX, points[cursorX], 2.3, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={height}
      className="w-full rounded-md border border-slate-800/90 bg-[#070B14] block"
    />
  );
};
