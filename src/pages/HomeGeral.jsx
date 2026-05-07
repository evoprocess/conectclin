import LandingNavbar from '../components/landing/LandingNavbar';
import HeroCarousel from '../components/landing/HeroCarousel';
import PartnersCarousel from '../components/landing/PartnersCarousel';
import LandingFooter from '../components/landing/LandingFooter';

export default function HomeGeral() {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <LandingNavbar />
      <main className="flex-grow-1" style={{ paddingTop: '72px' }}>
        <HeroCarousel />
        <PartnersCarousel />
      </main>
      <LandingFooter />
    </div>
  );
}