import { LayoutGrid, Map, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'map';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views = [
    { key: 'grid' as const, icon: LayoutGrid, label: 'Card View' },
    { key: 'list' as const, icon: List, label: 'List View' },
    { key: 'map' as const, icon: Map, label: 'Map View' }
  ];

  return (
    <div className="flex rounded-lg border border-border bg-background p-1">
      {views.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onViewChange(key)}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            currentView === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
