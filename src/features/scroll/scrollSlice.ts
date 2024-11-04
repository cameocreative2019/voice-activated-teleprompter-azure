import { createAppSlice } from "../../app/createAppSlice"

export interface ScrollSliceState {
  savedPosition: number
}

const initialState: ScrollSliceState = {
  savedPosition: 0
}

export const scrollSlice = createAppSlice({
  name: "scroll",
  initialState,
  reducers: create => ({
    setSavedPosition: create.reducer((state, action) => {
      state.savedPosition = action.payload
    })
  }),
  selectors: {
    selectSavedPosition: state => state.savedPosition
  }
})

export const { setSavedPosition } = scrollSlice.actions
export const { selectSavedPosition } = scrollSlice.selectors