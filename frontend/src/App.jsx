import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PatientPortal from './components/PatientPortal';
import DoctorLogin from './components/DoctorLogin';
import DoctorDashboard from './components/DoctorDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">MediKiosk</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Patient Portal</Link>
            <Link to="/doctor/login" className="nav-link">Doctor Login</Link>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<PatientPortal />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>MediKiosk - AI-Powered Clinical Token System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
