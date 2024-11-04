import { setInterimTranscriptIndex, setFinalTranscriptIndex } from '../features/content/contentSlice'
import { store } from '../app/store'

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = 'en-US'

let finalTranscript = ''
let interimTranscript = ''

recognition.onresult = (event: SpeechRecognitionEvent) => {
  const transcript = Array.from(event.results)
    .map(result => result[0])
    .map(result => result.transcript)
    .join('')

  if (event.results[0].isFinal) {
    finalTranscript += transcript
    store.dispatch(setFinalTranscriptIndex(finalTranscript.length))
    interimTranscript = ''
  } else {
    interimTranscript = transcript
    store.dispatch(setInterimTranscriptIndex(finalTranscript.length + interimTranscript.length))
  }
}

recognition.onerror = (event: SpeechRecognitionError) => {
  console.error('Speech recognition error detected: ', event.error)
}

export const startAudioProcessing = (stream: MediaStream) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(stream)
  recognition.start()
}

export const stopAudioProcessing = () => {
  recognition.stop()
}
