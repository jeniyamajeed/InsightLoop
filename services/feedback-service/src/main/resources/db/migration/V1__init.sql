CREATE TABLE interactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(190) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    agent_user_id BIGINT NULL,
    csat_score INT NULL,
    csat_comment VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    feedback_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO interactions (customer_name, channel, summary, agent_user_id, csat_score, csat_comment, feedback_at) VALUES
    ('Rahul Verma',   'CALL',  'Duplicate card charge dispute',           2, 5, 'Very helpful',       NOW()),
    ('Anita Kumar',   'CHAT',  'Debit card blocked, needs replacement',   2, 4, 'Prompt',             NOW());
