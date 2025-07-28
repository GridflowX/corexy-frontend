import React from 'react';
import { Card, CardContent } from './ui/card';
import { PackingStats } from '../types/warehouse';

interface StatsCardsProps {
  stats: PackingStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const StatCard = ({ 
    label, 
    value, 
    unit
  }: { 
    label: string, 
    value: number | string, 
    unit?: string
  }) => (
    <Card className="text-center">
      <CardContent className="p-2 h-full flex flex-col justify-center">
        <div className="text-sm font-bold text-foreground mb-1 font-inter">
          {value}
        </div>
        <div className="text-xs text-muted-foreground leading-tight">
          {label}
          {unit && <span className="text-xs ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full grid grid-cols-2 gap-2">
      <StatCard
        label="Boxes Packed"
        value={stats.boxesPacked}
      />
      <StatCard
        label="Space Efficiency"
        value={stats.spaceEfficiency}
        unit="%"
      />
      <StatCard
        label="Time Efficiency"
        value={stats.timeEfficiency}
        unit="%"
      />
      <StatCard
        label="Solved In"
        value={stats.solvedIn.toFixed(1)}
        unit="s"
      />
    </div>
  );
};