-- =====================================================
-- COMBATY DATABASE - FINAL (with full survey storage)
-- MySQL / MariaDB / XAMPP / phpMyAdmin
-- =====================================================
DROP DATABASE IF EXISTS combaty;
CREATE DATABASE combaty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE combaty;
SET NAMES utf8mb4;

-- 1. ACCOUNTS
CREATE TABLE accounts (
    username VARCHAR(30) PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    role ENUM('Administrator','Brgy Staff','Barangay') NOT NULL,
    barangay VARCHAR(60) NOT NULL,
    status ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',
    full_name VARCHAR(60) DEFAULT '',
    position VARCHAR(60) DEFAULT '',
    email VARCHAR(80) DEFAULT '',
    phone VARCHAR(15) DEFAULT '',
    address VARCHAR(120) DEFAULT ''
) ENGINE=InnoDB;

-- 2. BARANGAYS
CREATE TABLE barangays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    pct DECIMAL(5,2) NOT NULL,
    hh INT NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL
) ENGINE=InnoDB;

-- 3. HISTORICAL RECORDS
CREATE TABLE records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barangay VARCHAR(60) NOT NULL,
    year SMALLINT NOT NULL,
    hh INT NOT NULL,
    mag INT NOT NULL,
    UNIQUE KEY uq_brgy_year (barangay, year),
    CONSTRAINT fk_rec_brgy FOREIGN KEY (barangay) REFERENCES barangays(name)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. HOUSEHOLDS (summary fields used by the dashboards)
