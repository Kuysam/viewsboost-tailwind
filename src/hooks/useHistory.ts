import { useState, useCallback, useRef } from 'react';
import { produce } from 'immer';

export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  data: any;
}

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  actions: HistoryAction[];
  currentActionIndex: number;
}

export function useHistory<T>(initialState: T, maxHistory: number = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
    actions: [],
    currentActionIndex: -1,
  });

  const actionIdRef = useRef(0);

  const saveState = useCallback((
    newState: T,
    actionType: string,
    description: string,
    actionData?: any
  ) => {
    setHistory(prev => produce(prev, draft => {
      const action: HistoryAction = {
        id: `action-${++actionIdRef.current}`,
        type: actionType,
        description,
        timestamp: Date.now(),
        data: actionData,
      };

      // Add current state to past
      draft.past.push(draft.present);
      draft.present = newState;
      draft.future = []; // Clear future when new action is performed
      
      // Add action to history
      draft.actions.push(action);
      draft.currentActionIndex = draft.actions.length - 1;

      // Limit history size
      if (draft.past.length > maxHistory) {
        draft.past.shift();
        draft.actions.shift();
        draft.currentActionIndex = Math.max(0, draft.currentActionIndex - 1);
      }
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      return produce(prev, draft => {
        const previous = draft.past.pop()!;
        draft.future.unshift(draft.present);
        draft.present = previous;
        draft.currentActionIndex = Math.max(-1, draft.currentActionIndex - 1);
      });
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      return produce(prev, draft => {
        const next = draft.future.shift()!;
        draft.past.push(draft.present);
        draft.present = next;
        draft.currentActionIndex = Math.min(draft.actions.length - 1, draft.currentActionIndex + 1);
      });
    });
  }, []);

  const jumpToAction = useCallback((actionIndex: number) => {
    setHistory(prev => {
      if (actionIndex < -1 || actionIndex >= prev.actions.length) return prev;

      const currentIndex = prev.currentActionIndex;
      const targetIndex = actionIndex;

      if (currentIndex === targetIndex) return prev;

      return produce(prev, draft => {
        const stepsToMove = targetIndex - currentIndex;
        
        if (stepsToMove > 0) {
          // Moving forward (redo multiple steps)
          for (let i = 0; i < stepsToMove; i++) {
            if (draft.future.length > 0) {
              const next = draft.future.shift()!;
              draft.past.push(draft.present);
              draft.present = next;
            }
          }
        } else {
          // Moving backward (undo multiple steps)
          for (let i = 0; i < Math.abs(stepsToMove); i++) {
            if (draft.past.length > 0) {
              const previous = draft.past.pop()!;
              draft.future.unshift(draft.present);
              draft.present = previous;
            }
          }
        }

        draft.currentActionIndex = targetIndex;
      });
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
      actions: [],
      currentActionIndex: -1,
    }));
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const currentAction = history.actions[history.currentActionIndex];

  return {
    state: history.present,
    canUndo,
    canRedo,
    actions: history.actions,
    currentActionIndex: history.currentActionIndex,
    currentAction,
    saveState,
    undo,
    redo,
    jumpToAction,
    clearHistory,
  };
}