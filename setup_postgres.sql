-- Run this as a PostgreSQL superuser (e.g. postgres)
-- psql -U postgres -f setup_postgres.sql

CREATE USER campus_user WITH PASSWORD 'campus_pass';
CREATE DATABASE campus_reminder_db OWNER campus_user;
GRANT ALL PRIVILEGES ON DATABASE campus_reminder_db TO campus_user;

\connect campus_reminder_db

GRANT ALL ON SCHEMA public TO campus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campus_user;

\echo 'Database setup complete. Connect with: postgresql+asyncpg://campus_user:campus_pass@localhost:5432/campus_reminder_db'
