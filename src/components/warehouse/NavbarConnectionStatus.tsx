import React, { useState } from 'react';
import { Wifi, WifiOff, Settings } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface NavbarConnectionStatusProps {
  onIpChange: (ip: string) => void;
  isConnected: boolean;
  className?: string;
}

interface ConnectionState {
  ip: string;
  port: string;
  isValid: boolean;
  isTesting: boolean;
}

const DEFAULT_IP = '192.168.1.100';
const DEFAULT_PORT = '7125';
const STORAGE_KEY = 'moonraker_connection';

export const NavbarConnectionStatus: React.FC<NavbarConnectionStatusProps> = ({
  onIpChange,
  isConnected,
  className
}) => {
  const [settings, setSettings] = useState<ConnectionState>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ip: parsed.ip || DEFAULT_IP,
          port: parsed.port || DEFAULT_PORT,
          isValid: false,
          isTesting: false,
        };
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
    return {
      ip: DEFAULT_IP,
      port: DEFAULT_PORT,
      isValid: false,
      isTesting: false,
    };
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Validate IP address format
  const validateIp = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Validate port number
  const validatePort = (port: string): boolean => {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
  };

  // Test connection to Moonraker
  const testConnection = async () => {
    if (!settings.ip || !settings.port) return;

    setSettings(prev => ({ ...prev, isTesting: true }));

    try {
      // Create AbortController for timeout compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${settings.ip}:${settings.port}/server/info`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isValid = response.ok;

      setSettings(prev => ({
        ...prev,
        isValid,
        isTesting: false,
      }));

      // Save to localStorage
      const connectionData = {
        ip: settings.ip,
        port: settings.port,
        lastTested: new Date().toLocaleTimeString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connectionData));

      // Notify parent component
      if (isValid) {
        onIpChange(`${settings.ip}:${settings.port}`);
        setIsDialogOpen(false);
      }

    } catch (error) {
      setSettings(prev => ({
        ...prev,
        isValid: false,
        isTesting: false,
      }));
    }
  };

  // Handle IP input change
  const handleIpChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      ip: value,
      isValid: false, // Reset validation when IP changes
    }));
  };

  // Handle port input change
  const handlePortChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      port: value,
      isValid: false, // Reset validation when port changes
    }));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status Badge */}
      {isConnected ? (
        <Badge variant="default" className="bg-green-500 flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          Connected
        </Badge>
      ) : (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="w-3 h-3" />
          Disconnected
        </Badge>
      )}

      {/* Current IP Display */}
      <span className="text-sm text-muted-foreground font-mono">
        {settings.ip}:{settings.port}
      </span>

      {/* Settings Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Moonraker Connection Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* IP Address Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Address</label>
              <Input
                type="text"
                value={settings.ip}
                onChange={(e) => handleIpChange(e.target.value)}
                placeholder="192.168.1.100"
                className={
                  settings.ip && !validateIp(settings.ip) 
                    ? 'border-red-300 focus:border-red-500' 
                    : ''
                }
              />
            </div>

            {/* Port Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Port</label>
              <Input
                type="text"
                value={settings.port}
                onChange={(e) => handlePortChange(e.target.value)}
                placeholder="7125"
                className={
                  settings.port && !validatePort(settings.port)
                    ? 'border-red-300 focus:border-red-500'
                    : ''
                }
              />
            </div>

            {/* Test Connection Button */}
            <Button
              onClick={testConnection}
              disabled={
                settings.isTesting || 
                !validateIp(settings.ip) || 
                !validatePort(settings.port)
              }
              className="w-full"
            >
              {settings.isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {/* Connection URL Preview */}
            {settings.ip && settings.port && validateIp(settings.ip) && validatePort(settings.port) && (
              <div className="p-3 bg-muted rounded text-sm">
                <span className="text-muted-foreground">Connection URL: </span>
                <span className="font-mono">http://{settings.ip}:{settings.port}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};