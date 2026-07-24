-- ============================================================
-- Swasthya Sathi G�� Supabase Database Schema
-- Migration for PostgreSQL via Supabase SQL Editor
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1a. User Profiles (patients & doctors)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('patient', 'doctor')),
  name          text not null,
  email         text,
  phone         text,
  avatar_url    text,
  blood_group   text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  swasthya_id   text unique,
  date_of_birth date,
  address       text,
  gender        text check (gender in ('male','female','other')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 1b. Medical Departments
create table departments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  nepali_name   text,
  description   text,
  created_at    timestamptz not null default now()
);

-- 1c. Hospitals
create table hospitals (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text,
  phone         text,
  lat           numeric,
  lng           numeric,
  created_at    timestamptz not null default now()
);

-- 1d. Doctors
create table doctors (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references profiles(id) on delete set null,
  name          text not null,
  qualification text,
  specialty     text,
  department_id uuid references departments(id),
  hospital_id   uuid references hospitals(id),
  opd_timing    text,
  photo_url     text,
  license_no    text unique,
  created_at    timestamptz not null default now()
);

-- 1e. Diseases
create table diseases (
  id              uuid primary key default gen_random_uuid(),
  department_id   uuid references departments(id),
  name            text not null,
  nepali_name     text,
  description     text,
  nepal_context   text,
  created_at      timestamptz not null default now()
);

-- 1f. Symptoms
create table symptoms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  nepali_name   text,
  created_at    timestamptz not null default now()
);

-- 1g. Disease-Symptom mapping
create table disease_symptoms (
  disease_id    uuid references diseases(id) on delete cascade,
  symptom_id    uuid references symptoms(id) on delete cascade,
  primary key (disease_id, symptom_id)
);

-- 1h. Disease-disease related mapping
create table disease_relations (
  disease_id      uuid references diseases(id) on delete cascade,
  related_disease_id uuid references diseases(id) on delete cascade,
  primary key (disease_id, related_disease_id),
  check (disease_id <> related_disease_id)
);

-- 1i. Patient Vitals
create table vitals (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  temperature     numeric(4,1),
  blood_pressure_systolic smallint,
  blood_pressure_diastolic smallint,
  heart_rate       smallint,
  spo2             smallint check (spo2 between 0 and 100),
  recorded_at      timestamptz not null default now(),
  notes            text
);

