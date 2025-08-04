import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Home, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Box, SimulationState, PackingStats } from '../types/warehouse';

interface ModernStorageGridProps {
  boxes: Box[];
  config: {
    storageWidth: number;
    storageLength: number;
    clearance: number;
  };
  simulationState: SimulationState;
  stats: PackingStats;
  onBoxClick?: (boxId: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onHome: () => void;
  className?: string;
}

export const ModernStorageGrid: React.FC<ModernStorageGridProps> = ({
  boxes,
  config,
  simulationState,
  stats,
  onBoxClick,
  onPlay,
  onPause,
  onReset,
  onHome,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canvasSize = useMemo(() => {
    // Responsive canvas size - reduced to fit page better
    const { width: vw, height: vh } = windowSize;
    
    if (vw < 768) return 300; // Mobile
    if (vw < 1024) return 380; // Tablet
    if (vh < 800) return 400; // Short screens
    return 450; // Desktop - reduced to fit page
  }, [windowSize]);

  const scale = useMemo(() => {
    return canvasSize / Math.max(config.storageWidth, config.storageLength);
  }, [config.storageWidth, config.storageLength, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with light background to match reference
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dotted grid pattern like in reference images
    ctx.fillStyle = '#d1d5db';
    const dotSpacing = 20 * scale; // Spacing between dots
    const dotSize = 1; // Size of each dot
    
    // Create dotted grid pattern
    for (let x = dotSpacing; x < canvas.width; x += dotSpacing) {
      for (let y = dotSpacing; y < canvas.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw subtle border lines for major grid sections
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    const majorGridSize = 100 * scale;
    for (let x = majorGridSize; x < canvas.width; x += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = majorGridSize; y < canvas.height; y += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash pattern

    // Draw storage boundary with subtle border like in reference
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(2, 2, config.storageWidth * scale - 4, config.storageLength * scale - 4);
    ctx.setLineDash([]); // Reset dash pattern

    // Draw current path
    if (simulationState.currentPath && simulationState.currentPath.length > 0) {
      ctx.strokeStyle = simulationState.mode === 'Placement' ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      const firstPoint = simulationState.currentPath[0];
      ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale);
      
      for (let i = 1; i < simulationState.currentPath.length; i++) {
        const point = simulationState.currentPath[i];
        ctx.lineTo(point.x * scale, point.y * scale);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw boxes with modern styling
    boxes.forEach((box) => {
      if (!box.isPacked) return;

      const x = box.x * scale;
      const y = box.y * scale;
      const width = box.width * scale;
      const height = box.height * scale;

      // Updated colors to match reference design
      let fillColor = '#4b5563'; // Darker gray for better contrast like reference
      let borderColor = '#374151'; // Darker border
      let textColor = '#ffffff'; // White text
      
      if (box.isSelected) {
        fillColor = '#f59e0b'; // Amber-500
        borderColor = '#d97706'; // Amber-600
        textColor = '#ffffff';
      } else if (simulationState.currentBox?.id === box.id) {
        fillColor = simulationState.mode === 'Placement' ? '#3b82f6' : '#10b981'; // Blue-500 / Green-500
        borderColor = simulationState.mode === 'Placement' ? '#2563eb' : '#059669'; // Blue-600 / Green-600
        textColor = '#ffffff';
      }

      // Draw box with subtle shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(x + 1, y + 1, width, height);

      // Draw main box
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);

      // Draw box ID with better typography
      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px system-ui, -apple-system';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        box.id.toString(),
        x + width / 2,
        y + height / 2
      );
    });

    // Draw moving box animation
    if (simulationState.currentBox && simulationState.currentPath) {
      const currentStep = Math.min(simulationState.step, simulationState.currentPath.length - 1);
      if (currentStep >= 0) {
        const currentPos = simulationState.currentPath[currentStep];
        const box = simulationState.currentBox;
        
        const x = currentPos.x * scale;
        const y = currentPos.y * scale;
        const width = box.width * scale;
        const height = box.height * scale;

        // Animated moving box with glow effect
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        if (simulationState.mode === 'Placement') {
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#1d4ed8');
        } else {
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
        }

        // Glow effect
        ctx.shadowColor = simulationState.mode === 'Placement' ? '#3b82f6' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = simulationState.mode === 'Placement' ? '#1d4ed8' : '#059669';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Box ID
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px system-ui, -apple-system';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          box.id.toString(),
          x + width / 2,
          y + height / 2
        );
      }
    }
  }, [boxes, config, simulationState, scale]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onBoxClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const clickedBox = boxes.find(box => 
      box.isPacked &&
      x >= box.x && x <= box.x + box.width &&
      y >= box.y && y <= box.y + box.height
    );

    if (clickedBox) {
      onBoxClick(clickedBox.id);
    }
  };

  return (
    <div className={`relative h-full ${className}`}>
      {/* Main Canvas Container */}
      <Card className="relative overflow-hidden h-full flex flex-col">
        <div className="flex-1 flex flex-col relative">
          {/* Header with controls */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="neomorphic-icon w-8 h-8 flex items-center justify-center">
                  <Square className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold">Storage Grid</h2>
              </div>
              <Badge variant="muted">
{config.storageWidth}×{config.storageLength}mm
              </Badge>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={onHome} size="icon" variant="ghost">
                <Home className="w-4 h-4" />
              </Button>
              <Button 
                onClick={simulationState.isRunning ? onPause : onPlay} 
                size="icon" 
                variant="ghost"
              >
                {simulationState.isRunning ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button onClick={onReset} size="icon" variant="ghost">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex justify-center items-center relative">
            <div className="graph-grid-background absolute inset-8 rounded-lg"></div>
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className="border border-border rounded-lg cursor-pointer bg-background/80 shadow-sm relative z-10 max-w-full max-h-full"
              onClick={handleCanvasClick}
            />
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Card className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Step: <span className="font-medium text-foreground">{simulationState.step}</span> / {simulationState.totalSteps}
                    </span>
                    <span className="text-muted-foreground">
                      Mode: <Badge variant="muted" className="ml-1">{simulationState.mode}</Badge>
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${simulationState.totalSteps > 0 ? (simulationState.step / simulationState.totalSteps) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Boxes: <span className="font-medium text-foreground">{stats.boxesPacked}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Efficiency: <span className="font-medium text-foreground">{stats.spaceEfficiency}%</span>
                    </span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 border border-gray-700 rounded-sm"></div>
                    <span>Packed boxes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 border border-amber-600 rounded-sm"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded-sm"></div>
                    <span>In motion</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};