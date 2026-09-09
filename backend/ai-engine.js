// MediKiosk Enhanced AI Engine
const symptomClusters = {
  cardiovascular: ['chest pain','heart','palpitations','shortness of breath','breathing difficulty','high blood pressure','hypertension','irregular heartbeat','arm pain','jaw pain','swollen ankles','edema','fainting','syncope','cyanosis'],
  respiratory: ['cough','asthma','breathing','respiratory','pneumonia','bronchitis','tuberculosis','sleep apnea','wheezing','sputum','phlegm','chest tightness'],
  neurological: ['headache','migraine','dizziness','numbness','tingling','seizure','memory loss','confusion','stroke','tremor','paralysis','vertigo','burning sensation','weakness','loss of consciousness'],
  gastrointestinal: ['stomach','digestive','acid reflux','heartburn','bloating','nausea','vomiting','diarrhea','constipation','ulcer','liver','hepatitis','abdominal pain','indigestion','loss of appetite','gas','blood in stool','loose stools'],
  musculoskeletal: ['bone','joint pain','fracture','back pain','knee pain','shoulder pain','arthritis','sprain','muscle pain','neck pain','sports injury','swelling','stiffness','limited movement','muscle cramp'],
  dermatological: ['skin','rash','acne','eczema','psoriasis','itching','hair loss','pigmentation','mole','blemish','dermatology','wound','burn','blister','dry skin','oily skin'],
  ent: ['ear','nose','throat','sinus','tonsil','hearing loss','tinnitus','sore throat','nasal congestion','voice change','snoring','difficulty swallowing','earache'],
  ophthalmic: ['eye','vision','blurred vision','eye pain','red eye','glaucoma','cataract','glasses','contact lens','dry eyes','watery eyes','double vision','light sensitivity'],
  psychiatric: ['anxiety','depression','stress','insomnia','mental health','mood swings','panic attack','obsession','bipolar','irritability','hopelessness','fatigue','sleep problems'],
  urological: ['urinary','kidney','bladder','prostate','urination','kidney stone','uti','incontinence','frequent urination','burning urination','blood in urine'],
  gynecological: ['pregnancy','menstrual','period','ovarian','uterine','vaginal','breast','contraception','fertility','irregular periods','heavy bleeding']
};

