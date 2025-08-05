import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Square,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface MachineControlPanelProps {
  isConnected: boolean;
  isRunning: boolean;
  onDirectionalMove: (direction: 'up' | 'down' | 'left' | 'right', distance?: number) => void;
  onHome: () => void;
  onStop: () => void;
  onTestConnection?: () => void;
  currentServer?: { host: string; port: string };
  className?: string;
}

export const MachineControlPanel: React.FC<MachineControlPanelProps> = ({
  isConnected,
  isRunning,
  onDirectionalMove,
  onHome,
  onStop,
  onTestConnection,
  currentServer = { host: 'localhost', port: '7125' },
  className = ''
}) => {
  const [moveDistance, setMoveDistance] = useState(10); // Default 10mm
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDirectionalClick = async (direction: 'up' | 'down' | 'left' | 'right') => {
    if (isMoving) return; // Prevent multiple simultaneous movements
    
    setError(null); // Clear previous errors
    setIsMoving(true);
    try {
      await onDirectionalMove(direction, moveDistance);
    } catch (error) {
      console.error('Movement failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Movement failed';
      setError(errorMessage);
    } finally {
      // Add a small delay to prevent rapid clicking
      setTimeout(() => setIsMoving(false), 500);
    }
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Machine Control
          </CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Manual Controls */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Manual Control
          </h4>
          
          {/* Distance Selection */}
          <div className="flex gap-1">
            {[1, 5, 10, 25].map((distance) => (
              <Button
                key={distance}
                onClick={() => {
                  setMoveDistance(distance);
                  setError(null); // Clear errors when distance changes
                }}
                size="sm"
                variant={moveDistance === distance ? "default" : "outline"}
                className="flex-1 text-xs"
                disabled={isMoving}
              >
                {distance}mm
              </Button>
            ))}
          </div>
          
          {/* Movement Status */}
          {isMoving && (
            <div className="text-xs text-muted-foreground text-center py-1">
              Executing movement...
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="text-xs text-red-500 text-center py-1 bg-red-50 rounded px-2">
              {error}
            </div>
          )}

          {/* Directional Controls */}
          <div className="grid grid-cols-3 gap-1 mx-auto w-fit">
            <div></div>
            <Button
              onClick={() => handleDirectionalClick('up')}
              size="sm"
              variant={isMoving ? "secondary" : "outline"}
              disabled={!isConnected || isRunning || isMoving}
              className="aspect-square p-0"
              title={`Move up ${moveDistance}mm`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <div></div>
            
            <Button
              onClick={() => handleDirectionalClick('left')}
              size="sm"
              variant={isMoving ? "secondary" : "outline"}
              disabled={!isConnected || isRunning || isMoving}
              className="aspect-square p-0"
              title={`Move left ${moveDistance}mm`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={onHome}
              size="sm"
              variant="outline"
              disabled={!isConnected || isRunning || isMoving}
              className="aspect-square p-0"
              title="Home All Axes"
            >
              <Home className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => handleDirectionalClick('right')}
              size="sm"
              variant={isMoving ? "secondary" : "outline"}
              disabled={!isConnected || isRunning || isMoving}
              className="aspect-square p-0"
              title={`Move right ${moveDistance}mm`}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <div></div>
            <Button
              onClick={() => handleDirectionalClick('down')}
              size="sm"
              variant={isMoving ? "secondary" : "outline"}
              disabled={!isConnected || isRunning || isMoving}
              className="aspect-square p-0"
              title={`Move down ${moveDistance}mm`}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <div></div>
          </div>

          {/* Test Connection */}
          {onTestConnection && (
            <Button
              onClick={onTestConnection}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Test Connection
            </Button>
          )}

          {/* Emergency Stop */}
          <Button
            onClick={onStop}
            size="sm"
            variant="destructive"
            className="w-full"
            disabled={!isConnected}
          >
            <Square className="w-3 h-3 mr-1" />
            Emergency Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};