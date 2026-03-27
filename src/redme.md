CREATE TABLE indent (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    indent_number TEXT,
    post TEXT,
    gender TEXT,
    prefer TEXT,
    number_of_posts INTEGER,
    completion_date DATE,
    social_site TEXT,
    status TEXT,
    experience TEXT,
    social_site_types TEXT,
    department TEXT
);


CREATE TABLE master_hr (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),

    hod_name TEXT,
    firm_name TEXT,
    department TEXT,
    social_site TEXT,
    call_tracker_status TEXT,
    family_relationship TEXT,
    attendance_type TEXT,
    employee_name TEXT,
    mobile_no VARCHAR(15),
    designation TEXT
);



CREATE TABLE enquiry (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),

    timestamp TIMESTAMP,
    indent_number TEXT,
    candidate_enquiry_number TEXT,
    applying_post TEXT,
    candidate_name TEXT,
    dob DATE,
    candidate_phone VARCHAR(15),
    candidate_email TEXT,
    previous_company_name TEXT,
    job_experience TEXT,
    department TEXT,
    previous_position TEXT,
    reason_of_leaving TEXT,
    marital_status TEXT,
    last_employer_mobile VARCHAR(15),
    candidate_photo TEXT,
    reference_by TEXT,
    present_address TEXT,
    aadhar_number VARCHAR(20),
    resume_copy TEXT,

    planned_1 DATE,
    actual_1 DATE,
    time_delay_1 INTEGER,

    candidate_feedback TEXT,
    tracker_status TEXT,
    next_call_date DATE,

    planned_2 DATE,
    actual_2 DATE,
    department_next TEXT
);



CREATE TABLE follow_up (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),

    enquiry_number TEXT,
    status TEXT,
    candidate_says TEXT,
    next_call_date DATE
);


CREATE OR REPLACE FUNCTION enquiry_planned_trigger()
RETURNS TRIGGER AS $$
BEGIN

IF NEW.planned_1 IS NULL THEN
    NEW.planned_1 = NOW() + INTERVAL '2 day';
END IF;

RETURN NEW;

END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER enquiry_planned_auto
BEFORE INSERT ON enquiry
FOR EACH ROW
EXECUTE FUNCTION enquiry_planned_trigger();



CREATE TABLE joining (
    id BIGSERIAL PRIMARY KEY,

    timestamp_date TIMESTAMP,
    rbp_joining_id VARCHAR(50),
    status VARCHAR(50),
    firm_name VARCHAR(150),
    name_as_per_aadhar VARCHAR(150),
    blood_group VARCHAR(10),
    father_name VARCHAR(150),
    date_of_joining DATE,
    work_location VARCHAR(150),
    designation VARCHAR(150),
    salary NUMERIC(12,2),

    aadhar_front_photo TEXT,
    aadhar_back_photo TEXT,
    pan_card TEXT,

    family_relationship VARCHAR(100),

    current_address TEXT,
    aadhar_address TEXT,

    date_of_birth DATE,
    gender VARCHAR(20),

    mobile_number VARCHAR(20),
    family_number VARCHAR(20),

    past_pf_id VARCHAR(50),
    past_esic_number VARCHAR(50),

    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    branch_name VARCHAR(100),

    personal_email VARCHAR(150),

    company_pf_provided BOOLEAN,
    company_esic_provided BOOLEAN,
    company_mail_provided BOOLEAN,

    attendance_type VARCHAR(50),

    candidate_validated BOOLEAN,
    gmail_id_issued BOOLEAN,
    joining_letter_issued BOOLEAN,

    attendance_registration BOOLEAN,
    pf_registration BOOLEAN,
    esic_registration BOOLEAN,

    leaving_date DATE,
    leaving_reason TEXT,

    planned_date DATE,
    actual_date DATE,
    delay_days INTEGER,

    salary_slip_resume_checked BOOLEAN,
    offer_letter_received BOOLEAN,
    welcome_meeting BOOLEAN,
    biometric_access BOOLEAN,
    official_email_id VARCHAR(150),
    assets_assigned BOOLEAN,

    pf_esic_completed BOOLEAN,
    company_directory_added BOOLEAN,

    department VARCHAR(100),
    pdc VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION set_planned_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.timestamp_date IS NOT NULL THEN
        NEW.planned_date := NEW.timestamp_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_set_planned_date
BEFORE INSERT OR UPDATE ON joining
FOR EACH ROW
EXECUTE FUNCTION set_planned_date();



CREATE TABLE employee_leaving (
    id BIGSERIAL PRIMARY KEY,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id VARCHAR(50),
    name VARCHAR(150),
    date_of_leaving DATE,
    mobile_number VARCHAR(15),
    reason_of_leaving TEXT,
    firm_name VARCHAR(150),
    father_name VARCHAR(150),
    date_of_joining DATE,
    work_location VARCHAR(150),
    designation VARCHAR(150),
    department VARCHAR(150),
    
    planned_date DATE,
    actual DATE,
    delay INTEGER,
    
    resignation_letter_received BOOLEAN DEFAULT FALSE,
    resignation_acceptance BOOLEAN DEFAULT FALSE,
    handover_of_assets BOOLEAN DEFAULT FALSE,
    cancellation_of_email_id BOOLEAN DEFAULT FALSE,
    
    final_release_date DATE,
    remove_benefit_enrollment BOOLEAN DEFAULT FALSE
);



CREATE OR REPLACE FUNCTION calculate_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned_date IS NOT NULL THEN
     NEW.delay := NEW.actual - NEW.planned_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delay_trigger
BEFORE INSERT OR UPDATE ON employee_leaving
FOR EACH ROW
EXECUTE FUNCTION calculate_delay();



CREATE OR REPLACE FUNCTION update_actual_on_joining()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Joining' THEN
    UPDATE enquiry
    SET actual_1 = NEW.created_at
    WHERE candidate_enquiry_number = NEW.enquiry_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_update_actual
AFTER INSERT ON follow_up
FOR EACH ROW
EXECUTE FUNCTION update_actual_on_joining();


CREATE TABLE users_hr (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(150),
    department VARCHAR(100),
    given_by VARCHAR(100),
    email_id VARCHAR(255),
    wa_number VARCHAR(10),
    role VARCHAR(50) DEFAULT 'USER',
    page TEXT,
    access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,

    timestamp TIMESTAMP DEFAULT NOW(),        -- Column A
    employee_id VARCHAR(50),                  -- Column B
    employee_name VARCHAR(150),               -- Column C
    email_id VARCHAR(150),                   -- Column D
    email_password VARCHAR(150),             -- Column E

    laptop VARCHAR(100),                     -- Column F
    mobile VARCHAR(100),                     -- Column G
    vehicle VARCHAR(100),                    -- Column H
    sim VARCHAR(100),                        -- Column I

    manual TEXT,                             -- Column J (file URL)
    punch_code VARCHAR(50),                  -- Column K
    pf VARCHAR(50),                          -- Column L
    esic VARCHAR(50),                        -- Column M

    pdc_file TEXT                            -- Column N (file URL)

);