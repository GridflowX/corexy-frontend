import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, XCircle, Wifi } from 'lucide-react';

interface DebugPanelProps {
  isConnected: boolean;
  currentServer: { host: string; port: string };
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isConnected,
  currentServer
}) => {
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
    details?: any;
  }>({ status: 'idle' });

  const testConnection = async () => {
    setTestResult({ status: 'testing' });
    
    try {
      const { MoonrakerAPI } = await import('../lib/moonraker-api');
      const result = await MoonrakerAPI.testConnection();
      
      if (result.success) {
        setTestResult({
          status: 'success',
          message: 'Connection successful!',
          details: result.info
        });
      } else {
        setTestResult({
          status: 'error',
          message: result.error || 'Unknown error',
          details: null
        });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: null
      });
    }
  };

  const testDirectAPI = () => {
    const url = `http://${currentServer.host}:${currentServer.port}/server/info`;
    window.open(url, '_blank');
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case 'testing':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Connection Debug
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Current Server */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Server</span>
            <span className="font-mono text-xs">{currentServer.host}:{currentServer.port}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Test Results */}
        {testResult.status !== 'idle' && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className="font-medium">
                {testResult.status === 'testing' ? 'Testing...' : 'Test Result'}
              </span>
            </div>
            
            {testResult.message && (
              <p className="text-sm text-muted-foreground">{testResult.message}</p>
            )}
            
            {testResult.details && (
              <div className="text-xs font-mono bg-background p-2 rounded border">
                <div>Klippy: {testResult.details.klippy_version || 'Unknown'}</div>
                <div>Moonraker: {testResult.details.moonraker_version || 'Unknown'}</div>
              </div>
            )}
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-2">
          <Button
            onClick={testConnection}
            size="sm"
            variant="outline"
            className="w-full"
            disabled={testResult.status === 'testing'}
          >
            {testResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button
            onClick={testDirectAPI}
            size="sm"
            variant="ghost"
            className="w-full text-xs"
          >
            Open API in Browser
          </Button>
        </div>

        {/* Troubleshooting Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Quick Fixes:</p>
          <ul className="space-y-1 ml-2">
            <li>• Check if Moonraker is running</li>
            <li>• Verify IP address is correct</li>
            <li>• Ensure port 7125 is open</li>
            <li>• Check CORS configuration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};