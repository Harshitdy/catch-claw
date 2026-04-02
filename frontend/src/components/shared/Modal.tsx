import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  readonly children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="fixed inset-0 z-50 m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-dark-surface-container p-6 shadow-[0_12px_40px_rgba(25,28,30,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-on-surface dark:text-dark-on-surface">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-high dark:hover:bg-dark-surface-high transition-colors">
              <X size={18} className="text-on-surface-variant dark:text-dark-on-surface-variant" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </dialog>
  )
}
