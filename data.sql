
-- =====================================================
-- COMBATY DATABASE - FINAL VERSION
-- MySQL / MariaDB / XAMPP / phpMyAdmin
-- =====================================================

-- 1. REMOVE AND RECREATE DATABASE
DROP DATABASE IF EXISTS combaty;

CREATE DATABASE combaty
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE combaty;

SET NAMES utf8mb4;

-- =====================================================
-- 2. ACCOUNTS TABLE
-- =====================================================

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

-- =====================================================
-- 3. BARANGAYS TABLE
-- =====================================================

CREATE TABLE barangays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    pct DECIMAL(5,2) NOT NULL,
    hh INT NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL
) ENGINE=InnoDB;

-- =====================================================
-- 4. RECORDS TABLE
-- =====================================================

CREATE TABLE records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barangay VARCHAR(60) NOT NULL,
    year SMALLINT NOT NULL,
    hh INT NOT NULL,
    mag INT NOT NULL,

    UNIQUE KEY uq_brgy_year (barangay, year),

    CONSTRAINT fk_rec_brgy
        FOREIGN KEY (barangay)
        REFERENCES barangays(name)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 5. HOUSEHOLDS TABLE
-- =====================================================

CREATE TABLE households (
    id VARCHAR(10) PRIMARY KEY,
    head VARCHAR(120) NOT NULL,
    barangay VARCHAR(60) NOT NULL,
    address VARCHAR(120) NOT NULL,
    members INT NOT NULL,
    income DECIMAL(12,2) NOT NULL,
    occupation VARCHAR(120) DEFAULT '',

    education ENUM(
        'No schooling',
        'Elementary undergrad/grad',
        'Secondary undergrad',
        'Secondary graduate',
        'Tertiary'
    ),

    housing ENUM('Poor','Fair','Good'),
    services ENUM('Limited','Moderate','Full'),

    status ENUM(
        'Draft',
        'Submitted',
        'Under Review',
        'Approved',
        'Returned'
    ) NOT NULL DEFAULT 'Draft',

    lat DOUBLE NULL,
    lng DOUBLE NULL,
    geo_src VARCHAR(60) NULL,
    geo_at VARCHAR(16) NULL,

    remarks VARCHAR(300) DEFAULT '',
    submitted_by VARCHAR(30) DEFAULT '—',
    form_date DATE NULL,
    acted_by VARCHAR(30) NULL,
    acted_on VARCHAR(16) NULL,

    KEY ix_hh_brgy (barangay),
    KEY ix_hh_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- 6. LOGS TABLE
-- =====================================================

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    t VARCHAR(16) NOT NULL,
    username VARCHAR(30),
    role VARCHAR(20),

    type ENUM('Activity','User') NOT NULL,
    action VARCHAR(200) NOT NULL,

    KEY ix_logs_t (t)
) ENGINE=InnoDB;

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brgy VARCHAR(60) NOT NULL,
    text VARCHAR(300) NOT NULL,
    time VARCHAR(16) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,

    KEY ix_notif_brgy (brgy)
) ENGINE=InnoDB;

-- =====================================================
-- 8. INSERT ACCOUNTS
-- =====================================================

INSERT INTO accounts (
    username, password_hash, role, barangay,
    status, full_name, position, email, phone, address
) VALUES
(
    'admin',
    '$2b$10$K77hOyDXuIN5a5dK7NTiZuMVA4aJbOKpRrPTGeOgzHETjDLmRPr.i',
    'Administrator',
    'Municipal-wide',
    'Active', '', '', '', '', ''
),
(
    'brgystaff',
    '$2b$10$2amGKemWEjT0GlXvGr.Ane8Pz1b2txsje2WmvfJv2w19b9Hi3srEm',
    'Brgy Staff',
    'Guilang-Guilang',
    'Active', '', '', '', '', ''
),
(
    'barangay',
    '$2b$10$gvqtmUCQw.Q8UGuJfSdHjO3PPH7sTa7cJLk.vkwsYA7y.Xrq999gS',
    'Barangay',
    'Guilang-Guilang',
    'Active', '', '', '', '', ''
);

-- =====================================================
-- 9. INSERT BARANGAYS
-- =====================================================

INSERT INTO barangays (name, pct, hh, lat, lng) VALUES
('Minsuro', 45.00, 250, 8.3900, 124.8300),
('Ticala', 42.00, 220, 8.3700, 124.8700),
('Guilang-Guilang', 84.82, 412, 8.3745, 124.8467),
('Santiago', 74.35, 389, 8.3512, 124.8801),
('Maluco', 53.75, 165, 8.3298, 124.8489);

