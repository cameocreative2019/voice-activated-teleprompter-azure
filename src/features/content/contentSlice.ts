import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "../../app/createAppSlice"
import { type TextElement, tokenize } from "../../lib/word-tokenizer"
import { toggleQuickEdit, toggleEditor } from "../navbar/navbarSlice"

export interface ContentSliceState {
  rawText: string
  textElements: TextElement[]
  finalTranscriptIndex: number
  interimTranscriptIndex: number
}

// Try to get the saved content from localStorage, fall back to default if none exists
const getSavedContent = () => {
  const savedContent = localStorage.getItem('scriptContent')
  return savedContent || 'Click on the Editor button and paste your content here...'
}

const initialText = getSavedContent()

const initialState: ContentSliceState = {
  rawText: initialText,
  textElements: tokenize(initialText),
  finalTranscriptIndex: -1,
  interimTranscriptIndex: -1,
}

export const contentSlice = createAppSlice({
  name: "content",

  initialState,

  reducers: create => ({
    setContent: create.reducer((state, action: PayloadAction<string>) => {
      state.rawText = action.payload
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1
      // Save to localStorage whenever content changes
      localStorage.setItem('scriptContent', action.payload)
    }),

    clearContent: create.reducer(state => {
      const defaultText = 'Click on the Editor button and paste your content here...'
      state.rawText = defaultText
      state.textElements = tokenize(defaultText)
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1
      localStorage.removeItem('scriptContent')
    }),

    setFinalTranscriptIndex: create.reducer(
      (state, action: PayloadAction<number>) => {
        state.finalTranscriptIndex = action.payload
      },
    ),

    setInterimTranscriptIndex: create.reducer(
      (state, action: PayloadAction<number>) => {
        state.interimTranscriptIndex = action.payload
      },
    ),

    resetTranscriptionIndices: create.reducer(state => {
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1
    }),
  }),

  extraReducers: builder =>
    builder
      .addCase(toggleQuickEdit, state => {
        state.textElements = tokenize(state.rawText)
      })
      .addCase(toggleEditor, state => {
        state.textElements = tokenize(state.rawText)
      }),

  selectors: {
    selectRawText: state => state.rawText,
    selectTextElements: state => state.textElements,
    selectFinalTranscriptIndex: state => state.finalTranscriptIndex,
    selectInterimTranscriptIndex: state => state.interimTranscriptIndex,
  },
})

export const {
  setContent,
  clearContent, // Added clearContent to exports
  setFinalTranscriptIndex,
  setInterimTranscriptIndex,
  resetTranscriptionIndices,
} = contentSlice.actions

export const {
  selectRawText,
  selectTextElements,
  selectFinalTranscriptIndex,
  selectInterimTranscriptIndex,
} = contentSlice.selectors