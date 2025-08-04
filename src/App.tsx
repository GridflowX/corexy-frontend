import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from './components/ui/button';
import { ModernStorageGrid } from './components/ModernStorageGrid';
import { ModernConfigPanel } from './components/ModernConfigPanel';
import { StatsCards } from './components/StatsCards';
import { NavbarConnectionStatus } from './components/warehouse/NavbarConnectionStatus';
import { PackingAlgorithm } from './lib/packingAlgorithm';
import { useMoonrakerConnection } from './hooks/useMoonrakerConnection';
import { Box, WarehouseConfig, SimulationState, SimulationMode, PackingStats, Position } from './types/warehouse';

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
        alert('Homing command sent to CoreXY system');
      }
    } catch (error) {
      console.error('Failed to home system:', error);
      alert('Failed to home system. Check connection to Moonraker.');
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
              <div className="h-[400px] lg:h-[460px]">
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

          {/* Storage Grid - Right side */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="h-[400px] lg:h-[483px]">
              <ModernStorageGrid
                boxes={boxes}
                config={{
                  storageWidth: appliedConfig.storageWidth,
                  storageLength: appliedConfig.storageLength,
                  clearance: appliedConfig.clearance
                }}
                simulationState={simulationState}
                stats={stats}
                onBoxClick={handleBoxClick}
                onPlay={handlePlay}
                onPause={handlePause}
                onReset={handleReset}
                onHome={handleHome}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;