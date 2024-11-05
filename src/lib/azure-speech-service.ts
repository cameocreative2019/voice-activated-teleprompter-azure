import {
  SpeechConfig,
  AudioConfig,
  SpeechRecognizer,
  ResultReason,
  Recognizer,
  CancellationReason,
  CancellationErrorCode,
  ServicePropertyChannel
} from 'microsoft-cognitiveservices-speech-sdk';
import { tokenManager } from '@/features/token/tokenManager';
import { store } from '@/app/store';
import { selectSelectedDeviceId } from '@/features/microphone/microphoneSlice';
import { stopTeleprompter } from '@/app/thunks';

export class AzureSpeechService {
  private recognizer: SpeechRecognizer | null = null;
  private currentDeviceId: string | null = null;
  private onFinalResultCallback: ((transcript: string) => void) | null = null;
  private onInterimResultCallback: ((transcript: string) => void) | null = null;

  private async createRecognizer(): Promise<SpeechRecognizer> {
    try {
      console.log('Creating recognizer...');
      const { token, region } = await tokenManager.getToken();

      console.log('Configuring speech service with region:', region);
      const speechConfig = SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      // Disable punctuation and formatting for cleaner text matching
      speechConfig.setServiceProperty(
        "punctuation",
        "none",
        ServicePropertyChannel.UriQueryParameter
      );

      // Get the selected device ID from Redux store
      const state = store.getState();
      const selectedDeviceId = selectSelectedDeviceId(state);
      this.currentDeviceId = selectedDeviceId;

      // Create audio config with selected device
      const audioConfig = selectedDeviceId
        ? AudioConfig.fromMicrophoneInput(selectedDeviceId)
        : AudioConfig.fromDefaultMicrophoneInput();

      console.log(`Creating recognizer with ${selectedDeviceId ? 'selected' : 'default'} microphone`);
      return new SpeechRecognizer(speechConfig, audioConfig);
    } catch (error) {
      console.error('Failed to create recognizer:', error);
      throw error;
    }
  }

  async start(
    onFinalResult: (transcript: string) => void,
    onInterimResult: (transcript: string) => void
  ): Promise<void> {
    try {
      console.log('Starting speech recognition...');

      // Store callbacks for potential reconnection
      this.onFinalResultCallback = onFinalResult;
      this.onInterimResultCallback = onInterimResult;

      this.recognizer = await this.createRecognizer();

      // Set up device change monitoring
      navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);

      // Handle interim results
      this.recognizer.recognizing = (_, event) => {
        if (event.result.reason === ResultReason.RecognizingSpeech) {
          const transcript = event.result.text.toLowerCase();
          console.log('Interim result:', transcript);
          onInterimResult(transcript);
        }
      };

      // Handle final results
      this.recognizer.recognized = (_, event) => {
        if (event.result.reason === ResultReason.RecognizedSpeech) {
          const transcript = event.result.text.toLowerCase();
          console.log('Final result:', transcript);
          onFinalResult(transcript);
        }
      };

      // Handle errors
      this.recognizer.canceled = async (_, event) => {
        if (event.reason === CancellationReason.Error) {
          console.error(`Speech recognition error: ${event.errorCode} - ${event.errorDetails}`);

          // If token expired, refresh token and retry
          if (event.errorCode === CancellationErrorCode.AuthenticationFailure) {
            console.log('Authentication failure detected, refreshing token and retrying...');
            await this.stop();
            await tokenManager.refreshToken();
            await this.start(onFinalResult, onInterimResult);
          } else if (event.errorCode === CancellationErrorCode.ConnectionFailure) {
            // Handle microphone connection failures
            console.error('Microphone connection failure detected');
            store.dispatch(stopTeleprompter());
          }
        } else if (event.reason === CancellationReason.EndOfStream) {
          console.log('End of stream detected');
          store.dispatch(stopTeleprompter());
        }
      };

      // Handle session started/stopped events
      this.recognizer.sessionStarted = (_) => {
        console.log('Speech recognition session started');
      };

      this.recognizer.sessionStopped = (_) => {
        console.log('Speech recognition session stopped');
      };

      console.log('Starting continuous recognition...');
      await this.recognizer.startContinuousRecognitionAsync();
      console.log('Continuous recognition started successfully');

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      throw error;
    }
  }

  private handleDeviceChange = async () => {
    // Get current device selection from Redux
    const state = store.getState();
    const selectedDeviceId = selectSelectedDeviceId(state);

    // If device changed while recognition is active
    if (this.recognizer && this.currentDeviceId !== selectedDeviceId) {
      console.log('Microphone changed, restarting recognition...');
      await this.stop();

      // Only attempt restart if we have the callbacks stored
      if (this.onFinalResultCallback && this.onInterimResultCallback) {
        try {
          await this.start(this.onFinalResultCallback, this.onInterimResultCallback);
        } catch (error) {
          console.error('Failed to restart recognition after device change:', error);
          store.dispatch(stopTeleprompter());
        }
      }
    }
  };

  async stop(): Promise<void> {
    if (this.recognizer) {
      try {
        console.log('Stopping speech recognition...');

        // Remove device change listener
        navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);

        // Clear callbacks
        this.onFinalResultCallback = null;
        this.onInterimResultCallback = null;

        await this.recognizer.stopContinuousRecognitionAsync();
        this.recognizer = null;
        this.currentDeviceId = null;
        console.log('Speech recognition stopped successfully');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        throw error;
      }
    } else {
      console.log('No active recognizer to stop');
    }
  }

  // Method to check if recognition is active
  isRecognizing(): boolean {
    return this.recognizer !== null;
  }

  // Method to get current device ID
  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }
}

// Export singleton instance
export const azureSpeechService = new AzureSpeechService();