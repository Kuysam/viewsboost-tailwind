import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export interface KeyboardShortcut {
  keys: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enableGlobalShortcuts?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enableGlobalShortcuts = true }: UseKeyboardShortcutsProps) {
  // Register individual shortcuts
  shortcuts.forEach(({ keys, action, enabled = true }) => {
    useHotkeys(
      keys,
      (event) => {
        event.preventDefault();
        if (enabled) {
          action();
        }
      },
      {
        enabled: enabled && enableGlobalShortcuts,
        enableOnContentEditable: false,
        enableOnFormTags: false,
      }
    );
  });

  // Global shortcuts that should work everywhere
  const globalShortcuts = [
    {
      keys: 'ctrl+z, cmd+z',
      description: 'Undo',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+y, cmd+shift+z',
      description: 'Redo',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+c, cmd+c',
      description: 'Copy',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+v, cmd+v',
      description: 'Paste',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+x, cmd+x',
      description: 'Cut',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'delete, backspace',
      description: 'Delete selected elements',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+a, cmd+a',
      description: 'Select all',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+d, cmd+d',
      description: 'Duplicate',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+g, cmd+g',
      description: 'Group elements',
      action: () => {
        // Will be handled by individual components
      },
    },
    {
      keys: 'ctrl+shift+g, cmd+shift+g',
      description: 'Ungroup elements',
      action: () => {
        // Will be handled by individual components
      },
    },
  ];

  return {
    globalShortcuts,
    shortcuts,
  };
}

// Predefined shortcut configurations for different editor modes
export const EDITOR_SHORTCUTS = {
  GENERAL: [
    { keys: 'ctrl+s, cmd+s', description: 'Save project', action: () => {} },
    { keys: 'ctrl+o, cmd+o', description: 'Open project', action: () => {} },
    { keys: 'ctrl+n, cmd+n', description: 'New project', action: () => {} },
    { keys: 'ctrl+e, cmd+e', description: 'Export', action: () => {} },
    { keys: 'ctrl+p, cmd+p', description: 'Print', action: () => {} },
    { keys: 'f11', description: 'Toggle fullscreen', action: () => {} },
    { keys: 'escape', description: 'Cancel current action', action: () => {} },
  ],

  CANVAS: [
    { keys: 'space', description: 'Pan canvas (hold)', action: () => {} },
    { keys: 'ctrl+plus, cmd+plus', description: 'Zoom in', action: () => {} },
    { keys: 'ctrl+minus, cmd+minus', description: 'Zoom out', action: () => {} },
    { keys: 'ctrl+0, cmd+0', description: 'Reset zoom', action: () => {} },
    { keys: 'ctrl+1, cmd+1', description: 'Fit to screen', action: () => {} },
    { keys: 'ctrl+2, cmd+2', description: 'Zoom to selection', action: () => {} },
    { keys: 'h', description: 'Pan tool', action: () => {} },
    { keys: 'v', description: 'Select tool', action: () => {} },
    { keys: 'r', description: 'Rectangle tool', action: () => {} },
    { keys: 'o', description: 'Ellipse tool', action: () => {} },
    { keys: 't', description: 'Text tool', action: () => {} },
  ],

  TEXT: [
    { keys: 'ctrl+b, cmd+b', description: 'Bold', action: () => {} },
    { keys: 'ctrl+i, cmd+i', description: 'Italic', action: () => {} },
    { keys: 'ctrl+u, cmd+u', description: 'Underline', action: () => {} },
    { keys: 'ctrl+shift+l, cmd+shift+l', description: 'Align left', action: () => {} },
    { keys: 'ctrl+shift+c, cmd+shift+c', description: 'Align center', action: () => {} },
    { keys: 'ctrl+shift+r, cmd+shift+r', description: 'Align right', action: () => {} },
    { keys: 'ctrl+shift+j, cmd+shift+j', description: 'Justify', action: () => {} },
    { keys: 'ctrl+shift+plus, cmd+shift+plus', description: 'Increase font size', action: () => {} },
    { keys: 'ctrl+shift+minus, cmd+shift+minus', description: 'Decrease font size', action: () => {} },
  ],

  LAYERS: [
    { keys: 'ctrl+shift+up, cmd+shift+up', description: 'Bring to front', action: () => {} },
    { keys: 'ctrl+up, cmd+up', description: 'Bring forward', action: () => {} },
    { keys: 'ctrl+down, cmd+down', description: 'Send backward', action: () => {} },
    { keys: 'ctrl+shift+down, cmd+shift+down', description: 'Send to back', action: () => {} },
    { keys: 'ctrl+l, cmd+l', description: 'Lock/unlock layer', action: () => {} },
    { keys: 'ctrl+shift+h, cmd+shift+h', description: 'Hide/show layer', action: () => {} },
  ],

  NAVIGATION: [
    { keys: 'up', description: 'Move up', action: () => {} },
    { keys: 'down', description: 'Move down', action: () => {} },
    { keys: 'left', description: 'Move left', action: () => {} },
    { keys: 'right', description: 'Move right', action: () => {} },
    { keys: 'shift+up', description: 'Move up (large)', action: () => {} },
    { keys: 'shift+down', description: 'Move down (large)', action: () => {} },
    { keys: 'shift+left', description: 'Move left (large)', action: () => {} },
    { keys: 'shift+right', description: 'Move right (large)', action: () => {} },
    { keys: 'tab', description: 'Select next element', action: () => {} },
    { keys: 'shift+tab', description: 'Select previous element', action: () => {} },
  ],

  VIDEO: [
    { keys: 'spacebar', description: 'Play/pause', action: () => {} },
    { keys: 'j', description: 'Rewind', action: () => {} },
    { keys: 'l', description: 'Fast forward', action: () => {} },
    { keys: 'k', description: 'Play/pause', action: () => {} },
    { keys: 'left', description: 'Previous frame', action: () => {} },
    { keys: 'right', description: 'Next frame', action: () => {} },
    { keys: 'home', description: 'Go to start', action: () => {} },
    { keys: 'end', description: 'Go to end', action: () => {} },
    { keys: 'i', description: 'Mark in point', action: () => {} },
    { keys: 'o', description: 'Mark out point', action: () => {} },
    { keys: 'ctrl+k, cmd+k', description: 'Split clip', action: () => {} },
  ],
};

