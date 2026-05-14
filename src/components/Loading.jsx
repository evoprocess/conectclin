export default function Loading({ message = "Carregando..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',          // altura total da viewport para cobrir o fundo azul
      gap: '16px',
      color: '#475569',
      backgroundColor: '#ffffff',  // fundo branco explícito
      fontFamily: "'Segoe UI', 'Poppins', sans-serif"
    }}>
      <div className="loading" />
      <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0.3px' }}>
        {message}
      </span>
    </div>
  );
}