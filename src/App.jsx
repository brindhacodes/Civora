import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ReportIssueModal from './components/ReportIssueModal';
import LiveMap from './components/LiveMap';
import HeroSection from './components/HeroSection';
import ExplainerSection from './components/ExplainerSection';
import SignUp from './components/SignUp';
import Login from './components/Login';
import TrackComplaint from './components/TrackComplaint';
import AdminDashboard from './components/AdminDashboard';
import VoiceGuideAssistant from './components/VoiceGuideAssistance';
import MyComplaints from './components/MyComplaints';
import NearbyComplaints from './components/NearbyComplaints';
import ProtectedRoute from './components/ProtectedRoute';
import LiveFeed from './components/LiveFeed';
import VolunteerDashboard from './components/volunteerdashboard';
import WelcomeOverlay from './components/WelcomeOverlay';
import LiveChatbot from './components/LiveChatbot';
import InfoPage from './components/InfoPage';

function Home({ onOpenReport, language }) {
  return (
    <main>
      <HeroSection onOpenReport={onOpenReport} language={language} />
      <ExplainerSection language={language} />
      <LiveMap language={language} />
      <LiveFeed language={language} />
    </main>
  );
}

function App() {
  const reviewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has('review');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPreFillData, setReportPreFillData] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [guideStart, setGuideStart] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const interfaceLanguage = selectedLanguage === 'ta-IN' ? 'ta' : 'en';

  useEffect(() => {
    document.documentElement.lang = interfaceLanguage;
    document.documentElement.dir = 'ltr';
  }, [interfaceLanguage]);

  const handleOpenReport = useCallback((data = null) => {
    setReportPreFillData(data);
    setIsReportModalOpen(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setIsReportModalOpen(false);
    setReportPreFillData(null);
  }, []);

  return (
    <Router>
      <Navbar
        onOpenReport={() => handleOpenReport()}
        language={interfaceLanguage}
        onLanguageChange={(language) => setSelectedLanguage(language === 'ta' ? 'ta-IN' : 'en-IN')}
      />
      <Routes>
        <Route path="/" element={<Home onOpenReport={() => handleOpenReport()} language={interfaceLanguage} />} />
        <Route path="/feed" element={<LiveFeed language={interfaceLanguage} />} />
        <Route path="/map" element={<LiveMap language={interfaceLanguage} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/dashboard" element={<MyComplaints onOpenReport={() => handleOpenReport()} />} />
        <Route path="/about" element={<InfoPage page="about" language={interfaceLanguage} />} />
        <Route path="/careers" element={<InfoPage page="careers" language={interfaceLanguage} />} />
        <Route path="/press" element={<InfoPage page="press" language={interfaceLanguage} />} />
        <Route path="/privacy" element={<InfoPage page="privacy" language={interfaceLanguage} />} />
        <Route path="/terms" element={<InfoPage page="terms" language={interfaceLanguage} />} />
        <Route
          path="/my-complaints"
          element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nearby-issues"
          element={
            <ProtectedRoute>
              <NearbyComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={reviewMode ? <AdminDashboard /> :
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute requiredRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer language={interfaceLanguage} />

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReport}
        initialData={reportPreFillData}
      />

      <LiveChatbot 
        onAutoFill={handleOpenReport} 
        forceOpen={chatbotOpen} 
        onForceOpened={() => setChatbotOpen(false)} 
      />

      {!reviewMode && <VoiceGuideAssistant
        externalStart={guideStart}
        onExternalStarted={() => setGuideStart(false)}
        onOpenChatbot={() => setChatbotOpen(true)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />}

      {!reviewMode && <WelcomeOverlay
        onStartGuide={() => setGuideStart(true)}
        onOpenChatbot={() => setChatbotOpen(true)}
        onLanguageSelect={(lang) => setSelectedLanguage(lang)}
      />}
    </Router>
  );
}

export default App;