const followUpQuestionsByCluster = {
  cardiovascular: [
    { id:'cv_onset', question:'When did this start?', options:['Sudden onset','Gradual over days','Gradual over weeks','Comes and goes'] },
    { id:'cv_severity', question:'How would you rate the severity?', options:['Mild','Moderate','Severe','Very severe / Worst ever'] },
    { id:'cv_trigger', question:'Does it get worse with any of these?', options:['Physical activity / climbing stairs','Rest / lying down','No specific trigger','Emotional stress'] },
    { id:'cv_associated', question:'Do you also experience any of these?', options:['Sweating','Nausea / vomiting','Dizziness / lightheadedness','Arm / jaw pain','None of these'] }
  ],
  respiratory: [
    { id:'resp_onset', question:'When did this start?', options:['Sudden onset','Gradual over days','Gradual over weeks','Chronic / recurring'] },
    { id:'resp_cough_type', question:'What type of cough do you have?', options:['Dry cough','Wet / productive cough','Cough with blood','Barking cough'] },
    { id:'resp_fever', question:'Do you have fever?', options:['No fever','Low-grade fever','High fever','Fever with chills'] },
    { id:'resp_severity', question:'How severe is the breathing difficulty?', options:['No breathing difficulty','Mild - only on exertion','Moderate - at rest too','Severe - cannot speak full sentences'] }
  ],
  neurological: [
    { id:'neuro_onset', question:'When did this start?', options:['Sudden onset','Gradual over days','Gradual over weeks','Recurrent episodes'] },
    { id:'neuro_location', question:'Where is the discomfort?', options:['One side of head/body','Both sides','All over','Specific area'] },
    { id:'neuro_severity', question:'How would you rate the severity?', options:['Mild','Moderate','Severe','Worst ever experienced'] },
    { id:'neuro_associated', question:'Do you also experience any of these?', options:['Vision changes','Numbness / tingling','Nausea / vomiting','Difficulty speaking','None of these'] }
  ],
  gastrointestinal: [
    { id:'gi_location', question:'Where is the pain/discomfort?', options:['Upper abdomen','Lower abdomen','Right side','Left side','All over abdomen'] },
    { id:'gi_severity', question:'How severe is it?', options:['Mild discomfort','Moderate pain','Severe pain','Cannot tolerate'] },
    { id:'gi_associated', question:'Do you also experience any of these?', options:['Nausea / vomiting','Diarrhea','Constipation','Bloating / gas','None of these'] },
    { id:'gi_onset', question:'When did this start?', options:['After eating','After fasting','Sudden onset','Gradual over days'] }
  ],
  musculoskeletal: [
    { id:'msk_location', question:'Where is the pain?', options:['Upper back','Lower back','Neck','Joints (knees/hips/etc)','Limbs (arms/legs)'] },
    { id:'msk_onset', question:'How did this start?', options:['After injury / accident','Gradual over time','After physical activity','No apparent cause'] },
    { id:'msk_severity', question:'How severe is the pain?', options:['Mild - tolerable','Moderate - affects daily activities','Severe - difficult to move','Extreme - cannot move the area'] },
    { id:'msk_duration', question:'How long have you had this?', options:['Less than 1 day','1-3 days','1-2 weeks','More than 2 weeks','Months / chronic'] }
  ],
  dermatological: [
    { id:'derm_location', question:'Where on the body?', options:['Face / head','Torso / chest / back','Arms / hands','Legs / feet','Multiple areas'] },
    { id:'derm_appearance', question:'What does it look like?', options:['Red / inflamed bumps','Flat rash','Raised bumps / pimples','Blister / sore','Discoloration / patches'] },
    { id:'derm_sensation', question:'Do you feel any of these?', options:['Itching','Burning','Pain / tenderness','No sensation'] },
    { id:'derm_duration', question:'How long have you noticed this?', options:['Less than 1 day','A few days','1-2 weeks','More than a month','Recurring for months'] }
  ],
  ent: [
    { id:'ent_area', question:'Which area is affected?', options:['Ear(s)','Nose / sinuses','Throat','Multiple areas'] },
    { id:'ent_severity', question:'How severe is it?', options:['Mild','Moderate','Severe','Very severe'] },
    { id:'ent_duration', question:'How long have you had this?', options:['Less than 1 day','1-3 days','1-2 weeks','More than 2 weeks','Recurring'] },
    { id:'ent_associated', question:'Do you also have any of these?', options:['Fever','Difficulty swallowing','Hearing changes','Nasal discharge','None of these'] }
  ],
  ophthalmic: [
    { id:'eye_symptom', question:'What is your main eye complaint?', options:['Blurred vision','Eye pain','Redness','Discharge / watering','Floaters / flashes'] },
    { id:'eye_onset', question:'When did this start?', options:['Sudden','Gradual over days','Gradual over weeks','Recurring'] },
    { id:'eye_eye', question:'Which eye is affected?', options:['Left eye only','Right eye only','Both eyes'] },
    { id:'eye_trauma', question:'Any injury or exposure?', options:['Yes - injury to eye','Yes - chemical / foreign body','No injury','Not sure'] }
  ],
  psychiatric: [
    { id:'psych_symptom', question:'What is your main concern?', options:['Persistent sadness','Excessive worry / anxiety','Sleep problems','Loss of interest','Mood changes'] },
    { id:'psych_duration', question:'How long have you felt this way?', options:['Less than 1 week','1-4 weeks','1-3 months','More than 3 months','Years'] },
    { id:'psych_severity', question:'How is it affecting your daily life?', options:['Barely noticeable','Mildly - can manage','Moderately - struggling','Severely - cannot function'] },
    { id:'psych_sleep', question:'How is your sleep?', options:['Normal','Difficulty falling asleep','Waking up frequently','Sleeping too much','Not sleeping at all'] }
  ],
  urological: [
    { id:'uro_symptom', question:'What is your main urinary symptom?', options:['Pain / burning during urination','Frequent urination','Blood in urine','Difficulty starting','Incontinence'] },
    { id:'uro_onset', question:'When did this start?', options:['Sudden','Gradual over days','Gradual over weeks','Recurring'] },
    { id:'uro_severity', question:'How severe is it?', options:['Mild','Moderate','Severe','With fever / chills'] },
    { id:'uro_flank', question:'Any back / side pain?', options:['No back pain','Mild lower back pain','Severe flank / side pain','Pain radiating to groin'] }
  ],
  gynecological: [
    { id:'gyn_symptom', question:'What is your main concern?', options:['Menstrual irregularity','Pelvic pain','Abnormal discharge','Breast changes','Pregnancy-related'] },
    { id:'gyn_onset', question:'When did this start?', options:['This cycle','Past few cycles','Gradual over months','Sudden onset'] },
    { id:'gyn_severity', question:'How severe is it?', options:['Mild','Moderate','Severe','With heavy bleeding'] },
    { id:'gyn_additional', question:'Any additional symptoms?', options:['Fever','Nausea / vomiting','Dizziness','Foul-smelling discharge','None'] }
  ]
};

