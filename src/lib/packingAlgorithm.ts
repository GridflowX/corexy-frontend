import { Box, Position, WarehouseConfig } from '../types/warehouse';

interface PackingResult {
  boxes: Box[];
  packingPaths: { [boxId: number]: Position[] };
  retrievalPaths: { [boxId: number]: Position[] };
  retrievalOrder: number[];
}

class PriorityQueue<T> {
  private items: { priority: number; item: T }[] = [];

  enqueue(item: T, priority: number) {
    this.items.push({ priority, item });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export class PackingAlgorithm {
  private config: WarehouseConfig;
  private step = 10; // Movement step size

  constructor(config: WarehouseConfig) {
    this.config = config;
  }

  generateRandomBoxes(): Box[] {
    const boxes: Box[] = [];
    
    for (let i = 0; i < this.config.numRectangles; i++) {
      const width = Math.floor(Math.random() * (this.config.maxSide - this.config.minSide)) + this.config.minSide;
      const height = Math.floor(Math.random() * (this.config.maxSide - this.config.minSide)) + this.config.minSide;
      
      boxes.push({
        id: i,
        width,
        height,
        x: 0,
        y: 0,
        isRotated: false,
        isPacked: false
      });
    }
    
    return boxes;
  }

  private heuristic(pos: Position, targetEdge: string, boxWidth: number, boxHeight: number): number {
    const { x, y } = pos;
    
    switch (targetEdge) {
      case 'left':
        return x;
      case 'right':
        return this.config.storageWidth - (x + boxWidth);
      case 'top':
        return y;
      case 'bottom':
        return this.config.storageLength - (y + boxHeight);
      default:
        return 0;
    }
  }

  private findRetrievalPath(targetBox: Box, currentPositions: Box[]): Position[] | null {
    const obstacles = currentPositions
      .filter(box => box.id !== targetBox.id && box.isPacked)
      .map(box => ({
        x: box.x - this.config.clearance,
        y: box.y - this.config.clearance,
        width: box.width + 2 * this.config.clearance,
        height: box.height + 2 * this.config.clearance
      }));

    // Find nearest edge
    const distances = {
      left: targetBox.x,
      right: this.config.storageWidth - (targetBox.x + targetBox.width),
      top: targetBox.y,
      bottom: this.config.storageLength - (targetBox.y + targetBox.height)
    };

    const nearestEdge = Object.keys(distances).reduce((a, b) => 
      distances[a as keyof typeof distances] < distances[b as keyof typeof distances] ? a : b
    );

    // A* pathfinding
    const openSet = new PriorityQueue<Position>();
    const visited = new Set<string>();
    const parent = new Map<string, Position>();
    const gScore = new Map<string, number>();

    const startPos: Position = { x: targetBox.x, y: targetBox.y };
    const startKey = `${startPos.x},${startPos.y}`;
    
    openSet.enqueue(startPos, this.heuristic(startPos, nearestEdge, targetBox.width, targetBox.height));
    gScore.set(startKey, 0);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;
      const currentKey = `${current.x},${current.y}`;

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      // Check if reached exit
      const isExit = (
        (nearestEdge === 'left' && current.x <= 0) ||
        (nearestEdge === 'right' && current.x + targetBox.width >= this.config.storageWidth) ||
        (nearestEdge === 'top' && current.y <= 0) ||
        (nearestEdge === 'bottom' && current.y + targetBox.height >= this.config.storageLength)
      );

      if (isExit) {
        // Reconstruct path
        const path: Position[] = [];
        let currentPos: Position | undefined = current;
        
        while (currentPos) {
          path.unshift(currentPos);
          const key = `${currentPos.x},${currentPos.y}`;
          currentPos = parent.get(key);
        }
        
        return path;
      }

      // Get direction priorities based on nearest edge
      let directions: Position[] = [];
      switch (nearestEdge) {
        case 'left':
          directions = [{ x: -this.step, y: 0 }, { x: 0, y: -this.step }, { x: 0, y: this.step }, { x: this.step, y: 0 }];
          break;
        case 'right':
          directions = [{ x: this.step, y: 0 }, { x: 0, y: -this.step }, { x: 0, y: this.step }, { x: -this.step, y: 0 }];
          break;
        case 'top':
          directions = [{ x: 0, y: -this.step }, { x: -this.step, y: 0 }, { x: this.step, y: 0 }, { x: 0, y: this.step }];
          break;
        case 'bottom':
          directions = [{ x: 0, y: this.step }, { x: -this.step, y: 0 }, { x: this.step, y: 0 }, { x: 0, y: -this.step }];
          break;
      }

      for (const dir of directions) {
        const neighbor: Position = { x: current.x + dir.x, y: current.y + dir.y };
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (visited.has(neighborKey)) continue;

        const tentativeGScore = (gScore.get(currentKey) || 0) + this.step;

        // Skip if outside bounds (allow exit beyond boundaries)
        const inBounds = neighbor.x >= -targetBox.width && neighbor.x <= this.config.storageWidth &&
                         neighbor.y >= -targetBox.height && neighbor.y <= this.config.storageLength;
        
        if (!inBounds) continue;

        // Check collision only if still within storage area
        let collision = false;
        if (neighbor.x >= 0 && neighbor.x <= this.config.storageWidth - targetBox.width &&
            neighbor.y >= 0 && neighbor.y <= this.config.storageLength - targetBox.height) {
          
          for (const obstacle of obstacles) {
            if (neighbor.x + targetBox.width > obstacle.x && neighbor.x < obstacle.x + obstacle.width &&
                neighbor.y + targetBox.height > obstacle.y && neighbor.y < obstacle.y + obstacle.height) {
              collision = true;
              break;
            }
          }
        }

        if (!collision) {
          const currentGScore = gScore.get(neighborKey) || Infinity;
          if (tentativeGScore < currentGScore) {
            parent.set(neighborKey, current);
            gScore.set(neighborKey, tentativeGScore);
            const fScore = tentativeGScore + this.heuristic(neighbor, nearestEdge, targetBox.width, targetBox.height);
            openSet.enqueue(neighbor, fScore);
          }
        }
      }
    }

    return null; // No path found
  }

  private findPackingPath(targetPos: Position, boxSize: { width: number; height: number }, existingBoxes: Box[]): Position[] {
    const startPos: Position = { x: 0, y: this.config.storageLength };
    
    const obstacles = existingBoxes
      .filter(box => box.isPacked)
      .map(box => ({
        x: box.x - this.config.clearance,
        y: box.y - this.config.clearance,
        width: box.width + 2 * this.config.clearance,
        height: box.height + 2 * this.config.clearance
      }));

    // Simple BFS for packing path
    const queue: Position[] = [startPos];
    const visited = new Set<string>();
    const parent = new Map<string, Position>();

    visited.add(`${startPos.x},${startPos.y}`);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === targetPos.x && current.y === targetPos.y) {
        // Reconstruct path
        const path: Position[] = [];
        let currentPos: Position | undefined = current;
        
        while (currentPos) {
          path.unshift(currentPos);
          const key = `${currentPos.x},${currentPos.y}`;
          currentPos = parent.get(key);
        }
        
        return path;
      }

      const directions = [
        { x: -this.step, y: 0 }, { x: this.step, y: 0 },
        { x: 0, y: -this.step }, { x: 0, y: this.step }
      ];

      for (const dir of directions) {
        const neighbor: Position = { x: current.x + dir.x, y: current.y + dir.y };
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (visited.has(neighborKey)) continue;

        // Check bounds
        if (neighbor.x < 0 || neighbor.x > this.config.storageWidth - boxSize.width ||
            neighbor.y < 0 || neighbor.y > this.config.storageLength - boxSize.height) {
          continue;
        }

        // Check collision
        let collision = false;
        for (const obstacle of obstacles) {
          if (neighbor.x + boxSize.width > obstacle.x && neighbor.x < obstacle.x + obstacle.width &&
              neighbor.y + boxSize.height > obstacle.y && neighbor.y < obstacle.y + obstacle.height) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          visited.add(neighborKey);
          parent.set(neighborKey, current);
          queue.push(neighbor);
        }
      }
    }

