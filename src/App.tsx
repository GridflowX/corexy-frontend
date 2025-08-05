import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from './components/ui/button';
import { ModernStorageGrid } from './components/ModernStorageGrid';
import { ModernConfigPanel } from './components/ModernConfigPanel';
import { StatsCards } from './components/StatsCards';
import { MachineControlPanel } from './components/MachineControlPanel';
import { SimulationControlPanel } from './components/SimulationControlPanel';

import { NavbarConnectionStatus } from './components/warehouse/NavbarConnectionStatus';
import { PackingAlgorithm } from './lib/packingAlgorithm';
import { GcodeGenerator } from './lib/gcode-generator';
import { useMoonrakerConnection } from './hooks/useMoonrakerConnection';
import { Box, WarehouseConfig, SimulationState, SimulationMode, PackingStats, Position, MovementCommand, MovementQueue } from './types/warehouse';

const defaultConfig: WarehouseConfig = {
  storageWidth: 400,  // 40cm - matches printer config
  storageLength: 400, // 40cm - matches printer config
  numRectangles: 50,
  minSide: 50,        // 5cm (small boxes)
  maxSide: 50,        // 5cm (small boxes)
  clearance: 20       // 2cm
};

function App() {
  const [config, setConfig] = useState<WarehouseConfig>(defaultConfig);
  const [appliedConfig, setAppliedConfig] = useState<WarehouseConfig>(defaultConfig);

  // Calculate adaptive height based on bed dimensions
  const getAdaptiveHeight = useCallback((config: WarehouseConfig) => {
    // Keep heights reasonable and responsive
    return {
      mobile: `h-[500px]`,
      desktop: `lg:h-[600px]`,
      configPanel: `lg:h-[500px]`
    };
  }, []);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const { isConnected, setServer, connect } = useMoonrakerConnection();
  const [simulationState, setSimulationState] = useState<SimulationState>({
    mode: SimulationMode.IDLE,
    step: 0,
    totalSteps: 0,
    isRunning: false
  });
  const [stats, setStats] = useState<PackingStats>({
    boxesPacked: 0,
    totalBoxes: 0,
    spaceEfficiency: 0,
    timeEfficiency: 92,
    solvedIn: 2.5
  });
  const [packingPaths, setPackingPaths] = useState<{ [boxId: number]: Position[] }>({});
  const [retrievalPaths, setRetrievalPaths] = useState<{ [boxId: number]: Position[] }>({});
  const [retrievalOrder, setRetrievalOrder] = useState<number[]>([]);
  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);
  const [movementQueue, setMovementQueue] = useState<MovementQueue>({
    commands: [],
    currentIndex: 0,
    isExecuting: false
  });
  const [visibleBoxes, setVisibleBoxes] = useState<Set<number>>(new Set());

  const generateAndPackBoxes = useCallback((configToUse: WarehouseConfig) => {
    const algorithm = new PackingAlgorithm(configToUse);
    const startTime = Date.now();
    const generatedBoxes = algorithm.generateRandomBoxes();
    const result = algorithm.packBoxes(generatedBoxes);
    const endTime = Date.now();

    setBoxes(result.boxes);
    setPackingPaths(result.packingPaths);
    setRetrievalPaths(result.retrievalPaths);
    setRetrievalOrder(result.retrievalOrder);

    const packedCount = result.boxes.filter(box => box.isPacked).length;
    const density = algorithm.calculateStorageDensity(result.boxes);

    setStats({
      boxesPacked: packedCount,
      totalBoxes: result.boxes.length,
      spaceEfficiency: Math.round(density),
      timeEfficiency: 92,
      solvedIn: (endTime - startTime) / 1000
    });

    setSimulationState({
      mode: SimulationMode.IDLE,
      step: 0,
      totalSteps: 0,
      isRunning: false
    });

    // Reset visible boxes
    setVisibleBoxes(new Set());
    
    // Reset movement queue
    setMovementQueue({
      commands: [],
      currentIndex: 0,
      isExecuting: false
    });
  }, []);

  const handlePlay = useCallback(() => {
    if (simulationState.isRunning) return;

    // Create animation script
    const script: Array<{ type: 'pack' | 'retrieve', boxId: number, path: Position[] }> = [];
    
    // Add packing animations
    boxes.forEach(box => {
      if (box.isPacked && packingPaths[box.id]) {
        script.push({ type: 'pack', boxId: box.id, path: packingPaths[box.id] });
      }
    });

    // Add retrieval animations
    retrievalOrder.forEach(boxId => {
      if (retrievalPaths[boxId]) {
        script.push({ type: 'retrieve', boxId, path: retrievalPaths[boxId] });
      }
    });

    let currentStep = 0;
    let currentScriptIndex = 0;
    let currentPathIndex = 0;

    setSimulationState({
      mode: SimulationMode.PLACEMENT,
      step: 0,
      totalSteps: script.reduce((sum, item) => sum + item.path.length, 0),
      isRunning: true,
      currentBox: undefined,
      currentPath: undefined
    });

    const interval = setInterval(() => {
      if (currentScriptIndex >= script.length) {
        clearInterval(interval);
        setSimulationState(prev => ({ ...prev, isRunning: false, mode: SimulationMode.IDLE }));
        setAnimationInterval(null);
        return;
      }

      const currentScript = script[currentScriptIndex];
      const currentBox = boxes.find(box => box.id === currentScript.boxId);

      if (currentPathIndex === 0) {
        // Starting new animation
        setSimulationState(prev => ({
          ...prev,
          mode: currentScript.type === 'pack' ? SimulationMode.PLACEMENT : SimulationMode.RETRIEVAL,
          currentBox,
          currentPath: currentScript.path
        }));
      }

      setSimulationState(prev => ({
        ...prev,
        step: currentStep
      }));

      currentPathIndex++;
      currentStep++;

      if (currentPathIndex >= currentScript.path.length) {
        // Move to next script item
        currentScriptIndex++;
        currentPathIndex = 0;
      }
    }, 100);

    setAnimationInterval(interval);
  }, [simulationState.isRunning, boxes, packingPaths, retrievalPaths, retrievalOrder]);

  const handlePause = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    setSimulationState(prev => ({ ...prev, isRunning: false }));
  }, [animationInterval]);

  const handleReset = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    setConfig(currentConfig => {
      setAppliedConfig(currentConfig); // Update the applied config
      generateAndPackBoxes(currentConfig);
      return currentConfig;
    });
  }, [animationInterval, generateAndPackBoxes]);

  const handleHome = useCallback(async () => {
    try {
      console.log('Homing system...');
      
      // Import the MoonrakerAPI dynamically to avoid circular dependencies
      const { MoonrakerAPI } = await import('./lib/moonraker-api');
      
      if (window.confirm('Send homing command to the physical system?')) {
        await MoonrakerAPI.homeSystem();
        alert('✅ Homing command sent successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to home system:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to home system!\n\nError: ${errorMessage}\n\nTroubleshooting:\n• Check if Moonraker is running\n• Verify IP address and port\n• Ensure printer is connected\n• Check network connectivity`);
    }
  }, []);

  const handleBoxClick = useCallback((boxId: number) => {
    if (simulationState.isRunning) return;

    // Mark box for manual retrieval
    setBoxes(prev => prev.map(box => ({
      ...box,
      isSelected: box.id === boxId ? !box.isSelected : false
    })));
  }, [simulationState.isRunning]);

  const handleSaveConfiguration = useCallback(() => {
    // Use the current config state when the button is clicked
    setConfig(currentConfig => {
      setAppliedConfig(currentConfig); // Update the applied config
      generateAndPackBoxes(currentConfig);
      return currentConfig; // Don't change the config, just trigger the generation
    });
  }, [generateAndPackBoxes]);

  // Generate movement queue from packing paths
  const generateMovementQueue = useCallback(() => {
    const commands: MovementCommand[] = [];
    
    // Generate commands for each box placement
    boxes.forEach(box => {
      if (box.isPacked && packingPaths[box.id]) {
        const path = packingPaths[box.id];
        if (path.length >= 2) {
          // Assume first position is pickup, last is placement
          const pickupPos = path[0];
          const placePos = path[path.length - 1];
          
          const boxCommands = GcodeGenerator.generateBoxPlacementCommands(
            box.id,
            pickupPos,
            placePos
          );
          commands.push(...boxCommands);
        }
      }
    });

    setMovementQueue({
      commands,
      currentIndex: 0,
      isExecuting: false
    });

    setSimulationState(prev => ({
      ...prev,
      movementQueue: {
        commands,
        currentIndex: 0,
        isExecuting: false
      }
    }));
  }, [boxes, packingPaths]);

  // Execute single step in movement queue
  const executeNextStep = useCallback(async () => {
    if (movementQueue.currentIndex >= movementQueue.commands.length) return;

    const command = movementQueue.commands[movementQueue.currentIndex];
    
    try {
      // Import MoonrakerAPI dynamically
      const { MoonrakerAPI } = await import('./lib/moonraker-api');
      
      // Send G-code command to moonraker
      if (isConnected) {
        console.log(`Executing command: ${command.description}`);
        console.log(`G-code: ${command.gcode}`);
        
        // Send the G-code
        await MoonrakerAPI.executeGcode(command.gcode);
      }

      // Update frontend visualization
      if (command.type === 'place' && command.boxId) {
        setVisibleBoxes(prev => new Set([...Array.from(prev), command.boxId!]));
      }

      // Update movement queue
      setMovementQueue(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));

      setSimulationState(prev => ({
        ...prev,
        step: movementQueue.currentIndex + 1,
        totalSteps: movementQueue.commands.length
      }));

    } catch (error) {
      console.error('Failed to execute movement command:', error);
    }
  }, [movementQueue, isConnected]);

  // Manual control functions
  const handleDirectionalMove = useCallback(async (direction: 'up' | 'down' | 'left' | 'right', distance: number = 10) => {
    try {
      const { MoonrakerAPI } = await import('./lib/moonraker-api');
      const gcode = GcodeGenerator.manualMove(direction, distance);
      
      if (isConnected) {
        console.log(`🚀 Executing manual move: ${direction} ${distance}mm`);
        console.log(`📝 G-code commands:`);
        console.log(gcode);
        
        const result = await MoonrakerAPI.executeGcode(gcode);
        console.log(`✅ Movement completed successfully`);
        return result;
      } else {
        console.warn('⚠️ Not connected to Moonraker - movement ignored');
        throw new Error('Not connected to Moonraker');
      }
    } catch (error) {
      console.error('❌ Failed to execute manual move:', error);
      throw error; // Re-throw to allow UI to handle the error
    }
  }, [isConnected]);

  const handleEmergencyStop = useCallback(async () => {
    try {
      const { MoonrakerAPI } = await import('./lib/moonraker-api');
      
      if (isConnected) {
        await MoonrakerAPI.emergencyStop();
        
        // Stop any running animations
        if (animationInterval) {
          clearInterval(animationInterval);
          setAnimationInterval(null);
        }
        
        // Reset movement queue
        setMovementQueue(prev => ({
          ...prev,
          isExecuting: false
        }));

        setSimulationState(prev => ({
          ...prev,
          isRunning: false,
          mode: SimulationMode.IDLE
        }));
      }
    } catch (error) {
      console.error('Failed to execute emergency stop:', error);
    }
  }, [isConnected, animationInterval]);

  const handleTestConnection = useCallback(async () => {
    try {
      const { MoonrakerAPI } = await import('./lib/moonraker-api');
      
      console.log('Testing connection to Moonraker...');
      const result = await MoonrakerAPI.testConnection();
      
      if (result.success) {
        console.log('✅ Connection successful!', result.info);
        alert(`✅ Connection successful!\n\nServer: ${MoonrakerAPI.getCurrentServer().host}:${MoonrakerAPI.getCurrentServer().port}\nKlippy Version: ${result.info?.klippy_version || 'Unknown'}`);
      } else {
        console.error('❌ Connection failed:', result.error);
        alert(`❌ Connection failed!\n\nServer: ${MoonrakerAPI.getCurrentServer().host}:${MoonrakerAPI.getCurrentServer().port}\nError: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      alert(`❌ Connection test failed!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleConnectionChange = useCallback((ipPort: string) => {
    const [host, port] = ipPort.split(':');
    setServer(host, port);
    // Attempt to reconnect with new settings
    connect(host, port).catch(console.error);
  }, [setServer, connect]);

  useEffect(() => {
    generateAndPackBoxes(defaultConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate movement queue when boxes change
  useEffect(() => {
    if (boxes.length > 0 && Object.keys(packingPaths).length > 0) {
      generateMovementQueue();
    }
  }, [boxes, packingPaths, generateMovementQueue]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background grid pattern */}
      <div className="absolute inset-0 grid-background pointer-events-none"></div>
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Network
            </Button>
            
            {/* Centered Title */}
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-10 h-10 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground m-0">Warehouse 1</h1>
                <p className="text-sm text-muted-foreground m-0">CoreXY Automation System</p>
              </div>
            </div>
            
            {/* Connection Status in Navbar */}
            <div className="flex items-center gap-3">
              <NavbarConnectionStatus
                onIpChange={handleConnectionChange}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-2 sm:p-4 bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Left sidebar with Configuration Panel and Stats Cards */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="flex flex-col gap-3">
              {/* Configuration Panel */}
              <div className={`h-[400px] ${getAdaptiveHeight(appliedConfig).configPanel}`}>
                <ModernConfigPanel
                  config={config}
                  stats={stats}
                  onConfigChange={setConfig}
                  onSaveConfiguration={handleSaveConfiguration}
                  disabled={simulationState.isRunning}
                />
              </div>
              
              {/* Statistics Cards - 2x2 Grid */}
              <div className="h-20">
                <StatsCards stats={stats} />
              </div>
            </div>
          </div>

          {/* Center - Storage Grid Only */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className={`${getAdaptiveHeight(appliedConfig).mobile} ${getAdaptiveHeight(appliedConfig).desktop}`}>
              <ModernStorageGrid
                boxes={simulationState.isRunning ? boxes.filter(box => visibleBoxes.has(box.id)) : boxes}
                config={{
                  storageWidth: appliedConfig.storageWidth,
                  storageLength: appliedConfig.storageLength,
                  clearance: appliedConfig.clearance
                }}
                simulationState={simulationState}
                stats={stats}
                onBoxClick={handleBoxClick}
                onPlay={() => {
                  generateMovementQueue();
                  handlePlay();
                }}
                onPause={handlePause}
                onReset={handleReset}
                onHome={handleHome}
              />
            </div>
          </div>

          {/* Right side - Machine Control and Simulation Control */}
          <div className="lg:col-span-1 order-3 lg:order-3">
            <div className="flex flex-col gap-3">
              {/* Machine Control Panel */}
              <div className="h-auto">
                <MachineControlPanel
                  isConnected={isConnected}
                  isRunning={simulationState.isRunning || movementQueue.isExecuting}
                  onDirectionalMove={handleDirectionalMove}
                  onHome={handleHome}
                  onStop={handleEmergencyStop}
                  onTestConnection={handleTestConnection}
                />
              </div>
              
              {/* Simulation Control Panel */}
              <div className="h-auto">
                <SimulationControlPanel
                  isRunning={simulationState.isRunning || movementQueue.isExecuting}
                  currentStep={movementQueue.currentIndex}
                  totalSteps={movementQueue.commands.length}
                  simulationMode={simulationState.mode}
                  onPlay={() => {
                    generateMovementQueue();
                    handlePlay();
                  }}
                  onPause={handlePause}
                  onStepForward={executeNextStep}
                  onReset={handleReset}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;