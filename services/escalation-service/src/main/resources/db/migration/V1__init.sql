CREATE TABLE escalations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    commitment_id BIGINT NOT NULL,
    customer_name VARCHAR(190) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    priority VARCHAR(8) NOT NULL DEFAULT 'P1',
    sla_hours INT NOT NULL DEFAULT 4,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    assignee_user_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_priority ON escalations(priority);

INSERT INTO escalations (id, commitment_id, customer_name, summary, priority, sla_hours, status, created_at) VALUES
    (1, 3, 'Rahul Verma',  'Unresolved refund of INR 4,299',            'P1', 4,  'OPEN',        DATE_ADD(NOW(), INTERVAL -2 DAY)),
    (2, 4, 'Karan Mehta',  'Cheque bounce fee not refunded',            'P1', 4,  'IN_PROGRESS', DATE_ADD(NOW(), INTERVAL -4 DAY));
