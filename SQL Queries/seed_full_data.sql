-- ============================================================
-- Swasthya Sathi - Full Data Seed for Production
-- Run AFTER schema.sql has been applied
-- ============================================================

-- 1. ADDITIONAL DEPARTMENTS
insert into departments (name) values
  ('Urology'),
  ('Nephrology'),
  ('Pediatrics & Neonatology'),
  ('Obstetrics & Gynecology'),
  ('Oncology'),
  ('Psychiatry & Behavioral Health'),
  ('Endocrinology & Diabetology'),
  ('General Practice & Emergency Medicine'),
  ('Neurosurgery'),
  ('Cardiothoracic & Vascular Surgery')
on conflict (name) do nothing;

-- 2. ADDITIONAL HOSPITALS
insert into hospitals (name, address, phone) values
  ('Pokhara Health Care', 'Pokhara', '+977-61-5XXXXX'),
  ('Province Hospital, Pokhara', 'Pokhara, Gandaki Province', '+977-61-5XXXXX')
on conflict (name) do nothing;

-- 3. ADDITIONAL SYMPTOMS (from all JSON sources)
insert into symptoms (name) values
  ('Persistent nasal congestion'),
  ('Post-nasal drip'),
  ('Facial pain/pressure'),
  ('Hearing loss'),
  ('Fluid drainage'),
  ('Chills'),
  ('Body ache'),
  ('Throbbing pain'),
  ('Sensitivity to light'),
  ('Neck stiffness'),
  ('Loose stools'),
  ('Abdominal cramps'),
  ('Dehydration'),
  ('Chest discomfort'),
  ('Dry or wet cough'),
  ('Difficulty swallowing'),
  ('Facial pain'),
  ('Nasal congestion'),
  ('Watery eyes'),
  ('Itchy nose'),
  ('Prolonged fever'),
  ('Weakness'),
  ('Severe body pain'),
  ('Rash'),
  ('Swelling in legs'),
  ('Breathlessness'),
  ('Joint pain'),
  ('Stiffness'),
  ('Lower back ache'),
  ('Radiating pain'),
  ('Increased thirst/urination'),
  ('Retro-orbital pain'),
  ('Petechiae'),
  ('Eschar'),
  ('Lymphadenopathy'),
  ('Altered sensorium'),
  ('Myalgia'),
  ('Step-ladder fever'),
  ('Coated tongue'),
  ('Hepatosplenomegaly'),
  ('Constipation'),
  ('Chronic progressive dyspnea'),
  ('Productive cough'),
  ('Wheezing'),
  ('Frequent respiratory infections'),
  ('Hemoptysis'),
  ('Unexplained weight loss'),
  ('Low-grade evening fever'),
  ('Rice-watery diarrhea'),
  ('Severe vomiting'),
  ('Sunken eyes'),
  ('Anuria'),
  ('Jaundice'),
  ('Dark urine'),
  ('Clay-colored stools'),
  ('Anorexia'),
  ('Right upper quadrant discomfort'),
  ('Frothy sputum'),
  ('Ataxia'),
  ('Confusion'),
  ('Slurred speech'),
  ('Excessive sleepiness'),
  ('Disorientation')
on conflict (name) do nothing;

