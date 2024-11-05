import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Check } from 'lucide-react';
import {
  selectDevices,
  selectSelectedDeviceId,
  setSelectedDevice,
} from './microphoneSlice';

interface MicrophoneSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const devices = useAppSelector(selectDevices);
  const selectedDeviceId = useAppSelector(selectSelectedDeviceId);

  if (!isOpen) return null;

  return (
    <div className="microphone-selector">
      <div className="microphone-selector-backdrop" onClick={onClose} />
      <div className="microphone-selector-content">
        {devices.length === 0 ? (
          <div className="no-devices">No microphones detected</div>
        ) : (
          <div className="device-list">
            {devices.map((device) => (
              <button
                key={device.deviceId}
                className={`device-item ${
                  device.deviceId === selectedDeviceId ? 'selected' : ''
                }`}
                onClick={() => {
                  dispatch(setSelectedDevice(device.deviceId));
                  onClose();
                }}
              >
                <span>{device.label}</span>
                {device.deviceId === selectedDeviceId && (
                  <Check className="check-icon" size={16} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};