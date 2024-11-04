// src/utils/getAudioStream.ts
export const getAudioStream = async (deviceId: string): Promise<MediaStream> => {
  const constraints = {
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
    },
  }
  return await navigator.mediaDevices.getUserMedia(constraints)
}