-- 4. ADDITIONAL DOCTORS (from additional_doctors.json)
-- Map departments to their IDs
-- Pulmonology & Respiratory Medicine
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Buddhisagar Lamichhane', 'MD, DM', 'Senior Consultant Pulmonologist & Chest Physician',
  (select id from departments where name = 'Pulmonology & Respiratory Medicine'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/79/300/300'
where not exists (select 1 from doctors where name = 'Dr. Buddhisagar Lamichhane');

-- Urology
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Prof. Dr. Dhruba Bahadur Adhikari', 'MS', 'Professor & Consultant Urologist',
  (select id from departments where name = 'Urology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/80/300/300'
where not exists (select 1 from doctors where name = 'Prof. Dr. Dhruba Bahadur Adhikari');

-- Nephrology
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Bikash Khatri', 'MD, DM', 'Consultant Nephrologist & Kidney Specialist',
  (select id from departments where name = 'Nephrology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/81/300/300'
where not exists (select 1 from doctors where name = 'Dr. Bikash Khatri');

-- Pediatrics & Neonatology
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Kiran Sharma', 'MD', 'Consultant Neonatal and Pediatrician',
  (select id from departments where name = 'Pediatrics & Neonatology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/82/300/300'
where not exists (select 1 from doctors where name = 'Dr. Kiran Sharma');

-- Obstetrics & Gynecology (2 doctors)
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Rupa Paneru', 'MD Obstetrics & Gynaecology', 'Consultant Obstetrics and Gynecology',
  (select id from departments where name = 'Obstetrics & Gynecology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/83/300/300'
where not exists (select 1 from doctors where name = 'Dr. Rupa Paneru');

insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Madan Khadka', 'MS', 'Consultant Gynaec Endoscopic Surgeon & Infertility Specialist',
  (select id from departments where name = 'Obstetrics & Gynecology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/84/300/300'
where not exists (select 1 from doctors where name = 'Dr. Madan Khadka');

-- Oncology
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Deependra Man Shrestha Simangainda', 'MD', 'Consultant Medical Oncologist',
  (select id from departments where name = 'Oncology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/85/300/300'
where not exists (select 1 from doctors where name = 'Dr. Deependra Man Shrestha Simangainda');

-- Psychiatry & Behavioral Health
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Basanta Dhungana', 'MD', 'Consultant Neuropsychiatrist',
  (select id from departments where name = 'Psychiatry & Behavioral Health'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/86/300/300'
where not exists (select 1 from doctors where name = 'Dr. Basanta Dhungana');

-- Endocrinology & Diabetology
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Dipak Malla', 'MD, DM', 'Consultant Endocrinologist (Diabetes, Thyroid & Hormonal Specialist)',
  (select id from departments where name = 'Endocrinology & Diabetology'),
  (select id from hospitals where name = 'Pokhara Health Care'),
  'Specialist Clinic: Saturdays. Confirm with clinic.',
  'https://picsum.photos/id/87/300/300'
where not exists (select 1 from doctors where name = 'Dr. Dipak Malla');

-- Gastroenterology & Hepatology (2 doctors)
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Pasand Sharma', 'MD Gastroenterology', 'Consultant Gastroenterologist & Hepatologist',
  (select id from departments where name = 'Gastroenterology & Hepatology'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/88/300/300'
where not exists (select 1 from doctors where name = 'Dr. Pasand Sharma');

insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Suresh Thapa', 'MD, DM Gastroenterology', 'Consultant Gastroenterologist',
  (select id from departments where name = 'Gastroenterology & Hepatology'),
  (select id from hospitals where name = 'Fewa City Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/89/300/300'
where not exists (select 1 from doctors where name = 'Dr. Suresh Thapa');

-- General Practice & Emergency Medicine
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Pooja Sinha', 'MDGP', 'MDGP & Emergency Medicine Consultant',
  (select id from departments where name = 'General Practice & Emergency Medicine'),
  (select id from hospitals where name = 'Province Hospital, Pokhara'),
  'Emergency / General OPD. Confirm with hospital.',
  'https://picsum.photos/id/90/300/300'
where not exists (select 1 from doctors where name = 'Dr. Pooja Sinha');

-- Neurosurgery
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Bikas Thapa', 'MD, MCh', 'Consultant Brain and Spine Surgeon',
  (select id from departments where name = 'Neurosurgery'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/91/300/300'
where not exists (select 1 from doctors where name = 'Dr. Bikas Thapa');

-- Cardiothoracic & Vascular Surgery (CTVS)
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Krishna Prasad Bashyal', 'MS, MCh', 'Consultant Cardiothoracic and Vascular Surgeon',
  (select id from departments where name = 'Cardiothoracic & Vascular Surgery'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/92/300/300'
where not exists (select 1 from doctors where name = 'Dr. Krishna Prasad Bashyal');

-- Orthopedics & Joint Replacement (additional ortho doc)
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url)
select 'Dr. Manoj Kumar Tiwari', 'MS Orthopedic Surgery', 'Consultant Orthopedic, Hip/Knee Replacement & Arthroscopy Surgeon',
  (select id from departments where name = 'Orthopedics'),
  (select id from hospitals where name = 'Charak Memorial Hospital'),
  'General OPD: 9:00 AM - 1:00 PM (Sun-Fri). Confirm with hospital.',
  'https://picsum.photos/id/93/300/300'
where not exists (select 1 from doctors where name = 'Dr. Manoj Kumar Tiwari');

-- 5. ADDITIONAL DISEASE-SYMPTOM MAPPINGS (from expanded + additional JSONs)

-- Sinusitis → symptoms
insert into disease_symptoms (disease_id, symptom_id)
select d.id, s.id from diseases d, symptoms s
where d.name = 'Chronic Sinusitis' and s.name in ('Persistent nasal congestion', 'Post-nasal drip', 'Facial pain/pressure')
on conflict do nothing;

-- Tonsillitis (always map to existing if exists, else skip)
do $$
begin
  if exists (select 1 from diseases where name = 'Tonsillitis') then
    insert into disease_symptoms (disease_id, symptom_id)
    select d.id, s.id from diseases d, symptoms s
    where d.name = 'Tonsillitis' and s.name in ('Sore throat', 'Difficulty swallowing', 'Fever')
    on conflict do nothing;
  end if;
end $$;

-- Dengue additional symptoms
insert into disease_symptoms (disease_id, symptom_id)
select d.id, s.id from diseases d, symptoms s
where d.name = 'Dengue Fever' and s.name in ('Severe body pain', 'Rash', 'Retro-orbital pain', 'Petechiae')
on conflict do nothing;

-- Hypertension additional
insert into disease_symptoms (disease_id, symptom_id)
select d.id, s.id from diseases d, symptoms s
where d.name = 'Hypertension' and s.name in ('Nosebleed')
on conflict do nothing;

-- Migraine additional
insert into disease_symptoms (disease_id, symptom_id)
select d.id, s.id from diseases d, symptoms s
where d.name = 'Migraine' and s.name in ('Throbbing pain', 'Sensitivity to light')
on conflict do nothing;

-- 6. DIAGNOSTIC TESTS (from TESTS AND COST.json)
insert into diagnostic_tests (disease_id, disease_name, department, test_name, cost_range_npr, total_estimated_cost_npr, average_follow_up_time) values
('DIS_DENGUE', 'Dengue Fever / Severe Dengue', 'Tropical & Infectious Disease / General Medicine', 'Dengue NS1 Antigen Test (Days 1-5)', '1,000 - 1,500', '1,350 - 4,100', 'Daily during acute phase (Days 3-7) to monitor platelet count; 1 week post-fever recovery.'),
('DIS_DENGUE', 'Dengue Fever / Severe Dengue', 'Tropical & Infectious Disease / General Medicine', 'Dengue IgM/IgG Antibody Rapid Test', '1,000 - 2,000', '1,350 - 4,100', 'Daily during acute phase (Days 3-7) to monitor platelet count; 1 week post-fever recovery.'),
('DIS_DENGUE', 'Dengue Fever / Severe Dengue', 'Tropical & Infectious Disease / General Medicine', 'Complete Blood Count (CBC) with Platelet Count', '350 - 600', '1,350 - 4,100', 'Daily during acute phase (Days 3-7) to monitor platelet count; 1 week post-fever recovery.'),

('DIS_SCRUB_TYPHUS', 'Scrub Typhus', 'Tropical & Infectious Disease', 'Scrub Typhus IgM Antibodies (ELISA / Rapid Card)', '1,200 - 2,500', '2,200 - 4,300', '3 to 5 days after starting antibiotic therapy (Doxycycline).'),
('DIS_SCRUB_TYPHUS', 'Scrub Typhus', 'Tropical & Infectious Disease', 'Complete Blood Count (CBC) & LFT', '1,000 - 1,800', '2,200 - 4,300', '3 to 5 days after starting antibiotic therapy (Doxycycline).'),

('DIS_TYPHOID', 'Typhoid Fever (Enteric Fever)', 'Tropical & Infectious Disease / General Medicine', 'Blood Culture & Sensitivity (Gold Standard)', '800 - 1,500', '1,500 - 3,300', '3 to 5 days post-antibiotic treatment; 2 weeks for full resolution check.'),
('DIS_TYPHOID', 'Typhoid Fever (Enteric Fever)', 'Tropical & Infectious Disease / General Medicine', 'Widal Test / Typhidot IgM', '350 - 1,200', '1,500 - 3,300', '3 to 5 days post-antibiotic treatment; 2 weeks for full resolution check.'),
('DIS_TYPHOID', 'Typhoid Fever (Enteric Fever)', 'Tropical & Infectious Disease / General Medicine', 'Complete Blood Count (CBC)', '350 - 600', '1,500 - 3,300', '3 to 5 days post-antibiotic treatment; 2 weeks for full resolution check.'),

('DIS_COPD', 'Chronic Obstructive Pulmonary Disease (COPD)', 'Pulmonology & Respiratory Medicine', 'Spirometry / Pulmonary Function Test (PFT)', '1,200 - 2,500', '2,700 - 5,300', '1 month initially; every 3 to 6 months for chronic maintenance.'),
('DIS_COPD', 'Chronic Obstructive Pulmonary Disease (COPD)', 'Pulmonology & Respiratory Medicine', 'Chest X-Ray (PA View)', '500 - 800', '2,700 - 5,300', '1 month initially; every 3 to 6 months for chronic maintenance.'),
('DIS_COPD', 'Chronic Obstructive Pulmonary Disease (COPD)', 'Pulmonology & Respiratory Medicine', 'Arterial Blood Gas (ABG) [In severe cases]', '1,000 - 2,000', '2,700 - 5,300', '1 month initially; every 3 to 6 months for chronic maintenance.'),

('DIS_TB', 'Pulmonary Tuberculosis', 'Pulmonology & Respiratory Medicine', 'GeneXpert MTB/RIF Test (Sputum)', 'Free at Govt Centers / 2,000 - 3,500 in Private Labs', '800 - 4,900 (Free in DOTS Government Facilities)', 'Monthly during 6-month DOTS treatment regimen.'),
('DIS_TB', 'Pulmonary Tuberculosis', 'Pulmonology & Respiratory Medicine', 'Chest X-Ray PA View', '500 - 800', '800 - 4,900 (Free in DOTS Government Facilities)', 'Monthly during 6-month DOTS treatment regimen.'),
('DIS_TB', 'Pulmonary Tuberculosis', 'Pulmonology & Respiratory Medicine', 'Sputum AFB Smear Examination', '300 - 600', '800 - 4,900 (Free in DOTS Government Facilities)', 'Monthly during 6-month DOTS treatment regimen.'),

('DIS_AGE', 'Acute Gastroenteritis / Cholera / Diarrhea', 'Gastroenterology / General Medicine', 'Stool Routine & Microscopic Examination / Culture', '300 - 800', '1,500 - 2,900', '48 to 72 hours if symptoms persist or dehydration worsens.'),
('DIS_AGE', 'Acute Gastroenteritis / Cholera / Diarrhea', 'Gastroenterology / General Medicine', 'Serum Electrolytes (Na, K, Cl)', '700 - 1,200', '1,500 - 2,900', '48 to 72 hours if symptoms persist or dehydration worsens.'),
('DIS_AGE', 'Acute Gastroenteritis / Cholera / Diarrhea', 'Gastroenterology / General Medicine', 'Renal Function Test (Urea & Creatinine)', '500 - 900', '1,500 - 2,900', '48 to 72 hours if symptoms persist or dehydration worsens.'),

('DIS_HEP_E', 'Acute Hepatitis E', 'Gastroenterology & Hepatology', 'Hepatitis E IgM Antibody Test', '1,500 - 2,800', '3,500 - 6,500', '1 to 2 weeks to review liver enzymes until normalization.'),
('DIS_HEP_E', 'Acute Hepatitis E', 'Gastroenterology & Hepatology', 'Liver Function Test (LFT Profile)', '800 - 1,500', '3,500 - 6,500', '1 to 2 weeks to review liver enzymes until normalization.'),
('DIS_HEP_E', 'Acute Hepatitis E', 'Gastroenterology & Hepatology', 'Ultrasound (USG) Abdomen & Pelvis', '1,200 - 2,200', '3,500 - 6,500', '1 to 2 weeks to review liver enzymes until normalization.'),

('DIS_AMS_HAPE', 'HAPE / HACE (High Altitude Pulmonary/Cerebral Edema)', 'High-Altitude & Emergency Medicine', 'Pulse Oximetry & Clinical Ataxia Screening', 'Included in Triage / Minimal', '2,000 - 8,000 (Excludes Evacuation Costs)', '24 hours post-descent; 1 week post-emergency stabilization.'),
('DIS_AMS_HAPE', 'HAPE / HACE (High Altitude Pulmonary/Cerebral Edema)', 'High-Altitude & Emergency Medicine', 'Chest X-Ray / CT Brain (Post-evacuation)', '1,000 - 6,000', '2,000 - 8,000 (Excludes Evacuation Costs)', '24 hours post-descent; 1 week post-emergency stabilization.'),
('DIS_AMS_HAPE', 'HAPE / HACE (High Altitude Pulmonary/Cerebral Edema)', 'High-Altitude & Emergency Medicine', 'Arterial Blood Gas (ABG)', '1,000 - 2,000', '2,000 - 8,000 (Excludes Evacuation Costs)', '24 hours post-descent; 1 week post-emergency stabilization.'),

('DIS_COMMON_COLD_SINUS', 'Common Cold / Sinusitis / Allergic Rhinitis', 'ENT / General Medicine', 'Clinical Examination / Diagnostic Nasal Endoscopy', '1,000 - 2,500', '500 - 3,400', '7 to 10 days if symptoms do not improve.'),
('DIS_COMMON_COLD_SINUS', 'Common Cold / Sinusitis / Allergic Rhinitis', 'ENT / General Medicine', 'X-Ray Paranasal Sinuses (PNS) [If persistent]', '500 - 900', '500 - 3,400', '7 to 10 days if symptoms do not improve.'),

('DIS_DIABETES_T2', 'Type 2 Diabetes Mellitus', 'General Medicine / Endocrinology', 'Fasting & Postprandial Blood Sugar (FBS/PPBS)', '250 - 450', '1,950 - 3,650', '2 to 4 weeks after starting medication; every 3 months for HbA1c.'),
('DIS_DIABETES_T2', 'Type 2 Diabetes Mellitus', 'General Medicine / Endocrinology', 'HbA1c (Glycated Hemoglobin)', '700 - 1,200', '1,950 - 3,650', '2 to 4 weeks after starting medication; every 3 months for HbA1c.'),
('DIS_DIABETES_T2', 'Type 2 Diabetes Mellitus', 'General Medicine / Endocrinology', 'Urine Microalbumin / Lipid Profile', '1,000 - 2,000', '1,950 - 3,650', '2 to 4 weeks after starting medication; every 3 months for HbA1c.'),

('DIS_CAD_ANGINA', 'Coronary Artery Disease / Angina', 'Cardiology', '12-Lead Electrocardiogram (ECG)', '400 - 800', '3,900 - 7,300', 'Immediate ER evaluation for acute pain; 2 weeks for chronic angina adjustment.'),
('DIS_CAD_ANGINA', 'Coronary Artery Disease / Angina', 'Cardiology', 'Echocardiogram (2D Echo)', '2,000 - 3,500', '3,900 - 7,300', 'Immediate ER evaluation for acute pain; 2 weeks for chronic angina adjustment.'),
('DIS_CAD_ANGINA', 'Coronary Artery Disease / Angina', 'Cardiology', 'Troponin-I / Lipid Profile', '1,500 - 3,000', '3,900 - 7,300', 'Immediate ER evaluation for acute pain; 2 weeks for chronic angina adjustment.'),

('DIS_OSTEOARTHRITIS', 'Osteoarthritis / Joint Diseases', 'Orthopedics', 'X-Ray of Affected Joint (Weight-Bearing View)', '600 - 1,200', '1,400 - 2,700', '1 month after initiating physical therapy/pain management.'),
('DIS_OSTEOARTHRITIS', 'Osteoarthritis / Joint Diseases', 'Orthopedics', 'Serum Uric Acid & RA Factor (To rule out Gout/RA)', '800 - 1,500', '1,400 - 2,700', '1 month after initiating physical therapy/pain management.'),

('DIS_STROKE_MIGRAINE', 'Stroke / Migraine / Neurological Issues', 'Neurology', 'CT Scan Head (Non-contrast for suspected Stroke)', '3,500 - 6,000', '4,500 - 21,800', 'Immediate emergency for Stroke; 2 to 4 weeks for Migraine management.'),
('DIS_STROKE_MIGRAINE', 'Stroke / Migraine / Neurological Issues', 'Neurology', 'MRI Brain (If indicated)', '8,000 - 14,000', '4,500 - 21,800', 'Immediate emergency for Stroke; 2 to 4 weeks for Migraine management.'),
('DIS_STROKE_MIGRAINE', 'Stroke / Migraine / Neurological Issues', 'Neurology', 'Fasting Blood Glucose & Lipid Profile', '1,000 - 1,800', '4,500 - 21,800', 'Immediate emergency for Stroke; 2 to 4 weeks for Migraine management.'),

('DIS_CATARACT', 'Cataract', 'Ophthalmology', 'Slit Lamp Examination & Refraction Test', '300 - 700', '1,100 - 2,200', 'Day 1, 1 week, and 1 month post-cataract surgery.'),
('DIS_CATARACT', 'Cataract', 'Ophthalmology', 'A-Scan Biometry (Pre-surgery intraocular lens calculation)', '800 - 1,500', '1,100 - 2,200', 'Day 1, 1 week, and 1 month post-cataract surgery.'),

('DIS_FUNGAL_INFECTION', 'Fungal Skin Infections / Dermatosis', 'Dermatology', 'KOH Mount Skin Scraping Examination', '400 - 800', '400 - 1,800', '2 to 3 weeks after starting topical/oral antifungal treatments.'),
('DIS_FUNGAL_INFECTION', 'Fungal Skin Infections / Dermatosis', 'Dermatology', 'Wood''s Lamp Examination', '500 - 1,000', '400 - 1,800', '2 to 3 weeks after starting topical/oral antifungal treatments.');

-- 7. EDGE CASES (from ADDITIONAL DISEASES.json)
insert into edge_cases (case_id, title, patient_profile, reported_symptoms, diagnostic_challenge, expected_department, recommended_action) values
('EDGE_001', 'Atypical Scrub Typhus vs. Meningitis Presentation',
 '32-year-old male farmer from Chitwan',
 ARRAY['High fever for 6 days', 'Severe confusion and altered behavior', 'Neck stiffness', 'Small black eschar mark hidden near groin region'],
 'Symptoms mimic pyogenic meningitis or encephalitis due to neurological alteration. Misrouting to Neurology without checking for vector-borne eschar can delay critical Doxycycline administration.',
 'Tropical & Infectious Disease / Critical Care',
 'High-priority triage: Route to Infectious Diseases or ER immediately due to signs of systemic infection with CNS involvement.'),

('EDGE_002', 'Atypical Dengue Manifesting as Acute Abdomen',
 '24-year-old female from Kathmandu',
 ARRAY['Sudden high fever resolving on day 4', 'Severe continuous right-upper quadrant abdominal pain', 'Persistent vomiting', 'Extreme fatigue and cold clammy extremities'],
 'Often misidentified as acute appendicitis or acute cholecystitis (Surgical Gastroenterology). However, this marks the critical capillary leak phase of Severe Dengue Hemorrhagic Fever.',
 'Emergency Medicine / Infectious Disease',
 'Critical Emergency Warning: Flag plasma leakage phase of Severe Dengue. Immediate fluid management in ER required.'),

('EDGE_003', 'Severe Altitude Sickness (HACE) Mimicking Acute Stroke',
 '45-year-old trekker at Mustang (3,800m altitude)',
 ARRAY['Inability to walk straight (staggering gait)', 'Slurred speech', 'Severe headache', 'Extreme drowsiness'],
 'Looks like an acute ischemic stroke (Neurology). At high altitude, this pattern points directly to High Altitude Cerebral Edema (HACE).',
 'High-Altitude Medicine / Emergency Evacuation',
 'Emergency Altitude Protocol: Primary trigger must order immediate descent/oxygen therapy alongside referral to High-Altitude Medicine.'),

('EDGE_004', 'Fulminant Hepatitis E in Pregnancy',
 '26-year-old pregnant female (3rd trimester) from Biratnagar',
 ARRAY['Progressive yellowish discoloration of eyes for 3 days', 'Tea-colored urine', 'Excessive sleepiness and disorientation (early encephalopathy)', 'Frequent vomiting'],
 'Presents as routine gastroenterology/jaundice issue, but Hepatitis E in 3rd-trimester pregnancy carries high mortality from Acute Liver Failure.',
 'Hepatology / High-Risk Obstetrics / ICU',
 'High-Risk Multi-Specialty Flag: Alert both Hepatology and Obstetrics for rapid triage to prevent acute hepatic necrosis.');
