export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-dark-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
