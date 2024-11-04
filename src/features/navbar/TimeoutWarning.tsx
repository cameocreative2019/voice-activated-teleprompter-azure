import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectShowTimeoutWarning,
  selectTimeoutCountdown,
  selectStatus
} from '../navbar/navbarSlice';
import { extendTimeout } from '../../app/thunks';

export const TimeoutWarning = () => {
  const dispatch = useAppDispatch();
  const showWarning = useAppSelector(selectShowTimeoutWarning);
  const countdown = useAppSelector(selectTimeoutCountdown);
  const status = useAppSelector(selectStatus);

  // Only show warning if we're in started mode
  if (!showWarning || status !== "started") return null;

  return (
    <div className="timeout-warning-container">
      <div className="timeout-warning">
        <div className="timeout-message">Are you still there?
          <button
            className="button is-white is-outlined ml-2"
            onClick={() => dispatch(extendTimeout())}
          >
            Yes
          </button>
        </div>
        <div className="timeout-countdown">
          Stopping in {countdown} seconds
        </div>
      </div>
    </div>
  );
};