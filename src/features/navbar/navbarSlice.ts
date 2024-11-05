import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "../../app/createAppSlice"

interface SavedSettings {
  fontSize: number;
  margin: number;
  readLinePosition: number;
  microphoneDeviceId?: string | null;
  lastKnownMicName?: string | null;
}

export interface NavBarSliceState {
  status: "editing" | "editorMode" | "started" | "stopped";
  showSettings: boolean;
  horizontallyFlipped: boolean;
  verticallyFlipped: boolean;
  fontSize: number;
  margin: number;
  opacity: number;
  readLinePosition: number;
  savedSettings: SavedSettings | null;
  showTimeoutWarning: boolean;
  timeoutCountdown: number | null;
  lastProgressTimestamp: number | null;
  microphoneDeviceId: string | null;
  lastKnownMicName: string | null;
}

// Get settings from localStorage or use defaults
const getSavedSettings = () => {
  const savedSettings = localStorage.getItem('appSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    return {
      fontSize: settings.fontSize ?? 80,
      margin: settings.margin ?? 290,
      opacity: settings.opacity ?? 100,
      readLinePosition: settings.readLinePosition ?? 90,
      horizontallyFlipped: settings.horizontallyFlipped ?? false,
      verticallyFlipped: settings.verticallyFlipped ?? false,
      microphoneDeviceId: settings.microphoneDeviceId ?? null,
      lastKnownMicName: settings.lastKnownMicName ?? null
    }
  }
  return {
    fontSize: 80,
    margin: 290,
    opacity: 100,
    readLinePosition: 90,
    horizontallyFlipped: false,
    verticallyFlipped: false,
    microphoneDeviceId: null,
    lastKnownMicName: null
  }
}

const defaultSettings = getSavedSettings()

const initialState: NavBarSliceState = {
  status: "stopped",
  showSettings: false,
  horizontallyFlipped: defaultSettings.horizontallyFlipped,
  verticallyFlipped: defaultSettings.verticallyFlipped,
  fontSize: defaultSettings.fontSize,
  margin: defaultSettings.margin,
  opacity: defaultSettings.opacity,
  readLinePosition: defaultSettings.readLinePosition,
  savedSettings: null,
  showTimeoutWarning: false,
  timeoutCountdown: null,
  lastProgressTimestamp: null,
  microphoneDeviceId: defaultSettings.microphoneDeviceId,
  lastKnownMicName: defaultSettings.lastKnownMicName
}

// Helper function to save settings to localStorage
const saveSettingsToStorage = (state: NavBarSliceState) => {
  const settingsToSave = {
    fontSize: state.fontSize,
    margin: state.margin,
    opacity: state.opacity,
    readLinePosition: state.readLinePosition,
    horizontallyFlipped: state.horizontallyFlipped,
    verticallyFlipped: state.verticallyFlipped,
    microphoneDeviceId: state.microphoneDeviceId,
    lastKnownMicName: state.lastKnownMicName
  }
  localStorage.setItem('appSettings', JSON.stringify(settingsToSave))
}

