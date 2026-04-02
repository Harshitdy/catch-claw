import { STATUS_COLORS } from '../../data/mockData'

interface StatusBadgeProps {
  readonly status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? 'bg-outline-variant/20 text-on-surface-variant'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {status}
    </span>
  )
}
