import {
  SpeechConfig,
  AudioConfig,
  SpeechRecognizer,
  ResultReason,
  Recognizer,
  CancellationReason,
  CancellationErrorCode
} from 'microsoft-cognitiveservices-speech-sdk';
import axios from 'axios';
import Cookies from 'universal-cookie';

interface TokenResponse {
  token: string;
  region: string;
}

export class AzureSpeechService {
  private recognizer: SpeechRecognizer | null = null;
  private cookies = new Cookies();

  private async getTokenOrRefresh(): Promise<TokenResponse> {
    const cookieToken = this.cookies.get('azure-token');

    if (cookieToken) {
      return cookieToken;
    }

    try {
      console.log('Requesting new token...');
      const response = await axios.get<TokenResponse>('/api/get-speech-token', {
        validateStatus: (status) => true, // Always resolve promise to see response
        timeout: 5000, // 5 second timeout
      });

      console.log('Token response status:', response.status);

      if (response.status !== 200) {
        console.error('Token response error:', response.data);
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const { token, region } = response.data;

      // Set cookie to expire in 9 minutes (token expires in 10)
      this.cookies.set('azure-token', { token, region }, { maxAge: 540 });

      return { token, region };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Token request failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          }
        });
      } else {
        console.error('Token request failed:', error);
      }
      throw error;
    }
  }

  private async createRecognizer(): Promise<SpeechRecognizer> {
    try {
      console.log('Creating recognizer...');
      const { token, region } = await this.getTokenOrRefresh();

      console.log('Configuring speech service with region:', region);
      const speechConfig = SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      // Disable punctuation and formatting for cleaner text matching
      speechConfig.setServiceProperty(
        "punctuation",
        "none",
        "ServicePropertyChannel.UriQueryParameter"
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
      this.recognizer.canceled = (_, event) => {
        if (event.reason === CancellationReason.Error) {
          console.error(`Speech recognition error: ${event.errorCode} - ${event.errorDetails}`);

          // If token expired, clear cookie and retry
          if (event.errorCode === CancellationErrorCode.AuthenticationFailure) {
            console.log('Authentication failure detected, clearing token and retrying...');
            this.cookies.remove('azure-token');
            this.stop().then(() => {
              this.start(onFinalResult, onInterimResult);
            });
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