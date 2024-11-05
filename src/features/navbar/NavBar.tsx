import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { startTeleprompter, stopTeleprompter } from "../../app/thunks"
import { StatusButton } from './StatusButton'
import { MicrophoneButton } from "../microphone/MicrophoneButton"
import { MicrophoneSelector } from "../microphone/MicrophoneSelector"
import { setDevices, setError } from "../microphone/microphoneSlice"
import { SettingsPanel } from "./SettingsPanel"
import {
  toggleQuickEdit,
  toggleEditor,
  toggleSettings,
  resetToDefaults,
  setFontSize,
  setMargin,
  setOpacity,
  setReadLinePosition,
  selectStatus,
  selectShowSettings,
  selectFontSize,
  selectMargin,
  selectOpacity,
  selectReadLinePosition,
} from "./navbarSlice"
import { resetTranscriptionIndices, clearContent } from "../content/contentSlice"
import { setSavedPosition } from "../scroll/scrollSlice"

// Default values remain the same
const DEFAULT_VALUES = {
  fontSize: 100,
  margin: 350,
  opacity: 100,
  readLinePosition: 90,
} as const

interface SettingValue {
  value: number;
  onChange: (value: number) => void;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
}

export const NavBar = () => {
  const dispatch = useAppDispatch()
  const [shouldPulse, setShouldPulse] = useState(true)
  const [showMicSelector, setShowMicSelector] = useState(false)

  const status = useAppSelector(selectStatus)
  const showSettings = useAppSelector(selectShowSettings)
  const fontSize = useAppSelector(selectFontSize)
  const margin = useAppSelector(selectMargin)
  const opacity = useAppSelector(selectOpacity)
  const readLinePosition = useAppSelector(selectReadLinePosition)

  // Handle microphone device enumeration and monitoring
  useEffect(() => {
    const updateDevices = async () => {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        dispatch(setDevices({
          devices: audioInputs,
          currentStatus: status
        }));
      } catch (error) {
        console.error('Microphone access error:', error);
        dispatch(setError('Microphone access denied'));
      }
    };

    // Initial device enumeration
    updateDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', updateDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, [dispatch, status]);

  useEffect(() => {
    const hasClickedButton = localStorage.getItem('hasClickedButton')
    setShouldPulse(!hasClickedButton)
  }, [])

  const handleAnyButtonClick = () => {
    if (shouldPulse) {
      setShouldPulse(false)
      localStorage.setItem('hasClickedButton', 'true')
    }
  }

  const handleClearAll = () => {
    localStorage.clear()
    setShouldPulse(true)
    dispatch(resetToDefaults())
    dispatch(clearContent())
    dispatch(setSavedPosition(0))
    if (status === "editorMode") {
      dispatch(toggleEditor())
    }
    if (showSettings) {
      dispatch(toggleSettings())
    }
  }

  const isEditing = status === "editing" || status === "editorMode"

  const handleQuickEdit = () => {
    handleAnyButtonClick()
    const contentElement = document.querySelector('.content')
    if (contentElement) {
      const currentScroll = contentElement.scrollTop
      dispatch(setSavedPosition(currentScroll))
    }
    dispatch(toggleQuickEdit())
    if (showSettings) dispatch(toggleSettings())
  }

  // Define settings controls configuration
  const settingsControls: SettingValue[] = [
    {
      label: "Brightness",
      value: opacity,
      unit: "%",
      min: 0,
      max: 100,
      step: 10,
      defaultValue: DEFAULT_VALUES.opacity,
      onChange: (value) => dispatch(setOpacity(value))
    },
    {
      label: "Margin",
      value: margin,
      unit: "px",
      min: 0,
      max: 500,
      step: 10,
      defaultValue: DEFAULT_VALUES.margin,
      onChange: (value) => dispatch(setMargin(value))
    },
    {
      label: "Read Line",
      value: readLinePosition,
      unit: "%",
      min: 40,
      max: 90,
      step: 5,
      defaultValue: DEFAULT_VALUES.readLinePosition,
      onChange: (value) => dispatch(setReadLinePosition(value))
    },
    {
      label: "Font Size",
      value: fontSize,
      unit: "px",
      min: 10,
      max: 200,
      step: 5,
      defaultValue: DEFAULT_VALUES.fontSize,
      onChange: (value) => dispatch(setFontSize(value))
    }
  ]

  return (
    <>
      <nav
        className={`navbar is-black has-text-light is-unselectable is-fixed-bottom is-floating-bottom ${
          status === "started" ? "started" : ""
        }`}
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-menu">
          <div className="navbar-start">
            <div className="buttons navbar-item">
              <StatusButton
                onClick={() => {
                  handleAnyButtonClick()
                  dispatch(status === "stopped" ? startTeleprompter() : stopTeleprompter())
                  if (showSettings) dispatch(toggleSettings())
                }}
                disabled={isEditing}
              />

              {status !== "started" && (
                <>
                  <button
                    className={`button ${status === "editing" ? "editing" : ""}`}
                    disabled={status === "editorMode"}
                    onClick={() => {
                      handleAnyButtonClick()
                      handleQuickEdit()
                    }}
                  >
                    <span className="icon-text">
                      <span className="icon is-small">
                        <i className="fa-solid fa-pencil" />
                      </span>
                      <span>Quick Edit</span>
                    </span>
                  </button>

                  <button
                    className={`button ${status === "editorMode" ? "editing" : ""} ${
                      shouldPulse ? "editor-pulse" : ""
                    }`}
                    disabled={status === "editing"}
                    onClick={() => {
                      handleAnyButtonClick()
                      dispatch(toggleEditor())
                      if (showSettings) dispatch(toggleSettings())
                    }}
                  >
                    <span className="icon-text">
                      <span className="icon is-small">
                        <i className="fa-solid fa-edit" />
                      </span>
                      <span>Editor</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="navbar-end">
            <div className="microphone-settings-group">
              {status !== "started" && (
                <>
                  <MicrophoneButton
                    onClick={() => {
                      handleAnyButtonClick();
                      setShowMicSelector(true);
                    }}
                  />
                  <button
                    className={`button ${showSettings ? "is-active" : ""}`}
                    onClick={() => dispatch(toggleSettings())}
                    disabled={status !== "stopped"}
                  >
                    <span className="icon-text">
                      <span className="icon is-small">
                        <i className="fa-solid fa-gear" />
                      </span>
                      <span>Settings</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <SettingsPanel
          isVisible={showSettings && status === "stopped"}
          settingsControls={settingsControls}
          onClearAll={handleClearAll}
        />
      </nav>

      <MicrophoneSelector
        isOpen={showMicSelector}
        onClose={() => setShowMicSelector(false)}
      />
    </>
  )
}