import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setDialog({ message, resolve });
    });
  }, []);

  const close = useCallback((result) => {
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  }, [dialog]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <ConfirmModal message={dialog.message} onClose={close} />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmModal({ message, onClose }) {
  return (
    <div className="modal" style={{ display: 'flex' }} onClick={() => onClose(false)}>
      <div
        className="modal-content modal-small"
        onClick={e => e.stopPropagation()}
        style={{
          padding: '20px 20px 16px',
          margin: 'auto',
          height: 'auto',
          minHeight: 'unset',
          flex: 'none'
        }}
      >
        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          <i className="bi bi-question-circle" style={{ fontSize: 36, color: '#f97316' }}></i>
          <p style={{ marginTop: 8, fontSize: 15, fontWeight: 500, color: '#1e293b' }}>{message}</p>
        </div>
        <div className="form-actions" style={{ justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
          <button className="btn-primary" onClick={() => onClose(true)}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}