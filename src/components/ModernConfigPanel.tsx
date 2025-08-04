import React from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { WarehouseConfig, PackingStats } from '../types/warehouse';
import { BED_SIZE_LIMITS } from '../lib/constants';

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
                Width (mm)
              </Label>
              <Input
                type="number"
                value={config.storageWidth}
                onChange={(e) => handleInputChange('storageWidth', Number(e.target.value))}
                disabled={disabled}
                min={BED_SIZE_LIMITS.MIN_WIDTH}
                max={BED_SIZE_LIMITS.MAX_WIDTH}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
                Length (mm)
              </Label>
              <Input
                type="number"
                value={config.storageLength}
                onChange={(e) => handleInputChange('storageLength', Number(e.target.value))}
                disabled={disabled}
                min={BED_SIZE_LIMITS.MIN_WIDTH}
                max={BED_SIZE_LIMITS.MAX_WIDTH}
              />
            </div>
          </div>

          {/* Box configuration */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
              Number of Rectangles
            </Label>
            <Select
              value={config.numRectangles.toString()}
              onValueChange={(value) => handleInputChange('numRectangles', Number(value))}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of boxes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="75">75</SelectItem>
              </SelectContent>
            </Select>
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
              <Select
                value={config.maxSide.toString()}
                onValueChange={(value) => handleInputChange('maxSide', Number(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select max size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">15cm</SelectItem>
                  <SelectItem value="200">20cm</SelectItem>
                  <SelectItem value="250">25cm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block whitespace-nowrap">
              Clearance (cm)
            </Label>
            <Select
              value={config.clearance.toString()}
              onValueChange={(value) => handleInputChange('clearance', Number(value))}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select clearance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">1cm</SelectItem>
                <SelectItem value="20">2cm</SelectItem>
                <SelectItem value="30">3cm</SelectItem>
              </SelectContent>
            </Select>
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