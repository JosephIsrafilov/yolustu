import { StateCreator } from 'zustand';
import { AppState, UiSlice } from '../types';

export const createUiSlice: StateCreator<
  AppState,
  [],
  [],
  UiSlice
> = (set) => ({
  language: 'az',
  setLanguage: (language) => set({ language }),
});
