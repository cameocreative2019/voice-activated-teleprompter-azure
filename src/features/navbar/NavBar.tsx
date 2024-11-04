import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { startTeleprompter, stopTeleprompter } from "../../app/thunks"
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
import SettingsControl from "./SettingsControl"

// Default values
const DEFAULT_VALUES = {
  fontSize: 115,
  margin: 350,
  opacity: 100,
  readLinePosition: 90,
}

export const NavBar = () => {
  const dispatch = useAppDispatch()
  const [shouldPulse, setShouldPulse] = useState(true)

  const status = useAppSelector(selectStatus)
  const showSettings = useAppSelector(selectShowSettings)
  const fontSize = useAppSelector(selectFontSize)
  const margin = useAppSelector(selectMargin)
  const opacity = useAppSelector(selectOpacity)
  const readLinePosition = useAppSelector(selectReadLinePosition)

  // Initialize pulse state from localStorage
  useEffect(() => {
    const hasClickedButton = localStorage.getItem('hasClickedButton')
    setShouldPulse(!hasClickedButton)
  }, [])

  // Helper function to handle any button click
  const handleAnyButtonClick = () => {
    if (shouldPulse) {
      setShouldPulse(false)
      localStorage.setItem('hasClickedButton', 'true')
    }
  }

  const handleClearAll = () => {
    // Clear all localStorage
    localStorage.clear()

    // Reset pulse state
    setShouldPulse(true)

    // Reset settings to defaults
    dispatch(resetToDefaults())

    // Clear content
    dispatch(clearContent())

    // Reset scroll position
    dispatch(setSavedPosition(0))

    // If in editor mode, exit it
    if (status === "editorMode") {
      dispatch(toggleEditor())
    }

    // If settings are open, close them
    if (showSettings) {
      dispatch(toggleSettings())
    }
  }

  // Helper function to determine if in any editing state
  const isEditing = status === "editing" || status === "editorMode";

  // Get the scroll position from the document
  const handleQuickEdit = () => {
    handleAnyButtonClick()
    const contentElement = document.querySelector('.content');
    if (contentElement) {
      const currentScroll = contentElement.scrollTop;
      dispatch(setSavedPosition(currentScroll));
    }
    dispatch(toggleQuickEdit());
    if (showSettings) dispatch(toggleSettings());
  };

  return (
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
            <button
              className={`button is-custom-start ${
                status === "stopped" || isEditing ? "is-start" : "is-stop"
              }`}
              disabled={isEditing}
              onClick={() => {
                handleAnyButtonClick()
                dispatch(status === "stopped" ? startTeleprompter() : stopTeleprompter())
                if (showSettings) dispatch(toggleSettings())
              }}
            >
              <span className="icon-text">
                <span className="icon is-small">
                  <i
                    className={`fa-solid ${
                      status === "stopped" || isEditing ? "fa-play" : "fa-stop"
                    }`}
                  />
                </span>
                <span>{status === "stopped" || isEditing ? "Start" : "Stop"}</span>
              </span>
            </button>

            {status !== "started" && (
              <>
                <button
                  className="button"
                  disabled={status !== "stopped"}
                  onClick={() => {
                    handleAnyButtonClick()
                    dispatch(resetTranscriptionIndices())
                  }}
                >
                  <span className="icon-text">
                    <span className="icon is-small">
                      <i className="fa-solid fa-arrows-rotate" />
                    </span>
                    <span>Restart</span>
                  </span>
                </button>

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
          <div
            className={`settings-controls ${showSettings && status === "stopped" ? "visible" : ""}`}
          >
            <SettingsControl
              label="Brightness"
              value={opacity}
              unit="%"
              min={0}
              max={100}
              step={10}
              onChange={(value) => dispatch(setOpacity(value))}
              defaultValue={DEFAULT_VALUES.opacity}
            />
            <SettingsControl
              label="Margin"
              value={margin}
              unit="px"
              min={0}
              max={500}
              step={10}
              onChange={(value) => dispatch(setMargin(value))}
              defaultValue={DEFAULT_VALUES.margin}
            />
            <SettingsControl
              label="Read Line"
              value={readLinePosition}
              unit="%"
              min={40}
              max={90}
              step={5}
              onChange={(value) => dispatch(setReadLinePosition(value))}
              defaultValue={DEFAULT_VALUES.readLinePosition}
            />
            <SettingsControl
  label="Font Size"
  value={fontSize}
  unit="px"
  min={10}
  max={200}
  step={5}
  onChange={(value) => dispatch(setFontSize(value))}
  defaultValue={DEFAULT_VALUES.fontSize}
/>

<div className="settings-spacer"></div>

<button
  className="button clear-storage-btn"
  onClick={handleClearAll}
  disabled={status !== "stopped"}
>
  <span className="icon-text">
    <span className="icon is-small">
      <i className="fa-solid fa-trash" />
    </span>
    <span>Reset Page</span>
  </span>
</button>
</div>

{status !== "started" && (
  <div className="navbar-item">
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
  </div>
)}
</div>
</div>
</nav>
  )
}