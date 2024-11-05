// src/features/microphone/MicrophoneButton.tsx
import React from 'react';
import { Mic } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectStatus } from '../navbar/navbarSlice';
import {
  selectMicrophoneStatus,
  selectSelectedDeviceId,
} from './microphoneSlice';

export const MicrophoneButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const status = useAppSelector(selectStatus);
  const micStatus = useAppSelector(selectMicrophoneStatus);

  const getButtonStyle = () => {
    switch (micStatus) {
      case 'None':
        return 'has-background-danger-dark'; // #a90505
      case 'External':
        return 'has-background-success-dark'; // #008000
      default:
        return '';
    }
  };

  return (
    <button
      className={`button ${getButtonStyle()}`}
      onClick={onClick}
      disabled={status === 'started'}
      style={{
        backgroundColor: micStatus === 'External' ? '#008000' :
                        micStatus === 'None' ? '#a90505' : undefined
      }}
    >
      <span className="icon-text">
        <span className="icon is-small">
          <Mic />
        </span>
        <span>{micStatus}</span>
      </span>
    </button>
  );
};