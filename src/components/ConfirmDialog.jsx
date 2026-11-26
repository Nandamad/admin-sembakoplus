import { AlertTriangle } from 'lucide-react'
import './ConfirmDialog.css'

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Hapus',
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="confirm-dialog__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <span className="confirm-dialog__icon">
          <AlertTriangle aria-hidden="true" size={22} />
        </span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog__actions">
          <button
            className="confirm-dialog__cancel"
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="confirm-dialog__confirm"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