    // Fallback: direct path
    const path: Position[] = [];
    let px = startPos.x;
    let py = startPos.y;
    
    while (px !== targetPos.x || py !== targetPos.y) {
      if (px < targetPos.x) px = Math.min(px + this.step, targetPos.x);
      if (px > targetPos.x) px = Math.max(px - this.step, targetPos.x);
      if (py < targetPos.y) py = Math.min(py + this.step, targetPos.y);
      if (py > targetPos.y) py = Math.max(py - this.step, targetPos.y);
      
      path.push({ x: px, y: py });
    }
    
    return path;
  }

  private wouldBlockRetrieval(newPos: Position, newSize: { width: number; height: number }, 
                             currentBoxId: number, boxes: Box[], retrievalOrder: number[]): boolean {
    // Create temporary configuration with new box
    const tempBoxes = boxes.map(box => ({ ...box }));
    const targetBox = tempBoxes.find(box => box.id === currentBoxId);
    if (targetBox) {
      targetBox.x = newPos.x;
      targetBox.y = newPos.y;
      targetBox.width = newSize.width;
      targetBox.height = newSize.height;
      targetBox.isPacked = true;
    }

    // Check if any future retrieval would be blocked
    for (const boxId of retrievalOrder) {
      const box = tempBoxes.find(b => b.id === boxId);
      if (box && box.isPacked) {
        const path = this.findRetrievalPath(box, tempBoxes);
        if (!path) return true;
      }
    }

    return false;
  }

  packBoxes(boxes: Box[]): PackingResult {
    const result: PackingResult = {
      boxes: boxes.map(box => ({ ...box })),
      packingPaths: {},
      retrievalPaths: {},
      retrievalOrder: []
    };

    // Generate random retrieval order
    const retrievalOrder = Array.from({ length: boxes.length }, (_, i) => i);
    for (let i = retrievalOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [retrievalOrder[i], retrievalOrder[j]] = [retrievalOrder[j], retrievalOrder[i]];
    }
    result.retrievalOrder = retrievalOrder;

    const packedPositions: Position[] = [];

    // Pack each box
    for (let i = 0; i < result.boxes.length; i++) {
      const box = result.boxes[i];
      let placed = false;

      // Try both orientations
      const orientations = [
        { width: box.width, height: box.height, rotated: false },
        { width: box.height, height: box.width, rotated: true }
      ];

      for (const orientation of orientations) {
        if (placed) break;

        for (let y = 0; y <= this.config.storageLength - orientation.height && !placed; y += this.step) {
          for (let x = 0; x <= this.config.storageWidth - orientation.width && !placed; x += this.step) {
            const pos: Position = { x, y };

            // Check collision with existing boxes
            let collision = false;
            for (const existingPos of packedPositions) {
              const existingBox = result.boxes.find(b => b.isPacked && b.x === existingPos.x && b.y === existingPos.y);
              if (existingBox) {
                if (x < existingBox.x + existingBox.width + this.config.clearance &&
                    x + orientation.width + this.config.clearance > existingBox.x &&
                    y < existingBox.y + existingBox.height + this.config.clearance &&
                    y + orientation.height + this.config.clearance > existingBox.y) {
                  collision = true;
                  break;
                }
              }
            }

            if (!collision) {
              // Check if this position would block future retrievals
              if (!this.wouldBlockRetrieval(pos, orientation, box.id, result.boxes, retrievalOrder)) {
                box.x = x;
                box.y = y;
                box.width = orientation.width;
                box.height = orientation.height;
                box.isRotated = orientation.rotated;
                box.isPacked = true;
                
                packedPositions.push(pos);
                
                // Generate packing path
                const packingPath = this.findPackingPath(pos, orientation, result.boxes.slice(0, i));
                result.packingPaths[box.id] = packingPath;
                
                placed = true;
              }
            }
          }
        }
      }
    }

    // Generate retrieval paths for packed boxes
    for (const boxId of retrievalOrder) {
      const box = result.boxes.find(b => b.id === boxId);
      if (box && box.isPacked) {
        const path = this.findRetrievalPath(box, result.boxes);
        if (path) {
          result.retrievalPaths[boxId] = path;
        }
      }
    }

    return result;
  }

  calculateStorageDensity(packedBoxes: Box[]): number {
    const totalArea = this.config.storageWidth * this.config.storageLength;
    const occupiedArea = packedBoxes
      .filter(box => box.isPacked)
      .reduce((sum, box) => sum + (box.width * box.height), 0);
    
    return (occupiedArea / totalArea) * 100;
  }
}