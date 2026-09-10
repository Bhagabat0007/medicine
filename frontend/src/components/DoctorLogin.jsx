import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = '/api';

function DoctorLogin() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    specialization: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const specializations = [
    'General Physician',
    'Cardiologist',
    'Neurologist',
    'Orthopedic',
    'Dermatologist',
    'ENT Specialist',
    'Ophthalmologist',
    'Psychiatrist',
    'Gastroenterologist',
    'Pulmonologist',
    'Urologist',
    'Gynecologist'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/doctors/login`, {
          email: formData.email,
          password: formData.password
        });

        localStorage.setItem('doctorToken', response.data.token);
        localStorage.setItem('doctorInfo', JSON.stringify(response.data.doctor));
        navigate('/doctor/dashboard');
      } else {
        await axios.post(`${API_URL}/doctors/register`, formData);
        setIsLogin(true);
        setError('');
        alert(t('doctorRegister.registrationSuccess') || 'Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('common.errorOccurred') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login">
      <div className="login-card">
        <div className="login-header">
          <h1>{isLogin ? t('doctorLogin.title') : t('doctorRegister.title')}</h1>
          <p>{isLogin ? t('doctorLogin.subtitle') : t('doctorRegister.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>{t('doctorRegister.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. Name"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('doctorRegister.specialization')} *</label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('doctorRegister.specializationPlaceholder') || 'Select Specialization'}</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>{t('doctorLogin.email')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@medikiosk.com"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('doctorLogin.password')} *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t('common.pleaseWait') : (isLogin ? t('doctorLogin.login') : t('doctorRegister.register'))}
          </button>
        </form>

        <div className="toggle-form">
          <p>
            {isLogin ? t('doctorLogin.noAccount') : t('doctorLogin.hasAccount')}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? t('doctorLogin.registerHere') : t('doctorLogin.loginHere')}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="demo-credentials">
            <p><strong>{t('doctorLogin.demoCredentials')}:</strong></p>
            <p>{t('doctorLogin.demoEmail')}</p>
            <p>{t('doctorLogin.demoPassword')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorLogin;
