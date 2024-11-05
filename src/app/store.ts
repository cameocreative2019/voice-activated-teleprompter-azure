// src/app/store.ts
import type { Action, ThunkAction } from "@reduxjs/toolkit"
import { combineSlices, configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { navbarSlice } from "../features/navbar/navbarSlice"
import { contentSlice } from "../features/content/contentSlice"
import { scrollSlice } from "../features/scroll/scrollSlice"
import { tokenSlice } from "../features/token/tokenSlice"
import { microphoneSlice } from "../features/microphone/microphoneSlice"

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s
const rootReducer = combineSlices(
  navbarSlice,
  contentSlice,
  scrollSlice,
  tokenSlice,
  microphoneSlice
)

// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>

// The store setup is wrapped in `makeStore` to allow reuse
// when setting up tests that need the same store config
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
  })
  // configure listeners using the provided defaults
  setupListeners(store.dispatch)
  return store
}

export const store = makeStore()

// Infer the type of `store`
export type AppStore = typeof store

// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"]

export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>