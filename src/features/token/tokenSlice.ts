import { createAppSlice } from "@/app/createAppSlice";
import type { PayloadAction } from "@reduxjs/toolkit";

interface TokenState {
  token: string;
  region: string;
  timestamp: number;
  expiresIn: number;
  error: string | null;
}

// Rest of the code remains exactly the same
interface TokenPayload {
  token: string;
  region: string;
  timestamp: number;
  expiresIn: number;
}

const initialState: TokenState = {
  token: "",
  region: "",
  timestamp: 0,
  expiresIn: 0,
  error: null
};

export const tokenSlice = createAppSlice({
  name: "token",
  initialState,
  reducers: create => ({
    setToken: create.reducer(
      (state, action: PayloadAction<TokenPayload>) => {
        state.token = action.payload.token;
        state.region = action.payload.region;
        state.timestamp = action.payload.timestamp;
        state.expiresIn = action.payload.expiresIn;
        state.error = null;
      }
    ),
    clearToken: create.reducer(state => {
      state.token = "";
      state.region = "";
      state.timestamp = 0;
      state.expiresIn = 0;
      state.error = null;
    }),
    setTokenError: create.reducer(
      (state, action: PayloadAction<string>) => {
        state.error = action.payload;
      }
    )
  }),
  selectors: {
    selectToken: state => state.token,
    selectRegion: state => state.region,
    selectTokenError: state => state.error,
    selectTokenExpiration: state => ({
      timestamp: state.timestamp,
      expiresIn: state.expiresIn
    })
  }
});

export const {
  setToken,
  clearToken,
  setTokenError
} = tokenSlice.actions;

export const {
  selectToken,
  selectRegion,
  selectTokenError,
  selectTokenExpiration
} = tokenSlice.selectors;