-- 1j. Appointments
create table appointments (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid references doctors(id),
  hospital_id     uuid references hospitals(id),
  appointment_date date not null,
  appointment_time time,
  status          text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no-show')),
  reason          text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- 1k. Prescriptions / Medications
create table prescriptions (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid references doctors(id),
  medication_name text not null,
  dosage          text,
  frequency       text,
  route           text,
  start_date      date,
  end_date        date,
  status          text not null default 'active' check (status in ('active','completed','discontinued')),
  notes           text,
  prescribed_at   timestamptz not null default now()
);

-- 1l. Health Records / Visit History
create table health_records (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid references doctors(id),
  hospital_id     uuid references hospitals(id),
  visit_date      date not null,
  diagnosis       text,
  treatment       text,
  notes           text,
  record_type     text not null default 'visit' check (record_type in ('visit','lab','report','immunization')),
  status          text not null default 'completed' check (status in ('completed','ongoing','pending')),
  created_at      timestamptz not null default now()
);

-- 1m. AI Chat Messages
create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  role            text not null check (role in ('patient','assistant')),
  content         text not null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- 1n. Emergency Contacts
create table emergency_contacts (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  name            text not null,
  relationship    text,
  phone           text not null,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

-- 1o. Notifications
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  title           text not null,
  body            text,
  type            text not null check (type in ('appointment','medication','alert','general')),
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

create index idx_profiles_role on profiles(role);
create index idx_profiles_swasthya_id on profiles(swasthya_id);
create index idx_doctors_department on doctors(department_id);
create index idx_doctors_hospital on doctors(hospital_id);
create index idx_diseases_department on diseases(department_id);
create index idx_vitals_patient on vitals(patient_id, recorded_at desc);
create index idx_appointments_patient on appointments(patient_id, appointment_date desc);
create index idx_appointments_doctor on appointments(doctor_id, appointment_date desc);
create index idx_prescriptions_patient on prescriptions(patient_id);
create index idx_health_records_patient on health_records(patient_id, visit_date desc);
create index idx_chat_messages_patient on chat_messages(patient_id, created_at desc);
create index idx_notifications_profile on notifications(profile_id, created_at desc);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table departments enable row level security;
alter table hospitals enable row level security;
alter table doctors enable row level security;
alter table diseases enable row level security;
alter table symptoms enable row level security;
alter table disease_symptoms enable row level security;
alter table disease_relations enable row level security;
alter table vitals enable row level security;
alter table appointments enable row level security;
alter table prescriptions enable row level security;
alter table health_records enable row level security;
alter table chat_messages enable row level security;
alter table emergency_contacts enable row level security;
alter table notifications enable row level security;

-- Profiles: users read their own, doctors can read patient profiles
create policy "Users view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- Public read for reference tables
create policy "Public read departments"
  on departments for select using (true);

create policy "Public read hospitals"
  on hospitals for select using (true);

create policy "Public read doctors"
  on doctors for select using (true);

create policy "Public read diseases"
  on diseases for select using (true);

create policy "Public read symptoms"
  on symptoms for select using (true);

create policy "Public read disease_symptoms"
  on disease_symptoms for select using (true);

create policy "Public read disease_relations"
  on disease_relations for select using (true);

-- Vitals: patients own, doctors read assigned patients
create policy "Patients manage own vitals"
  on vitals for all using (auth.uid() = patient_id);

-- Appointments
create policy "Patients manage own appointments"
  on appointments for all using (auth.uid() = patient_id);

-- Prescriptions
create policy "Patients manage own prescriptions"
  on prescriptions for all using (auth.uid() = patient_id);

-- Health records
create policy "Patients manage own records"
  on health_records for all using (auth.uid() = patient_id);

-- Chat messages
create policy "Patients manage own messages"
  on chat_messages for all using (auth.uid() = patient_id);

-- Emergency contacts
create policy "Patients manage own emergency contacts"
  on emergency_contacts for all using (auth.uid() = patient_id);

-- Notifications
create policy "Users view own notifications"
  on notifications for select using (auth.uid() = profile_id);

create policy "Users update own notifications"
  on notifications for update using (auth.uid() = profile_id);

-- ============================================================
-- 4. AUTOMATED UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- 5. SEED DATA G�� DEPARTMENTS, SYMPTOMS, DISEASES, HOSPITALS, DOCTORS
-- ============================================================

-- Departments
insert into departments (name, nepali_name) values
  ('ENT', 'a��a�+a�, a�a�+a��, a��a�+a��a�a��'),
  ('General Medicine', 'a�+a�+a�a�+a�a��a� a��a�+a��a�+a��a��a�+a�+'),
  ('Cardiology', 'a�a��a�a� a�a��a�� a�a�+a�a�+a��'),
  ('Orthopedics', 'a�a��a��a��a�� a��a��a�+ a�a��a�a��a�a�� a�a��a�� a�a�+a�a�+a��'),
  ('Ophthalmology', 'a��a��a��a�+ a�a��a�� a�a�+a�a�+a��'),
  ('Dermatology', 'a�a�+a�a�+ a�a��a�� a�a�+a�a�+a��'),
  ('Neurology', 'a�+a��a�a�+a�a�� a�a��a�� a�a�+a�a�+a��'),
  ('Tropical & Infectious Disease', 'a�+a�a��a�a�+ a��a��a�+ a�a��a�a��a�a�+a��a� a�a��a�� a�a�+a�a�+a��'),
  ('Pulmonology & Respiratory Medicine', 'a�a�+a��a�� a��a��a�+ a�a��a�a�+a�+a�a��a�a�a��a�a�+a�+ a�a��a�� a�a�+a�a�+a��'),
  ('Gastroenterology & Hepatology', 'a��a��a�a�+a�+a��a�a��a�a�� a��a��a�+ a��a�a��a�a�� a�a��a�� a�a�+a�a�+a��'),
  ('High-Altitude & Emergency Medicine', 'a�a�+a�a�+a�a�� a��a��a�+ a��a��a�+a��a�a�+a�� a��a�+a��a�+a��a��a�+a�+ a�a�+a�a�+a��');

-- Symptoms
insert into symptoms (name, nepali_name) values
  ('Fever', 'a�a��a�a�a��'),
  ('Headache', 'a�a�+a��a��a�� a�a��a��a��a�a��'),
  ('Cough', 'a��a��a��a��'),
  ('Sore throat', 'a��a�+a��a�a�� a�a��a��a��a�a��'),
  ('Runny nose', 'a�a�+a�� a�a��a��a�a��'),
  ('Sneezing', 'a�a�+a��a��a�a�+a��a�� a��a��a�a��'),
  ('Chest pain', 'a�a�+a��a�� a�a��a��a��a�a��'),
  ('Shortness of breath', 'a�+a�+a�+ a�a��a�a��a� a��a�+a�a��a�a��'),
  ('Fatigue', 'a��a��a�+a��'),
  ('Nausea', 'a�a�+a��a�a�+a��a��'),
  ('Vomiting', 'a�a�+a�a��a��a�+'),
  ('Diarrhea', 'a�a��a�+a�a�+'),
  ('Abdominal pain', 'a�a��a� a�a��a��a��a�a��'),
  ('Joint pain', 'a�a��a�a��a�a�� a�a��a��a��a�a��'),
  ('Muscle pain', 'a�a�+a��a�+a�a��a�a�� a�a��a��a��a�a��'),
  ('Dizziness', 'a��a��a��a��a� a��a��a�a��'),
  ('Blurred vision', 'a��a��a��a�+ a�a�a�+a�a�� a�a��a�a��'),
  ('Skin rash', 'a�a�+a�a�+a�a�+ a�a�+a��'),
  ('Itching', 'a��a�+a�a�+a��a�a��'),
  ('Ear pain', 'a��a�+a� a�a��a��a��a�a��'),
  ('Weight loss', 'a��a��a� a��a�a��a�a��'),
  ('Night sweats', 'a�a�+a��a�+ a�a�+a�+a�a�+ a��a��a�a��'),
  ('Swelling', 'a�+a��a�a��a�a�+a�a��'),
  ('Nosebleed', 'a�a�+a��a�a�+a� a�a��a�� a��a��a�a��'),
  ('Chest tightness', 'a�a�+a��a�� a�a�+a� a�a�� a�a�+a��a��a��');

-- Hospitals
insert into hospitals (name, address, phone) values
  ('Charak Memorial Hospital', 'Pokhara, Gandaki Province', '+977-61-5XXXXX'),
  ('Fewa City Hospital', 'Pokhara, Gandaki Province', '+977-61-5XXXXX'),
  ('Metrocity Hospital', 'Pokhara, Gandaki Province', '+977-61-5XXXXX');

-- Diseases
insert into diseases (department_id, name, nepali_name, description, nepal_context) values
  -- ENT
  ((select id from departments where name = 'ENT'), 'Chronic Sinusitis', 'a�a��a�a�+a�a�� a�+a�+a��a�a�+a�+a��a�a�+a�+', 'Inflammation of sinuses lasting 12+ weeks', 'Worsened by dust and pollution.'),
  ((select id from departments where name = 'ENT'), 'Allergic Rhinitis', 'a��a�a�a��a�a�� a�a�+a��a�a�+a��a�a�+a�+', 'Allergic inflammation of nasal airways', 'Common due to pollen and dust.'),
  ((select id from departments where name = 'ENT'), 'Acute Otitis Media', 'a��a�+a�a��a�� a�+a��a��a��a�a�a��', 'Middle ear infection', 'Common in children after colds.'),
  ((select id from departments where name = 'ENT'), 'Tonsillitis', 'a�a�a��a�+a�+a�a��a�� a�+a��a�a��a�a�+a�a��', 'Inflammation of tonsils', 'Common in winter months.'),
  -- General Medicine
  ((select id from departments where name = 'General Medicine'), 'Typhoid Fever', 'a�a�+a��a�a�+a��a��', 'Systemic bacterial infection', 'Waterborne illness, monsoon peak.'),
  ((select id from departments where name = 'General Medicine'), 'Type 2 Diabetes', 'a�a�a��a�a��a�', 'Chronic metabolic disorder', 'Rising in urban areas.'),
  ((select id from departments where name = 'General Medicine'), 'Common Cold', 'a�+a�+a�a�+a�a��a� a�a��a��a�+', 'Viral upper respiratory infection', 'Very common in winter and rainy season.'),
  ((select id from departments where name = 'General Medicine'), 'Viral Fever', 'a�a�+a��a�a� a�a��a�a�a��', 'Fever caused by viral infection', 'Common due to infections and monsoon.'),
  ((select id from departments where name = 'General Medicine'), 'Dengue Fever', 'a��a��a��a��a��a�� a�a��a�a�a��', 'Mosquito-borne viral infection', 'Endemic across plains and urban valleys during post-monsoon.'),
  -- Cardiology
  ((select id from departments where name = 'Cardiology'), 'Coronary Artery Disease', 'a�a��a�a� a�a�a�a�� a�a��a��', 'Narrowing of coronary arteries', 'Linked to hypertension.'),
  ((select id from departments where name = 'Cardiology'), 'Hypertension', 'a��a��a��a�� a�a��a��a��a��a�+a�', 'High blood pressure', 'Common in urban population.'),
  ((select id from departments where name = 'Cardiology'), 'Angina', 'a��a�a��a�a�+a��a�a�+', 'Chest pain from reduced blood flow to heart', 'Triggered by exertion.'),
  ((select id from departments where name = 'Cardiology'), 'Heart Failure', 'a�a��a�a�a��a�+a��', 'Heart unable to pump sufficiently', 'Related to untreated hypertension.'),
  -- Orthopedics
  ((select id from departments where name = 'Orthopedics'), 'Osteoarthritis', 'a��a��a�+a�a�+', 'Degenerative joint disease', 'Common from physical labor.'),
  ((select id from departments where name = 'Orthopedics'), 'Back Pain', 'a��a�+a�� a�a��a��a��a�a��', 'Pain in the back', 'Often due to physical labor.'),
  -- Ophthalmology
  ((select id from departments where name = 'Ophthalmology'), 'Cataract', 'a�a��a��a�+a�a�+a�a�+a�a��a�a��', 'Clouding of eye lens', 'Age and UV related.'),
  -- Dermatology
  ((select id from departments where name = 'Dermatology'), 'Fungal Infection', 'a�a��a��a� a�+a��a��a��a�a�a��', 'Fungal skin infection', 'Humid climate trigger.'),
  -- Neurology
  ((select id from departments where name = 'Neurology'), 'Migraine', 'a�a�+a��a��a��a�a��a�', 'Severe throbbing headache', 'Stress and altitude triggers.'),
  ((select id from departments where name = 'Neurology'), 'Stroke', 'a�a�+a��a��a�+a�+a��a��a�+a��a�+a��', 'Brain blood supply interruption', 'Hypertension related.'),
  -- Tropical
  ((select id from departments where name = 'Tropical & Infectious Disease'), 'Scrub Typhus', 'a�+a��a��a��a�a� a�a�+a��a�a�+', 'Bacterial disease from mites', 'Prevalent during agricultural season.'),
  ((select id from departments where name = 'Tropical & Infectious Disease'), 'Acute Gastroenteritis', 'a�a�+a��a�+a�a��a�+a�a�+', 'Stomach flu / infection', 'Frequent outbreaks during monsoon.'),
  -- Pulmonology
  ((select id from departments where name = 'Pulmonology & Respiratory Medicine'), 'COPD', 'a�a� a�a��a��', 'Chronic obstructive pulmonary disease', 'High prevalence due to biomass fuel smoke.'),
  ((select id from departments where name = 'Pulmonology & Respiratory Medicine'), 'Pulmonary Tuberculosis', 'a��a��a�+a�a�a��a��', 'Airborne bacterial lung infection', 'High priority public health issue.'),
  -- Gastroenterology
  ((select id from departments where name = 'Gastroenterology & Hepatology'), 'Hepatitis E', 'a�a��a�a�+a�a�+a��a�a�+a�+ a��', 'Liver inflammation from HEV', 'Fecal-oral transmission, extreme risk to pregnant women.'),
  -- High-Altitude
  ((select id from departments where name = 'High-Altitude & Emergency Medicine'), 'HAPE / HACE', 'a�a��a�� a�a�+a��a��a�a��', 'High altitude pulmonary/cerebral edema', 'Life-threatening above 2,500m.');

-- Disease-Symptom mappings
insert into disease_symptoms (disease_id, symptom_id)
select d.id, s.id from diseases d, symptoms s
where
  (d.name = 'Chronic Sinusitis' and s.name in ('Headache', 'Runny nose', 'Cough', 'Fever')) or
  (d.name = 'Allergic Rhinitis' and s.name in ('Sneezing', 'Runny nose', 'Itching', 'Headache')) or
  (d.name = 'Acute Otitis Media' and s.name in ('Ear pain', 'Fever', 'Headache')) or
  (d.name = 'Tonsillitis' and s.name in ('Sore throat', 'Fever', 'Headache')) or
  (d.name = 'Typhoid Fever' and s.name in ('Fever', 'Headache', 'Abdominal pain', 'Fatigue')) or
  (d.name = 'Common Cold' and s.name in ('Runny nose', 'Sneezing', 'Sore throat', 'Cough', 'Headache', 'Fever')) or
  (d.name = 'Viral Fever' and s.name in ('Fever', 'Muscle pain', 'Fatigue', 'Headache')) or
  (d.name = 'Dengue Fever' and s.name in ('Fever', 'Headache', 'Muscle pain', 'Joint pain', 'Nausea', 'Vomiting', 'Skin rash')) or
  (d.name = 'Coronary Artery Disease' and s.name in ('Chest pain', 'Shortness of breath', 'Fatigue')) or
  (d.name = 'Hypertension' and s.name in ('Headache', 'Dizziness', 'Nosebleed')) or
  (d.name = 'Angina' and s.name in ('Chest pain', 'Shortness of breath')) or
  (d.name = 'Heart Failure' and s.name in ('Shortness of breath', 'Swelling', 'Fatigue')) or
  (d.name = 'Osteoarthritis' and s.name in ('Joint pain', 'Swelling')) or
  (d.name = 'Back Pain' and s.name in ('Joint pain', 'Muscle pain')) or
  (d.name = 'Cataract' and s.name in ('Blurred vision')) or
  (d.name = 'Fungal Infection' and s.name in ('Itching', 'Skin rash')) or
  (d.name = 'Migraine' and s.name in ('Headache', 'Nausea', 'Blurred vision')) or
  (d.name = 'Stroke' and s.name in ('Headache', 'Dizziness', 'Blurred vision')) or
  (d.name = 'Scrub Typhus' and s.name in ('Fever', 'Headache', 'Muscle pain', 'Skin rash')) or
  (d.name = 'Acute Gastroenteritis' and s.name in ('Diarrhea', 'Vomiting', 'Abdominal pain', 'Nausea')) or
  (d.name = 'COPD' and s.name in ('Cough', 'Shortness of breath', 'Chest tightness', 'Fatigue')) or
  (d.name = 'Pulmonary Tuberculosis' and s.name in ('Cough', 'Fever', 'Night sweats', 'Weight loss', 'Chest pain')) or
  (d.name = 'Hepatitis E' and s.name in ('Fever', 'Nausea', 'Vomiting', 'Abdominal pain')) or
  (d.name = 'HAPE / HACE' and s.name in ('Headache', 'Dizziness', 'Shortness of breath', 'Cough', 'Chest tightness'));

-- Doctors
insert into doctors (name, qualification, specialty, department_id, hospital_id, opd_timing, photo_url) values
  ('Dr. Nabin Raj Gautam', 'MS', 'Consultant ENT, Head and Neck Surgery', (select id from departments where name = 'ENT'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/64/300/300'),
  ('Dr. Donjan Bahadur Lamechhine', 'MBBS, MS', 'ENT', (select id from departments where name = 'ENT'), (select id from hospitals where name = 'Fewa City Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/65/300/300'),
  ('Dr. Bonu Gaudel', 'MBBS, MS', 'ENT', (select id from departments where name = 'ENT'), (select id from hospitals where name = 'Fewa City Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/66/300/300'),
  ('Dr. Maan Bahadur Gurung', 'MD', 'Senior Consultant General Physician', (select id from departments where name = 'General Medicine'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/67/300/300'),
  ('Dr. Bhoj Raj Neupane', 'MBBS, MS', 'General Surgeon', (select id from departments where name = 'General Medicine'), (select id from hospitals where name = 'Fewa City Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/68/300/300'),
  ('Dr. SK Jayswal', 'MD', 'Consultant Cardiologist', (select id from departments where name = 'Cardiology'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/69/300/300'),
  ('Dr. Arun Kadel', 'MBBS, MD', 'Cardiologist', (select id from departments where name = 'Cardiology'), (select id from hospitals where name = 'Fewa City Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/70/300/300'),
  ('Dr. Jhapindra Pokharel', 'MS', 'Senior Consultant Orthopaedic and Trauma', (select id from departments where name = 'Orthopedics'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/71/300/300'),
  ('Dr. Bharat Bahadur Khatri', 'MBBS, MS Ortho', 'Senior Orthopedic Surgeon', (select id from departments where name = 'Orthopedics'), (select id from hospitals where name = 'Metrocity Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/72/300/300'),
  ('Dr. Jamuna Gurung', 'MS', 'Consultant Ophthalmology', (select id from departments where name = 'Ophthalmology'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/73/300/300'),
  ('Dr. Renu Poudel', 'MBBS, MD', 'Ophthalmologist', (select id from departments where name = 'Ophthalmology'), (select id from hospitals where name = 'Fewa City Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/74/300/300'),
  ('Dr. Pravin Baniya', 'MD', 'Senior Consultant Dermatologist', (select id from departments where name = 'Dermatology'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/75/300/300'),
  ('Dr. Saraswati Neupane Sharma', 'MBBS, MD', 'Senior Dermatologist', (select id from departments where name = 'Dermatology'), (select id from hospitals where name = 'Metrocity Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/76/300/300'),
  ('Dr. Krishna Dhungana', 'DM', 'Consultant Neurologist', (select id from departments where name = 'Neurology'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/77/300/300'),
  ('Dr. Rajan Kumar Sharma', 'MS, MCh', 'Neurosurgeon', (select id from departments where name = 'Neurology'), (select id from hospitals where name = 'Charak Memorial Hospital'), 'General OPD: 9:00 AM - 1:00 PM (Sun-Fri)', 'https://picsum.photos/id/78/300/300');

-- ============================================================
-- 6. HELPER FUNCTION G�� symptom-based disease lookup
-- ============================================================

create or replace function find_diseases_by_symptoms(symptom_names text[])
returns table (
  disease_id    uuid,
  disease_name  text,
  department    text,
  match_count   bigint,
  total_symptoms bigint
) language sql as $$
  select
    d.id,
    d.name,
    dep.name,
    count(ds.symptom_id)::bigint as match_count,
    (select count(*) from disease_symptoms where disease_id = d.id)::bigint as total_symptoms
  from diseases d
  join departments dep on dep.id = d.department_id
  join disease_symptoms ds on ds.disease_id = d.id
  join symptoms s on s.id = ds.symptom_id
  where s.name = any(symptom_names)
  group by d.id, d.name, dep.name
  order by match_count desc;
$$;

-- ============================================================
-- 7. HELPER FUNCTION G�� health score calculation
-- ============================================================

create or replace function calculate_health_score(p_patient_id uuid)
returns integer language plpgsql as $$
declare
  score integer := 86;
begin
  -- ponytail: static baseline, add weighting when real data flows
  return score;
end;
$$;

-- ============================================================
-- 8. MEDICAL HISTORY CONSENT & EMERGENCY ACCESS
-- ============================================================

-- 8a. Consent grants: patient grants doctor access to their history
create table medical_history_consents (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid not null references profiles(id) on delete cascade,
  granted_at      timestamptz not null default now(),
  expires_at      timestamptz,
  is_revoked      boolean not null default false,
  scope           text not null default 'full' check (scope in ('full', 'vitals_only', 'prescriptions_only')),
  unique(patient_id, doctor_id)
);

-- 8b. Emergency access log: when a doctor accesses history in emergency
create table emergency_access_logs (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid not null references profiles(id) on delete cascade,
  accessed_at     timestamptz not null default now(),
  reason          text not null,
  accessed_sections text[] not null default array['vitals', 'prescriptions', 'health_records', 'allergies']
);

-- 8c. Add consent flags to profiles
alter table profiles add column if not exists emergency_data_access boolean not null default true;
alter table profiles add column if not exists share_vitals boolean not null default true;
alter table profiles add column if not exists share_prescriptions boolean not null default true;
alter table profiles add column if not exists share_health_records boolean not null default true;

-- 8d. RLS for consent table
alter table medical_history_consents enable row level security;

create policy "Patients manage own consents"
  on medical_history_consents for all using (auth.uid() = patient_id);

create policy "Doctors view consents granted to them"
  on medical_history_consents for select using (auth.uid() = doctor_id);

-- 8e. RLS for emergency access logs
alter table emergency_access_logs enable row level security;

create policy "Patients view own emergency logs"
  on emergency_access_logs for select using (auth.uid() = patient_id);

create policy "Doctors insert emergency access logs"
  on emergency_access_logs for insert with check (auth.uid() = doctor_id);

-- 8f. Doctor can read patient health data ONLY with consent or emergency
-- Vitals access with consent
create policy "Doctors read patient vitals with consent"
  on vitals for select using (
    exists (
      select 1 from medical_history_consents c
      where c.patient_id = vitals.patient_id
        and c.doctor_id = auth.uid()
        and c.is_revoked = false
        and (c.expires_at is null or c.expires_at > now())
        and c.scope in ('full', 'vitals_only')
    )
  );

-- Prescriptions access with consent
create policy "Doctors read patient prescriptions with consent"
  on prescriptions for select using (
    exists (
      select 1 from medical_history_consents c
      where c.patient_id = prescriptions.patient_id
        and c.doctor_id = auth.uid()
        and c.is_revoked = false
        and (c.expires_at is null or c.expires_at > now())
        and c.scope in ('full', 'prescriptions_only')
    )
  );

-- Health records access with consent
create policy "Doctors read patient health records with consent"
  on health_records for select using (
    exists (
      select 1 from medical_history_consents c
      where c.patient_id = health_records.patient_id
        and c.doctor_id = auth.uid()
        and c.is_revoked = false
        and (c.expires_at is null or c.expires_at > now())
        and c.scope = 'full'
    )
  );

-- 8g. Emergency override: doctors with 'doctor' role can read in emergencies
-- (emergency_data_access flag on profile controls this)
create policy "Emergency override: doctors read vitals"
  on vitals for select using (
    exists (
      select 1 from profiles p
      where p.id = vitals.patient_id
        and p.emergency_data_access = true
        and auth.uid() in (select id from profiles where role = 'doctor')
    )
  );

create policy "Emergency override: doctors read prescriptions"
  on prescriptions for select using (
    exists (
      select 1 from profiles p
      where p.id = prescriptions.patient_id
        and p.emergency_data_access = true
        and auth.uid() in (select id from profiles where role = 'doctor')
    )
  );

create policy "Emergency override: doctors read health records"
  on health_records for select using (
    exists (
      select 1 from profiles p
      where p.id = health_records.patient_id
        and p.emergency_data_access = true
        and auth.uid() in (select id from profiles where role = 'doctor')
    )
  );

create policy "Emergency override: doctors read profiles"
  on profiles for select using (
    emergency_data_access = true
    and auth.uid() in (select id from profiles where role = 'doctor')
    and id <> auth.uid()
  );
