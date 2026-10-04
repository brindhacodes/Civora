import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import CivoraMark from './CivoraMark';
import './WelcomeOverlay.css';

const STORAGE_KEY = 'civora_welcomed';

const speak = (text, lang = 'en-IN') => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const msg = new SpeechSynthesisUtterance(text);
  
  // Find a voice that matches the language code
  const voices = window.speechSynthesis.getVoices();
  const langLower = lang.toLowerCase();
  
  // 1st choice: Perfect match (e.g., 'ta-IN')
  // 2nd choice: Language match (e.g., 'ta')
  let voice = voices.find(v => v.lang.toLowerCase() === langLower) || 
              voices.find(v => v.lang.toLowerCase().startsWith(langLower.split('-')[0]));
  
  if (voice) {
    msg.voice = voice;
  }
  
  msg.lang = lang;
  msg.rate = 0.95;
  msg.pitch = 1;
  msg.volume = 1;
  window.speechSynthesis.speak(msg);
};

const PROMPTS = {
  'en-IN': {
    welcome: 'Welcome to Civora! Please select your preferred language to continue. Choose English, Tamil, Hindi, Malayalam, Telugu, Kannada, or Urdu.',
    confirmation: (lang) => `You selected ${lang}. Now, please choose how you would like to get started.`,
    options: 'Welcome to Civora! Please select one of the options. Click Start Guide to hear step-by-step voice instructions. Click Chat Bot to speak with our AI assistant. Or click Just Browse to explore on your own.'
  },
  'ta-IN': {
    welcome: 'சிவோராவிற்கு வரவேற்கிறோம்! தொடర உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும். ஆங்கிலం, தமிழ், ఈంది, தெலுங்கு அல்லது மலையாளத்தைத் தேர்ந்தெடுக்கவும்.',
    confirmation: () => `நீங்கள் தமிழைத் தேர்ந்தெடுத்துள்ளீர்கள். இப்போது, நீங்கள் எவ்வாறு தொடங்க விரும்புகிறீர்கள் என்பதைத் தேர்வுசெய்யவும்.`,
    options: 'சிவோராவிற்கு வரவேற்கிறோம்! விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும். படிப்படியான குரல் வழிமுறைகளைக் கேட்க தொடக்க வழிகாட்டியை கிளிக் செய்யவும். எங்கள் AI உதவியாளருடன் பேச சாட் பாட்டை கிளிக் செய்யவும். அல்லது நீங்களாகவே உலாவ ஜஸ்ட் பிரவுஸை கிளிக் செய்யவும்.'
  },
  'hi-IN': {
    welcome: 'Civora में आपका स्वागत है! जारी रखने के लिए कृपया अपनी पसंदीदा भाषा चुनें। अंग्रेजी, तमिल, हिंदी, तेलुगु या मलयालम चुनें।',
    confirmation: () => `आपने हिंदी चुनी है। अब, कृपया चुनें कि आप कैसे शुरू करना चाहेंगे।`,
    options: 'Civora में आपका स्वागत है! कृपया विकल्पों में से एक चुनें। चरण-दर-चरण वॉयस निर्देश सुनने के लिए स्टार्ट गाइड पर क्लिक करें। हमारे एआई सहायक से बात करने के लिए चैट बॉट पर क्लिक करें। या अपने आप घूमने के लिए जस्ट ब्राउज़ पर क्लिक करें।'
  },
  'te-IN': {
    welcome: 'సివోరాకు స్వాగతం! కొనసాగించడానికి దయచేసి మీకు ఇష్టమైన భాషను ఎంచుకోండి. ఇంగ్లీష్, తమిళం, హిందీ, మలయాళం, తెలుగు, కన్నడ లేదా ఉర్దూ ఎంచుకోండి.',
    confirmation: () => `మీరు తెలుగును ఎంచుకున్నారు. ఇప్పుడు, మీరు ఎలా ప్రారంభించాలనుకుంటున్నారో ఎంచుకోండి.`,
    options: 'సివోరాకు స్వాగతం! ఎంపికలలో ఒకదాన్ని ఎంచుకోండి. దశలవారీ వాయిస్ సూచనల కోసం "గైడ్ ప్రారంభించండి" ఎంచుకోండి. మా ఏఐ సహాయకుడితో మాట్లాడటానికి "చాట్ బాట్" ఎంచుకోండి. మీరే వెబ్‌సైట్‌ను చూడటానికి "బ్రౌజ్ చేయండి" ఎంచుకోండి.'
  },
  'ml-IN': {
    welcome: 'സിവോറയിലേക്ക് സ്വാഗതം! തുടരുന്നതിന് നിങ്ങളുടെ ഇഷ്ടപ്പെട്ട ഭാഷ തിരഞ്ഞെടുക്കുക. ഇംഗ്ലീഷ്, തമിഴ്, ഹിന്ദി, മലയാളം, തെലുങ്ക്, കന്നഡ അല്ലെങ്കിൽ ഉറുദു തിരഞ്ഞെടുക്കുക.',
    confirmation: () => `നിങ്ങൾ മലയാളം തിരഞ്ഞെടുത്തു. ഇനി, എങ്ങനെ തുടങ്ങണമെന്ന് ദയവായി തിരഞ്ഞെടുക്കുക.`,
    options: 'സിവോറയിലേക്ക് സ്വാഗതം! ഓപ്ഷനുകളിൽ ഒന്ന് തിരഞ്ഞെടുക്കുക. ഘട്ടംഘട്ടമായുള്ള ശബ്ദ നിർദ്ദേശങ്ങൾ കേൾക്കാൻ "ഗൈഡ് ആരംഭിക്കുക" തിരഞ്ഞെടുക്കുക. എ.ഐ. സഹായിയുമായി സംസാരിക്കാൻ "ചാറ്റ്ബോട്ട്" തിരഞ്ഞെടുക്കുക. സ്വയം വെബ്സൈറ്റ് കാണാൻ "ബ്രൗസ് ചെയ്യുക" തിരഞ്ഞെടുക്കുക.'
  }
};

