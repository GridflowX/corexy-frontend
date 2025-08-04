import { API_CONFIG } from './constants';

interface MoonrakerMessage {
  jsonrpc: '2.0';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id?: number;
}

interface SubscriptionCallback {
  (data: any): void;
}

export class MoonrakerWebSocket {
  private ws: WebSocket | null = null;
  private host: string;
  private port: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions = new Map<string, Set<SubscriptionCallback>>();
  private requestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  
  constructor(host: string = API_CONFIG.DEFAULT_HOST, port: string = API_CONFIG.DEFAULT_PORT) {
    this.host = host;
    this.port = port;
  }

  // Update server connection
  setServer(host: string, port: string = '7125') {
    this.host = host;
    this.port = port;
    // Reconnect if currently connected
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  private getWebSocketUrl(): string {
    return API_CONFIG.getWebSocketUrl(this.host, this.port);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrl();
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('Moonraker WebSocket connected');
          this.reconnectAttempts = 0;
          this.subscribeToUpdates();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: MoonrakerMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse Moonraker message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('Moonraker WebSocket disconnected');
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('Moonraker WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };
        
      } catch (error) {
        console.error('Failed to connect to Moonraker WebSocket:', error);
        reject(error as Error);
      }
    });
  }

  private handleMessage(message: MoonrakerMessage) {
    // Handle responses to requests
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        request.reject(new Error(`Moonraker Error ${message.error.code}: ${message.error.message}`));
      } else {
        request.resolve(message.result);
      }
      return;
    }

    // Handle notifications/updates
    if (message.method && message.params) {
      this.handleNotification(message.method, message.params);
    }
  }

  private handleNotification(method: string, params: any) {
    const callbacks = this.subscriptions.get(method);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(params);
        } catch (error) {
          console.error(`Error in subscription callback for ${method}:`, error);
        }
      });
    }
  }

  private async subscribeToUpdates() {
    try {
      // Subscribe to printer state updates
      await this.request('printer.objects.subscribe', {
        objects: {
          print_stats: ['state', 'state_message'],
          toolhead: ['position', 'homed_axes'],
          motion_report: ['live_position'],
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to printer updates:', error);
    }
  }

  private request(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const id = this.requestId++;
      const message: MoonrakerMessage = {
        jsonrpc: '2.0',
        method,
        params,
        id,
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  // Public subscription methods
  onPrinterStateChange(callback: SubscriptionCallback): () => void {
    return this.subscribe('notify_status_update', callback);
  }

  onPositionUpdate(callback: SubscriptionCallback): () => void {
    return this.subscribe('notify_status_update', (data) => {
      if (data.toolhead?.position || data.motion_report?.live_position) {
        callback(data);
      }
    });
  }

  onGcodeResponse(callback: SubscriptionCallback): () => void {
    return this.subscribe('notify_gcode_response', callback);
  }

  private subscribe(event: string, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    
    this.subscriptions.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(event);
        }
      }
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to Moonraker (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max Moonraker reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.pendingRequests.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}