export interface Box {
  id: number;
  width: number;
  height: number;
  x: number;
  y: number;
  isRotated: boolean;
  isPacked: boolean;
  isSelected?: boolean;
}

export interface WarehouseConfig {
  storageWidth: number;
  storageLength: number;
  numRectangles: number;
  minSide: number;
  maxSide: number;
  clearance: number;
}

export interface PackingStats {
  boxesPacked: number;
  totalBoxes: number;
  spaceEfficiency: number;
  timeEfficiency: number;
  solvedIn: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Path {
  positions: Position[];
  boxId: number;
}

export enum SimulationMode {
  PLACEMENT = 'Placement',
  RETRIEVAL = 'Retrieval',
  IDLE = 'Idle'
}

export interface MovementCommand {
  id: string;
  type: 'move' | 'place' | 'pickup' | 'home';
  position: Position;
  boxId?: number;
  gcode: string;
  description: string;
}

export interface MovementQueue {
  commands: MovementCommand[];
  currentIndex: number;
  isExecuting: boolean;
}

export interface SimulationState {
  mode: SimulationMode;
  step: number;
  totalSteps: number;
  isRunning: boolean;
  currentBox?: Box;
  currentPath?: Position[];
  movementQueue?: MovementQueue;
}