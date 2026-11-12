export interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

export function prepareHighDPICanvas(
  canvas: HTMLCanvasElement
): { ctx: CanvasRenderingContext2D; width: number; height: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

export function drawScientificGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  step = 24
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 1;

  for (let gx = x; gx <= x + w; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVectorArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label?: string,
  labelOffsetY = -12,
  lineWidth = 3
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 3) return;

  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(12, Math.max(7, len * 0.25));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Shaft stops slightly before tip for crisp arrowhead
  const shaftEndX = x2 - (headLen * 0.65) * Math.cos(angle);
  const shaftEndY = y2 - (headLen * 0.65) * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6.5),
    y2 - headLen * Math.sin(angle - Math.PI / 6.5)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6.5),
    y2 - headLen * Math.sin(angle + Math.PI / 6.5)
  );
  ctx.closePath();
  ctx.fill();

  if (label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + labelOffsetY;
    ctx.font = '600 11.5px "IBM Plex Mono", "Hind Siliguri", monospace';
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const padX = 5;
    const boxW = textW + padX * 2;
    const boxH = 18;
    ctx.beginPath();
    ctx.roundRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY + 0.5);
  }

  ctx.restore();
}

export function drawAnchorWall(
  ctx: CanvasRenderingContext2D,
  wallX: number,
  topY: number,
  bottomY: number
) {
  ctx.save();
  const wallW = 18;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(wallX - wallW, topY, wallW, bottomY - topY);

  // Diagonal engineering hatch lines
  ctx.beginPath();
  ctx.rect(wallX - wallW, topY, wallW, bottomY - topY);
  ctx.clip();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let y = topY - 20; y <= bottomY + 20; y += 10) {
    ctx.beginPath();
    ctx.moveTo(wallX - wallW, y);
    ctx.lineTo(wallX, y - 14);
    ctx.stroke();
  }
  ctx.restore();

  // Solid front edge
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wallX, topY);
  ctx.lineTo(wallX, bottomY);
  ctx.stroke();
  ctx.restore();
}

export function drawHelicalSpring(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  centerY: number,
  coils: number,
  radius: number,
  wireThickness: number,
  strokeColor = '#334155'
) {
  const lead = Math.min(18, Math.max(8, (endX - startX) * 0.08));
  const x0 = startX + lead;
  const x1 = endX - lead;
  const span = Math.max(12, x1 - x0);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Subtle shadow depth pass
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.lineWidth = wireThickness + 1.5;
  ctx.beginPath();
  ctx.moveTo(startX, centerY + 2);
  ctx.lineTo(x0, centerY + 2);
  const steps = coils * 18;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const angle = u * coils * Math.PI * 2;
    const px = x0 + u * span + Math.cos(angle) * (span / (coils * 5.2));
    const py = centerY + 2 + Math.sin(angle) * radius;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(endX, centerY + 2);
  ctx.stroke();

  // Metallic highlight gradient across vertical coil height
  const grad = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
  grad.addColorStop(0, '#64748b');
  grad.addColorStop(0.35, '#0f172a');
  grad.addColorStop(0.65, strokeColor);
  grad.addColorStop(1, '#475569');

  ctx.strokeStyle = grad;
  ctx.lineWidth = wireThickness;
  ctx.beginPath();
  ctx.moveTo(startX, centerY);
  ctx.lineTo(x0, centerY);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const angle = u * coils * Math.PI * 2;
    const px = x0 + u * span + Math.cos(angle) * (span / (coils * 5.2));
    const py = centerY + Math.sin(angle) * radius;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(endX, centerY);
  ctx.stroke();

  ctx.restore();
}

export function drawMetallicBlock(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  width: number,
  height: number,
  massLabel: string,
  isDragging = false,
  hasExtraMass = false
) {
  const left = centerX - width / 2;
  const top = bottomY - height;

  ctx.save();

  // Contact shadow on frictionless track
  ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
  ctx.beginPath();
  ctx.roundRect(left + 3, bottomY - 2, width - 6, 5, 2);
  ctx.fill();

  // Main metallic body gradient
  const bodyGrad = ctx.createLinearGradient(left, top, left + width, bottomY);
  if (isDragging) {
    bodyGrad.addColorStop(0, '#e0f2fe');
    bodyGrad.addColorStop(0.5, '#bae6fd');
    bodyGrad.addColorStop(1, '#7dd3fc');
  } else {
    bodyGrad.addColorStop(0, '#f8fafc');
    bodyGrad.addColorStop(0.45, '#e2e8f0');
    bodyGrad.addColorStop(1, '#cbd5e1');
  }

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = isDragging ? '#0284c7' : '#334155';
  ctx.lineWidth = isDragging ? 2.5 : 2;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 8);
  ctx.fill();
  ctx.stroke();

  // Subtle top bevel highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left + 6, top + 2.5);
  ctx.lineTo(left + width - 6, top + 2.5);
  ctx.stroke();

  // Extra dropped mass plate on top if active
  if (hasExtraMass) {
    const plateW = width * 0.72;
    const plateH = 14;
    const plateX = centerX - plateW / 2;
    const plateY = top - plateH + 1;
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 9.5px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+1.0 kg', centerX, plateY + plateH / 2 + 0.5);
  }

  // Mass label inside block
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 13px "IBM Plex Mono", "Hind Siliguri", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(massLabel, centerX, top + height / 2);

  // Center-of-mass crosshair dot
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(centerX, top + height * 0.24, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
