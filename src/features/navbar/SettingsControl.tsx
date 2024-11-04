import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface SettingsControlProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  defaultValue: number;
}

const SettingsControl: React.FC<SettingsControlProps> = ({
  label,
  value,
  unit = "",
  min,
  max,
  step,
  onChange,
  defaultValue
}) => {
  const increment = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const reset = () => {
    onChange(defaultValue);
  };

  return (
    <div className="slider">
      <div className="slider-label-group">
        <span className="slider-label">{label}</span>
        <button
          onClick={reset}
          className="reset-button"
          title="Reset to default"
        >
          <RotateCcw size={12} />
        </button>
      </div>
      <div className="slider-controls">
        <div className="control-group">
          <button
            onClick={decrement}
            disabled={value <= min}
            className="control-button"
          >
            <Minus size={12} />
          </button>
          <div className="value-display">
            {value}{unit}
          </div>
          <button
            onClick={increment}
            disabled={value >= max}
            className="control-button"
          >
            <Plus size={12} />
          </button>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
};

export default SettingsControl;