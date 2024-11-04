import type { AppThunk } from "./store"
import {
  start,
  stop,
  updateLastProgress,
  startTimeoutWarning,
  updateTimeoutCountdown,
  clearTimeoutState,
  resetTimeout
} from "../features/navbar/navbarSlice"
import {
  setFinalTranscriptIndex,
  setInterimTranscriptIndex,
} from "../features/content/contentSlice"
import { computeSpeechRecognitionTokenIndex } from "../lib/speech-matcher"
import { azureSpeechService } from "../lib/azure-speech-service"

let inactivityTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

const INACTIVITY_TIMEOUT = 15000; // 15 seconds
const WARNING_DURATION = 5; // 5 seconds

const clearTimers = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer as NodeJS.Timeout);
    countdownTimer = null;
  }
};

const startInactivityCheck = (dispatch: any, getState: any) => {
  clearTimers();

  inactivityTimer = setTimeout(() => {
    const state = getState();
    if (state.navbar.status === "started") {
      dispatch(startTimeoutWarning());

      let countdown = WARNING_DURATION;
      dispatch(updateTimeoutCountdown(countdown));

      countdownTimer = setInterval(() => {
        const currentState = getState();
        if (!currentState.navbar.showTimeoutWarning || currentState.navbar.status !== "started") {
          clearInterval(countdownTimer);
          countdownTimer = null;
          dispatch(clearTimeoutState());
          return;
        }

        countdown--;
        if (countdown <= 0) {
          dispatch(stopTeleprompter());
        } else {
          dispatch(updateTimeoutCountdown(countdown));
        }
      }, 1000);
    }
  }, INACTIVITY_TIMEOUT);
};

export const extendTimeout = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  if (state.navbar.status === "started") {
    dispatch(resetTimeout());
    clearTimers();
    startInactivityCheck(dispatch, getState);
  } else {
    dispatch(clearTimeoutState());
  }
};

export const startTeleprompter = (): AppThunk => (dispatch, getState) => {
  clearTimers();
  dispatch(clearTimeoutState());
  dispatch(start());
  dispatch(updateLastProgress());

  // Start Azure Speech Service
  azureSpeechService.start(
    // Final transcript handler
    (finalTranscript: string) => {
      const state = getState();
      // Remove status check to allow processing final results even when stopped
      const {
        textElements,
        finalTranscriptIndex: lastFinalTranscriptIndex,
        interimTranscriptIndex
      } = state.content;

      if (finalTranscript) {
        const finalTranscriptIndex = computeSpeechRecognitionTokenIndex(
          finalTranscript,
          textElements,
          lastFinalTranscriptIndex,
        );

        // Process any interim transcripts that should be finalized
        if (finalTranscriptIndex >= lastFinalTranscriptIndex) {
          // Use max of final and interim indices to ensure all interim text is finalized
          dispatch(setFinalTranscriptIndex(Math.max(finalTranscriptIndex, interimTranscriptIndex)));
          dispatch(updateLastProgress());
          clearTimers();
          // Only start inactivity check if still running
          if (state.navbar.status === "started") {
            startInactivityCheck(dispatch, getState);
          }
        }
      }
    },
    // Interim transcript handler
    (interimTranscript: string) => {
      const state = getState();
      // Keep status check for interim results to prevent new yellows after stopping
      if (state.navbar.status !== "started") return;

      const {
        textElements,
        finalTranscriptIndex: lastFinalTranscriptIndex,
      } = state.content;

      if (interimTranscript) {
        const interimTranscriptIndex = computeSpeechRecognitionTokenIndex(
          interimTranscript,
          textElements,
          lastFinalTranscriptIndex,
        );

        if (interimTranscriptIndex > lastFinalTranscriptIndex) {
          dispatch(setInterimTranscriptIndex(interimTranscriptIndex));
          dispatch(updateLastProgress());
          clearTimers();
          startInactivityCheck(dispatch, getState);
        }
      }
    }
  ).catch(error => {
    console.error('Failed to start teleprompter:', error);
    dispatch(stopTeleprompter());
  });

  // Start initial inactivity check
  startInactivityCheck(dispatch, getState);

  // Set up periodic check
  const periodicCheck = setInterval(() => {
    const state = getState();
    if (state.navbar.status !== "started") {
      clearInterval(periodicCheck);
      return;
    }

    const lastProgressTime = state.navbar.lastProgressTimestamp;
    const showingWarning = state.navbar.showTimeoutWarning;

    if (!showingWarning &&
        lastProgressTime &&
        Date.now() - lastProgressTime >= INACTIVITY_TIMEOUT &&
        !inactivityTimer) {
      startInactivityCheck(dispatch, getState);
    }
  }, 1000);

  // Return cleanup function
  return () => {
    clearInterval(periodicCheck);
    clearTimers();
  };
};

export const stopTeleprompter = (): AppThunk => async dispatch => {
  clearTimers();

  // Add delay to allow final results to be processed
  await new Promise(resolve => setTimeout(resolve, 500));

  await azureSpeechService.stop();
  dispatch(clearTimeoutState());
  dispatch(stop());
};