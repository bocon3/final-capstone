-- ComBaTy: Community-Based Poverty Mapping, Manolo Fortich, Bukidnon
-- MySQL 8 / MariaDB 10.4+ (works with XAMPP / phpMyAdmin)

CREATE DATABASE IF NOT EXISTS combaty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE combaty;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_logs, notifications, households, poverty_records, users, barangays;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. BARANGAYS (admin: Poverty Data / Dashboard)
CREATE TABLE barangays (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  poverty_pct   DECIMAL(5,2) NOT NULL DEFAULT 0,          -- poverty incidence %
  households    INT NOT NULL DEFAULT 0,                   -- target households surveyed
  latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS (Administrator, Brgy Staff, Barangay)
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,                    -- store password_hash() output, never plain text
  role          ENUM('Administrator','Brgy Staff','Barangay') NOT NULL,
  barangay_id   INT NULL,                                 -- NULL = municipal-wide (admin)
  status        ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. POVERTY RECORDS (historical trend: feeds AI Analysis and Reports)
CREATE TABLE poverty_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  barangay_id   INT NOT NULL,
  survey_year   SMALLINT NOT NULL,
  households    INT NOT NULL,
  poor_hh       INT NOT NULL,
  poor_pct      DECIMAL(5,2) GENERATED ALWAYS AS (ROUND(poor_hh / households * 100, 2)) STORED,
  UNIQUE KEY uq_bgy_year (barangay_id, survey_year),
  CHECK (poor_hh <= households),
  FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. HOUSEHOLDS (Brgy Staff forms + geotagging; Barangay reports + GIS map)
CREATE TABLE households (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  household_code VARCHAR(12) NOT NULL UNIQUE,             -- e.g. HH-0001
  barangay_id   INT NOT NULL,
  head_name     VARCHAR(120) NOT NULL,
  address       VARCHAR(150) NOT NULL,                    -- purok / sitio
  members       INT NOT NULL CHECK (members > 0),
  monthly_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  occupation    VARCHAR(100),
  education     ENUM('No schooling','Elementary undergrad/grad','Secondary undergrad','Secondary graduate','Tertiary') NOT NULL,
  housing       ENUM('Poor','Fair','Good') NOT NULL,
  services      ENUM('Limited','Moderate','Full') NOT NULL,
  status        ENUM('Draft','Submitted','Under Review','Approved','Returned') NOT NULL DEFAULT 'Draft',
  latitude      DECIMAL(9,6) NULL,                        -- geotag
  longitude     DECIMAL(9,6) NULL,
  geotagged_at  DATETIME NULL,
  remarks       VARCHAR(255) NULL,                        -- Barangay's reason when returned
  created_by    INT NULL,                                 -- staff user
  submitted_at  DATETIME NULL,
  acted_by      INT NULL,                                 -- barangay user who approved/reviewed/returned
  acted_at      DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hh_bgy_status (barangay_id, status),
  FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (acted_by)    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. NOTIFICATIONS (Barangay alerts when staff submit forms)
CREATE TABLE notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  barangay_id   INT NOT NULL,
  message       VARCHAR(255) NOT NULL,
  is_read       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif (barangay_id, is_read),
  FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. SYSTEM LOGS (admin: activity and user logs)
CREATE TABLE system_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NULL,
  log_type      ENUM('Activity','User') NOT NULL,
  action        VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(45) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_type (log_type, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ───────────── SEED DATA (placeholders: replace with real survey data) ─────────────
INSERT INTO barangays (name, poverty_pct, households, latitude, longitude) VALUES
('Minsuro',45.00,250,8.390000,124.830000),
('Ticala',42.00,220,8.370000,124.870000),
('Guilang-Guilang',84.82,412,8.374500,124.846700),
('Santiago',74.35,389,8.351200,124.880100),
('Maluco',53.75,165,8.329800,124.848900);

-- Demo passwords: admin123 / brgystaff123 / barangay123 (bcrypt). Change them before real use.
INSERT INTO users (username, password_hash, role, barangay_id) VALUES
('admin','$2y$10$I4rEfuIZxxNKCejE8bCysOA4KBnhRwcgDEnnUS7xg5nByB3UJjsYK','Administrator',NULL),
('brgystaff','$2y$10$t/CAhwxgqp9vORy0Kb.ZW.DRjQ72Du2xvlB4m7UwYzwJJpYLBBZde','Brgy Staff',(SELECT id FROM barangays WHERE name='Guilang-Guilang')),
('barangay','$2y$10$P4It1iuLM8iM03Y0x.GP4e9/ms9zc7Lkpssdkv0veegnBVvkgi7J2','Barangay',(SELECT id FROM barangays WHERE name='Guilang-Guilang'));

INSERT INTO poverty_records (barangay_id, survey_year, households, poor_hh)
SELECT b.id, v.y, v.hh, v.poor FROM barangays b JOIN (
 SELECT 'Guilang-Guilang' n,2019 y,290 hh,232 poor UNION ALL SELECT 'Guilang-Guilang',2021,303,257 UNION ALL SELECT 'Guilang-Guilang',2023,360,300 UNION ALL SELECT 'Guilang-Guilang',2025,412,349
 UNION ALL SELECT 'Santiago',2019,350,245 UNION ALL SELECT 'Santiago',2021,365,262 UNION ALL SELECT 'Santiago',2023,378,279 UNION ALL SELECT 'Santiago',2025,389,289
 UNION ALL SELECT 'Maluco',2019,150,70 UNION ALL SELECT 'Maluco',2021,155,78 UNION ALL SELECT 'Maluco',2023,160,84 UNION ALL SELECT 'Maluco',2025,165,89
 UNION ALL SELECT 'Minsuro',2019,230,90 UNION ALL SELECT 'Minsuro',2021,238,98 UNION ALL SELECT 'Minsuro',2023,245,108 UNION ALL SELECT 'Minsuro',2025,250,112
 UNION ALL SELECT 'Ticala',2019,205,80 UNION ALL SELECT 'Ticala',2021,210,84 UNION ALL SELECT 'Ticala',2023,215,90 UNION ALL SELECT 'Ticala',2025,220,92
) v ON v.n = b.name;

INSERT INTO households (household_code, barangay_id, head_name, address, members, monthly_income, occupation, education, housing, services, status, latitude, longitude, remarks, created_by)
SELECT h.code, b.id, h.head, h.addr, h.mem, h.inc, h.occ, h.edu, h.hou, h.srv, h.st, h.la, h.lo, h.rem,
       (SELECT id FROM users WHERE username='brgystaff')
FROM barangays b JOIN (
 SELECT 'HH-0001' code,'Guilang-Guilang' bn,'Maria Dela Cruz' head,'Purok 3' addr,6 mem,6500 inc,'Farm laborer' occ,'Elementary undergrad/grad' edu,'Poor' hou,'Limited' srv,'Approved' st,8.375100 la,124.847200 lo,NULL rem
 UNION ALL SELECT 'HH-0002','Guilang-Guilang','Juan Bautista','Purok 1',5,9000,'Tricycle driver','Secondary undergrad','Fair','Moderate','Submitted',8.373800,124.845500,NULL
 UNION ALL SELECT 'HH-0003','Guilang-Guilang','Rosa Villanueva','Purok 5',4,15000,'Sari-sari store owner','Secondary graduate','Good','Full','Under Review',NULL,NULL,NULL
 UNION ALL SELECT 'HH-0004','Guilang-Guilang','Elena Reyes','Purok 2',7,5000,'Seasonal farm labor','No schooling','Poor','Limited','Returned',8.376000,124.844000,'Please verify income figure.'
 UNION ALL SELECT 'HH-0005','Guilang-Guilang','Pedro Santos','Purok 4',3,12000,'Carpenter','Secondary graduate','Fair','Moderate','Draft',NULL,NULL,NULL
 UNION ALL SELECT 'HH-0006','Santiago','Ana Lopez','Purok 2',6,7000,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.351500,124.879500,NULL
) h ON h.bn = b.name;

INSERT INTO notifications (barangay_id, message)
VALUES ((SELECT id FROM barangays WHERE name='Guilang-Guilang'),'Brgy Staff (brgystaff) submitted 2 household forms for review.');

INSERT INTO system_logs (user_id, log_type, action) VALUES
((SELECT id FROM users WHERE username='admin'),'User','Logged in'),
((SELECT id FROM users WHERE username='brgystaff'),'Activity','Submitted 2 household forms to Barangay');

-- ───────────── USEFUL QUERIES ─────────────
-- Poverty classification (matches the app):
--   SELECT name, poverty_pct, CASE WHEN poverty_pct>=36 THEN 'High' WHEN poverty_pct>=21 THEN 'Moderate'
--          WHEN poverty_pct>=11 THEN 'Low' ELSE 'Very Low' END AS level FROM barangays;
-- Per-household poverty status (per-capita monthly income, illustrative thresholds):
--   SELECT household_code, CASE WHEN monthly_income/members<2775 THEN 'Poor'
--          WHEN monthly_income/members<4163 THEN 'Near-poor' ELSE 'Non-poor' END AS poverty_status FROM households;
-- Barangay survey progress %:
--   SELECT b.name, ROUND(SUM(h.status<>'Draft')/b.households*100,1) AS progress_pct
--   FROM barangays b LEFT JOIN households h ON h.barangay_id=b.id GROUP BY b.id;