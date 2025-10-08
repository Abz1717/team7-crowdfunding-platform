"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Pitch, CreatePitchData, AIAnalysis } from "@/lib/types/pitch";

// Action types
type PitchAction =
  | { type: "SET_PITCHES"; payload: Pitch[] }
  | { type: "ADD_PITCH"; payload: Pitch }
  | { type: "UPDATE_PITCH"; payload: Pitch }
  | { type: "DELETE_PITCH"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

// State type
interface PitchState {
  pitches: Pitch[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PitchState = {
  pitches: [],
  loading: false,
  error: null,
};

// Reducer
function pitchReducer(state: PitchState, action: PitchAction): PitchState {
  switch (action.type) {
    case "SET_PITCHES":
      return { ...state, pitches: action.payload, loading: false, error: null };
    case "ADD_PITCH":
      return {
        ...state,
        pitches: [action.payload, ...state.pitches],
        loading: false,
        error: null,
      };
    case "UPDATE_PITCH":
      return {
        ...state,
        pitches: state.pitches.map((pitch) =>
          pitch.id === action.payload.id ? action.payload : pitch
        ),
        loading: false,
        error: null,
      };
    case "DELETE_PITCH":
      return {
        ...state,
        pitches: state.pitches.filter((pitch) => pitch.id !== action.payload),
        loading: false,
        error: null,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// Context type
interface PitchContextType extends PitchState {
  dispatch: React.Dispatch<PitchAction>;
}

  // pitchcontext remove now all pitch state is in swr hooks
