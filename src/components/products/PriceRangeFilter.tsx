import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PriceRangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export const PriceRangeFilter = ({
  min,
  max,
  value,
  onChange,
  className,
}: PriceRangeFilterProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    const range: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(range);
  };

  const handleValueCommit = (newValue: number[]) => {
    const range: [number, number] = [newValue[0], newValue[1]];
    onChange(range);
  };

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-sm text-muted-foreground">Price Range</span>
        <span className="font-body text-sm font-medium">
          ₹{localValue[0].toLocaleString()} - ₹{localValue[1].toLocaleString()}
        </span>
      </div>
      <Slider
        value={localValue}
        min={min}
        max={max}
        step={100}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="w-full"
      />
      <div className="flex justify-between mt-2">
        <span className="font-body text-xs text-muted-foreground">
          ₹{min.toLocaleString()}
        </span>
        <span className="font-body text-xs text-muted-foreground">
          ₹{max.toLocaleString()}
        </span>
      </div>
    </div>
  );
};