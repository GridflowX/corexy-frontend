import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Check, X, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';

interface ConnectionSettingsProps {
  onIpChange: (ip: string) => void;
  isConnected: boolean;
  className?: string;
}

interface ConnectionState {
  ip: string;
  port: string;
  isValid: boolean;
  isTesting: boolean;
  lastTested: string | null;
}

const DEFAULT_IP = '192.168.1.100';
const DEFAULT_PORT = '7125';
const STORAGE_KEY = 'moonraker_connection';

export const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({
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
          lastTested: parsed.lastTested || null,
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
      lastTested: null,
    };
  });

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
      const now = new Date().toLocaleTimeString();

      setSettings(prev => ({
        ...prev,
        isValid,
        isTesting: false,
        lastTested: now,
      }));

      // Save to localStorage
      const connectionData = {
        ip: settings.ip,
        port: settings.port,
        lastTested: now,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connectionData));

      // Notify parent component
      if (isValid) {
        onIpChange(`${settings.ip}:${settings.port}`);
      }

    } catch (error) {
      setSettings(prev => ({
        ...prev,
        isValid: false,
        isTesting: false,
        lastTested: new Date().toLocaleTimeString(),
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

  // Auto-test connection when component mounts if we have saved settings
  useEffect(() => {
    if (settings.ip && settings.port && !settings.lastTested) {
      testConnection();
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            <span>Connection</span>
          </div>
          {isConnected ? (
            <Badge variant="default" className="bg-green-500 text-xs px-1 py-0">
              <Wifi className="w-3 h-3" />
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs px-1 py-0">
              <WifiOff className="w-3 h-3" />
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        {/* IP and Port in single row */}
        <div className="grid grid-cols-3 gap-1">
          <div className="col-span-2">
            <Input
              type="text"
              value={settings.ip}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="192.168.1.100"
              className={`text-xs h-7 ${
                settings.ip && !validateIp(settings.ip) 
                  ? 'border-red-300 focus:border-red-500' 
                  : ''
              }`}
            />
          </div>
          <div>
            <Input
              type="text"
              value={settings.port}
              onChange={(e) => handlePortChange(e.target.value)}
              placeholder="7125"
              className={`text-xs h-7 ${
                settings.port && !validatePort(settings.port)
                  ? 'border-red-300 focus:border-red-500'
                  : ''
              }`}
            />
          </div>
        </div>

        {/* Test Connection Button */}
        <Button
          onClick={testConnection}
          disabled={
            settings.isTesting || 
            !validateIp(settings.ip) || 
            !validatePort(settings.port)
          }
          size="sm"
          className="w-full h-6 text-xs"
        >
          {settings.isTesting ? (
            <>
              <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              Testing...
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 mr-1" />
              Test
            </>
          )}
        </Button>

        {/* Status indicator */}
        {settings.lastTested && (
          <div className="flex items-center justify-center text-xs">
            {settings.isValid ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <X className="w-3 h-3" />
                <span>Failed</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};