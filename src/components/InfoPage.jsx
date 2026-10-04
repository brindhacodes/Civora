import { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { infoPages } from '../content/infoPages';
import './InfoPage.css';

const InfoPage = ({ page, language = 'en' }) => {
  const content = infoPages[page]?.[language] || infoPages[page]?.en;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (content) document.title = `${content.label} — Civora`;
    return () => { document.title = 'Civora — Better cities, together'; };
  }, [content]);

  if (!content) return null;

  return (
    <main className="info-page">
      <header className="info-hero">
        <div className="container info-hero__inner">
          <Link className="info-back" to="/"><ArrowLeft size={17} /> {language === 'ta' ? 'முகப்புக்குத் திரும்பு' : 'Back to home'}</Link>
          <p className="info-label">{content.label}</p>
          <h1>{content.title}</h1>
          <p className="info-intro">{content.intro}</p>
          {content.updated && <p className="info-updated">{content.updated}</p>}
        </div>
      </header>

      <div className="container info-layout">
        <aside className="info-toc" aria-label={language === 'ta' ? 'இப்பக்கத்தில்' : 'On this page'}>
          <strong>{language === 'ta' ? 'இப்பக்கத்தில்' : 'On this page'}</strong>
          <nav>
            {content.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}
          </nav>
        </aside>

        <article className="info-article">
          <div className="info-notice">{content.note}</div>
          {content.sections.map((section) => (
            <section id={section.id} className="info-section" key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
          <Link className="info-home-link" to="/">{language === 'ta' ? 'சிவோரா முகப்பைப் பார்க்க' : 'Return to Civora'} <ArrowUpRight size={17} /></Link>
        </article>
      </div>
    </main>
  );
};

export default InfoPage;

