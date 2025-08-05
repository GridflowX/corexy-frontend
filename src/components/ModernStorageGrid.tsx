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
    // Adaptive canvas size based on bed dimensions and viewport
    const { width: vw } = windowSize;
    
    let baseSize;
    if (vw < 768) baseSize = 320; // Mobile
    else if (vw < 1024) baseSize = 400; // Tablet
    else baseSize = 480; // Desktop
    
    // For now, keep canvas size reasonable and consistent
    return baseSize;
  }, [windowSize]);

  const scale = useMemo(() => {
    return canvasSize / Math.max(config.storageWidth, config.storageLength);
  }, [config.storageWidth, config.storageLength, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw grid lines every 50 units (5cm)
    const gridSize = 50 * scale;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw storage boundary
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, config.storageWidth * scale, config.storageLength * scale);

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
        <div className="flex-1 flex flex-col">
          {/* Header with controls */}
          <div className="p-4 flex items-center justify-between border-b border-border">
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
          <div className="flex-1 flex justify-center items-center p-6 min-h-0">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="border border-border rounded-lg cursor-pointer bg-background shadow-sm"
                onClick={handleCanvasClick}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Boxes: <span className="font-medium text-foreground">{stats.boxesPacked}</span> / {stats.totalBoxes}
              </span>
              <span className="text-muted-foreground">
                Efficiency: <span className="font-medium text-foreground">{stats.spaceEfficiency}%</span>
              </span>
              <span className="text-muted-foreground">
                Container: {config.storageWidth}×{config.storageLength}mm
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};