import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SubcategoryFilterProps {
  subcategories: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export const SubcategoryFilter = ({ subcategories, value, onChange, className }: SubcategoryFilterProps) => {
  if (subcategories.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={() => onChange(null)}
            className={cn(
              "px-4 py-2 font-body text-xs uppercase tracking-wider rounded-full transition-all border whitespace-nowrap",
              value === null
                ? "bg-gold/20 border-gold text-gold"
                : "border-border text-muted-foreground hover:border-gold hover:text-foreground"
            )}
          >
            All Types
          </button>
          {subcategories.map((subcat) => (
            <button
              key={subcat}
              onClick={() => onChange(subcat)}
              className={cn(
                "px-4 py-2 font-body text-xs uppercase tracking-wider rounded-full transition-all border whitespace-nowrap",
                value === subcat
                  ? "bg-gold/20 border-gold text-gold"
                  : "border-border text-muted-foreground hover:border-gold hover:text-foreground"
              )}
            >
              {subcat.replace(/^(Gold|Silver|Fashion) /, '')}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