const medicalHistoryQuestions = [
  { id:'conditions', question:'Do you have any pre-existing conditions?', type:'multi-select', options:['Diabetes','Hypertension','Asthma / COPD','Heart Disease','Thyroid Disorder','Kidney Disease','Liver Disease','Cancer','None of the above'] },
  { id:'allergies', question:'Do you have any known allergies?', type:'text', placeholder:'e.g., Penicillin, Peanuts, Dust, or None' },
  { id:'medications', question:'Are you currently taking any medications?', type:'text', placeholder:'e.g., Metformin 500mg, Amlodipine 5mg, or None' },
  { id:'surgeries', question:'Have you had any previous surgeries?', type:'text', placeholder:'e.g., Appendectomy 2015, or None' },
  { id:'family_history', question:'Any significant family medical history?', type:'text', placeholder:'e.g., Father had heart disease, or None' }
];

const conditionKnowledgeBase = [
  { name:'Acute Coronary Syndrome', cluster:'cardiovascular', specialist:'Cardiologist',
    symptoms:['chest pain','shortness of breath','sweating','arm pain','jaw pain'],
    riskFactors:['Diabetes','Hypertension','Heart Disease'], urgencyBoost:['sudden onset','very severe','sweating','arm pain'],
    description:'Reduced blood flow to the heart muscle. Requires immediate cardiac evaluation.' },
  { name:'Hypertensive Emergency', cluster:'cardiovascular', specialist:'Cardiologist',
    symptoms:['chest pain','high blood pressure','headache','blurred vision','breathing difficulty'],
    riskFactors:['Hypertension','Kidney Disease'], urgencyBoost:['sudden onset','very severe'],
    description:'Dangerously elevated blood pressure causing organ damage risk.' },
  { name:'Cardiac Arrhythmia', cluster:'cardiovascular', specialist:'Cardiologist',
    symptoms:['palpitations','dizziness','chest pain','fainting'],
    riskFactors:['Heart Disease','Thyroid Disorder'], urgencyBoost:['sudden onset','fainting'],
    description:'Irregular heart rhythm that may require investigation and treatment.' },
  { name:'Pneumonia', cluster:'respiratory', specialist:'Pulmonologist',
    symptoms:['cough','fever','breathing difficulty','chest pain','sputum'],
    riskFactors:['Asthma / COPD','Diabetes'], urgencyBoost:['high fever','severe'],
    description:'Infection of the lung tissue requiring antibiotics and respiratory support.' },
  { name:'Acute Asthma Exacerbation', cluster:'respiratory', specialist:'Pulmonologist',
    symptoms:['wheezing','breathing difficulty','cough','chest tightness'],
    riskFactors:['Asthma / COPD'], urgencyBoost:['severe','cannot speak full sentences'],
    description:'Acute worsening of asthma symptoms requiring bronchodilator therapy.' },
  { name:'Bronchitis', cluster:'respiratory', specialist:'Pulmonologist',
    symptoms:['cough','sputum','chest discomfort','low-grade fever'],
    riskFactors:[], urgencyBoost:['cough with blood'],
    description:'Inflammation of the bronchial tubes, often viral. Usually self-limiting.' },
  { name:'Migraine', cluster:'neurological', specialist:'Neurologist',
    symptoms:['headache','nausea','vision changes','light sensitivity'],
    riskFactors:[], urgencyBoost:['worst ever experienced','sudden onset'],
    description:'Recurrent headache disorder with neurological symptoms.' },
  { name:'Tension Headache', cluster:'neurological', specialist:'Neurologist',
    symptoms:['headache','neck pain','stress'],
    riskFactors:[], urgencyBoost:[],
    description:'Most common type of headache, often stress-related.' },
  { name:'Gastroesophageal Reflux Disease (GERD)', cluster:'gastrointestinal', specialist:'Gastroenterologist',
    symptoms:['heartburn','acid reflux','chest pain','bloating'],
    riskFactors:[], urgencyBoost:['severe'],
    description:'Chronic acid reflux causing esophageal irritation.' },
  { name:'Peptic Ulcer Disease', cluster:'gastrointestinal', specialist:'Gastroenterologist',
    symptoms:['abdominal pain','nausea','bloating','loss of appetite'],
    riskFactors:[], urgencyBoost:['blood in stool','severe'],
    description:'Open sore in the stomach or duodenum lining.' },
  { name:'Appendicitis', cluster:'gastrointestinal', specialist:'General Physician',
    symptoms:['abdominal pain','nausea','vomiting','fever'],
    riskFactors:[], urgencyBoost:['sudden onset','severe'],
    description:'Inflammation of the appendix requiring surgical evaluation.' },
  { name:'Lumbar Disc Herniation', cluster:'musculoskeletal', specialist:'Orthopedic',
    symptoms:['back pain','numbness','tingling','leg pain'],
    riskFactors:[], urgencyBoost:['severe','numbness'],
    description:'Herniated disc in the lower back pressing on nerves.' },
  { name:'Osteoarthritis', cluster:'musculoskeletal', specialist:'Orthopedic',
    symptoms:['joint pain','stiffness','swelling','limited movement'],
    riskFactors:[], urgencyBoost:[],
    description:'Degenerative joint disease causing cartilage breakdown.' },
  { name:'Contact Dermatitis', cluster:'dermatological', specialist:'Dermatologist',
    symptoms:['rash','itching','redness','skin irritation'],
    riskFactors:[], urgencyBoost:[],
    description:'Skin reaction from contact with an irritant or allergen.' },
  { name:'Acute Sinusitis', cluster:'ent', specialist:'ENT Specialist',
    symptoms:['nasal congestion','facial pain','headache','fever'],
    riskFactors:[], urgencyBoost:['high fever','severe'],
    description:'Inflammation of the sinus passages, often following a cold.' },
  { name:'Acute Otitis Media', cluster:'ent', specialist:'ENT Specialist',
    symptoms:['earache','fever','hearing loss'],
    riskFactors:[], urgencyBoost:['high fever','severe'],
    description:'Middle ear infection common in adults and children.' },
  { name:'Diabetic Emergency', cluster:'cardiovascular', specialist:'Cardiologist',
    symptoms:['dizziness','confusion','sweating','weakness'],
    riskFactors:['Diabetes'], urgencyBoost:['sudden onset','severe','confusion'],
    description:'Blood sugar emergency requiring immediate intervention.' }
];