PROMPTS['kn-IN'] = {
  welcome: 'ಸಿವೋರಾಗೆ ಸ್ವಾಗತ! ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ಇಂಗ್ಲಿಷ್, ತಮಿಳು, ಹಿಂದಿ, ಮಲಯಾಳಂ, ತೆಲುಗು, ಕನ್ನಡ ಅಥವಾ ಉರ್ದು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
  confirmation: () => `ನೀವು ಕನ್ನಡವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಈಗ ಹೇಗೆ ಪ್ರಾರಂಭಿಸಬೇಕೆಂದು ಆಯ್ಕೆ ಮಾಡಿ.`,
  options: 'ಸಿವೋರಾಗೆ ಸ್ವಾಗತ! ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ. ಹಂತ ಹಂತದ ಧ್ವನಿ ಸೂಚನೆಗಳಿಗಾಗಿ "ಮಾರ್ಗದರ್ಶಿ ಪ್ರಾರಂಭಿಸಿ" ಆಯ್ಕೆ ಮಾಡಿ. ನಮ್ಮ ಎಐ ಸಹಾಯಕರೊಂದಿಗೆ ಮಾತನಾಡಲು "ಚಾಟ್ ಬಾಟ್" ಆಯ್ಕೆ ಮಾಡಿ. ನೀವೇ ಜಾಲತಾಣವನ್ನು ವೀಕ್ಷಿಸಲು "ಬ್ರೌಸ್ ಮಾಡಿ" ಆಯ್ಕೆ ಮಾಡಿ.'
};

PROMPTS['ur-IN'] = {
  welcome: 'سیوورا میں خوش آمدید! جاری رکھنے کے لیے اپنی پسندیدہ زبان منتخب کریں۔ انگریزی، تمل، ہندی، ملیالم، تیلگو، کنڑ یا اردو میں سے انتخاب کریں۔',
  confirmation: () => `آپ نے اردو منتخب کی ہے۔ اب شروع کرنے کا طریقہ منتخب کریں۔`,
  options: 'سیوورا میں خوش آمدید! کسی ایک اختیار کا انتخاب کریں۔ مرحلہ وار صوتی ہدایات کے لیے "رہنمائی شروع کریں" منتخب کریں۔ ہمارے اے آئی معاون سے بات کرنے کے لیے "چیٹ بوٹ" منتخب کریں۔ خود ویب سائٹ دیکھنے کے لیے "براؤز کریں" منتخب کریں۔'
};

