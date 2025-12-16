//import React from 'react'; 

interface Props<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}

function TabSwitcher<T extends string>({ value, onChange, options }: Props<T>) {
  return (
    <div className="client-tabs">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`client-tab ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default TabSwitcher;
