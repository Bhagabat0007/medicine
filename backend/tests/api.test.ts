import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoData } from '../src/seed.js';
import { db } from '../src/db/database.js';

const app = createApp();

beforeAll(() => {
  seedDemoData();
});

describe('Session lifecycle', () => {
  it('creates a patient', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .send({ name: 'Asha Devi', age: 45, gender: 'F' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Asha Devi');
    expect(res.body.data.token).toBeTruthy();
  });

  it('creates a session for a patient', async () => {
    const patient = Array.from(db.patients.values())[0];
    const res = await request(app)
      .post('/api/v1/sessions')
      .send({ patient_id: patient.id, language: 'en' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONSENT_PENDING');
    expect(res.body.data.priority).toBe('NORMAL');
  });

  it('returns 404 for an invalid session', async () => {
    const res = await request(app).get('/api/v1/sessions/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('rejects invalid patients', async () => {
    const res = await request(app).post('/api/v1/patients').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('Consent', () => {
  it('records consent for a session', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/consent`)
      .send({ consent_given: true });
    expect(res.status).toBe(201);
    expect(res.body.data.consent_given).toBe(true);
  });
});

describe('Interview engine', () => {
  it('starts the interview with the first question', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });

    // give consent
    await request(app).post(`/api/v1/sessions/${sess.body.data.id}/consent`).send({ consent_given: true });

    const res = await request(app).post(`/api/v1/sessions/${sess.body.data.id}/interview/start`);
    expect(res.status).toBe(200);
    expect(res.body.data.question.question_id).toBe('chief_complaint');
  });

  it('requires consent before interview', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const res = await request(app).post(`/api/v1/sessions/${sess.body.data.id}/interview/start`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('generates adaptive follow-up questions', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;
    await request(app).post(`/api/v1/sessions/${sessionId}/consent`).send({ consent_given: true });
    await request(app).post(`/api/v1/sessions/${sessionId}/interview/start`);

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/interview/answer`)
      .send({ question_id: 'chief_complaint', answer: 'I have chest pain', input_type: 'voice' });

    expect(res.status).toBe(200);
    expect(res.body.data.next_question).toBeTruthy();
    expect(res.body.data.next_question.question_id).toBeDefined();
  });
});

describe('Red-flag detection', () => {
  it('flags chest pain + breathlessness as URGENT', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;
    await request(app).post(`/api/v1/sessions/${sessionId}/consent`).send({ consent_given: true });
    await request(app).post(`/api/v1/sessions/${sessionId}/interview/start`);

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/interview/answer`)
      .send({ question_id: 'chief_complaint', answer: 'Chest pain and difficulty breathing', input_type: 'voice' });

    expect(res.body.data.priority).toBe('URGENT');

    const priority = await request(app).get(`/api/v1/sessions/${sessionId}/priority`);
    expect(priority.body.data.triage_alert).toBe(true);
    expect(priority.body.data.priority).toBe('URGENT');
  });

  it('keeps normal symptoms as NORMAL', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;
    await request(app).post(`/api/v1/sessions/${sessionId}/consent`).send({ consent_given: true });
    await request(app).post(`/api/v1/sessions/${sessionId}/interview/start`);

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/interview/answer`)
      .send({ question_id: 'chief_complaint', answer: 'I have a mild headache', input_type: 'text' });

    expect(res.body.data.priority).toBe('NORMAL');
  });
});

describe('Documents / OCR', () => {
  it('rejects unsupported file types', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/documents`)
      .attach('file', Buffer.from('not an image'), { filename: 'report.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE');
  });

  it('processes a valid image into structured OCR output', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId}/documents`)
      .attach('file', Buffer.from('fake-jpeg-data'), { filename: 'prescription.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PROCESSED');
    expect(res.body.data.document_type).toBeTruthy();
    expect(Array.isArray(res.body.data.medicines)).toBe(true);
  });
});

describe('Summary + doctor', () => {
  it('generates a summary for a completed session', async () => {
    const patient = Array.from(db.patients.values())[0];
    const sess = await request(app).post('/api/v1/sessions').send({ patient_id: patient.id });
    const sessionId = sess.body.data.id;
    await request(app).post(`/api/v1/sessions/${sessionId}/consent`).send({ consent_given: true });
    await request(app).post(`/api/v1/sessions/${sessionId}/interview/start`);
    await request(app)
      .post(`/api/v1/sessions/${sessionId}/interview/answer`)
      .send({ question_id: 'chief_complaint', answer: 'Chest pain', input_type: 'voice' });

    const res = await request(app).post(`/api/v1/sessions/${sessionId}/summary`);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.chief_complaint.text).toContain('Chest pain');
    expect(res.body.data.integration.mock).toBe(true);
  });

  it('lists the doctor queue', async () => {
    const res = await request(app).get('/api/v1/doctor/queue');
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('lets the doctor edit and confirm a summary', async () => {
    const patient = Array.from(db.patients.values())[0];
    const patientId = patient.id;

    const edit = await request(app)
      .patch(`/api/v1/doctor/patients/${patientId}/summary`)
      .send({ chief_complaint: 'Chest pain for 2 days' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.chief_complaint.text).toBe('Chest pain for 2 days');

    const confirm = await request(app).post(`/api/v1/doctor/patients/${patientId}/summary/confirm`);
    expect(confirm.body.data.status).toBe('CONFIRMED');
  });
});
