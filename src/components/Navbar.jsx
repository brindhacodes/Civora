import { ArrowUpRight, CircleHelp, Languages, Menu, Minus, Plus, ShieldCheck, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CivoraMark from './CivoraMark';
import './Navbar.css';

const copy = {
  en: { tagline: 'CITIZEN POWERED', home: 'Home', map: 'Community map', dashboard: 'My dashboard', track: 'Track complaint', admin: 'Authority portal', signin: 'Sign in', report: 'Report issue', switchLabel: 'Switch to Tamil', menuOpen: 'Open menu', menuClose: 'Close menu' },
  ta: { tagline: 'மக்கள் சக்தி', home: 'முகப்பு', map: 'நகர வரைபடம்', feed: 'சமூக பதிவுகள்', track: 'நிலையை அறிய', admin: 'நிர்வாகம்', signin: 'உள்நுழை', report: 'புகாரளிக்க', switchLabel: 'ஆங்கிலத்திற்கு மாற்று', menuOpen: 'மெனுவைத் திற', menuClose: 'மெனுவை மூடு' },
};

const Navbar = ({ onOpenReport, language = 'en', onLanguageChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [fontScale]);

  const closeMenu = () => setMenuOpen(false);
  const navClass = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`;
  const text = copy[language] || copy.en;

  return (
    <header className={`site-header${menuOpen ? ' menu-open' : ''}`}>
      <div className="government-bar">
        <div className="container government-bar__inner">
          <span><ShieldCheck size={14} aria-hidden="true" /> Civora <i /> Digital Civic Services</span>
          <div className="government-bar__tools">
            <button type="button" onClick={() => setFontScale((value) => Math.max(90, value - 10))} aria-label="Decrease text size"><Minus size={13} /> A</button>
            <button type="button" onClick={() => setFontScale(100)} aria-label="Reset text size">A</button>
            <button type="button" onClick={() => setFontScale((value) => Math.min(120, value + 10))} aria-label="Increase text size">A <Plus size={13} /></button>
            <Link to="/about"><CircleHelp size={14} /> Help</Link>
            <button type="button" className="government-language" onClick={() => onLanguageChange?.(language === 'ta' ? 'en' : 'ta')}>English <i /> தமிழ்</button>
          </div>
        </div>
      </div>
      <nav className="navbar" aria-label="Primary navigation">
      <div className="container nav-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-mark"><CivoraMark className="logo-icon" /></span>
          <span>
            <span className="logo-text">Civora</span>
            <span className="logo-tagline">{text.tagline}</span>
          </span>
        </Link>
        <div className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end className={navClass} onClick={closeMenu}>{text.home}</NavLink>
          <NavLink to="/map" className={navClass} onClick={closeMenu}>{text.map}</NavLink>
          <NavLink to="/dashboard" className={navClass} onClick={closeMenu}>{text.dashboard || 'My dashboard'}</NavLink>
          <NavLink to="/track" className={navClass} data-guide-id="track-link" onClick={closeMenu}>{text.track}</NavLink>
          <NavLink to="/admin" className="nav-link admin-link-pill" onClick={closeMenu}>Officer portal</NavLink>
        </div>
        <div className="nav-actions">
          {!location.pathname.startsWith('/login') && !location.pathname.startsWith('/signup') && (
            <Link className="nav-signin" to="/login" onClick={closeMenu}>{text.signin}</Link>
          )}
          <button
            type="button"
            className="language-toggle"
            onClick={() => onLanguageChange?.(language === 'ta' ? 'en' : 'ta')}
            aria-label={text.switchLabel}
            title={text.switchLabel}
          >
            <Languages size={16} aria-hidden="true" />
            <span>{language === 'ta' ? 'EN' : 'தமிழ்'}</span>
          </button>
          <button className="btn btn-primary nav-btn" onClick={onOpenReport} data-guide-id="report-button">
            {text.report} <ArrowUpRight size={16} />
          </button>
          <button className="mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? text.menuClose : text.menuOpen} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      </nav>
    </header>
  );
};

export default Navbar;
