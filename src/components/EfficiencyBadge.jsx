import { efficiencyColor } from '../utils/efficiency';

export default function EfficiencyBadge({ value, className }) {
  if (value === null || value === undefined) return null;
  const color = efficiencyColor(value);
  return (
    <span className={className} style={{ background: color + '20', color }}>
      {value}% efficiency
    </span>
  );
}
