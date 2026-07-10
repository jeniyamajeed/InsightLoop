-- Create one schema per microservice (database-per-service pattern).
CREATE DATABASE IF NOT EXISTS insightloop_auth       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insightloop_feedback   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insightloop_validation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS insightloop_escalation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
