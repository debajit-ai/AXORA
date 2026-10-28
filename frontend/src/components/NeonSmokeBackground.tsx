"use client";

import React, { useEffect, useRef } from "react";

/**
 * Reusable pitch-black (#000000) & restrained atmospheric neon-green smoke layer.
 *
 * Keeps the screen predominantly pure pitch black (#000000), with subtle,
 * slow-moving translucent emerald and neon-green wisps concentrated around
 * selected outer corners and margins so the interface reads as black first.
 */
export function NeonSmokeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number | null = null;

    let bufWidth = 192;
    let bufHeight = 120;
    let imageData: ImageData | null = null;
    let pixels32: Uint32Array | null = null;

    const updateSize = () => {
      if (!canvas) return;
      const vw = Math.max(window.innerWidth || 1280, 320);
      const vh = Math.max(window.innerHeight || 800, 320);
      const aspect = vw / vh;
      bufHeight = 116;
      bufWidth = Math.max(140, Math.min(240, Math.round(bufHeight * aspect)));
      canvas.width = bufWidth;
      canvas.height = bufHeight;
      imageData = ctx.createImageData(bufWidth, bufHeight);
      pixels32 = new Uint32Array(imageData.data.buffer);
    };

    updateSize();

    // Deterministic permutation & gradient table for smooth 2D gradient noise
    const perm = new Uint8Array(512);
    const gradX = new Float32Array(512);
    const gradY = new Float32Array(512);
    let seed = 902105;
    const pBase = new Uint8Array(256);
    for (let i = 0; i < 256; i++) pBase[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      const tmp = pBase[i];
      pBase[i] = pBase[j];
      pBase[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      const v = pBase[i & 255];
      perm[i] = v;
      const angle = (v / 256) * Math.PI * 2;
      gradX[i] = Math.cos(angle);
      gradY[i] = Math.sin(angle);
    }

    const noise2D = (x: number, y: number): number => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;

      const X = xi & 255;
      const Y = yi & 255;

      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
      const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

      const aa = perm[X + perm[Y]];
      const ab = perm[X + perm[Y + 1]];
      const ba = perm[X + 1 + perm[Y]];
      const bb = perm[X + 1 + perm[Y + 1]];

      const gAA = gradX[aa] * xf + gradY[aa] * yf;
      const gBA = gradX[ba] * (xf - 1) + gradY[ba] * yf;
      const gAB = gradX[ab] * xf + gradY[ab] * (yf - 1);
      const gBB = gradX[bb] * (xf - 1) + gradY[bb] * (yf - 1);

      const x1 = gAA + u * (gBA - gAA);
      const x2 = gAB + u * (gBB - gAB);
      return 0.5 + 0.5 * (x1 + v * (x2 - x1));
    };

    const fbm = (x: number, y: number): number => {
      return (
        0.55 * noise2D(x, y) +
        0.3 * noise2D(x * 2.05 + 11.3, y * 2.05 + 27.9) +
        0.15 * noise2D(x * 4.13 - 17.4, y * 4.13 + 14.2)
      );
    };

    // Precompute 1024-entry Color Lookup Table (ABGR Uint32)
    // Pure #000000 dominates; only higher-density wisps emerge in #003B1F -> #008F45 -> #00D957 -> sparse #39FF14
    const lutSize = 1024;
    const colorLut = new Uint32Array(lutSize);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smoothstep = (edge0: number, edge1: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    for (let i = 0; i < lutSize; i++) {
      const d = i / (lutSize - 1);
      let r = 0;
      let g = 0;
      let b = 0;

      if (d <= 0.54) {
        // Pure pitch black (#000000) across the vast majority of the viewport
        r = 0;
        g = 0;
        b = 0;
      } else if (d <= 0.72) {
        // Subtle emergence into deep atmospheric green (#003B1F)
        const t = smoothstep(0.54, 0.72, d);
        r = 0;
        g = lerp(0, 59, t);
        b = lerp(0, 31, t);
      } else if (d <= 0.87) {
        // Soft emerald smoke (#008F45)
        const t = smoothstep(0.72, 0.87, d);
        r = 0;
        g = lerp(59, 143, t);
        b = lerp(31, 69, t);
      } else if (d <= 0.96) {
        // Luminous green wisp ridge (#00D957)
        const t = smoothstep(0.87, 0.96, d);
        r = 0;
        g = lerp(143, 217, t);
        b = lerp(69, 87, t);
      } else {
        // Occasional delicate neon highlight (#39FF14)
        const t = smoothstep(0.96, 1.0, d);
        r = lerp(0, 57, t * 0.65);
        g = lerp(217, 255, t * 0.75);
        b = lerp(87, 20, t * 0.65);
      }

      // Restrained atmospheric intensity so the screen always reads as pitch-black first
      const ri = Math.min(255, Math.round(r * 0.56));
      const gi = Math.min(255, Math.round(g * 0.56));
      const bi = Math.min(255, Math.round(b * 0.56));

      colorLut[i] = (255 << 24) | (bi << 16) | (gi << 8) | ri;
    }

    const renderFrame = (timeSeconds: number) => {
      if (!imageData || !pixels32) return;

      const t1 = timeSeconds * 0.024;
      const t2 = timeSeconds * 0.016;
      const t3 = timeSeconds * 0.011;

      const invW = 1 / bufWidth;
      const invH = 1 / bufHeight;
      const aspect = bufWidth / bufHeight;

      let idx = 0;
      for (let y = 0; y < bufHeight; y++) {
        const ny = y * invH;
        const py = ny * 2.6;

        for (let x = 0; x < bufWidth; x++) {
          const nx = x * invW;
          const px = nx * 2.6 * aspect * 0.65;

          // Concentrated only around selected outer corners and margins;
          // central workspace and navigation area remain predominantly pure black (#000000).
          const topLeftPocket = Math.exp(
            -(Math.pow((nx - 0.06) / 0.2, 2) + Math.pow((ny - 0.16) / 0.22, 2))
          );
          const bottomLeftPocket = Math.exp(
            -(Math.pow((nx - 0.1) / 0.24, 2) + Math.pow((ny - 0.86) / 0.22, 2))
          );
          const topRightPocket = Math.exp(
            -(Math.pow((nx - 0.92) / 0.2, 2) + Math.pow((ny - 0.2) / 0.24, 2))
          );
          const bottomRightPocket = Math.exp(
            -(Math.pow((nx - 0.88) / 0.25, 2) + Math.pow((ny - 0.88) / 0.24, 2))
          );
          const farLeftMargin =
            0.65 * Math.exp(-Math.pow(nx / 0.14, 2) * 2.2) *
            Math.exp(-Math.pow((ny - 0.52) / 0.35, 2));
          const farRightMargin =
            0.65 * Math.exp(-Math.pow((1 - nx) / 0.14, 2) * 2.2) *
            Math.exp(-Math.pow((ny - 0.5) / 0.35, 2));

          // Very faint diagonal allowance so an occasional subtle wisp can drift behind the workspace
          const diag = (nx - 0.5) * 0.8 + (ny - 0.54) * 0.9;
          const subtleCenterWisp =
            0.22 *
            Math.exp(-diag * diag * 4.5) *
            Math.exp(-Math.pow((ny - 0.55) / 0.32, 2));

          const spatialMask = Math.min(
            0.96,
            0.18 +
              0.68 *
                Math.max(
                  topLeftPocket,
                  bottomLeftPocket,
                  topRightPocket,
                  bottomRightPocket,
                  farLeftMargin,
                  farRightMargin
                ) +
              subtleCenterWisp
          );

          // Domain-warped organic vapor field
          const qx = fbm(px + t1, py - t2);
          const qy = fbm(px + 5.2 - t2, py + 1.3 + t1 * 0.85);

          const rx = fbm(
            px + 2.3 * qx + 1.7 + t2 * 0.9,
            py + 2.3 * qy + 9.2 - t3
          );
          const ry = fbm(
            px + 2.1 * qx + 8.3 - t3 * 1.1,
            py + 2.1 * qy + 2.8 + t2 * 0.75
          );

          const baseVapor = fbm(px + 2.0 * rx, py + 2.0 * ry);
          const wispDetail = noise2D(
            (px + 1.5 * ry) * 2.9 - t1 * 1.1,
            (py - 1.5 * rx) * 2.9 + t2
          );

          const combinedVapor = baseVapor * 0.72 + wispDetail * 0.28;
          const density = Math.max(0, Math.min(1, combinedVapor * spatialMask));

          const lutIdx = Math.min(
            lutSize - 1,
            Math.max(0, (density * (lutSize - 1)) | 0)
          );
          pixels32[idx++] = colorLut[lutIdx];
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let startTimestamp: number | null = null;
    let lastRenderTime = 0;
    const frameIntervalMs = 36;

    const animate = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      if (timestamp - lastRenderTime >= frameIntervalMs) {
        lastRenderTime = timestamp;
        const elapsedSeconds = (timestamp - startTimestamp) * 0.001 + 120.0;
        renderFrame(elapsedSeconds);
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const startOrStopAnimation = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (motionQuery.matches) {
        renderFrame(120.0);
      } else {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    const handleResize = () => {
      updateSize();
      renderFrame(120.0);
    };

    startOrStopAnimation();

    window.addEventListener("resize", handleResize, { passive: true });
    motionQuery.addEventListener("change", startOrStopAnimation);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", startOrStopAnimation);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#000000] select-none"
    >
      {/* Subtle domain-warped emerald vapor canvas on pure #000000 */}
      <canvas
        ref={canvasRef}
        className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] pointer-events-none opacity-90"
        style={{ filter: "blur(20px)" }}
      />

      {/* Restrained corner atmospheric wisps */}
      <div className="neon-smoke-layer neon-smoke-layer-1" />
      <div className="neon-smoke-layer neon-smoke-layer-2" />
    </div>
  );
}
