import { useState, useEffect, useRef, useCallback } from 'react';

const partners = [
  { name: 'Aurora Tech', icon: 'bi-cpu', color: '#0066FF' },
  { name: 'Velta Group', icon: 'bi-bar-chart', color: '#FF6B35' },
  { name: 'Solis Energy', icon: 'bi-sun', color: '#FFB300' },
  { name: 'Prism Digital', icon: 'bi-gem', color: '#00D4FF' },
  { name: 'Orion Labs', icon: 'bi-rocket-takeoff', color: '#8B5CF6' },
  { name: 'Zenith Co.', icon: 'bi-mountain', color: '#00C853' },
  { name: 'Nova Systems', icon: 'bi-diagram-3', color: '#FF6B35' },
  { name: 'Echo Labs', icon: 'bi-soundwave', color: '#0066FF' },
];

export default function PartnersCarousel() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);
  const [slidesPerView, setSlidesPerView] = useState(4);

  const totalPages = Math.ceil(partners.length / slidesPerView);

  const calcSlidesPerView = useCallback(() => {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    if (w < 1280) return 3;
    return 4;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newSlides = calcSlidesPerView();
      setSlidesPerView(newSlides);
      setCurrent(0); // reset ao redimensionar
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calcSlidesPerView]);

  const goTo = (index) => {
    setCurrent(Math.max(0, Math.min(index, totalPages - 1)));
  };

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  return (
    <section className="w-100 px-3 px-md-5 py-5 anim-fade-up">
      <div className="container-xl">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2
            className="fw-bold mb-0"
            style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a1a' }}
          >
            Nossos Parceiros Conveniados
          </h2>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-label="Anterior"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => goTo(current + 1)}
              disabled={current >= totalPages - 1}
              aria-label="Próximo"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="carousel-track d-flex"
            style={{
              gap: '1rem',
              transition: 'transform 0.5s ease',
            }}
          >
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="partner-card flex-shrink-0 rounded-4 p-4 bg-white border d-flex flex-column align-items-center text-center"
                style={{
                  width: `calc((100% - ${(slidesPerView - 1) * 1}rem) / ${slidesPerView})`,
                  borderColor: '#e8e8e8',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: 56,
                    height: 56,
                    background: `${partner.color}20`,
                  }}
                >
                  <i
                    className={`bi ${partner.icon}`}
                    style={{ fontSize: 28, color: partner.color }}
                  ></i>
                </div>
                <span className="fw-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}