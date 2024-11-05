import React, { useState, useEffect } from 'react';
import { Loader, X, Play, Square } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useAppSelector } from '../../app/hooks';
import { selectHasContent } from '../content/contentSlice';

export type ButtonState = 'connecting' | 'error' | 'ready' | 'starting' | 'active';

interface StatusButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const StatusButton = ({ onClick, disabled, className = '' }: StatusButtonProps) => {
  const [buttonState, setButtonState] = useState<ButtonState>('connecting');
  const hasContent = useAppSelector(selectHasContent);

  // Monitor console logs for state changes
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      const logMessage = args.join(' ');

      // Connecting State
      if (logMessage.includes('Initializing token manager') ||
          logMessage.includes('Requesting new token')) {
        setButtonState('connecting');
      }
      // Ready State
      else if (logMessage.includes('Token retrieved successfully') ||
                logMessage.includes('Speech recognition session stopped')) {
        setButtonState('ready');
      }
      // Starting State
      else if (logMessage.includes('Starting speech recognition') ||
               logMessage.includes('Creating recognizer') ||
               logMessage.includes('Stopping speech recognition...') ||
               logMessage.includes('Speech recognition stopped successfully') ||
               logMessage.includes('Starting continuous recognition')) {
        setButtonState('starting');
      }
      // Active State
      else if (logMessage.includes('Speech recognition session started')) {
        setButtonState('active');
      }
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const errorMessage = args.join(' ');

      if (errorMessage.includes('Failed to refresh token')) {
        setButtonState('error');
      }
    };

    // Reset on page load
    setButtonState('connecting');

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  const getButtonStyles = () => {
    const baseStyles = 'button is-custom-start';

    switch (buttonState) {
      case 'connecting':
      case 'error':
        return `${baseStyles} is-dark`;
      case 'ready':
      case 'starting':
        return `${baseStyles} is-start`;
      case 'active':
        return `${baseStyles} is-stop`;
      default:
        return baseStyles;
    }
  };

  const getButtonContent = () => {
    const iconClasses = 'icon is-small';
    const getIcon = () => {
      switch (buttonState) {
        case 'connecting':
          return <Play className="fa-solid" />;
        case 'error':
          return <X className="fa-solid" />;
        case 'ready':
          return <Play className="fa-solid text-green-500" />;
        case 'starting':
          return <Loader className="fa-solid animate-spin" />;
        case 'active':
          return <Square className="fa-solid text-red-500" />;
      }
    };

    return (
      <span className="icon-text">
        <span className={iconClasses}>
          {getIcon()}
        </span>
        <span>
          {buttonState === 'error' ? 'Error' :
           buttonState === 'starting' ? 'Starting' :
           buttonState === 'active' ? 'Stop' : 'Start'}
        </span>
      </span>
    );
  };

  const getTooltipContent = () => {
    if (!hasContent && buttonState === 'ready') {
      return 'Add content to begin';
    }

    switch (buttonState) {
      case 'connecting':
      case 'starting':
        return 'Connecting, please wait';
      case 'error':
        return 'Error. Please refresh page';
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (!hasContent && buttonState === 'ready') {
      return; // Prevent starting if no content
    }
    onClick();
  };

  return (
    <>
      <button
        className={`${getButtonStyles()} ${className}`}
        onClick={handleClick}
        disabled={disabled ||
                 ['connecting', 'error'].includes(buttonState) ||
                 (!hasContent && buttonState === 'ready')}
        data-tooltip-id="status-tooltip"
        data-tooltip-content={getTooltipContent()}
      >
        {getButtonContent()}
      </button>

      <Tooltip
        id="status-tooltip"
        place="top"
        className="status-tooltip"
        classNameArrow="status-tooltip-arrow"
        openOnClick={false}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}
      />
    </>
  );
};