-- =====================================================
-- 10. INSERT HISTORICAL RECORDS
-- =====================================================

INSERT INTO records (barangay, year, hh, mag) VALUES
('Guilang-Guilang', 2019, 290, 232),
('Guilang-Guilang', 2021, 303, 257),
('Guilang-Guilang', 2023, 360, 300),
('Guilang-Guilang', 2025, 412, 349),

('Santiago', 2019, 350, 245),
('Santiago', 2021, 365, 262),
('Santiago', 2023, 378, 279),
('Santiago', 2025, 389, 289),

('Maluco', 2019, 150, 70),
('Maluco', 2021, 155, 78),
('Maluco', 2023, 160, 84),
('Maluco', 2025, 165, 89),

('Minsuro', 2019, 230, 90),
('Minsuro', 2021, 238, 98),
('Minsuro', 2023, 245, 108),
('Minsuro', 2025, 250, 112),

('Ticala', 2019, 205, 80),
('Ticala', 2021, 210, 84),
('Ticala', 2023, 215, 90),
('Ticala', 2025, 220, 92);

-- =====================================================
-- 11. INSERT HOUSEHOLD RECORDS
-- =====================================================

INSERT INTO households (
    id, head, barangay, address, members, income,
    occupation, education, housing, services, status,
    lat, lng, geo_src, geo_at, remarks,
    submitted_by, form_date, acted_by, acted_on
) VALUES

('HH-0001','Maria Dela Cruz','Guilang-Guilang','Purok 3',
6,6500.00,'Farm laborer','Elementary undergrad/grad',
'Poor','Limited','Approved',8.3751,124.8472,
NULL,NULL,'','brgystaff','2026-10-20',NULL,NULL),

('HH-0002','Juan Bautista','Guilang-Guilang','Purok 1',
5,9000.00,'Tricycle driver','Secondary undergrad',
'Fair','Moderate','Submitted',8.3738,124.8455,
NULL,NULL,'','brgystaff','2026-10-25',NULL,NULL),

('HH-0003','Rosa Villanueva','Guilang-Guilang','Purok 5',
4,15000.00,'Sari-sari store owner','Secondary graduate',
'Good','Full','Under Review',NULL,NULL,
NULL,NULL,'','brgystaff','2026-10-25',NULL,NULL),

('HH-0004','Elena Reyes','Guilang-Guilang','Purok 2',
7,5000.00,'Seasonal farm labor','No schooling',
'Poor','Limited','Returned',8.376,124.844,
NULL,NULL,'Please verify income figure.',
'brgystaff','2026-10-22',NULL,NULL),

('HH-0005','Pedro Santos','Guilang-Guilang','Purok 4',
3,12000.00,'Carpenter','Secondary graduate',
'Fair','Moderate','Draft',NULL,NULL,
NULL,NULL,'','brgystaff','2026-10-27',NULL,NULL),

('HH-0006','Ana Lopez','Santiago','Purok 2',
6,7000.00,'Farm laborer','Elementary undergrad/grad',
'Poor','Limited','Approved',8.3515,124.8795,
NULL,NULL,'','—','2026-10-18',NULL,NULL);

-- =====================================================
-- 12. INSERT ACTIVITY LOGS
-- =====================================================

INSERT INTO logs (t, username, role, type, action) VALUES
(
    '2026-11-09 19:37',
    'system',
    '—',
    'Activity',
    'Database created and seeded with placeholder data'
);

-- =====================================================
-- 13. INSERT NOTIFICATIONS
-- =====================================================

INSERT INTO notifs (brgy, text, time, is_read) VALUES
(
    'Guilang-Guilang',
    'Brgy Staff (brgystaff) submitted 2 household forms for review.',
    '2026-10-25 14:31',
    0
);

-- =====================================================
-- 14. VERIFY DATABASE TABLES
-- =====================================================

SELECT 'accounts' AS table_name, COUNT(*) AS total FROM accounts
UNION ALL
SELECT 'barangays', COUNT(*) FROM barangays
UNION ALL
SELECT 'records', COUNT(*) FROM records
UNION ALL
SELECT 'households', COUNT(*) FROM households
UNION ALL
SELECT 'logs', COUNT(*) FROM logs
UNION ALL
SELECT 'notifs', COUNT(*) FROM notifs;

-- =====================================================
-- END OF COMBATY DATABASE
-- =====================================================
s