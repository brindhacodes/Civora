import CivoraMark from './CivoraMark';
import { Link } from 'react-router-dom';
import './Footer.css';

const copy = {
  en: { tagline: 'CITIZEN POWERED', description: 'Empowering citizens and local governments to build better, safer, and cleaner communities through AI-driven insights.', platform: 'Platform', report: 'Report Issue', map: 'Live Map', tracking: 'Track Status', company: 'Company', about: 'About Us', careers: 'Careers', press: 'Press', legal: 'Legal', privacy: 'Privacy Policy', terms: 'Terms & Conditions', cookies: 'Cookie Information', rights: 'All rights reserved.' },
  ta: { tagline: 'மக்கள் சக்தி', description: 'செயற்கை நுண்ணறிவு தகவல்களின் மூலம் சிறந்த, பாதுகாப்பான மற்றும் தூய்மையான சமூகங்களை உருவாக்க மக்களுக்கும் உள்ளாட்சி அமைப்புகளுக்கும் உதவுகிறது.', platform: 'தளம்', report: 'புகாரளிக்க', map: 'நேரடி வரைபடம்', tracking: 'நிலையைக் கண்காணிக்க', company: 'நிறுவனம்', about: 'எங்களைப் பற்றி', careers: 'வேலைவாய்ப்புகள்', press: 'ஊடகத் தகவல்', legal: 'சட்டம்', privacy: 'தனியுரிமைக் கொள்கை', terms: 'விதிமுறைகள்', cookies: 'குக்கீ தகவல்', rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' },
};

const Footer = ({ language = 'en' }) => {
  const text = copy[language] || copy.en;
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-mark"><CivoraMark className="logo-icon" /></span>
            <span>
              <span className="logo-text">Civora</span>
              <span className="logo-tagline">{text.tagline}</span>
            </span>
          </Link>
          <p className="footer-description">
            {text.description}
          </p>
        </div>
        
        <div className="footer-links">
          <div className="link-group">
            <h4>{text.platform}</h4>
            <Link to="/">{text.report}</Link>
            <Link to="/map">{text.map}</Link>
            <Link to="/track">{text.tracking}</Link>
          </div>
          <div className="link-group">
            <h4>{text.company}</h4>
            <Link to="/about">{text.about}</Link>
            <Link to="/careers">{text.careers}</Link>
            <Link to="/press">{text.press}</Link>
          </div>
          <div className="link-group">
            <h4>{text.legal}</h4>
            <Link to="/privacy">{text.privacy}</Link>
            <Link to="/terms">{text.terms}</Link>
            <Link to="/privacy#cookies">{text.cookies}</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Civora. {text.rights}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
