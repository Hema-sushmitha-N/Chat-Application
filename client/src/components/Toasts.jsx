// Small pop-ups in the corner. Clicking one dismisses it.
// toasts: [{ id, title, text }]
export default function Toasts({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} className="toast" onClick={() => onDismiss(t.id)}>
          <strong>{t.title}</strong>
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
