import { useToast } from '../contexts/ToastContext';

const typeStyles = {
  success: { background: '#d1fae5', color: '#065f46', icon: 'bi-check-circle-fill' },
  error:   { background: '#fee2e2', color: '#991b1b', icon: 'bi-exclamation-triangle-fill' },
  warning: { background: '#fef3c7', color: '#92400e', icon: 'bi-exclamation-circle-fill' },
  info:    { background: '#dbeafe', color: '#1e40af', icon: 'bi-info-circle-fill' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380
    }}>
      {toasts.map(toast => {
        const style = typeStyles[toast.type] || typeStyles.info;
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              background: style.background,
              color: style.color,
              padding: '16px 20px',
              borderRadius: 16,
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              animation: 'fadeInUp 0.3s ease',
              fontFamily: "'Segoe UI', 'Poppins', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            <i className={`bi ${style.icon}`} style={{ fontSize: 20, marginTop: 1 }}></i>
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}