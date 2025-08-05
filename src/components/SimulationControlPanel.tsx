import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward,
  RotateCcw,
  Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface SimulationControlPanelProps {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  simulationMode: string;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  className?: string;
}

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  isRunning,
  currentStep,
  totalSteps,
  simulationMode,
  onPlay,
  onPause,
  onStepForward,
  onReset,
  className = ''
}) => {
  const progressValue = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Simulation
          </div>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "Running" : "Idle"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mode</span>
            <Badge variant="outline">{simulationMode}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{currentStep} / {totalSteps}</span>
          </div>
          
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={isRunning ? onPause : onPlay} 
              size="sm"
              variant={isRunning ? "destructive" : "default"}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button 
              onClick={onReset} 
              size="sm" 
              variant="outline"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <Button 
            onClick={onStepForward} 
            size="sm" 
            variant="outline"
            disabled={isRunning}
            className="w-full"
          >
            <SkipForward className="w-3 h-3 mr-1" />
            Step Forward
          </Button>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Box States
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded-sm"></div>
              <span>Packed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>In Motion</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};