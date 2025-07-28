import React, { useMemo, useRef, useEffect } from 'react';
import { Box, SimulationState } from '../types/warehouse';

interface StorageGridProps {
  boxes: Box[];
  config: {
    storageWidth: number;
    storageLength: number;
    clearance: number;
  };
  simulationState: SimulationState;
  onBoxClick?: (boxId: number) => void;
  className?: string;
}

export const StorageGrid: React.FC<StorageGridProps> = ({
  boxes,
  config,
  simulationState,
  onBoxClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = useMemo(() => {
    // Scale to fit canvas (500px for 500mm bed)
    return 500 / Math.max(config.storageWidth, config.storageLength);
  }, [config.storageWidth, config.storageLength]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
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

    // Draw current path if simulation is running
    if (simulationState.currentPath && simulationState.currentPath.length > 0) {
      ctx.strokeStyle = simulationState.mode === 'Placement' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const firstPoint = simulationState.currentPath[0];
      ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale);
      
      for (let i = 1; i < simulationState.currentPath.length; i++) {
        const point = simulationState.currentPath[i];
        ctx.lineTo(point.x * scale, point.y * scale);
      }
      ctx.stroke();
    }

    // Draw boxes
    boxes.forEach((box) => {
      if (!box.isPacked) return;

      const x = box.x * scale;
      const y = box.y * scale;
      const width = box.width * scale;
      const height = box.height * scale;

      // Box fill color
      let fillColor = '#93c5fd'; // Default blue
      if (box.isSelected) {
        fillColor = '#fbbf24'; // Yellow for selected
      } else if (simulationState.currentBox?.id === box.id) {
        fillColor = simulationState.mode === 'Placement' ? '#fb7185' : '#60a5fa'; // Orange for packing, blue for retrieval
      }

      // Draw box
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      // Draw box border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);

      // Draw box ID
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        box.id.toString(),
        x + width / 2,
        y + height / 2
      );
    });

    // Draw current moving box if simulation is running
    if (simulationState.currentBox && simulationState.currentPath) {
      const currentStep = Math.min(simulationState.step, simulationState.currentPath.length - 1);
      if (currentStep >= 0) {
        const currentPos = simulationState.currentPath[currentStep];
        const box = simulationState.currentBox;
        
        const x = currentPos.x * scale;
        const y = currentPos.y * scale;
        const width = box.width * scale;
        const height = box.height * scale;

        // Moving box style
        ctx.fillStyle = simulationState.mode === 'Placement' ? '#f97316' : '#eab308';
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = simulationState.mode === 'Placement' ? '#ea580c' : '#ca8a04';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Box ID
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
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

    // Find clicked box
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
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Packaging Grid - Coordinate System</h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="border border-gray-300 cursor-pointer"
          onClick={handleCanvasClick}
        />
        {/* Coordinate labels */}
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          Container: {config.storageWidth}×{config.storageLength} units
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>• Boxes placed: {boxes.filter(b => b.isPacked).length}</div>
        <div>• Max box size: {Math.max(...boxes.map(b => Math.max(b.width, b.height)))} units</div>
        <div>• Clearance: {config.clearance} units</div>
        <div>• Box size range: 50 - 199 units</div>
      </div>
    </div>
  );
};