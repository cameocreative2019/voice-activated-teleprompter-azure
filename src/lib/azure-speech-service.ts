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

export class AzureSpeechService {
  private recognizer: SpeechRecognizer | null = null;

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

      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
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
      this.recognizer = await this.createRecognizer();

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
          }
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

  async stop(): Promise<void> {
    if (this.recognizer) {
      try {
        console.log('Stopping speech recognition...');
        await this.recognizer.stopContinuousRecognitionAsync();
        this.recognizer = null;
        console.log('Speech recognition stopped successfully');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        throw error;
      }
    } else {
      console.log('No active recognizer to stop');
    }
  }
}

// Create singleton instance
export const azureSpeechService = new AzureSpeechService();