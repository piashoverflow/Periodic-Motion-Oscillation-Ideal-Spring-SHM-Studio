import React from 'react';

interface ProgressiveSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  precision?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const ProgressiveSlider: React.FC<ProgressiveSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  precision = 1,
  disabled = false,
  onChange,
}) => {
  const clamped = Math.min(max, Math.max(min, value));
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-slate-900 leading-tight"
        >
          {label}
        </label>
        <span className="font-mono tabular-nums text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
          {clamped.toFixed(precision)} {unit}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="progressive-slider w-full"
        style={{
          background: `linear-gradient(to right, #059669 0%, #059669 ${percent}%, #d1fae5 ${percent}%, #d1fae5 100%)`,
        }}
      />

      <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500">
        <span>
          {min.toFixed(precision)} {unit}
        </span>
        <span>
          {max.toFixed(precision)} {unit}
        </span>
      </div>
    </div>
  );
};
