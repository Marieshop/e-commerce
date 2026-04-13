import { cn } from './utils';
import { Button } from './Button';

const categories = [
  'All',
  'Abanyeshuri',
  'Abakobwa',
  'Urubyiruko',
  'Abagabo',
  'Abagore'
];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(category)}
          className={cn(
            "rounded-full px-6",
            selectedCategory === category ? "shadow-md" : "hover:bg-secondary"
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
