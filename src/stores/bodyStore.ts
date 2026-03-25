// src/stores/bodyStore.ts
// Zustand store for body measurements, model params, and body type
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BodyMeasurements,
  BodyModelParams,
  BodyType,
  classifyBodyType,
  measurementsToModelParams,
} from '../services/bodyRatio.service';

const STORAGE_KEY = '@myfit:bodyMeasurements';

export const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  shoulders: 42,
  waist: 72,
  hips: 95,
  height: 165,
};

interface BodyState {
  measurements: BodyMeasurements;
  modelParams: BodyModelParams;
  bodyType: BodyType;
  hydrated: boolean;

  setMeasurement: (key: keyof BodyMeasurements, value: number) => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useBodyStore = create<BodyState>((set, get) => ({
  measurements: DEFAULT_MEASUREMENTS,
  modelParams: measurementsToModelParams(DEFAULT_MEASUREMENTS),
  bodyType: classifyBodyType(DEFAULT_MEASUREMENTS),
  hydrated: false,

  setMeasurement: (key, value) => {
    const next = { ...get().measurements, [key]: value };
    set({
      measurements: next,
      modelParams: measurementsToModelParams(next),
      bodyType: classifyBodyType(next),
    });
  },

  saveToStorage: async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(get().measurements),
      );
    } catch (err) {
      console.warn('[bodyStore] Failed to save:', err);
    }
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const m: BodyMeasurements = JSON.parse(raw);
        set({
          measurements: m,
          modelParams: measurementsToModelParams(m),
          bodyType: classifyBodyType(m),
        });
      }
    } catch (err) {
      console.warn('[bodyStore] Failed to load:', err);
    } finally {
      set({ hydrated: true });
    }
  },
}));
