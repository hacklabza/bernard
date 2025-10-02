import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for robot state
export interface RobotState {
  isConnected: boolean;
  isMoving: boolean;
  currentDirection: { x: number; y: number };
  cameraStreamUrl: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
}

// Action types for robot state management
export type RobotAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: RobotState['connectionStatus'] }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_MOVING'; payload: boolean }
  | { type: 'SET_DIRECTION'; payload: { x: number; y: number } }
  | { type: 'SET_CAMERA_URL'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: RobotState = {
  isConnected: false,
  isMoving: false,
  currentDirection: { x: 0, y: 0 },
  cameraStreamUrl: null,
  connectionStatus: 'disconnected',
  lastError: null,
};

// Reducer function
const robotReducer = (state: RobotState, action: RobotAction): RobotState => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        connectionStatus: action.payload ? 'connected' : 'disconnected',
        lastError: action.payload ? null : state.lastError
      };
    case 'SET_MOVING':
      return { ...state, isMoving: action.payload };
    case 'SET_DIRECTION':
      return { ...state, currentDirection: action.payload };
    case 'SET_CAMERA_URL':
      return { ...state, cameraStreamUrl: action.payload };
    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.payload,
        connectionStatus: action.payload ? 'error' : state.connectionStatus
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

// Context type
interface RobotContextType {
  state: RobotState;
  dispatch: React.Dispatch<RobotAction>;
  // Helper functions
  setConnected: (connected: boolean) => void;
  setMoving: (moving: boolean) => void;
  setDirection: (direction: { x: number; y: number }) => void;
  setCameraUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

// Create context
const RobotContext = createContext<RobotContextType | undefined>(undefined);

// Provider component
interface RobotProviderProps {
  children: ReactNode;
}

export const RobotProvider: React.FC<RobotProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(robotReducer, initialState);

  // Helper functions
  const setConnected = (connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  };

  const setMoving = (moving: boolean) => {
    dispatch({ type: 'SET_MOVING', payload: moving });
  };

  const setDirection = (direction: { x: number; y: number }) => {
    dispatch({ type: 'SET_DIRECTION', payload: direction });
  };

  const setCameraUrl = (url: string | null) => {
    dispatch({ type: 'SET_CAMERA_URL', payload: url });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: RobotContextType = {
    state,
    dispatch,
    setConnected,
    setMoving,
    setDirection,
    setCameraUrl,
    setError,
    resetState,
  };

  return (
    <RobotContext.Provider value={value}>
      {children}
    </RobotContext.Provider>
  );
};

// Custom hook to use the robot context
export const useRobot = () => {
  const context = useContext(RobotContext);
  if (context === undefined) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
};