export const navbarSlice = createAppSlice({
  name: "navbar",
  initialState,
  reducers: create => ({
    toggleQuickEdit: create.reducer(state => {
      if (state.status === "editing") {
        state.status = "stopped"
      } else {
        state.status = "editing"
      }
    }),

    toggleEditor: create.reducer(state => {
      if (state.status === "editorMode") {
        // Restore previous settings
        if (state.savedSettings) {
          state.fontSize = state.savedSettings.fontSize
          state.margin = state.savedSettings.margin
          state.readLinePosition = state.savedSettings.readLinePosition
          state.savedSettings = null
        }
        state.status = "stopped"
      } else {
        // Save current settings
        state.savedSettings = {
          fontSize: state.fontSize,
          margin: state.margin,
          readLinePosition: state.readLinePosition,
        }
        // Apply editor settings
        state.fontSize = 25
        state.margin = 370
        state.readLinePosition = 10
        state.status = "editorMode"
      }
      saveSettingsToStorage(state)
    }),

    toggleSettings: create.reducer(state => {
      state.showSettings = !state.showSettings
    }),

    start: create.reducer(state => {
      state.status = "started"
      state.showSettings = false
      state.lastProgressTimestamp = Date.now()
    }),

    stop: create.reducer(state => {
      state.status = "stopped"
      state.showTimeoutWarning = false
      state.timeoutCountdown = null
      state.lastProgressTimestamp = null
    }),

    flipHorizontally: create.reducer(state => {
      state.horizontallyFlipped = !state.horizontallyFlipped
      saveSettingsToStorage(state)
    }),

    flipVertically: create.reducer(state => {
      state.verticallyFlipped = !state.verticallyFlipped
      saveSettingsToStorage(state)
    }),

    setFontSize: create.reducer((state, action: PayloadAction<number>) => {
      state.fontSize = action.payload
      saveSettingsToStorage(state)
    }),

    setMargin: create.reducer((state, action: PayloadAction<number>) => {
      state.margin = action.payload
      saveSettingsToStorage(state)
    }),

    setOpacity: create.reducer((state, action: PayloadAction<number>) => {
      state.opacity = action.payload
      saveSettingsToStorage(state)
    }),

    setReadLinePosition: create.reducer((state, action: PayloadAction<number>) => {
      state.readLinePosition = action.payload
      saveSettingsToStorage(state)
    }),

    setMicrophone: create.reducer((state, action: PayloadAction<{ deviceId: string; deviceName: string }>) => {
      state.microphoneDeviceId = action.payload.deviceId;
      state.lastKnownMicName = action.payload.deviceName;
      saveSettingsToStorage(state)
    }),

    resetMicrophone: create.reducer(state => {
      state.microphoneDeviceId = null;
      state.lastKnownMicName = null;
      saveSettingsToStorage(state)
    }),

    resetToDefaults: create.reducer(state => {
      state.fontSize = 115
      state.margin = 350
      state.opacity = 100
      state.readLinePosition = 90
      state.horizontallyFlipped = false
      state.verticallyFlipped = false
      state.microphoneDeviceId = null
      state.lastKnownMicName = null
      localStorage.removeItem('appSettings')
    }),

    updateLastProgress: create.reducer((state) => {
      state.lastProgressTimestamp = Date.now()
      state.showTimeoutWarning = false
      state.timeoutCountdown = null
    }),

    startTimeoutWarning: create.reducer((state) => {
      state.showTimeoutWarning = true
      state.timeoutCountdown = 8
    }),

    updateTimeoutCountdown: create.reducer((state, action: PayloadAction<number>) => {
      state.timeoutCountdown = action.payload
    }),

    resetTimeout: create.reducer((state) => {
      state.showTimeoutWarning = false
      state.timeoutCountdown = null
      state.lastProgressTimestamp = Date.now()
    }),

    clearTimeoutState: create.reducer((state) => {
      state.showTimeoutWarning = false
      state.timeoutCountdown = null
      state.lastProgressTimestamp = null
    }),
  }),

  selectors: {
    selectStatus: state => state.status,
    selectShowSettings: state => state.showSettings,
    selectFontSize: state => state.fontSize,
    selectMargin: state => state.margin,
    selectHorizontallyFlipped: state => state.horizontallyFlipped,
    selectVerticallyFlipped: state => state.verticallyFlipped,
    selectOpacity: state => state.opacity,
    selectReadLinePosition: state => state.readLinePosition,
    selectShowTimeoutWarning: state => state.showTimeoutWarning,
    selectTimeoutCountdown: state => state.timeoutCountdown,
    selectLastProgressTimestamp: state => state.lastProgressTimestamp,
    selectMicrophoneDeviceId: state => state.microphoneDeviceId,
    selectLastKnownMicName: state => state.lastKnownMicName
  },
})

export const {
  toggleQuickEdit,
  toggleEditor,
  toggleSettings,
  start,
  stop,
  flipHorizontally,
  flipVertically,
  setFontSize,
  setMargin,
  setOpacity,
  setReadLinePosition,
  setMicrophone,
  resetMicrophone,
  resetToDefaults,
  updateLastProgress,
  startTimeoutWarning,
  updateTimeoutCountdown,
  resetTimeout,
  clearTimeoutState,
} = navbarSlice.actions

export const {
  selectStatus,
  selectShowSettings,
  selectFontSize,
  selectMargin,
  selectHorizontallyFlipped,
  selectVerticallyFlipped,
  selectOpacity,
  selectReadLinePosition,
  selectShowTimeoutWarning,
  selectTimeoutCountdown,
  selectLastProgressTimestamp,
  selectMicrophoneDeviceId,
  selectLastKnownMicName
} = navbarSlice.selectors