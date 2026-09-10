const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pathMod = require('path');
const multer = require('multer');
const { OpenAI } = require('openai');
const { createWorker } = require('tesseract.js');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const ai = require('./ai-engine');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medikiosk-secret-key-2024';
const DEMO_DOCTOR_ID = 1;

const audioUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'), false);
    }
  }
});

const imageUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/tiff', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type'), false);
    }
  }
});

// Lazy & safe OpenAI initialization to avoid crash when credentials are not configured
function getOpenAIClient() {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey.startsWith('your_groq_api_key')) {
    return null;
  }
  try {
    return new OpenAI({ 
      apiKey: apiKey.trim(),
      baseURL: process.env.GROQ_API_BASE_URL || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
    });
  } catch (err) {
    console.error('Error initializing OpenAI client:', err.message);
    return null;
  }
}

// Initialize Tesseract worker
let tesseractWorker = null;
async function getTesseractWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker('eng', 1, { logger: m => console.log(m) });
  }
  return tesseractWorker;
}

app.use(cors());
app.use(express.json());

// Base & Health Check routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'MediKiosk API',
    message: 'MediKiosk backend is running successfully',
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    name: 'MediKiosk API',
    message: 'MediKiosk backend API is active',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-doctor-room', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    console.log(`Doctor ${doctorId} joined room`);
  });
  
  socket.on('join-kiosk-room', () => {
    socket.join('kiosk');
    console.log('Kiosk client joined room');
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper to emit queue updates
function emitQueueUpdate(doctorId) {
  db.all(
    `SELECT * FROM tokens WHERE doctor_id = ?
     ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'moderate' THEN 1 ELSE 2 END, created_at ASC`,
    [doctorId],
    (err, tokens) => {
      if (!err && tokens) {
        io.to(`doctor-${doctorId}`).emit('queue:updated', tokens);
        io.to('kiosk').emit('kiosk:updated', tokens);
      }
    }
  );
}

// Database setup - support serverless /tmp fallback
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dbFilePath = process.env.DB_PATH || (isServerless ? pathMod.join('/tmp', 'medikiosk.db') : pathMod.join(__dirname, 'medikiosk.db'));

if (isServerless && !fs.existsSync(dbFilePath)) {
  const localDb = pathMod.join(__dirname, 'medikiosk.db');
  if (fs.existsSync(localDb)) {
    try {
      fs.copyFileSync(localDb, dbFilePath);
    } catch (e) {
      console.warn('Could not copy initial db template to /tmp:', e.message);
    }
  }
}

const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('SQLite connection error for path', dbFilePath, ':', err.message);
  } else {
    console.log('SQLite connected at:', dbFilePath);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_number INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT,
    symptoms TEXT NOT NULL,
    follow_up_answers TEXT,
    medical_history TEXT,
    predicted_conditions TEXT,
    ai_analysis TEXT,
    recommended_specialist TEXT NOT NULL,
    doctor_id INTEGER,
    status TEXT DEFAULT 'waiting',
    priority TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  )`);

  db.get('SELECT COUNT(*) as count FROM doctors', (err, row) => {
    if (row.count === 0) {
      const seedDoctors = [
        { name: 'Dr. Rajesh Kumar', specialization: 'General Physician', email: 'rajesh@medikiosk.com', password: 'doctor123' },
        { name: 'Dr. Priya Sharma', specialization: 'Cardiologist', email: 'priya@medikiosk.com', password: 'doctor123' },
        { name: 'Dr. Amit Patel', specialization: 'Neurologist', email: 'amit@medikiosk.com', password: 'doctor123' },
        { name: 'Dr. Sneha Reddy', specialization: 'Orthopedic', email: 'sneha@medikiosk.com', password: 'doctor123' },
        { name: 'Dr. Mohammed Ali', specialization: 'Dermatologist', email: 'mohammed@medikiosk.com', password: 'doctor123' },
        { name: 'Dr. Kavita Joshi', specialization: 'ENT Specialist', email: 'kavita@medikiosk.com', password: 'doctor123' },
      ];
      const stmt = db.prepare('INSERT INTO doctors (name, specialization, email, password) VALUES (?, ?, ?, ?)');
      seedDoctors.forEach(doc => {
        const hashed = bcrypt.hashSync(doc.password, 10);
        stmt.run(doc.name, doc.specialization, doc.email, hashed);
      });
      stmt.finalize();
      console.log('Seeded initial doctors');
    }
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctor = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ─── NEW: Get follow-up questions based on symptoms ────────────────────────
app.post('/api/symptoms/questions', (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Symptoms are required' });

  const { cluster } = ai.clusterSymptoms(symptoms);
  const followUpQuestions = ai.generateFollowUpQuestions(cluster);
  const medicalHistoryQs = ai.getMedicalHistoryQuestions();

  res.json({
    cluster,
    followUpQuestions,
    medicalHistoryQuestions: medicalHistoryQs
  });
});

// ─── NEW: Analyze symptoms and predict condition ────────────────────────────
app.post('/api/symptoms/analyze', (req, res) => {
  const { symptoms, followUpAnswers, medicalHistory, age, gender } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Symptoms are required' });

  const analysis = ai.analyzeCondition(symptoms, followUpAnswers, medicalHistory, age, gender);
  res.json(analysis);
});

// ─── NEW: Voice transcription endpoint ──────────────────────────────────────
app.post('/api/voice/transcribe', audioUpload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const client = getOpenAIClient();
  if (!client) {
    return res.status(503).json({ 
      error: 'Speech-to-text service not configured. Set GROQ_API_KEY in environment variables.' 
    });
  }

  try {
    const audioFile = new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype });
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'text'
    });

    res.json({ text: transcription.trim() });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed. Please try again or type manually.' });
  }
});

// ─── NEW: OCR endpoint for medical documents ─────────────────────────────────
app.post('/api/ocr/extract', imageUpload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const worker = await getTesseractWorker();
    
    const { data: { text } } = await worker.recognize(req.file.buffer);
    
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();

    if (!cleanedText) {
      return res.status(400).json({ error: 'No text detected in image. Please try a clearer image.' });
    }

    res.json({ text: cleanedText });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'OCR processing failed. Please try again.' });
  }
});

// ─── MODIFIED: Generate token with enriched data ────────────────────────────
app.post('/api/tokens/generate', (req, res) => {
  const {
    patient_name, patient_age, patient_gender, symptoms,
    followUpAnswers, medicalHistory, predictedConditions,
    urgency, recommendedSpecialist, analysisSummary
  } = req.body;

  // Demo: all specialists map to Dr. Rajesh (DEMO_DOCTOR_ID = 1)
  const doctorId = DEMO_DOCTOR_ID;
  const specialist = recommendedSpecialist || 'General Physician';

  db.get(
    'SELECT MAX(token_number) as last FROM tokens WHERE doctor_id = ? AND DATE(created_at) = DATE("now")',
    [doctorId],
    (err, lastToken) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const tokenNumber = (lastToken?.last || 0) + 1;
      const aiAnalysis = {
        recommended: specialist,
        priority: urgency || 'normal',
        predictedConditions: predictedConditions || [],
        analysisSummary: analysisSummary || ''
      };

      db.run(
        `INSERT INTO tokens (token_number, patient_name, patient_age, patient_gender, symptoms, follow_up_answers, medical_history, predicted_conditions, ai_analysis, recommended_specialist, doctor_id, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tokenNumber, patient_name, patient_age || null, patient_gender || null,
          symptoms, JSON.stringify(followUpAnswers || {}),
          JSON.stringify(medicalHistory || {}),
          JSON.stringify(predictedConditions || []),
          JSON.stringify(aiAnalysis), specialist, doctorId,
          urgency || 'normal'
        ],
        function(err) {
          if (err) return res.status(500).json({ error: 'Failed to generate token' });

          emitQueueUpdate(doctorId);

          res.status(201).json({
            message: 'Token generated successfully',
            token: {
              id: this.lastID,
              token_number: tokenNumber,
              patient_name,
              patient_age,
              patient_gender,
              symptoms,
              follow_up_answers: followUpAnswers,
              medical_history: medicalHistory,
              predicted_conditions: predictedConditions,
              recommended_specialist: specialist,
              priority: urgency || 'normal',
              doctor_name: 'Dr. Rajesh Kumar',
              doctor_specialization: specialist,
              status: 'waiting',
              estimated_wait: tokenNumber * 5,
              analysisSummary
            }
          });
        }
      );
    }
  );
});

