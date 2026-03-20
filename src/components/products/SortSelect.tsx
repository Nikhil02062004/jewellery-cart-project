import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortSelect = ({ value, onChange }: SortSelectProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-[180px] font-body">
        <ArrowUpDown className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured" className="font-body">Featured</SelectItem>
        <SelectItem value="newest" className="font-body">Newest First</SelectItem>
        <SelectItem value="price-low" className="font-body">Price: Low to High</SelectItem>
        <SelectItem value="price-high" className="font-body">Price: High to Low</SelectItem>
      </SelectContent>
    </Select>
  );
};
