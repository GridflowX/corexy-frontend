import React from 'react';
import { Clock, Package, Zap, Target } from 'lucide-react';
import { StatsCard } from './warehouse/StatsCard';
import { PackingStats } from '../types/warehouse';

interface StatsCardsProps {
  stats: PackingStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const getEfficiencyVariant = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'error';
  };

  return (
    <div className="h-full grid grid-cols-2 gap-2">
      <StatsCard
        title="Boxes Packed"
        value={`${stats.boxesPacked}/${stats.totalBoxes}`}
        icon={<Package className="w-4 h-4" />}
        variant={stats.boxesPacked === stats.totalBoxes ? 'success' : 'default'}
      />
      <StatsCard
        title="Space Efficiency"
        value={stats.spaceEfficiency}
        unit="%"
        icon={<Target className="w-4 h-4" />}
        variant={getEfficiencyVariant(stats.spaceEfficiency)}
      />
      <StatsCard
        title="Time Efficiency"
        value={stats.timeEfficiency}
        unit="%"
        icon={<Zap className="w-4 h-4" />}
        variant={getEfficiencyVariant(stats.timeEfficiency)}
      />
      <StatsCard
        title="Solved In"
        value={stats.solvedIn.toFixed(1)}
        unit="s"
        icon={<Clock className="w-4 h-4" />}
        variant={stats.solvedIn < 3 ? 'success' : 'default'}
      />
    </div>
  );
};