// Get token details
app.get('/api/tokens/:id', (req, res) => {
  db.get(
    `SELECT t.*, d.name as doctor_name, d.specialization as doctor_specialization
     FROM tokens t LEFT JOIN doctors d ON t.doctor_id = d.id WHERE t.id = ?`,
    [req.params.id],
    (err, token) => {
      if (err || !token) return res.status(404).json({ error: 'Token not found' });
      res.json(token);
    }
  );
});

// Get all doctors
app.get('/api/doctors', (req, res) => {
  db.all('SELECT id, name, specialization, is_active FROM doctors WHERE is_active = 1', [], (err, doctors) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch doctors' });
    res.json(doctors);
  });
});

// Doctor registration
app.post('/api/doctors/register', async (req, res) => {
  const { name, specialization, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO doctors (name, specialization, email, password) VALUES (?, ?, ?, ?)',
      [name, specialization, email, hashedPassword],
      function(err) {
        if (err) return res.status(400).json({ error: 'Email already exists or invalid data' });
        res.status(201).json({ message: 'Doctor registered successfully', id: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Doctor login
app.post('/api/doctors/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM doctors WHERE email = ?', [email], async (err, doctor) => {
    if (err || !doctor) return res.status(400).json({ error: 'Doctor not found' });
    const validPassword = await bcrypt.compare(password, doctor.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign(
      { id: doctor.id, name: doctor.name, specialization: doctor.specialization },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, doctor: { id: doctor.id, name: doctor.name, specialization: doctor.specialization } });
  });
});

// Doctor: Get my tokens
app.get('/api/doctor/tokens', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM tokens WHERE doctor_id = ?
     ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'moderate' THEN 1 ELSE 2 END, created_at ASC`,
    [req.doctor.id],
    (err, tokens) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch tokens' });
      res.json(tokens);
    }
  );
});

// Doctor: Update token status (with consultation data)
app.put('/api/doctor/tokens/:id', authenticateToken, (req, res) => {
  const { status, clinical_notes, prescription } = req.body;
  const updates = ['status = ?'];
  const params = [status, req.params.id, req.doctor.id];
  
  if (clinical_notes !== undefined) {
    updates.push('clinical_notes = ?');
    params.push(clinical_notes);
  }
  if (prescription !== undefined) {
    updates.push('prescription = ?');
    params.push(JSON.stringify(prescription));
  }
  
  db.run(
    `UPDATE tokens SET ${updates.join(', ')} WHERE id = ? AND doctor_id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update token' });
      if (this.changes === 0) return res.status(404).json({ error: 'Token not found' });
      
      emitQueueUpdate(req.doctor.id);
      res.json({ message: 'Token updated successfully' });
    }
  );
});

// Get queue statistics
app.get('/api/stats', (req, res) => {
  db.get(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
      SUM(CASE WHEN status = 'in_consultation' THEN 1 ELSE 0 END) as in_consultation,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
     FROM tokens WHERE DATE(created_at) = DATE('now')`,
    [],
    (err, stats) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
      res.json(stats);
    }
  );
});

// Migration: Add clinical_notes and prescription columns if not exist
db.run(`ALTER TABLE tokens ADD COLUMN clinical_notes TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) console.log('clinical_notes column exists or error:', err.message);
});
db.run(`ALTER TABLE tokens ADD COLUMN prescription TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) console.log('prescription column exists or error:', err.message);
});

if (!process.env.VERCEL || process.env.VERCEL_DEV === '1') {
  httpServer.listen(PORT, () => {
    console.log(`MediKiosk Backend running on http://localhost:${PORT}`);
    console.log(`Socket.io server ready`);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.httpServer = httpServer;
