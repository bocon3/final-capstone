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

    -- 8. LOGS
    CREATE TABLE logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        t VARCHAR(16) NOT NULL,
        username VARCHAR(30),
        role VARCHAR(20),
        type ENUM('Activity','User') NOT NULL,
        action VARCHAR(200) NOT NULL,
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
    ('brgystaff','$2b$10$2amGKemWEjT0GlXvGr.Ane8Pz1b2txsje2WmvfJv2w19b9Hi3srEm','Brgy Staff','Guilang-Guilang','Active','','','','',''),
    ('barangay','$2b$10$gvqtmUCQw.Q8UGuJfSdHjO3PPH7sTa7cJLk.vkwsYA7y.Xrq999gS','Barangay','Guilang-Guilang','Active','','','','','');

    INSERT INTO barangays (name, pct, hh, lat, lng) VALUES
    ('Minsuro', 45.00, 250, 8.3900, 124.8300),
    ('Ticala', 42.00, 220, 8.3700, 124.8700),
    ('Guilang-Guilang', 84.82, 412, 8.3745, 124.8467),
    ('Santiago', 74.35, 389, 8.3512, 124.8801),
    ('Maluco', 53.75, 165, 8.3298, 124.8489);

    INSERT INTO records (barangay, year, hh, mag) VALUES
    ('Guilang-Guilang',2019,290,232),('Guilang-Guilang',2021,303,257),('Guilang-Guilang',2023,360,300),('Guilang-Guilang',2025,412,349),
    ('Santiago',2019,350,245),('Santiago',2021,365,262),('Santiago',2023,378,279),('Santiago',2025,389,289),
    ('Maluco',2019,150,70),('Maluco',2021,155,78),('Maluco',2023,160,84),('Maluco',2025,165,89),
    ('Minsuro',2019,230,90),('Minsuro',2021,238,98),('Minsuro',2023,245,108),('Minsuro',2025,250,112),
    ('Ticala',2019,205,80),('Ticala',2021,210,84),('Ticala',2023,215,90),('Ticala',2025,220,92);

    INSERT INTO households (id, head, barangay, address, members, income, occupation, education, housing, services, status,
        lat, lng, remarks, submitted_by, form_date) VALUES
    ('HH-0001','Maria Dela Cruz','Guilang-Guilang','Purok 3',6,6500.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.3751,124.8472,'','brgystaff','2026-10-20'),
    ('HH-0002','Juan Bautista','Guilang-Guilang','Purok 1',5,9000.00,'Tricycle driver','Secondary undergrad','Fair','Moderate','Submitted',8.3738,124.8455,'','brgystaff','2026-10-25'),
    ('HH-0003','Rosa Villanueva','Guilang-Guilang','Purok 5',4,15000.00,'Sari-sari store owner','Secondary graduate','Good','Full','Under Review',NULL,NULL,'','brgystaff','2026-10-25'),
    ('HH-0004','Elena Reyes','Guilang-Guilang','Purok 2',7,5000.00,'Seasonal farm labor','No schooling','Poor','Limited','Returned',8.376,124.844,'Please verify income figure.','brgystaff','2026-10-22'),
    ('HH-0005','Pedro Santos','Guilang-Guilang','Purok 4',3,12000.00,'Carpenter','Secondary graduate','Fair','Moderate','Draft',NULL,NULL,'','brgystaff','2026-10-27'),
    ('HH-0006','Ana Lopez','Santiago','Purok 2',6,7000.00,'Farm laborer','Elementary undergrad/grad','Poor','Limited','Approved',8.3515,124.8795,'','—','2026-10-18');

    INSERT INTO logs (t, username, role, type, action) VALUES
    ('2026-11-17 09:00','system','—','Activity','Database created and seeded with placeholder data');

    INSERT INTO notifs (brgy, text, time, is_read) VALUES
    ('Guilang-Guilang','Brgy Staff (brgystaff) submitted 2 household forms for review.','2026-10-25 14:31',0);

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