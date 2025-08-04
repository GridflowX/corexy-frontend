import { WarehouseConfig, Box, Position } from '../types/warehouse';
import { API_CONFIG, MOONRAKER_ENDPOINTS, GCODE_COMMANDS, MOTION_CONFIG } from './constants';

interface MoonrakerResponse<T = any> {
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

interface PrinterStatus {
  state: string;
  state_message: string;
}

interface PrinterObjects {
  toolhead?: {
    position: [number, number, number, number];
    homed_axes: string;
  };
  motion_report?: {
    live_position: [number, number, number, number];
  };
  print_stats?: {
    state: string;
    state_message: string;
  };
}

export class MoonrakerAPI {
  private static currentHost: string | null = null;
  private static currentPort: string | null = null;

  // Set the current Moonraker server
  static setServer(host: string, port: string = '7125') {
    this.currentHost = host;
    this.currentPort = port;
  }

  // Get current server info
  static getCurrentServer(): { host: string; port: string } {
    return {
      host: this.currentHost || API_CONFIG.DEFAULT_HOST,
      port: this.currentPort || API_CONFIG.DEFAULT_PORT,
    };
  }

  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = API_CONFIG.getBaseUrl(this.currentHost || undefined, this.currentPort || undefined);
    const url = `${baseUrl}${endpoint}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MoonrakerResponse<T> = await response.json();
      
      if (data.error) {
        throw new Error(`Moonraker Error ${data.error.code}: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private static async sendGcode(command: string): Promise<string> {
    return this.request<string>(MOONRAKER_ENDPOINTS.GCODE_SCRIPT, {
      method: 'POST',
      body: JSON.stringify({ script: command }),
    });
  }

  // System Commands
  static async homeSystem(): Promise<string> {
    return this.sendGcode(GCODE_COMMANDS.HOME_ALL);
  }

  static async homeXY(): Promise<string> {
    return this.sendGcode(GCODE_COMMANDS.HOME_XY);
  }

  static async emergencyStop(): Promise<any> {
    return this.request(MOONRAKER_ENDPOINTS.EMERGENCY_STOP, {
      method: 'POST',
    });
  }

  // Motion Commands
  static async moveToPosition(x: number, y: number, z?: number, speed: number = MOTION_CONFIG.DEFAULT_SPEED): Promise<string> {
    const zMove = z !== undefined ? ` Z${z}` : '';
    const command = `${GCODE_COMMANDS.MOVE_LINEAR} X${x} Y${y}${zMove} F${speed}`;
    return this.sendGcode(command);
  }

  static async pickBox(x: number, y: number, boxId: number): Promise<string> {
    const commands = [
      // Move to position at travel height
      `${GCODE_COMMANDS.MOVE_LINEAR} X${x} Y${y} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.DEFAULT_SPEED}`,
      // Lower to pickup height
      `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.PICKUP_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
      // Engage pickup mechanism (placeholder - replace with actual command)
      'M400', // Wait for moves to complete
      // Raise to travel height
      `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
    ];
    
    return this.sendGcode(commands.join('\n'));
  }

  static async placeBox(x: number, y: number, boxId: number): Promise<string> {
    const commands = [
      // Move to position at travel height
      `${GCODE_COMMANDS.MOVE_LINEAR} X${x} Y${y} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.DEFAULT_SPEED}`,
      // Lower to place height
      `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.PICKUP_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
      // Release box (placeholder - replace with actual command)
      'M400', // Wait for moves to complete
      // Raise to travel height
      `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
    ];
    
    return this.sendGcode(commands.join('\n'));
  }

  // Status and Information
  static async getPrinterStatus(): Promise<PrinterStatus> {
    const objects = await this.request<PrinterObjects>(
      `${MOONRAKER_ENDPOINTS.PRINTER_OBJECTS}?print_stats`
    );
    
    return {
      state: objects.print_stats?.state || 'unknown',
      state_message: objects.print_stats?.state_message || '',
    };
  }

  static async getCurrentPosition(): Promise<Position & { z: number }> {
    const objects = await this.request<PrinterObjects>(
      `${MOONRAKER_ENDPOINTS.PRINTER_OBJECTS}?toolhead=position`
    );
    
    const position = objects.toolhead?.position || [0, 0, 0, 0];
    
    return {
      x: position[0],
      y: position[1],
      z: position[2],
    };
  }

  static async isHomed(): Promise<boolean> {
    const objects = await this.request<PrinterObjects>(
      `${MOONRAKER_ENDPOINTS.PRINTER_OBJECTS}?toolhead=homed_axes`
    );
    
    const homedAxes = objects.toolhead?.homed_axes || '';
    return homedAxes.includes('x') && homedAxes.includes('y');
  }

  // Sequence Execution
  static async executePacking(boxes: Box[]): Promise<string> {
    const packedBoxes = boxes.filter(box => box.isPacked);
    const commands: string[] = [
      GCODE_COMMANDS.SET_ABSOLUTE,
      GCODE_COMMANDS.HOME_XY,
    ];

    for (const box of packedBoxes) {
      // Add packing sequence for each box
      commands.push(
        `; Packing box ${box.id}`,
        `${GCODE_COMMANDS.MOVE_LINEAR} X${box.x} Y${box.y} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.DEFAULT_SPEED}`,
        `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.PICKUP_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
        'M400', // Wait for completion
        `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
      );
    }

    return this.sendGcode(commands.join('\n'));
  }

  static async executeRetrieval(boxIds: number[], boxes: Box[]): Promise<string> {
    const commands: string[] = [
      GCODE_COMMANDS.SET_ABSOLUTE,
    ];

    for (const boxId of boxIds) {
      const box = boxes.find(b => b.id === boxId);
      if (box && box.isPacked) {
        commands.push(
          `; Retrieving box ${boxId}`,
          `${GCODE_COMMANDS.MOVE_LINEAR} X${box.x} Y${box.y} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.DEFAULT_SPEED}`,
          `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.PICKUP_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
          'M400', // Wait for completion
          `${GCODE_COMMANDS.MOVE_LINEAR} Z${MOTION_CONFIG.TRAVEL_HEIGHT} F${MOTION_CONFIG.HOMING_SPEED}`,
        );
      }
    }

    return this.sendGcode(commands.join('\n'));
  }

  // Configuration Management
  static async getConfig(): Promise<WarehouseConfig> {
    // For now, return default config
    // In a real implementation, this could read from Klipper variables
    return {
      storageWidth: 500,
      storageLength: 500,
      numRectangles: 50,
      minSide: 50,
      maxSide: 50,
      clearance: 20,
    };
  }

  static async updateConfig(config: WarehouseConfig): Promise<{ status: string; config: WarehouseConfig }> {
    // Store configuration in Klipper variables (example)
    const commands = [
      `SET_GCODE_VARIABLE MACRO=WAREHOUSE_CONFIG VARIABLE=storage_width VALUE=${config.storageWidth}`,
      `SET_GCODE_VARIABLE MACRO=WAREHOUSE_CONFIG VARIABLE=storage_length VALUE=${config.storageLength}`,
      `SET_GCODE_VARIABLE MACRO=WAREHOUSE_CONFIG VARIABLE=clearance VALUE=${config.clearance}`,
    ];

    await this.sendGcode(commands.join('\n'));

    return {
      status: 'success',
      config,
    };
  }
}