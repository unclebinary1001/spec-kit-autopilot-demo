'use client';

type FilterStatus = 'all' | 'active' | 'completed';

interface TodoFilterProps {
  current: FilterStatus;
  onChange: (status: FilterStatus) => void;
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export default function TodoFilter({ current, onChange }: TodoFilterProps) {
  return (
    <div className="todo-filter" role="tablist" aria-label="Filter todos">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          role="tab"
          aria-selected={current === f.value}
          className={`filter-btn${current === f.value ? ' active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
