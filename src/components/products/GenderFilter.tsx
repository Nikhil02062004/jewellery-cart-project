import { cn } from '@/lib/utils';
import { ProductGender } from '@/hooks/useProducts';

interface GenderFilterProps {
  value: ProductGender | 'all';
  onChange: (value: ProductGender | 'all') => void;
  className?: string;
}

const genderTabs = [
  { value: 'all' as const, label: 'All', icon: '✨' },
  { value: 'women' as const, label: "Women's", icon: '👩' },
  { value: 'men' as const, label: "Men's", icon: '👨' },
];

export const GenderFilter = ({ value, onChange, className }: GenderFilterProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {genderTabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-2 font-body text-sm uppercase tracking-wider rounded-sm transition-all flex items-center gap-2",
            value === tab.value
              ? "bg-gold text-charcoal shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
