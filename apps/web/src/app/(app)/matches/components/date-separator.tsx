interface DateSeparatorProps {
  label: string
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-3">
      <div className="bg-surface-elevated rounded-full px-3 py-1">
        <span className="text-text-muted text-[11px] font-medium">{label}</span>
      </div>
    </div>
  )
}
