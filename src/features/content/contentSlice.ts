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

export const PLACEHOLDER_TEXT = 'Click on the Editor button and paste your content here...'

// Try to get the saved content from localStorage
const getSavedContent = () => {
  const savedContent = localStorage.getItem('scriptContent')
  return savedContent || ''
}

const initialText = getSavedContent()

const initialState: ContentSliceState = {
  rawText: initialText,
  textElements: tokenize(initialText || ''),
  finalTranscriptIndex: -1,
  interimTranscriptIndex: -1
}

export const contentSlice = createAppSlice({
  name: "content",

  initialState,

  reducers: create => ({
    setContent: create.reducer((state, action: PayloadAction<string>) => {
      const newContent = action.payload
      state.rawText = newContent
      state.textElements = tokenize(newContent)
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1

      // Only save non-empty content to localStorage
      if (newContent.trim()) {
        localStorage.setItem('scriptContent', newContent)
      } else {
        localStorage.removeItem('scriptContent')
      }
    }),

    clearContent: create.reducer(state => {
      state.rawText = ''
      state.textElements = []
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
    selectHasContent: state => state.rawText.trim().length > 0
  },
})

export const {
  setContent,
  clearContent,
  setFinalTranscriptIndex,
  setInterimTranscriptIndex,
  resetTranscriptionIndices,
} = contentSlice.actions

export const {
  selectRawText,
  selectTextElements,
  selectFinalTranscriptIndex,
  selectInterimTranscriptIndex,
  selectHasContent
} = contentSlice.selectors