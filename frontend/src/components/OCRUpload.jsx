import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../config/api';

function OCRUpload({ onTextExtracted, existingText = '' }) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState(existingText);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post(`${API_URL}/ocr/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.text) {
        setExtractedText(res.data.text);
        onTextExtracted?.(res.data.text);
      }
    } catch (err) {
      console.error('OCR error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(t('errors.ocrFailed') || 'OCR processing failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setExtractedText('');
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onTextExtracted?.('');
  };

  const handleManualEdit = (e) => {
    const text = e.target.value;
    setExtractedText(text);
    onTextExtracted?.(text);
  };

  return (
    <div className="ocr-upload">
      <div className="ocr-header">
        <h4>📄 {t('patientPortal.medicalHistory.ocrTitle') || 'Medical Document OCR'}</h4>
        <p className="ocr-help">{t('patientPortal.medicalHistory.ocrHelp') || 'Upload prescriptions, lab reports, or medical documents to auto-fill your history'}</p>
      </div>

      <div className="ocr-dropzone" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp,image/tiff,image/bmp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {previewUrl ? (
          <div className="ocr-preview">
            <img src={previewUrl} alt="Preview" />
            <button type="button" className="ocr-remove" onClick={(e) => { e.stopPropagation(); handleRemove(); }}>
              ✕
            </button>
          </div>
        ) : (
          <div className="ocr-placeholder">
            <span className="ocr-icon">📷</span>
            <p>{t('patientPortal.medicalHistory.uploadImage') || 'Click or drag to upload medical document'}</p>
            <small>{t('patientPortal.medicalHistory.supportedFormats') || 'JPG, PNG, WebP, TIFF, BMP (max 10MB)'}</small>
          </div>
        )}

        {isProcessing && (
          <div className="ocr-processing-overlay">
            <div className="spinner"></div>
            <p>{t('patientPortal.medicalHistory.processing') || 'Extracting text...'}</p>
          </div>
        )}
      </div>

      {error && <div className="ocr-error">{error}</div>}

      {extractedText && (
        <div className="ocr-extracted-text">
          <label>{t('patientPortal.medicalHistory.extractedText') || 'Extracted Text (editable)'}</label>
          <textarea
            value={extractedText}
            onChange={handleManualEdit}
            rows="4"
            placeholder={t('patientPortal.medicalHistory.editText') || 'Review and edit extracted text...'}
          />
        </div>
      )}

      <div className="ocr-tips">
        <details>
          <summary>{t('patientPortal.medicalHistory.ocrTips') || '💡 Tips for best OCR results'}</summary>
          <ul>
            <li>{t('patientPortal.medicalHistory.tip1') || 'Use good lighting, avoid shadows'}</li>
            <li>{t('patientPortal.medicalHistory.tip2') || 'Keep camera parallel to document'}</li>
            <li>{t('patientPortal.medicalHistory.tip3') || 'Ensure text is sharp and readable'}</li>
            <li>{t('patientPortal.medicalHistory.tip4') || 'Crop to document edges before uploading'}</li>
            <li>{t('patientPortal.medicalHistory.tip5') || 'Works best with printed text (prescriptions, lab reports)'}</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

export default OCRUpload;