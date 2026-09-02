import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import LanguagePage from './pages/LanguagePage';
import ConsentPage from './pages/ConsentPage';
import IdentifyPage from './pages/IdentifyPage';
import IntakePage from './pages/IntakePage';
import DocumentsPage from './pages/DocumentsPage';
import ReviewPage from './pages/ReviewPage';
import SubmittedPage from './pages/SubmittedPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientPage from './pages/DoctorPatientPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/identify" element={<IdentifyPage />} />
      <Route path="/consent" element={<ConsentPage />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/submitted" element={<SubmittedPage />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/patient/:id" element={<DoctorPatientPage />} />
    </Routes>
  );
}