export function getShortcutDisplay(keys: string): string {
  // Convert hotkey format to display format
  return keys
    .split(',')[0] // Take first variant
    .replace(/ctrl/g, '⌘')
    .replace(/cmd/g, '⌘')
    .replace(/shift/g, '⇧')
    .replace(/alt/g, '⌥')
    .replace(/plus/g, '+')
    .replace(/minus/g, '-')
    .replace(/\+/g, ' + ')
    .split(' ')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(' ');
}

// Hook for displaying shortcut help
export function useShortcutHelp() {
  const getAllShortcuts = useCallback(() => {
    const allShortcuts = [
      ...EDITOR_SHORTCUTS.GENERAL,
      ...EDITOR_SHORTCUTS.CANVAS,
      ...EDITOR_SHORTCUTS.TEXT,
      ...EDITOR_SHORTCUTS.LAYERS,
      ...EDITOR_SHORTCUTS.NAVIGATION,
      ...EDITOR_SHORTCUTS.VIDEO,
    ];

    return allShortcuts.map(shortcut => ({
      ...shortcut,
      displayKeys: getShortcutDisplay(shortcut.keys),
    }));
  }, []);

  const getShortcutsByCategory = useCallback(() => {
    return {
      General: EDITOR_SHORTCUTS.GENERAL.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
      Canvas: EDITOR_SHORTCUTS.CANVAS.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
      Text: EDITOR_SHORTCUTS.TEXT.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
      Layers: EDITOR_SHORTCUTS.LAYERS.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
      Navigation: EDITOR_SHORTCUTS.NAVIGATION.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
      Video: EDITOR_SHORTCUTS.VIDEO.map(s => ({ ...s, displayKeys: getShortcutDisplay(s.keys) })),
    };
  }, []);

  return {
    getAllShortcuts,
    getShortcutsByCategory,
  };
}