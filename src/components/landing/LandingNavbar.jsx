import { useState } from 'react';
import LoginModal from './LoginModal';
import logoImage from '../../assets/logo.webp';

export default function LandingNavbar() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <nav
        className="w-100 d-flex align-items-center justify-content-between px-3 px-md-5 py-3"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1030,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <img src={logoImage} alt="ConectClin Logo" style={{ height: 40, width: 'auto' }} />
        </div>

        <button
          className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-3 text-white fw-semibold"
          style={{
            background: 'rgba(2, 132, 199, 0.9)',
            border: 'none',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          onClick={() => setModalOpen(true)}
        >
          <i className="bi bi-box-arrow-in-right"></i>
          <span>Entrar</span>
        </button>
      </nav>

      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}