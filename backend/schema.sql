-- InnovX AI Database Schema
-- Run this in MySQL before starting the backend

CREATE DATABASE IF NOT EXISTS innovx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE innovx_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar VARCHAR(500),
    department VARCHAR(100),
    university VARCHAR(150),
    year_of_study INT,
    bio TEXT,
    github_url VARCHAR(300),
    linkedin_url VARCHAR(300),
    portfolio_url VARCHAR(300),
    location VARCHAR(200),
    latitude FLOAT,
    longitude FLOAT,
    skills TEXT,
    interests TEXT ,
    hackathon_count INT DEFAULT 0,
    startup_interest BOOLEAN DEFAULT FALSE,
    is_mentor BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score FLOAT DEFAULT 100.0,
    innovation_score INT DEFAULT 0,
    points INT DEFAULT 0,
    `rank` VARCHAR(50) DEFAULT 'Newcomer',
    google_id VARCHAR(200),
    otp VARCHAR(10),
    otp_expiry DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_location (latitude, longitude)
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    domain VARCHAR(100),
    tech_stack TEXT ,
    status VARCHAR(50) DEFAULT 'active',
    difficulty VARCHAR(50),
    github_url VARCHAR(300),
    demo_url VARCHAR(300),
    thumbnail VARCHAR(500),
    owner_id INT NOT NULL,
    team_size INT DEFAULT 1,
    looking_for_members BOOLEAN DEFAULT TRUE,
    required_skills TEXT ,
    milestones TEXT ,
    progress INT DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_domain (domain),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_id INT,
    leader_id INT,
    max_members INT DEFAULT 5,
    is_open BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    project_id INT,
    user_id INT NOT NULL,
    role VARCHAR(100),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS startups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(300),
    description TEXT,
    domain VARCHAR(100),
    stage VARCHAR(50),
    logo VARCHAR(500),
    website VARCHAR(300),
    pitch_deck VARCHAR(500),
    founder_id INT NOT NULL,
    looking_for TEXT ,
    required_skills TEXT ,
    funding_goal FLOAT,
    current_funding FLOAT DEFAULT 0,
    team_size INT DEFAULT 1,
    location VARCHAR(200),
    is_hiring BOOLEAN DEFAULT TRUE,
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_domain (domain),
    INDEX idx_stage (stage)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    room_id VARCHAR(100),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_room (room_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(300),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    expertise TEXT ,
    experience_years INT,
    company VARCHAR(200),
    designation VARCHAR(200),
    hourly_rate FLOAT DEFAULT 0,
    availability TEXT ,
    rating FLOAT DEFAULT 0,
    total_sessions INT DEFAULT 0,
    bio TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentor_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    student_id INT NOT NULL,
    scheduled_at DATETIME,
    duration_minutes INT DEFAULT 60,
    status VARCHAR(50) DEFAULT 'pending',
    topic VARCHAR(300),
    notes TEXT,
    rating INT,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    organizer_id INT,
    start_date DATETIME,
    end_date DATETIME,
    location VARCHAR(300),
    latitude FLOAT,
    longitude FLOAT,
    is_online BOOLEAN DEFAULT FALSE,
    registration_url VARCHAR(500),
    prize_pool VARCHAR(200),
    max_participants INT,
    current_participants INT DEFAULT 0,
    tags TEXT ,
    thumbnail VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (event_type),
    INDEX idx_location (latitude, longitude)
);

CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    description TEXT,
    badge_icon VARCHAR(100),
    badge_color VARCHAR(50),
    points_awarded INT DEFAULT 0,
    achievement_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collaboration_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    project_id INT,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to INT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    skills JSON,
    interests JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample data
INSERT IGNORE INTO users (name, email, password_hash, department, university, bio, skills, interests, is_verified, points, innovation_score, trust_score, `rank`) VALUES
('Alex Johnson', 'alex@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBufhFte2.QJWGLYQP3IQKK2', 'Computer Science', 'MIT', 'Full-stack developer passionate about AI', '["React", "Python", "Machine Learning", "Node.js"]', '["AI", "Startups", "Web Dev"]', TRUE, 1500, 150, 92.0, 'Advanced'),
('Sarah Chen', 'sarah@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBufhFte2.QJWGLYQP3IQKK2', 'Data Science', 'Stanford', 'ML researcher and startup enthusiast', '["Python", "TensorFlow", "Data Analysis", "SQL"]', '["Machine Learning", "Research", "Innovation"]', TRUE, 2200, 220, 95.0, 'Expert'),
('Marcus Williams', 'marcus@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBufhFte2.QJWGLYQP3IQKK2', 'Electrical Engineering', 'Caltech', 'IoT and embedded systems developer', '["C++", "Arduino", "IoT", "Embedded Systems"]', '["Hardware", "IoT", "Robotics"]', TRUE, 800, 80, 88.0, 'Rising Star');

-- Password for all demo users is: Demo@1234
