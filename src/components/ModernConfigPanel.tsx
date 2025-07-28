import React from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Label } from './ui/label';
import { WarehouseConfig, PackingStats } from '../types/warehouse';

interface ModernConfigPanelProps {
  config: WarehouseConfig;
  stats: PackingStats;
  onConfigChange: (config: WarehouseConfig) => void;
  onSaveConfiguration: () => void;
  disabled?: boolean;
}

export const ModernConfigPanel: React.FC<ModernConfigPanelProps> = ({
  config,
  stats,
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
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="neomorphic-icon w-8 h-8 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between p-4">
        <div className="flex-1 space-y-3">
          {/* Storage dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
                Storage Width
              </Label>
              <Input
                type="text"
                value="50cm"
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-inter transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
                Storage Length
              </Label>
              <Input
                type="text"
                value="50cm"
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-inter transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Box configuration */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
              Number of Rectangles
            </Label>
            <select
              value={config.numRectangles}
              onChange={(e) => handleInputChange('numRectangles', Number(e.target.value))}
              disabled={disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-inter transition-all duration-200 focus:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
                Min Side (cm)
              </Label>
              <Input
                type="number"
                value={config.minSide}
                onChange={(e) => handleInputChange('minSide', Number(e.target.value))}
                disabled={disabled}
                min={10}
                max={config.maxSide - 10}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
                Max Side (cm)
              </Label>
              <select
                value={config.maxSide}
                onChange={(e) => handleInputChange('maxSide', Number(e.target.value))}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-inter transition-all duration-200 focus:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={150}>15cm</option>
                <option value={200}>20cm</option>
                <option value={250}>25cm</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
              Clearance (cm)
            </Label>
            <select
              value={config.clearance}
              onChange={(e) => handleInputChange('clearance', Number(e.target.value))}
              disabled={disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-inter transition-all duration-200 focus:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={10}>1cm</option>
              <option value={20}>2cm</option>
              <option value={30}>3cm</option>
            </select>
          </div>
        </div>

        <div className="pt-3">
          <Button
            onClick={onSaveConfiguration}
            disabled={disabled}
            className="w-full h-10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Run Optimization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};