const ACTION_LABELS = {
  'ta-IN': { guide: 'குரல் வழிகாட்டி', chatbot: 'சாட் பாட்', close: 'தளத்தை உலாவுதல்' },
  'hi-IN': { guide: 'वॉयस गाइड', chatbot: 'चैट बॉट', close: 'वेबसाइट देखना' },
  'te-IN': { guide: 'వాయిస్ గైడ్', chatbot: 'చాట్ బాట్', close: 'వెబ్‌సైట్‌ను చూడటం' },
  'ml-IN': { guide: 'ശബ്ദ മാർഗ്ഗനിർദ്ദേശം', chatbot: 'ചാറ്റ്ബോട്ട്', close: 'വെബ്സൈറ്റ് കാണുക' },
  'kn-IN': { guide: 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ', chatbot: 'ಚಾಟ್ ಬಾಟ್', close: 'ಜಾಲತಾಣ ವೀಕ್ಷಣೆ' },
  'ur-IN': { guide: 'صوتی رہنمائی', chatbot: 'چیٹ بوٹ', close: 'ویب سائٹ دیکھنا' }
};

const WelcomeOverlay = ({ onStartGuide, onOpenChatbot, onLanguageSelect }) => {
  const [visible, setVisible] = useState(false);
  const step = 'language';
  const [langCode, setLangCode] = useState('en-IN');
  const [pointer, setPointer] = useState(0); 
  const [voicePlayed, setVoicePlayed] = useState(false);
  const pointerTimer = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return undefined;
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Trigger voice when user clicks the 🔊 button
  const handleHearInstructions = () => {
    setVoicePlayed(true);
    const p = PROMPTS[langCode];
    speak(step === 'language' ? p.welcome : p.options, langCode);
  };

  // Animated pointer cycles between the language cards
  useEffect(() => {
    if (!visible) return;
    const maxSteps = step === 'language' ? 7 : 3;
    pointerTimer.current = setInterval(() => {
      setPointer(p => (p + 1) % maxSteps);
    }, 1400);
    return () => clearInterval(pointerTimer.current);
  }, [visible, step]);

  const dismiss = (action) => {
    window.speechSynthesis.cancel();
    clearInterval(pointerTimer.current);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    if (action === 'guide') onStartGuide();
    if (action === 'chatbot') onOpenChatbot();
  };

  const handleLanguageSelect = (label, code) => {
    setLangCode(code);
    if (onLanguageSelect) onLanguageSelect(code);

    speak(PROMPTS[code].confirmation(label), code);
    clearInterval(pointerTimer.current);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleCardClick = (action, cardText) => {
    const localizedCardText = ACTION_LABELS[langCode]?.[action] || cardText;
    const confirmText = langCode === 'ta-IN' ? `நீங்கள் ${localizedCardText}-ஐத் தேர்ந்தெடுத்துள்ளீர்கள். இப்போது திறக்கிறது.` : 
                       langCode === 'hi-IN' ? `आपने ${localizedCardText} चुना है। अब खुल रहा है।` :
                       langCode === 'te-IN' ? `మీరు ${localizedCardText} ఎంచుకున్నారు. ఇప్పుడు తెరుచుకుంటుంది.` :
                       langCode === 'ml-IN' ? `നിങ്ങൾ ${localizedCardText} തിരഞ്ഞെടുത്തു. ഇപ്പോൾ തുറക്കുന്നു.` :
                       langCode === 'kn-IN' ? `ನೀವು ${localizedCardText} ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಈಗ ತೆರೆಯುತ್ತಿದೆ.` :
                       langCode === 'ur-IN' ? `آپ نے ${localizedCardText} منتخب کیا ہے۔ اب کھل رہا ہے۔` :
                       `You selected ${cardText}. Opening now.`;
    speak(confirmText, langCode);
    setTimeout(() => dismiss(action), 600);
  };

  if (!visible) return null;

  return (
    <div className="wo-backdrop">
      <div className="wo-panel" lang={langCode} dir={langCode === 'ur-IN' ? 'rtl' : 'ltr'} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="wo-close"
          onClick={() => dismiss('close')}
          aria-label="Close language selection"
          title="Close"
        >
          <X size={22} strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Heading */}
        <div className="wo-heading">
          <span className="wo-logo"><CivoraMark className="wo-logo-icon" /></span>
          <h2>Welcome to Civora</h2>
          <p>
            {step === 'language' 
              ? (langCode === 'ta-IN' ? 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்' : 
                 langCode === 'hi-IN' ? 'अपनी पसंदीदा भाषा चुनें' : 
                 langCode === 'te-IN' ? 'మీకు ఇష్టమైన భాషను ఎంచుకోండి' :
                 langCode === 'ml-IN' ? 'നിങ്ങളുടെ ഇഷ്ടപ്പെട്ട ഭാഷ തിരഞ്ഞെടുക്കുക' :
                 langCode === 'kn-IN' ? 'ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' :
                 langCode === 'ur-IN' ? 'اپنی پسندیدہ زبان منتخب کریں' :
                 'Select your preferred language')
              : (langCode === 'ta-IN' ? 'நீங்கள் எவ்வாறு தொடங்க விரும்புகிறீர்கள்?' : 
                 langCode === 'hi-IN' ? 'आप कैसे शुरुआत करना चाहेंगे?' : 
                 langCode === 'te-IN' ? 'మీరు ఎలా ప్రారంభించాలనుకుంటున్నారు?' :
                 langCode === 'ml-IN' ? 'നിങ്ങൾക്ക് എങ്ങനെ തുടങ്ങണം?' :
                 langCode === 'kn-IN' ? 'ನೀವು ಹೇಗೆ ಪ್ರಾರಂಭಿಸಲು ಬಯಸುತ್ತೀರಿ?' :
                 langCode === 'ur-IN' ? 'آپ کیسے شروع کرنا چاہتے ہیں؟' :
                 'How would you like to get started?')
            }
          </p>
          <button className="wo-hear-btn" onClick={handleHearInstructions}>
            🔊 {voicePlayed 
                ? (langCode === 'ta-IN' ? 'வழிமுறைகளை மீண்டும் இயக்கவும்' : 
                   langCode === 'hi-IN' ? 'निर्देश दोबारा सुनें' : 
                   langCode === 'te-IN' ? 'సూచనలను మళ్లీ ప్లే చేయండి' :
                   langCode === 'ml-IN' ? 'നിർദ്ദേശങ്ങൾ വീണ്ടും കേൾക്കുക' :
                   langCode === 'kn-IN' ? 'ಸೂಚನೆಗಳನ್ನು ಮತ್ತೆ ಕೇಳಿ' :
                   langCode === 'ur-IN' ? 'ہدایات دوبارہ سنیں' :
                   'Replay Instructions') 
                : (langCode === 'ta-IN' ? 'வழிமுறைகளைக் கேட்க தட்டவும்' : 
                   langCode === 'hi-IN' ? 'निर्देश सुनने के लिए टैप करें' : 
                   langCode === 'te-IN' ? 'సూచనల కోసం ఇక్కడ నొక్కండి' :
                   langCode === 'ml-IN' ? 'നിർദ്ദേശങ്ങൾ കേൾക്കാൻ ടാപ്പ് ചെയ്യുക' :
                   langCode === 'kn-IN' ? 'ಸೂಚನೆಗಳನ್ನು ಕೇಳಲು ಒತ್ತಿರಿ' :
                   langCode === 'ur-IN' ? 'ہدایات سننے کے لیے دبائیں' :
                   'Tap to Hear Instructions')}
          </button>
        </div>

        {step === 'language' ? (
          /* Step 1: Language selection */
          <div className="wo-cards wo-cards--languages">
            <div
              className={`wo-card wo-card--lang${pointer === 0 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('English', 'en-IN')}
            >
              {pointer === 0 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇬🇧</span>
              <h3>English</h3>
              <p>Continue in English</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 1 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Tamil', 'ta-IN')}
            >
              {pointer === 1 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Tamil (தமிழ்)</h3>
              <p>தமிழில் தொடరவும்</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 2 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Hindi', 'hi-IN')}
            >
              {pointer === 2 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Hindi (हिन्दी)</h3>
              <p>हिंदी में जारी रखें</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 3 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Telugu', 'te-IN')}
            >
              {pointer === 3 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Telugu (తెలుగు)</h3>
              <p>తెలుగులో కొనసాగించండి</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 4 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Malayalam', 'ml-IN')}
            >
              {pointer === 4 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Malayalam (മലയാളം)</h3>
              <p>മലയാളത്തിൽ തുടരുക</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 5 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Kannada', 'kn-IN')}
            >
              {pointer === 5 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Kannada (ಕನ್ನಡ)</h3>
              <p>ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ</p>
            </div>

            <div
              className={`wo-card wo-card--lang${pointer === 6 ? ' wo-card--active' : ''}`}
              onClick={() => handleLanguageSelect('Urdu', 'ur-IN')}
            >
              {pointer === 6 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🇮🇳</span>
              <h3>Urdu (اردو)</h3>
              <p dir="rtl">اردو میں جاری رکھیں</p>
            </div>
          </div>
        ) : (
          /* Step 2: Options */
          <div className="wo-cards wo-cards--options">
            {/* Start Guide */}
            <div
              className={`wo-card wo-card--guide${pointer === 0 ? ' wo-card--active' : ''}`}
              onClick={() => handleCardClick('guide', 'Start Guide')}
            >
              {pointer === 0 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🎙️</span>
              <h3>{langCode === 'ta-IN' ? 'தொடக்க வழிகாட்டி' : langCode === 'hi-IN' ? 'गाइड शुरू करें' : langCode === 'te-IN' ? 'గైడ్‌ని ప్రారంభించండి' : langCode === 'ml-IN' ? 'ഗൈഡ് ആരംഭിക്കുക' : langCode === 'kn-IN' ? 'ಮಾರ್ಗದರ್ಶಿ ಪ್ರಾರಂಭಿಸಿ' : langCode === 'ur-IN' ? 'رہنمائی شروع کریں' : 'Start Guide'}</h3>
              <p>Step-by-step voice instructions to report an issue</p>
            </div>

            {/* Chat Bot */}
            <div
              className={`wo-card wo-card--chat${pointer === 1 ? ' wo-card--active' : ''}`}
              onClick={() => handleCardClick('chatbot', 'Chat Bot')}
            >
              {pointer === 1 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">🤖</span>
              <h3>Chat Bot</h3>
              <p>Describe your issue to our AI assistant and auto-fill the form</p>
            </div>

            {/* Just Browse */}
            <div
              className={`wo-card wo-card--stop${pointer === 2 ? ' wo-card--active' : ''}`}
              onClick={() => handleCardClick('close', 'Just Browse')}
            >
              {pointer === 2 && <span className="wo-pointer">👆 Click here</span>}
              <span className="wo-card-icon">✋</span>
              <h3>Just Browse</h3>
              <p>Explore the site on your own — you can start the guide anytime</p>
            </div>
          </div>
        )}

        <p className="wo-hint">🔊 {langCode === 'ta-IN' ? 'மேலே உள்ள குரల్ வழிகாட்டியைப் பின்பற்றவும், அல்லது ஏதேனும் கார்டினை கிளிக் செய்து தொடங்கவும்' : 
                                langCode === 'hi-IN' ? 'ऊपर दी गई वॉयस गाइड सुनें, या शुरू करने के लिए किसी भी कार्ड पर क्लिक करें' : 
                                 langCode === 'te-IN' ? 'పైన ఉన్న వాయిస్ గైడ్ వినండి లేదా ప్రారంభించడానికి ఏదైనా కార్డ్‌ని క్లిక్ చేయండి' :
                                 langCode === 'ml-IN' ? 'മുകളിലുള്ള വോയ്‌സ് ഗൈഡ് കേൾക്കുക, അല്ലെങ്കിൽ ആരംഭിക്കാൻ ഏതെങ്കിലും കാർഡിൽ ക്ലിക്ക് ചെയ്യുക' :
                                 langCode === 'kn-IN' ? 'ಮೇಲಿನ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಕೇಳಿ ಅಥವಾ ಪ್ರಾರಂಭಿಸಲು ಯಾವುದೇ ಆಯ್ಕೆಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ' :
                                 langCode === 'ur-IN' ? 'اوپر دی گئی صوتی رہنمائی سنیں، یا شروع کرنے کے لیے کسی اختیار پر کلک کریں' :
                                 'Listen to the voice guide above, or click any card to begin'}</p>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
