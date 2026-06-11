create table public.assets (
  id bigserial not null,
  timestamp timestamp without time zone null default now(),
  employee_id character varying(50) null,
  employee_name character varying(150) null,
  email_id character varying(150) null,
  email_password character varying(150) null,
  laptop character varying(100) null,
  mobile character varying(100) null,
  vehicle character varying(100) null,
  sim character varying(100) null,
  manual text null,
  punch_code character varying(50) null,
  pf character varying(50) null,
  esic character varying(50) null,
  pdc_file text null,
  constraint assets_pkey primary key (id)
) TABLESPACE pg_default;

create table public.attendance (
  id bigserial not null,
  timestamp text null,
  date_and_time text null,
  end_date text null,
  status text null,
  reason text null,
  latitude text null,
  longitude text null,
  map_link text null,
  address text null,
  person_name text null,
  date text null,
  time text null,
  year_name text null,
  month_name text null,
  approved_status text null,
  images text null,
  constraint attendance_pkey primary key (id)
) TABLESPACE pg_default;


create table public.confirmation_letters (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  follow_up_id bigint null,
  enquiry_number text null,
  employee_name text null,
  department text null,
  designation text null,
  confirmation_date date null,
  effective_date date null,
  remarks text null,
  status text null,
  constraint confirmation_letters_pkey primary key (id)
) TABLESPACE pg_default;


create table public.emp_leaving_holiday (
  id bigserial not null,
  employee_name character varying(150) not null,
  employee_id character varying(100) not null,
  designation character varying(150) not null,
  hod_name character varying(150) not null,
  from_date date not null,
  to_date date not null,
  reason text not null,
  leave_category character varying(100) not null,
  support_document text null,
  total_days integer GENERATED ALWAYS as (((to_date - from_date) + 1)) STORED null,
  status character varying(50) null default 'Pending'::character varying,
  reviewer_name character varying(150) null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint emp_leaving_holiday_pkey primary key (id)
) TABLESPACE pg_default;


create table public.employee_leaving (
  id bigserial not null,
  timestamp timestamp without time zone null default CURRENT_TIMESTAMP,
  employee_id character varying(50) null,
  name character varying(150) null,
  date_of_leaving date null,
  mobile_number character varying(15) null,
  reason_of_leaving text null,
  firm_name character varying(150) null,
  father_name character varying(150) null,
  date_of_joining date null,
  work_location character varying(150) null,
  designation character varying(150) null,
  department character varying(150) null,
  planned_date date null,
  actual date null,
  delay integer null,
  resignation_letter_received boolean null default false,
  resignation_acceptance boolean null default false,
  handover_of_assets boolean null default false,
  cancellation_of_email_id boolean null default false,
  final_release_date date null,
  remove_benefit_enrollment boolean null default false,
  last_working_date date null,
  fnf_date date null,
  cheque_handover boolean null default false,
  constraint employee_leaving_pkey primary key (id)
) TABLESPACE pg_default;


create table public.enquiry (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  timestamp timestamp without time zone null,
  indent_number text null,
  candidate_enquiry_number text null,
  applying_post text null,
  candidate_name text null,
  dob date null,
  candidate_phone character varying(15) null,
  candidate_email text null,
  previous_company_name text null,
  job_experience text null,
  department text null,
  previous_position text null,
  reason_of_leaving text null,
  marital_status text null,
  last_employer_mobile character varying(15) null,
  candidate_photo text null,
  reference_by text null,
  present_address text null,
  aadhar_number character varying(20) null,
  resume_copy text null,
  planned_1 date null,
  actual_1 date null,
  time_delay_1 integer null,
  candidate_feedback text null,
  tracker_status text null,
  next_call_date date null,
  planned_2 date null,
  actual_2 date null,
  department_next text null,
  constraint enquiry_pkey primary key (id)
) TABLESPACE pg_default;



create table public.fms (
  id bigserial not null,
  timestamp timestamp without time zone null,
  serial_no text null,
  person_name text null,
  from_location text null,
  to_location text null,
  in_vehicle_type text null,
  in_vehicle_mtr_number text null,
  total_running_km text null,
  in_vehicle_mtr_pic_ticket_pic text null,
  date date null,
  in_remarks text null,
  in_vehicle_amount text null,
  planned timestamp without time zone null,
  actual timestamp without time zone null,
  time_delay text null,
  return_date date null,
  out_vehicle_type text null,
  out_vehicle_mtr_number text null,
  vehical_mtr_pic text null,
  out_remarks text null,
  vehicle_amount text null,
  gmail_id text null,
  constraint fms_pkey primary key (id)
) TABLESPACE pg_default;


