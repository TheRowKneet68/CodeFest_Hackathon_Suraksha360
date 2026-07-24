-- ============================================================
-- Swasthya Sathi - Migration: add missing tables & columns
-- Run this AFTER the existing Supabase schema is in place
-- ============================================================

-- 1. Consent columns on profiles (safe: IF NOT EXISTS)
alter table profiles add column if not exists emergency_data_access boolean not null default true;
alter table profiles add column if not exists share_vitals boolean not null default true;
alter table profiles add column if not exists share_prescriptions boolean not null default true;
alter table profiles add column if not exists share_health_records boolean not null default true;

-- 2. Medical history consents table
create table if not exists medical_history_consents (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid not null references profiles(id) on delete cascade,
  granted_at      timestamptz not null default now(),
  expires_at      timestamptz,
  is_revoked      boolean not null default false,
  scope           text not null default 'full' check (scope in ('full', 'vitals_only', 'prescriptions_only')),
  unique(patient_id, doctor_id)
);
alter table medical_history_consents enable row level security;
drop policy if exists "Patients manage own consents" on medical_history_consents;
create policy "Patients manage own consents" on medical_history_consents for all using (auth.uid() = patient_id);
drop policy if exists "Doctors view consents granted to them" on medical_history_consents;
create policy "Doctors view consents granted to them" on medical_history_consents for select using (auth.uid() = doctor_id);

-- 3. Emergency access logs table
create table if not exists emergency_access_logs (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  doctor_id       uuid not null references profiles(id) on delete cascade,
  accessed_at     timestamptz not null default now(),
  reason          text not null,
  accessed_sections text[] not null default array['vitals', 'prescriptions', 'health_records', 'allergies']
);
alter table emergency_access_logs enable row level security;
drop policy if exists "Patients view own emergency logs" on emergency_access_logs;
create policy "Patients view own emergency logs" on emergency_access_logs for select using (auth.uid() = patient_id);
drop policy if exists "Doctors insert emergency access logs" on emergency_access_logs;
create policy "Doctors insert emergency access logs" on emergency_access_logs for insert with check (auth.uid() = doctor_id);

-- 4. Doctor RLS policies for reading patient data with consent
drop policy if exists "Doctors read patient vitals with consent" on vitals;
create policy "Doctors read patient vitals with consent" on vitals for select using (
  exists (
    select 1 from medical_history_consents c
    where c.patient_id = vitals.patient_id
      and c.doctor_id = auth.uid()
      and c.is_revoked = false
      and (c.expires_at is null or c.expires_at > now())
      and c.scope in ('full', 'vitals_only')
  )
);

drop policy if exists "Doctors read patient prescriptions with consent" on prescriptions;
create policy "Doctors read patient prescriptions with consent" on prescriptions for select using (
  exists (
    select 1 from medical_history_consents c
    where c.patient_id = prescriptions.patient_id
      and c.doctor_id = auth.uid()
      and c.is_revoked = false
      and (c.expires_at is null or c.expires_at > now())
      and c.scope in ('full', 'prescriptions_only')
  )
);

drop policy if exists "Doctors read patient health records with consent" on health_records;
create policy "Doctors read patient health records with consent" on health_records for select using (
  exists (
    select 1 from medical_history_consents c
    where c.patient_id = health_records.patient_id
      and c.doctor_id = auth.uid()
      and c.is_revoked = false
      and (c.expires_at is null or c.expires_at > now())
      and c.scope = 'full'
  )
);

-- 5. Emergency override policies
drop policy if exists "Emergency override: doctors read vitals" on vitals;
create policy "Emergency override: doctors read vitals" on vitals for select using (
  exists (
    select 1 from profiles p
    where p.id = vitals.patient_id
      and p.emergency_data_access = true
      and auth.uid() in (select id from profiles where role = 'doctor')
  )
);

drop policy if exists "Emergency override: doctors read prescriptions" on prescriptions;
create policy "Emergency override: doctors read prescriptions" on prescriptions for select using (
  exists (
    select 1 from profiles p
    where p.id = prescriptions.patient_id
      and p.emergency_data_access = true
      and auth.uid() in (select id from profiles where role = 'doctor')
  )
);

drop policy if exists "Emergency override: doctors read health records" on health_records;
create policy "Emergency override: doctors read health records" on health_records for select using (
  exists (
    select 1 from profiles p
    where p.id = health_records.patient_id
      and p.emergency_data_access = true
      and auth.uid() in (select id from profiles where role = 'doctor')
  )
);

drop policy if exists "Emergency override: doctors read profiles" on profiles;
create policy "Emergency override: doctors read profiles" on profiles for select using (
  emergency_data_access = true
  and auth.uid() in (select id from profiles where role = 'doctor')
  and id <> auth.uid()
);

-- 6. Diagnostic tests table
create table if not exists diagnostic_tests (
  id              uuid primary key default gen_random_uuid(),
  disease_id      text,
  disease_name    text not null,
  department      text,
  test_name       text not null,
  cost_range_npr  text,
  total_estimated_cost_npr text,
  average_follow_up_time text,
  created_at      timestamptz not null default now()
);
alter table diagnostic_tests enable row level security;
drop policy if exists "Public read diagnostic tests" on diagnostic_tests;
create policy "Public read diagnostic tests" on diagnostic_tests for select using (true);

-- 7. Edge cases table
create table if not exists edge_cases (
  id                uuid primary key default gen_random_uuid(),
  case_id           text not null,
  title             text not null,
  patient_profile   text,
  reported_symptoms text[],
  diagnostic_challenge text,
  expected_department text,
  recommended_action  text,
  created_at        timestamptz not null default now()
);
alter table edge_cases enable row level security;
drop policy if exists "Public read edge cases" on edge_cases;
create policy "Public read edge cases" on edge_cases for select using (true);
