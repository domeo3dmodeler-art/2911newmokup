export interface ResponsiveSettings {
  desktop?: { 
    width?: string; 
    height?: string; 
    x?: string; 
    y?: string; 
    display?: string; 
  };
  tablet?: { 
    width?: string; 
    height?: string; 
    x?: string; 
    y?: string; 
    display?: string; 
  };
  mobile?: { 
    width?: string; 
    height?: string; 
    x?: string; 
    y?: string; 
    display?: string; 
  };
}

export interface AnimationSettings {
  type: string;
  duration: number;
  delay: number;
  iteration: string;
}

export interface ConstructorElement {
  id: string;
  type: string; // e.g., 'block', 'module', 'container', 'text', 'image'
  component: string; // React component name
  props: Record<string, any>; // Props passed to the component
  children?: ConstructorElement[];
  position: { x: number; y: number };
  size: { width: string; height: string };
  responsive: ResponsiveSettings;
  animations?: AnimationSettings[];
  styles?: Record<string, any>; // Tailwind or CSS styles
}

export interface ConstructorState {
  elements: ConstructorElement[];
  selectedElementId: string | null;
  history: ConstructorState[];
  historyPointer: number;
}

export interface ConstructorContextType {
  state: ConstructorState;
  addElement: (element: Partial<ConstructorElement>) => void;
  updateElement: (id: string, updates: Partial<ConstructorElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, position: { x: number; y: number }) => void;
  resizeElement: (id: string, size: { width: string; height: string }) => void;
  duplicateElement: (id: string) => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  loadState: (state: ConstructorState) => void;
  resetState: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedElement: ConstructorElement | null;
}
