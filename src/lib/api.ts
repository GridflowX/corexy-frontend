import { WarehouseConfig, Box, Position } from '../types/warehouse';

const API_BASE_URL = 'http://localhost:8000';

export class WarehouseAPI {
  static async getConfig(): Promise<WarehouseConfig> {
    const response = await fetch(`${API_BASE_URL}/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch configuration');
    }
    return response.json();
  }

  static async updateConfig(config: WarehouseConfig): Promise<{ status: string; config: WarehouseConfig }> {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update configuration');
    }
    
    return response.json();
  }

  static async moveToPosition(x: number, y: number, speed: number = 3000): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/motion/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'move',
        x,
        y,
        speed,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send move command');
    }
    
    return response.json();
  }

  static async pickBox(x: number, y: number, boxId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/motion/pick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'pick',
        x,
        y,
        box_id: boxId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send pick command');
    }
    
    return response.json();
  }

  static async placeBox(x: number, y: number, boxId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/motion/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'place',
        x,
        y,
        box_id: boxId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send place command');
    }
    
    return response.json();
  }

  static async homeSystem(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/motion/home`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to send home command');
    }
    
    return response.json();
  }

  static async emergencyStop(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/motion/emergency_stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to send emergency stop command');
    }
    
    return response.json();
  }

  static async executePacking(boxes: Box[]): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/execute_packing_sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(boxes),
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute packing sequence');
    }
    
    return response.json();
  }

  static async executeRetrieval(boxIds: number[], boxes: Box[]): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/execute_retrieval_sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ box_ids: boxIds, boxes }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute retrieval sequence');
    }
    
    return response.json();
  }

  static async getPrinterStatus(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/printer/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get printer status');
    }
    
    return response.json();
  }
}