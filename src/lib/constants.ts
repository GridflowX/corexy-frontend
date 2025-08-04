// API Configuration
export const API_CONFIG = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: '7125',
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
  
  // Dynamic URL getters
  getBaseUrl: (host?: string, port?: string): string => {
    const targetHost = host || API_CONFIG.DEFAULT_HOST;
    const targetPort = port || API_CONFIG.DEFAULT_PORT;
    return `http://${targetHost}:${targetPort}`;
  },
  
  getWebSocketUrl: (host?: string, port?: string): string => {
    const targetHost = host || API_CONFIG.DEFAULT_HOST;
    const targetPort = port || API_CONFIG.DEFAULT_PORT;
    return `ws://${targetHost}:${targetPort}/websocket`;
  },
} as const;

// Moonraker API Endpoints
export const MOONRAKER_ENDPOINTS = {
  GCODE_SCRIPT: '/printer/gcode/script',
  EMERGENCY_STOP: '/printer/emergency_stop',
  PRINTER_INFO: '/printer/info',
  PRINTER_OBJECTS: '/printer/objects/query',
  SERVER_INFO: '/server/info',
} as const;

// Warehouse Configuration Defaults
export const WAREHOUSE_DEFAULTS = {
  STORAGE_WIDTH: 400,  // 400mm (40cm) - matches printer config
  STORAGE_LENGTH: 400, // 400mm (40cm) - matches printer config
  NUM_RECTANGLES: 50,
  MIN_SIDE: 50,        // 5cm in mm
  MAX_SIDE: 50,        // 5cm in mm
  CLEARANCE: 20,       // 2cm in mm
} as const;

// Bed Size Limits
export const BED_SIZE_LIMITS = {
  MIN_WIDTH: 200,      // 20cm minimum
  MAX_WIDTH: 1000,     // 100cm maximum
  MIN_LENGTH: 200,     // 20cm minimum
  MAX_LENGTH: 1000,    // 100cm maximum
} as const;

// Motion Settings
export const MOTION_CONFIG = {
  DEFAULT_SPEED: 3000,      // mm/min
  HOMING_SPEED: 1500,       // mm/min
  PICKUP_HEIGHT: 5,         // mm above surface
  TRAVEL_HEIGHT: 20,        // mm for safe travel
  STEP_SIZE: 10,           // mm per pathfinding step
} as const;

// Animation Settings
export const ANIMATION_CONFIG = {
  STEP_INTERVAL: 100,       // ms between animation steps
  FAST_INTERVAL: 50,        // ms for fast animations
  SLOW_INTERVAL: 200,       // ms for slow animations
} as const;

// G-code Commands
export const GCODE_COMMANDS = {
  HOME_ALL: 'G28',
  HOME_XY: 'G28 X Y',
  MOVE_LINEAR: 'G1',
  SET_ABSOLUTE: 'G90',
  SET_RELATIVE: 'G91',
  EMERGENCY_STOP: 'M112',
  GET_POSITION: 'M114',
} as const;

// UI Constants
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,      // ms for input debouncing
  TOAST_DURATION: 4000,     // ms for toast notifications
  ANIMATION_DURATION: 200,  // ms for UI transitions
} as const;