create table public.follow_up (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  enquiry_number text null,
  status text null,
  candidate_says text null,
  next_call_date date null,
  constraint follow_up_pkey primary key (id)
) TABLESPACE pg_default;


create table public.indent (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  indent_number text null,
  post text null,
  gender text null,
  prefer text null,
  number_of_posts integer null,
  completion_date date null,
  social_site text null,
  status text null,
  experience text null,
  social_site_types text null,
  department text null,
  constraint indent_pkey primary key (id)
) TABLESPACE pg_default;


create table public.joining (
  id bigserial not null,
  timestamp_date text null,
  rbp_joining_id text null,
  status text null,
  firm_name text null,
  name_as_per_aadhar text null,
  father_name text null,
  date_of_joining text null,
  work_location text null,
  designation text null,
  salary numeric(12, 2) null,
  aadhar_front_photo text null,
  aadhar_back_photo text null,
  pan_card text null,
  family_relationship text null,
  current_address text null,
  aadhar_address text null,
  date_of_birth text null,
  gender text null,
  mobile_number text null,
  family_number text null,
  past_pf_id text null,
  past_esic_number text null,
  bank_account_number text null,
  ifsc_code text null,
  branch_name text null,
  personal_email text null,
  company_pf_provided text null,
  company_esic_provided boolean null,
  company_mail_provided boolean null,
  attendance_type text null,
  candidate_validated boolean null,
  gmail_id_issued boolean null,
  joining_letter_issued boolean null,
  attendance_registration boolean null,
  pf_registration boolean null,
  esic_registration boolean null,
  leaving_date text null,
  leaving_reason text null,
  planned_date text null,
  actual_date text null,
  delay_days integer null,
  salary_slip_resume_checked boolean null,
  offer_letter_received boolean null,
  welcome_meeting boolean null,
  biometric_access boolean null,
  official_email_id text null,
  assets_assigned boolean null,
  pf_esic_completed boolean null,
  company_directory_added boolean null,
  department text null,
  pdc text null,
  created_at timestamp without time zone null default now(),
  bank_passbook_photo text null,
  family_person_name text null,
  constraint joining_pkey primary key (id)
) TABLESPACE pg_default;


create table public.location_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  person_name text null,
  latitude numeric not null,
  longitude numeric not null,
  is_mock boolean null default false,
  timestamp timestamp with time zone null default now(),
  date date null default CURRENT_DATE,
  tracking_session_id text null,
  accuracy numeric null,
  speed numeric null,
  battery integer null,
  attendance_type text null,
  constraint location_logs_pkey primary key (id)
) TABLESPACE pg_default;


create table public.master_hr (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  hod_name text null,
  firm_name text null,
  department text null,
  social_site text null,
  call_tracker_status text null,
  family_relationship text null,
  attendance_type text null,
  employee_name text null,
  mobile_no character varying(15) null,
  designation text null,
  constraint master_hr_pkey primary key (id)
) TABLESPACE pg_default;


create table public.minopcloud_attendance_log (
  id bigint generated always as identity not null,
  txn_id bigint null,
  device_id bigint null,
  device_ip text null,
  punch_id text null,
  employee_code text null,
  punch_time timestamp without time zone null,
  mode text null,
  device_serial_no text null,
  device_time text null,
  raw_data jsonb null,
  created_at timestamp with time zone null default now(),
  constraint minopcloud_attendance_log_pkey primary key (id),
  constraint minopcloud_attendance_log_txn_id_key unique (txn_id)
) TABLESPACE pg_default;


create table public.offer_letters (
  id bigserial not null,
  created_at timestamp without time zone null default now(),
  follow_up_id bigint null,
  enquiry_number text null,
  employee_name text null,
  department text null,
  designation text null,
  salary numeric null,
  offer_date date null,
  status text null,
  salary_structure jsonb null,
  probation_period text null,
  reporting_manager text null,
  work_location text null,
  email text null,
  mobile_number text null,
  constraint offer_letters_pkey primary key (id)
) TABLESPACE pg_default;


create table public.users (
  id bigserial not null,
  timestamp timestamp without time zone null,
  sales_person_name text null,
  user_name text null,
  password text null,
  admin text null,
  access text null,
  in_office text null,
  employee_id text null,
  constraint user_access_pkey primary key (id),
  constraint users_user_name_unique unique (user_name)
) TABLESPACE pg_default;


create table public.users_hr (
  id serial not null,
  username character varying(100) not null,
  password text not null,
  name character varying(150) null,
  department character varying(100) null,
  given_by character varying(100) null,
  email_id character varying(255) null,
  wa_number character varying(10) null,
  role character varying(50) null default 'USER'::character varying,
  page text null,
  access boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint users_hr_pkey primary key (id),
  constraint users_hr_username_key unique (username)
) TABLESPACE pg_default;

