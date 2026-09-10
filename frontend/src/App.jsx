import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientPortal from './components/PatientPortal';
import DoctorLogin from './components/DoctorLogin';
import DoctorDashboard from './components/DoctorDashboard';
import KioskView from './components/KioskView';
import LanguageSelector from './components/LanguageSelector';
import './App.css';

function App() {
  const { t } = useTranslation();

  return (
    <Router>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">{t('app.name')}</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">{t('nav.patientPortal')}</Link>
            <Link to="/doctor/login" className="nav-link">{t('nav.doctorLogin')}</Link>
            <LanguageSelector />
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<PatientPortal />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/kiosk" element={<KioskView />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>{t('app.tagline')}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
