import React from 'react';
import SettingsControl from './SettingsControl';
import { Trash2 } from 'lucide-react';

interface SettingValue {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number) => void;
}

interface SettingsPanelProps {
  isVisible: boolean;
  settingsControls: SettingValue[];
  onClearAll: () => void;
  buttonPosition?: { right: number };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isVisible,
  settingsControls,
  onClearAll,
  buttonPosition
}) => {
  return (
    <div
      className={`settings-panel ${isVisible ? 'visible' : ''}`}
      style={buttonPosition ? {
        right: `${buttonPosition.right}px`
      } : undefined}
    >
      <div className="settings-grid">
        {settingsControls.map((control, index) => (
          <div key={index} className="settings-grid-item">
            <SettingsControl {...control} />
          </div>
        ))}
      </div>
      <button
        className="clear-storage-btn"
        onClick={onClearAll}
      >
        <span className="icon-text">
          <span className="icon is-small">
            <Trash2 size={16} />
          </span>
          <span>Reset Page</span>
        </span>
      </button>
    </div>
  );
};