CREATE TABLE households (
    id VARCHAR(10) PRIMARY KEY,
    head VARCHAR(120) NOT NULL,
    barangay VARCHAR(60) NOT NULL,
    address VARCHAR(120) NOT NULL,              -- Sitio/Purok (Part I, Q2)
    members INT NOT NULL,                       -- Part I, Q4
    children INT NOT NULL DEFAULT 0,            -- Part I, Q5
    seniors INT NOT NULL DEFAULT 0,             -- Part I, Q6
    income DECIMAL(12,2) NOT NULL,              -- midpoint of Q14 income bracket
    occupation VARCHAR(120) DEFAULT '',         -- Q11
    education ENUM('No schooling','Elementary undergrad/grad','Secondary undergrad','Secondary graduate','Tertiary'),
    housing ENUM('Poor','Fair','Good'),
    services ENUM('Limited','Moderate','Full'),
    status ENUM('Draft','Submitted','Under Review','Approved','Returned') NOT NULL DEFAULT 'Draft',
    lat DOUBLE NULL,
    lng DOUBLE NULL,
    geo_src VARCHAR(60) NULL,
    geo_at VARCHAR(16) NULL,
    remarks VARCHAR(300) DEFAULT '',
    submitted_by VARCHAR(30) DEFAULT '—',
    form_date DATE NULL,
    acted_by VARCHAR(30) NULL,
    acted_on VARCHAR(16) NULL,
    consent TINYINT(1) NOT NULL DEFAULT 0,      -- Data Privacy consent ticked
    consent_name VARCHAR(60) DEFAULT '',        -- typed signature
    consent_date DATE NULL,
    KEY ix_hh_brgy (barangay),
    KEY ix_hh_status (status),
    CONSTRAINT fk_hh_brgy FOREIGN KEY (barangay) REFERENCES barangays(name)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. HOUSEHOLD MEMBERS (Part II table)
CREATE TABLE household_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id VARCHAR(10) NOT NULL,
    member_no TINYINT NOT NULL,
    age SMALLINT NULL,
    sex ENUM('Male','Female') NULL,
    family_role VARCHAR(30) DEFAULT '',
    civil_status VARCHAR(20) DEFAULT '',
    education VARCHAR(30) DEFAULT '',
    UNIQUE KEY uq_hh_member (household_id, member_no),
    CONSTRAINT fk_mem_hh FOREIGN KEY (household_id) REFERENCES households(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. SURVEY ANSWERS (Parts III–X, one row per question: q7 ... q34)
--    Checkbox questions are saved comma-separated; "Other" text is saved under q11_o, q21_o, etc.
CREATE TABLE survey_answers (
    household_id VARCHAR(10) NOT NULL,
    q_key VARCHAR(20) NOT NULL,
    answer TEXT,
    PRIMARY KEY (household_id, q_key),
    CONSTRAINT fk_ans_hh FOREIGN KEY (household_id) REFERENCES households(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. REPORTS (Barangay -> Administrator)
CREATE TABLE reports (
    id VARCHAR(10) PRIMARY KEY,
    barangay VARCHAR(60) NOT NULL,
    submitted_by VARCHAR(30) NOT NULL,
    sent_at VARCHAR(16) NOT NULL,
    total INT NOT NULL DEFAULT 0,
    approved INT NOT NULL DEFAULT 0,
    under_review INT NOT NULL DEFAULT 0,
    returned INT NOT NULL DEFAULT 0,
    pending INT NOT NULL DEFAULT 0,
    trend TEXT,
    status ENUM('Submitted','Received') NOT NULL DEFAULT 'Submitted',
    CONSTRAINT fk_rep_brgy FOREIGN KEY (barangay) REFERENCES barangays(name)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. LOGS (with device model and IP address)
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    t VARCHAR(16) NOT NULL,
    username VARCHAR(30),
    role VARCHAR(20),
    type ENUM('Activity','User') NOT NULL,
    action VARCHAR(200) NOT NULL,
    device VARCHAR(100) DEFAULT '',
    ip_address VARCHAR(45) DEFAULT '',
    KEY ix_logs_t (t)
) ENGINE=InnoDB;

-- 9. NOTIFICATIONS
CREATE TABLE notifs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brgy VARCHAR(60) NOT NULL,
    text VARCHAR(300) NOT NULL,
    time VARCHAR(16) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    KEY ix_notif_brgy (brgy)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA (placeholders - replace with real survey data)
-- =====================================================
INSERT INTO accounts (username, password_hash, role, barangay, status, full_name, position, email, phone, address) VALUES
('admin','$2b$10$K77hOyDXuIN5a5dK7NTiZuMVA4aJbOKpRrPTGeOgzHETjDLmRPr.i','Administrator','Municipal-wide','Active','','','','',''),
('G-staff','$2y$10$ayGJWoySoqltjLH5oguTVu0zYQgPuFaLaqBhYct9JsHqDa3IJUlp.','Brgy Staff','Guilang-Guilang','Active','','','','',''),
('G-barangay','$2y$10$G4tZS5aWdx/Q9krhaj.KZe.j.CicrnLG8NFZQxXxhcb898CAAh4uO','Barangay','Guilang-Guilang','Active','','','','',''),
('S-staff','$2y$10$e4NahgKTW7l5j4zLdMX0o.JcuE7ogOUzAflujVLZlInxt7wT6SbMW','Brgy Staff','Santiago','Active','','','','',''),
('S-barangay','$2y$10$r0WDOvUjrDz3L1Q1AbDTK.QPOWj/XUD2Eekk8AsmMf7yhQXf016Kq','Barangay','Santiago','Active','','','','',''),
('M-staff','$2y$10$FTYfh/K/1yXOuG9TTolwKOPlE8/kzz/Y188ji9WAwUO3KfOWpJW6q','Brgy Staff','Maluko','Active','','','','',''),
('M-barangay','$2y$10$Au/GEz/7j2/8KKGkRTFr5.NOKuaof/F28IUcRnOypL2gypHUHd3bG','Barangay','Maluko','Active','','','','',''),
('L-staff','$2y$10$EtTyE9sggPGFDPUk/6KAhOBpUMulBBnWMc2HxII7Jl90/LHB2.K4G','Brgy Staff','Lunocan','Active','','','','',''),
('L-barangay','$2y$10$GAY9jTV1nmCqYL1C.Qj4se7qegrVVNRjYpX91SBT/ywOCJTAaHxPW','Barangay','Lunocan','Active','','','','',''),
('T-staff','$2y$10$n7xjhGpevCWSRr681IxK6uIXulck2nrZqN3NHI1Ev4OyrwzbJt/UC','Brgy Staff','Ticala','Active','','','','',''),
('T-barangay','$2y$10$V/6k2Sedfl3.dkXq7.Tcz.nvcJXcw9Ur457BnNfpplJOLiifzephG','Barangay','Ticala','Active','','','','','');

INSERT INTO barangays (name, pct, hh, lat, lng) VALUES
('Guilang-Guilang', 84.82, 412, 8.4589, 125.0407),
('Santiago', 74.35, 389, 8.4386, 124.9934),
('Maluko', 53.75, 165, 8.3732, 124.9538),
('Lunocan', 45.00, 250, 8.4143, 124.8231),
('Ticala', 42.00, 220, 8.3412, 124.8911);

INSERT INTO records (barangay, year, hh, mag) VALUES
('Guilang-Guilang',2019,290,232),('Guilang-Guilang',2021,303,257),('Guilang-Guilang',2023,360,300),('Guilang-Guilang',2025,412,349),
('Santiago',2019,350,245),('Santiago',2021,365,262),('Santiago',2023,378,279),('Santiago',2025,389,289),
('Maluko',2019,150,70),('Maluko',2021,155,78),('Maluko',2023,160,84),('Maluko',2025,165,89),
('Lunocan',2019,230,90),('Lunocan',2021,238,98),('Lunocan',2023,245,108),('Lunocan',2025,250,112),
('Ticala',2019,205,80),('Ticala',2021,210,84),('Ticala',2023,215,90),('Ticala',2025,220,92);

INSERT INTO households (id, head, barangay, address, members, income, occupation, education, housing, services, status,
    lat, lng, remarks, submitted_by, form_date) VALUES
('HH-0001','Maria Dela Cruz','Guilang-Guilang','Purok 3',6,6500.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.4596,125.0412,'','G-staff','2026-10-20'),
('HH-0002','Juan Bautista','Guilang-Guilang','Purok 1',5,9000.00,'Tricycle driver','Secondary undergrad','Fair','Moderate','Approved',8.4583,125.0395,'','G-staff','2026-10-25'),
('HH-0003','Rosa Villanueva','Guilang-Guilang','Purok 5',4,15000.00,'Sari-sari store owner','Secondary graduate','Good','Full','Approved',8.4574,125.0418,'','G-staff','2026-10-25'),
('HH-0004','Elena Reyes','Guilang-Guilang','Purok 2',7,5000.00,'Seasonal farm labor','No schooling','Poor','Limited','Approved',8.4604,125.0380,'','G-staff','2026-10-22'),
('HH-0005','Pedro Santos','Guilang-Guilang','Purok 4',3,12000.00,'Carpenter','Secondary graduate','Fair','Moderate','Approved',8.4611,125.0393,'','G-staff','2026-10-27'),
('HH-0006','Ana Lopez','Santiago','Purok 2',6,7000.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.4389,124.9928,'','S-staff','2026-10-18'),
('HH-0007','Roberto Mendoza','Santiago','Purok 1',5,8000.00,'Farmer','Elementary undergrad/grad','Fair','Moderate','Approved',8.4407,124.9919,'','S-staff','2026-11-03'),
('HH-0008','Liza Cabahug','Santiago','Purok 3',4,14000.00,'Government employee','Tertiary','Good','Full','Approved',8.4368,124.9958,'','S-staff','2026-11-02'),
('HH-0009','Dante Ocampo','Santiago','Purok 4',7,5500.00,'Daily wage laborer','No schooling','Poor','Limited','Approved',8.4418,124.9945,'','S-staff','2026-11-04'),
('HH-0010','Grace Tumulak','Santiago','Purok 5',3,11000.00,'Small business owner','Secondary graduate','Fair','Moderate','Approved',8.4376,124.9913,'','S-staff','2026-11-06'),
('HH-0011','Ernesto Pacatang','Maluko','Purok 1',6,6000.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.3752,124.9556,'','M-staff','2026-11-01'),
('HH-0012','Marites Gonzales','Maluko','Purok 2',5,12500.00,'Private employee','Secondary graduate','Fair','Moderate','Approved',8.3716,124.9516,'','M-staff','2026-11-03'),
('HH-0013','Alfredo Baguio','Maluko','Purok 3',8,7000.00,'Seasonal worker','Secondary undergrad','Poor','Limited','Approved',8.3759,124.9529,'','M-staff','2026-11-02'),
('HH-0014','Nenita Salcedo','Maluko','Purok 4',4,18000.00,'Teacher','Tertiary','Good','Full','Approved',8.3707,124.9552,'','M-staff','2026-11-01'),
('HH-0015','Jun Dalagan','Maluko','Purok 5',3,9500.00,'Tricycle driver','Secondary undergrad','Fair','Moderate','Approved',8.374,124.9563,'','M-staff','2026-11-07'),
('HH-0016','Teresita Abello','Lunocan','Purok 1',5,7500.00,'Farmer','Elementary undergrad/grad','Fair','Moderate','Approved',8.4162,124.8252,'','L-staff','2026-11-01'),
('HH-0017','Ramon Villaruz','Lunocan','Purok 2',6,5000.00,'Farm laborer','No schooling','Poor','Limited','Approved',8.412,124.8219,'','L-staff','2026-11-04'),
('HH-0018','Cynthia Paraiso','Lunocan','Purok 3',4,16000.00,'Sari-sari store owner','Secondary graduate','Good','Full','Approved',8.4157,124.8204,'','L-staff','2026-11-05'),
('HH-0019','Mario Lagunday','Lunocan','Purok 4',7,6500.00,'Daily wage laborer','Secondary undergrad','Poor','Limited','Approved',8.4132,124.8261,'','L-staff','2026-11-03'),
('HH-0020','Joy Estrada','Lunocan','Purok 5',3,10500.00,'Self-employed','Secondary graduate','Fair','Moderate','Approved',8.4155,124.8247,'','L-staff','2026-11-07'),
('HH-0021','Benjamin Ayuban','Ticala','Purok 1',5,9000.00,'Farmer','Secondary undergrad','Fair','Moderate','Approved',8.3429,124.8891,'','T-staff','2026-11-01'),
('HH-0022','Luzviminda Cuenca','Ticala','Purok 2',6,5800.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.3392,124.8927,'','T-staff','2026-11-04'),
('HH-0023','Felix Manatad','Ticala','Purok 3',4,13500.00,'Carpenter','Secondary graduate','Good','Moderate','Approved',8.344,124.8919,'','T-staff','2026-11-05'),
('HH-0024','Rosalinda Bacalso','Ticala','Purok 4',7,4800.00,'No regular income','No schooling','Poor','Limited','Approved',8.3398,124.8885,'','T-staff','2026-11-03'),
('HH-0025','Noel Tabamo','Ticala','Purok 5',3,15000.00,'Government employee','Tertiary','Good','Full','Approved',8.3397,124.8922,'','T-staff','2026-11-07');

INSERT INTO logs (t, username, role, type, action, device, ip_address) VALUES
('2026-11-17 09:00','system','—','Activity','Database created and seeded with placeholder data','Server','—');

INSERT INTO notifs (brgy, text, time, is_read) VALUES
('Guilang-Guilang','Brgy Staff (G-staff) submitted 2 household forms for review.','2026-10-25 14:31',0);

-- VERIFY
SELECT 'accounts' AS table_name, COUNT(*) AS total FROM accounts
UNION ALL SELECT 'barangays', COUNT(*) FROM barangays
UNION ALL SELECT 'records', COUNT(*) FROM records
UNION ALL SELECT 'households', COUNT(*) FROM households
UNION ALL SELECT 'household_members', COUNT(*) FROM household_members
UNION ALL SELECT 'survey_answers', COUNT(*) FROM survey_answers
UNION ALL SELECT 'reports', COUNT(*) FROM reports
UNION ALL SELECT 'logs', COUNT(*) FROM logs
UNION ALL SELECT 'notifs', COUNT(*) FROM notifs;