import { useState, useEffect, useRef, useCallback } from 'react';
import img1 from '../../assets/image1.webp';
import img2 from '../../assets/image2.webp';
import img3 from '../../assets/image3.webp';
import img4 from '../../assets/image4.webp';
import img5 from '../../assets/image5.webp';

const announcements = [
  {
    tag: 'Novidade',
    date: '15 Jan 2025',
    title: 'Atendimento humanizado',
    desc: 'Aqui você tem contato com os médicos em tempo real, sem burocracias e com total transparência.',
    icon: 'bi-building',
    accent: '#0066FF',
    image: `url(${img1})`,
  },
  {
    tag: 'Evento',
    date: '02 Fev 2025',
    title: 'Campanha nutricional de verão',
    desc: 'Participe de palestras, workshops e avaliações gratuitas para uma vida mais saudável.',
    icon: 'bi-calendar-event',
    accent: '#FF6B35',
    image: `url(${img3})`,
  },
  {
    tag: 'Atualização',
    date: '20 Fev 2025',
    title: 'Acompanhamento pré e pós cirúrgico',
    desc: 'Novo módulo para monitorar pacientes antes e depois de cirurgias, garantindo suporte completo.',
    icon: 'bi-lightning-charge',
    accent: '#00D4FF',
    image: `url(${img2})`,
  },
  {
    tag: 'Resultado',
    date: '10 Mar 2025',
    title: 'App Multiplaforma',
    desc: 'Melhorias de performance, interface mais intuitiva e novas funcionalidades para facilitar seu dia a dia.',
    icon: 'bi-graph-up-arrow',
    accent: '#00C853',
    image: `url(${img4})`,
  },
  {
    tag: 'Comunicado',
    date: '25 Mar 2025',
    title: 'Sua jornada para uma vida mais saudável começa aqui!',
    desc: 'O que está esperando? Venha fazer parte dessa evolução e experimente o nosso portal de saúde inovador.',
    icon: 'bi-people',
    accent: '#FF6B35',
    image: `url(${img5})`,
  },
];

const STANDARD_DELAY = 5000;   // 5 segundos para slides normais
const LAST_SLIDE_DELAY = 8000; // 8 segundos para o último

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const intervalRef = useRef(null);
  const total = announcements.length;

  const goTo = useCallback(
    (index) => {
      setCurrent((prev) => {
        if (index < 0) return total - 1;
        if (index >= total) return 0;
        return index;
      });
    },
    [total]
  );

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(current + (diff > 0 ? 1 : -1));
    }
  };

  // Atualiza a posição do track
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  // Autoplay com delay variável
  useEffect(() => {
    // Limpa intervalo anterior
    if (intervalRef.current) clearTimeout(intervalRef.current);

    // Se o mouse está sobre o carrossel, pausa o autoplay
    if (isHovered) return;

    const delay = current === total - 1 ? LAST_SLIDE_DELAY : STANDARD_DELAY;

    intervalRef.current = setTimeout(() => {
      next();
    }, delay);

    return () => clearTimeout(intervalRef.current);
  }, [current, isHovered, total]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="w-100 px-3 px-md-5 py-4 py-md-5 anim-fade-up">
      <div className="container-xl">
        <h1
          className="fw-bold mb-2"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a1a' }}
        >
          Onde a saúde se conecta e o cuidado é personalizado.
        </h1>
        <p className="text-secondary mb-4">
          Faça parte do nosso time. Acesse o portal de saúde mais inovador do mercado e transforme a maneira como você cuida da sua saúde.
        </p>

        <div
          className="position-relative rounded-4 overflow-hidden shadow"
          style={{ border: '1px solid #e8e8e8', background: '#fff' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={trackRef}
            className="carousel-track d-flex"
            style={{ transition: 'transform 0.5s ease' }}
          >
            {announcements.map((slide, idx) => (
              <div key={idx} className="flex-shrink-0 w-100">
                <div className="row g-0 h-100">
                  <div
                    className="col-md-6 hero-image"
                    style={{
                        backgroundImage: slide.image,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        minHeight: 400,
                    }}
                    ></div>
                  <div className="col-md-6 p-4 p-md-5 d-flex flex-column justify-content-center bg-white">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          background: `${slide.accent}20`,
                        }}
                      >
                        <i
                          className={`bi ${slide.icon}`}
                          style={{ fontSize: 24, color: slide.accent }}
                        ></i>
                      </div>
                      <span
                        className="badge rounded-pill text-uppercase fw-semibold"
                        style={{
                          background: `${slide.accent}15`,
                          color: slide.accent,
                        }}
                      >
                        {slide.tag}
                      </span>
                    </div>
                    <small className="text-muted fw-semibold mb-2">
                      {slide.date}
                    </small>
                    <h3
                      className="fw-bold mb-3"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {slide.title}
                    </h3>
                    <p className="text-secondary">{slide.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Setas */}
          <button
            className="carousel-arrow start-0"
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: -20,
            }}
            onClick={prev}
            aria-label="Anterior"
          >
            <i className="bi bi-chevron-left fs-4"></i>
          </button>
          <button
            className="carousel-arrow end-0"
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: -20,
            }}
            onClick={next}
            aria-label="Próximo"
          >
            <i className="bi bi-chevron-right fs-4"></i>
          </button>
        </div>

        {/* Dots */}
        <div className="d-flex justify-content-center gap-2 mt-4">
          {announcements.map((_, idx) => (
            <button
              key={idx}
              className={`dot rounded-pill border-0 ${idx === current ? 'active' : ''}`}
              style={{
                width: idx === current ? 24 : 8,
                height: 8,
                backgroundColor: idx === current ? '#0284c7' : '#e8e8e8',
                transition: 'all 0.3s',
              }}
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}