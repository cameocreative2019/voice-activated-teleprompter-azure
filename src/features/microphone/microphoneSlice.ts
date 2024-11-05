// src/features/microphone/microphoneSlice.ts
import { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "@/app/createAppSlice";

interface MicrophoneState {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  lastKnownDeviceName: string | null;
  manuallySelectedDeviceName: string | null;
  error: string | null;
}

const initialState: MicrophoneState = {
  devices: [],
  selectedDeviceId: null,
  lastKnownDeviceName: null,
  manuallySelectedDeviceName: null,
  error: null,
};

// Priority ordered keywords for external mic detection
const EXTERNAL_MIC_PRIORITIES = ['blackmagic', 'usb', 'yeti', 'rode', 'external'];

// Helper function to get priority of a device name (-1 if not external)
const getExternalPriority = (deviceName: string): number => {
  const lowerName = deviceName.toLowerCase();
  return EXTERNAL_MIC_PRIORITIES.findIndex(keyword => lowerName.includes(keyword));
};

// Helper function to determine if a device name indicates an external mic
const isExternalMic = (deviceName: string): boolean => {
  return getExternalPriority(deviceName) !== -1;
};

// Helper function to get preferred mic based on priorities
const getPreferredMic = (
  devices: MediaDeviceInfo[],
  manuallySelectedDeviceName: string | null
): MediaDeviceInfo | null => {
  // If we have a manually selected device name, prioritize that
  if (manuallySelectedDeviceName) {
    const matchingDevice = devices.find(d =>
      d.label === manuallySelectedDeviceName
    );
    if (matchingDevice) return matchingDevice;
  }

  // Sort devices by priority
  const externalDevices = devices
    .filter(d => isExternalMic(d.label))
    .sort((a, b) => {
      const priorityA = getExternalPriority(a.label);
      const priorityB = getExternalPriority(b.label);
      return priorityA - priorityB;
    });

  return externalDevices[0] || (devices.length > 0 ? devices[0] : null);
};

export const microphoneSlice = createAppSlice({
  name: "microphone",
  initialState,
  reducers: create => ({
    setDevices: create.reducer((state, action: PayloadAction<{
      devices: MediaDeviceInfo[];
      currentStatus: string;
    }>) => {
      const { devices, currentStatus } = action.payload;
      state.devices = devices;

      // Don't auto-switch during active recognition
      if (currentStatus === "started") return;

      // Only auto-select if no manual selection or current device is gone
      if (!state.manuallySelectedDeviceName ||
          !devices.find(d => d.label === state.lastKnownDeviceName)) {
        const preferredMic = getPreferredMic(devices, state.manuallySelectedDeviceName);
        if (preferredMic) {
          state.selectedDeviceId = preferredMic.deviceId;
          state.lastKnownDeviceName = preferredMic.label;
        } else {
          state.selectedDeviceId = null;
          state.lastKnownDeviceName = null;
        }
      }
    }),

    setSelectedDevice: create.reducer((state, action: PayloadAction<string>) => {
      const device = state.devices.find(d => d.deviceId === action.payload);
      if (device) {
        state.selectedDeviceId = action.payload;
        state.lastKnownDeviceName = device.label;
        state.manuallySelectedDeviceName = device.label;
        state.error = null;
      }
    }),

    clearManualSelection: create.reducer(state => {
      state.manuallySelectedDeviceName = null;
    }),

    setError: create.reducer((state, action: PayloadAction<string>) => {
      state.error = action.payload;
    }),

    clearError: create.reducer(state => {
      state.error = null;
    }),
  }),

  selectors: {
    selectDevices: (state: { devices: MediaDeviceInfo[] }) => state.devices,
    selectSelectedDeviceId: (state: { selectedDeviceId: string | null }) => state.selectedDeviceId,
    selectLastKnownDeviceName: (state: { lastKnownDeviceName: string | null }) => state.lastKnownDeviceName,
    selectManuallySelectedDeviceName: (state: { manuallySelectedDeviceName: string | null }) => state.manuallySelectedDeviceName,
    selectError: (state: { error: string | null }) => state.error,
    selectMicrophoneStatus: (state: MicrophoneState) => {
      if (state.devices.length === 0) return 'None';
      if (!state.selectedDeviceId) return 'Select Mic';

      const selectedDevice = state.devices.find(d =>
        d.deviceId === state.selectedDeviceId
      );

      if (!selectedDevice) return 'Select Mic';
      return isExternalMic(selectedDevice.label) ? 'External' : 'Internal';
    },
  },
});

export const {
  setDevices,
  setSelectedDevice,
  clearManualSelection,
  setError,
  clearError,
} = microphoneSlice.actions;

export const {
  selectDevices,
  selectSelectedDeviceId,
  selectLastKnownDeviceName,
  selectManuallySelectedDeviceName,
  selectError,
  selectMicrophoneStatus,
} = microphoneSlice.selectors;