function clusterSymptoms(symptoms) {
  const lower = symptoms.toLowerCase();
  const scores = {};
  for (const [cluster, keywords] of Object.entries(symptomClusters)) {
    scores[cluster] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[cluster]++;
    }
  }
  let best = 'general';
  let bestScore = 0;
  for (const [cluster, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = cluster; }
  }
  return { cluster: best, scores };
}

function generateFollowUpQuestions(cluster) {
  return followUpQuestionsByCluster[cluster] || followUpQuestionsByCluster.neurological;
}

function getMedicalHistoryQuestions() {
  return medicalHistoryQuestions;
}

function analyzeCondition(symptoms, followUpAnswers, medicalHistory, age, gender) {
  const allText = [symptoms, ...Object.values(followUpAnswers || {})].join(' ').toLowerCase();
  const { cluster } = clusterSymptoms(symptoms);

  const conditions = conditionKnowledgeBase.filter(c => c.cluster === cluster);

  const userConditions = medicalHistory?.conditions || [];
  const scored = conditions.map(cond => {
    let score = 0;
    for (const kw of cond.symptoms) {
      if (allText.includes(kw)) score += 20;
    }
    for (const rf of cond.riskFactors) {
      if (userConditions.includes(rf)) score += 15;
    }
    for (const ub of cond.urgencyBoost) {
      if (allText.includes(ub)) score += 10;
    }
    if (age > 50 && cluster === 'cardiovascular') score += 10;
    if (age > 60 && cluster === 'neurological') score += 5;
    return { ...cond, confidence: Math.min(score, 98) };
  });

  scored.sort((a, b) => b.confidence - a.confidence);
  const topConditions = scored.filter(c => c.confidence > 0).slice(0, 3);

  if (topConditions.length === 0) {
    topConditions.push({
      name: cluster === 'general' ? 'General Illness' : cluster.charAt(0).toUpperCase() + cluster.slice(1) + ' Condition',
      cluster, specialist: 'General Physician', confidence: 40,
      description: 'Based on the symptoms provided, a general evaluation is recommended.'
    });
  }

  let urgency = 'normal';
  const urgentKeywords = ['sudden onset', 'very severe', 'chest pain', 'stroke', 'unconscious', 'severe'];
  for (const kw of urgentKeywords) {
    if (allText.includes(kw)) { urgency = 'moderate'; break; }
  }
  const veryUrgentKeywords = ['chest pain', 'stroke', 'unconscious', 'cannot speak'];
  for (const kw of veryUrgentKeywords) {
    if (allText.includes(kw)) { urgency = 'urgent'; break; }
  }

  const specialist = topConditions[0].specialist || 'General Physician';

  return {
    predictedConditions: topConditions.map(c => ({ name: c.name, confidence: c.confidence, description: c.description })),
    urgency,
    recommendedSpecialist: specialist,
    detectedCluster: cluster,
    analysisSummary: 'Symptoms analyzed in the ' + cluster + ' category. Based on the reported symptoms' + (age ? ' (age: ' + age + ')' : '') + (gender ? ', gender: ' + gender : '') + ', the system identified ' + topConditions.length + ' possible condition(s). This is an AI-generated draft for doctor review only - not a diagnosis.'
  };
}

module.exports = {
  symptomClusters,
  followUpQuestionsByCluster,
  medicalHistoryQuestions,
  conditionKnowledgeBase,
  clusterSymptoms,
  generateFollowUpQuestions,
  getMedicalHistoryQuestions,
  analyzeCondition
};
