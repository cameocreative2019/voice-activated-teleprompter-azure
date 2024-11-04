import {
  AzureFunction,
  Context,
  HttpRequest
} from "@azure/functions"
import axios, { AxiosError } from "axios";

interface TokenResponse {
  token: string;
  region: string;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("Token request received");

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    context.log.error("Missing credentials");
    context.res = {
      status: 500,
      body: {
        error: "Speech key or region not configured"
      } as ErrorResponse
    };
    return;
  }

  try {
    const response = await axios.post(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      null,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    context.log("Token retrieved successfully");
    context.res = {
      body: {
        token: response.data,
        region: speechRegion
      } as TokenResponse
    };
  } catch (err) {
    const error = err as Error | AxiosError;
    let errorMessage = "Unknown error occurred";
    let errorDetails = {};

    if (axios.isAxiosError(error)) {
      errorMessage = "Failed to retrieve token";
      errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      };
      context.log.error("Token error:", errorDetails);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      context.log.error("Token error:", error.message);
    }

    context.res = {
      status: 500,
      body: {
        error: errorMessage,
        details: errorDetails
      } as ErrorResponse
    };
  }
}

export default httpTrigger;