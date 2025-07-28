import React from 'react';
import { SimulationState, PackingStats } from '../types/warehouse';

interface ControlPanelProps {
  simulationState: SimulationState;
  stats: PackingStats;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onRetrieveBox: (boxId: number) => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationState,
  stats,
  onPlay,
  onPause,
  onReset,
  onRetrieveBox,
  disabled = false
}) => {
  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          onClick={simulationState.isRunning ? onPause : onPlay}
          disabled={disabled}
          className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          title={simulationState.isRunning ? "Pause" : "Play"}
        >
          {simulationState.isRunning ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-gray-700"></div>
              <div className="w-1 h-4 bg-gray-700"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-4 border-l-gray-700 border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
          )}
        </button>

        <button
          onClick={onReset}
          disabled={disabled}
          className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          title="Reset"
        >
          <div className="w-4 h-4 border-2 border-gray-700 rounded-full border-t-transparent animate-spin-slow"></div>
        </button>
      </div>

      {/* Simulation Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center mb-3">
          <span className="text-sm text-gray-600">
            Step: {simulationState.step} / {simulationState.totalSteps}
          </span>
          <span className="mx-4 text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Remaining: {simulationState.totalSteps - simulationState.step}
          </span>
          <span className="mx-4 text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Mode: {simulationState.mode}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${simulationState.totalSteps > 0 ? (simulationState.step / simulationState.totalSteps) * 100 : 0}%`
            }}
          ></div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">⏱</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.solvedIn.toFixed(1)}s</div>
          <div className="text-sm text-gray-600">Solved in</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">📦</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.boxesPacked}</div>
          <div className="text-sm text-gray-600">Boxes Packed</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">📊</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.spaceEfficiency}%</div>
          <div className="text-sm text-gray-600">Space Efficiency</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚡</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.timeEfficiency}%</div>
          <div className="text-sm text-gray-600">Time Efficiency</div>
        </div>
      </div>

      {/* Manual Retrieval */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Box Retrieval</h3>
        <p className="text-xs text-gray-600 mb-3">
          Click on any box in the grid above to retrieve it manually
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 bg-blue-200 border border-gray-400"></div>
          <span>Packed boxes</span>
          <div className="w-3 h-3 bg-yellow-200 border border-gray-400 ml-4"></div>
          <span>Selected for retrieval</span>
        </div>
      </div>
    </div>
  );
};