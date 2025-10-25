import { useEffect } from 'react';
// ✅ usa el alias
import '@/styles/Toast.css';

export default function Toast({ type = 'success', message = '', onClose, duration = 2000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

    return (
      <div className={`toast ${type}`}>
        <span>{message}</span>
      </div>
    );
}
