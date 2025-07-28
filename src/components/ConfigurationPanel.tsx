import React from 'react';
import { WarehouseConfig } from '../types/warehouse';

interface ConfigurationPanelProps {
  config: WarehouseConfig;
  onConfigChange: (config: WarehouseConfig) => void;
  onSaveConfiguration: () => void;
  disabled?: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
  onSaveConfiguration,
  disabled = false
}) => {
  const handleInputChange = (field: keyof WarehouseConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
          <div className="w-3 h-3 border border-white rounded-sm"></div>
        </div>
        <h2 className="text-xl font-semibold">Storage Grid Configuration</h2>
      </div>
      
      <p className="text-gray-600 mb-6">Configure warehouse storage parameters and run optimization algorithms</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Input Mode ▶
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Width (cm)
          </label>
          <select
            value={config.storageWidth}
            onChange={(e) => handleInputChange('storageWidth', Number(e.target.value))}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={1500}>1500</option>
            <option value={2000}>2000</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Length (cm)
          </label>
          <select
            value={config.storageLength}
            onChange={(e) => handleInputChange('storageLength', Number(e.target.value))}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={1500}>1500</option>
            <option value={2000}>2000</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Rectangles
          </label>
          <select
            value={config.numRectangles}
            onChange={(e) => handleInputChange('numRectangles', Number(e.target.value))}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={75}>75</option>
            <option value={100}>100</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Max allowed: 800</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Side Length (cm)
          </label>
          <input
            type="number"
            value={config.minSide}
            onChange={(e) => handleInputChange('minSide', Number(e.target.value))}
            disabled={disabled}
            min={10}
            max={config.maxSide - 10}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Side Length (cm)
          </label>
          <select
            value={config.maxSide}
            onChange={(e) => handleInputChange('maxSide', Number(e.target.value))}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value={100}>100</option>
            <option value={150}>150</option>
            <option value={200}>200</option>
            <option value={250}>250</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clearance (cm)
          </label>
          <select
            value={config.clearance}
            onChange={(e) => handleInputChange('clearance', Number(e.target.value))}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
          </select>
        </div>

        <button
          onClick={onSaveConfiguration}
          disabled={disabled}
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>💾</span>
          Save Configuration
        </button>

        <div className="text-sm text-gray-600 space-y-1">
          <div>• Width and Length define the warehouse dimensions</div>
          <div>• Number of Rectangles determines storage bin count</div>
          <div>• Min/Max Side control individual bin sizes</div>
          <div>• Clearance ensures boxes do not touch</div>
        </div>
      </div>
    </div>
  );
};