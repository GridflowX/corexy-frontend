import { Position, MovementCommand } from '../types/warehouse';

export class GcodeGenerator {
  private static feedRate = 3000; // mm/min
  private static safeHeight = 10; // mm above the bed for travel moves

  /**
   * Generate G-code for moving to a position
   */
  static moveToPosition(position: Position, safeMove: boolean = true): string {
    const commands: string[] = [];
    
    if (safeMove) {
      // First move up to safe height
      commands.push(`G1 Z${this.safeHeight} F${this.feedRate}`);
      // Then move to XY position
      commands.push(`G1 X${position.x} Y${position.y} F${this.feedRate}`);
      // Finally move down to bed level
      commands.push(`G1 Z0 F${this.feedRate}`);
    } else {
      // Direct move to position
      commands.push(`G1 X${position.x} Y${position.y} F${this.feedRate}`);
    }
    
    return commands.join('\n');
  }

  /**
   * Generate G-code for picking up a box
   */
  static pickupBox(position: Position): string {
    const commands: string[] = [];
    
    // Move to position safely
    commands.push(this.moveToPosition(position, true));
    // Engage gripper/suction (custom command)
    commands.push('M106 P0 S255 ; Engage suction');
    // Small delay for suction to engage
    commands.push('G4 P500 ; Wait 500ms');
    // Move up slightly
    commands.push(`G1 Z${this.safeHeight} F${this.feedRate}`);
    
    return commands.join('\n');
  }

  /**
   * Generate G-code for placing a box
   */
  static placeBox(position: Position): string {
    const commands: string[] = [];
    
    // Move to position at safe height
    commands.push(`G1 X${position.x} Y${position.y} Z${this.safeHeight} F${this.feedRate}`);
    // Move down to place
    commands.push(`G1 Z0 F${this.feedRate}`);
    // Disengage gripper/suction
    commands.push('M106 P0 S0 ; Disengage suction');
    // Small delay
    commands.push('G4 P200 ; Wait 200ms');
    // Move up to safe height
    commands.push(`G1 Z${this.safeHeight} F${this.feedRate}`);
    
    return commands.join('\n');
  }

  /**
   * Generate G-code for homing
   */
  static homeAll(): string {
    return 'G28 ; Home all axes';
  }

  /**
   * Generate G-code for homing specific axes
   */
  static homeAxis(axis: 'X' | 'Y' | 'Z' | 'XY' | 'XYZ'): string {
    return `G28 ${axis} ; Home ${axis} axis`;
  }

  /**
   * Generate G-code for Z-axis movement
   */
  static moveZ(distance: number, relative: boolean = true): string {
    const commands: string[] = [];
    const feedRate = Math.abs(distance) <= 5 ? 1000 : 2000;
    
    commands.push('G4 P100 ; Safety delay');
    
    if (relative) {
      commands.push('G91 ; Relative positioning');
      commands.push(`G1 Z${distance} F${feedRate} ; Move Z ${distance}mm`);
      commands.push('G90 ; Absolute positioning');
    } else {
      commands.push(`G1 Z${distance} F${feedRate} ; Move Z to ${distance}mm`);
    }
    
    commands.push('G4 P50 ; Post-movement delay');
    
    return commands.join('\n');
  }

  /**
   * Generate G-code for setting feed rate
   */
  static setFeedRate(feedRate: number): string {
    return `M220 S${feedRate} ; Set feed rate to ${feedRate}%`;
  }

  /**
   * Generate G-code for manual directional move
   */
  static manualMove(direction: 'up' | 'down' | 'left' | 'right', distance: number): string {
    const commands: string[] = [];
    
    // Adjust feed rate based on distance for better control
    const feedRate = distance <= 5 ? 1500 : distance <= 10 ? 2000 : 3000;
    
    // Add a small delay before movement for safety
    commands.push('G4 P100 ; Safety delay');
    
    switch (direction) {
      case 'up':
        commands.push(`G91 ; Relative positioning`);
        commands.push(`G1 Y${distance} F${feedRate} ; Move up ${distance}mm`);
        commands.push(`G90 ; Absolute positioning`);
        break;
      case 'down':
        commands.push(`G91 ; Relative positioning`);
        commands.push(`G1 Y-${distance} F${feedRate} ; Move down ${distance}mm`);
        commands.push(`G90 ; Absolute positioning`);
        break;
      case 'left':
        commands.push(`G91 ; Relative positioning`);
        commands.push(`G1 X-${distance} F${feedRate} ; Move left ${distance}mm`);
        commands.push(`G90 ; Absolute positioning`);
        break;
      case 'right':
        commands.push(`G91 ; Relative positioning`);
        commands.push(`G1 X${distance} F${feedRate} ; Move right ${distance}mm`);
        commands.push(`G90 ; Absolute positioning`);
        break;
    }
    
    // Add a small delay after movement
    commands.push('G4 P50 ; Post-movement delay');
    
    return commands.join('\n');
  }

  /**
   * Generate movement commands for a box placement sequence
   */
  static generateBoxPlacementCommands(
    boxId: number, 
    pickupPosition: Position, 
    placePosition: Position
  ): MovementCommand[] {
    const commands: MovementCommand[] = [];

    // 1. Move to pickup position
    commands.push({
      id: `${boxId}-move-to-pickup`,
      type: 'move',
      position: pickupPosition,
      boxId,
      gcode: this.moveToPosition(pickupPosition, true),
      description: `Move to pickup position for box ${boxId}`
    });

    // 2. Pick up the box
    commands.push({
      id: `${boxId}-pickup`,
      type: 'pickup',
      position: pickupPosition,
      boxId,
      gcode: this.pickupBox(pickupPosition),
      description: `Pick up box ${boxId}`
    });

    // 3. Move to placement position
    commands.push({
      id: `${boxId}-move-to-place`,
      type: 'move',
      position: placePosition,
      boxId,
      gcode: this.moveToPosition(placePosition, true),
      description: `Move box ${boxId} to placement position`
    });

    // 4. Place the box
    commands.push({
      id: `${boxId}-place`,
      type: 'place',
      position: placePosition,
      boxId,
      gcode: this.placeBox(placePosition),
      description: `Place box ${boxId}`
    });

    return commands;
  }
}