CREATE TABLE commitments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(190) NOT NULL,
    commitment_type VARCHAR(64) NOT NULL,
    description VARCHAR(500) NOT NULL,
    owner_user_id BIGINT NULL,
    due_at TIMESTAMP NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validation_sent_at TIMESTAMP NULL,
    validation_responded_at TIMESTAMP NULL,
    customer_resolved_response BOOLEAN NULL,
    customer_response_comment VARCHAR(1000) NULL,
    linked_escalation_id BIGINT NULL
) ENGINE=InnoDB;

CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_due_at ON commitments(due_at);

CREATE TABLE commitment_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    commitment_id BIGINT NOT NULL,
    event VARCHAR(64) NOT NULL,
    detail VARCHAR(500) NULL,
    at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_commitment (commitment_id, at)
) ENGINE=InnoDB;

INSERT INTO commitments (id, customer_name, commitment_type, description, due_at, status, created_at, linked_escalation_id) VALUES
    (1, 'Anita Kumar',   'CARD_REPLACEMENT',    'Dispatch replacement debit card',                 DATE_ADD(NOW(), INTERVAL 1 DAY),  'PENDING',         DATE_ADD(NOW(), INTERVAL -1 DAY), NULL),
    (2, 'Ishaan Rao',    'ACCOUNT_CORRECTION',  'Correct middle name spelling',                    DATE_ADD(NOW(), INTERVAL 0 HOUR), 'PENDING',         DATE_ADD(NOW(), INTERVAL -1 DAY), NULL),
    (3, 'Rahul Verma',   'REFUND',              'Refund of INR 4,299 to source card',              DATE_ADD(NOW(), INTERVAL -3 DAY), 'ESCALATED',       DATE_ADD(NOW(), INTERVAL -5 DAY), 1),
    (4, 'Karan Mehta',   'REFUND',              'Reverse cheque bounce charge',                    DATE_ADD(NOW(), INTERVAL -5 DAY), 'ESCALATED',       DATE_ADD(NOW(), INTERVAL -7 DAY), 2);

-- Populate audit for a couple of commitments to make the timeline look real.
INSERT INTO commitment_audit (commitment_id, event, detail, at) VALUES
    (3, 'CREATED',            'Commitment created for Rahul Verma',       DATE_ADD(NOW(), INTERVAL -5 DAY)),
    (3, 'VALIDATION_SENT',    'Automated validation request sent',        DATE_ADD(NOW(), INTERVAL -3 DAY)),
    (3, 'CUSTOMER_RESPONDED', 'Customer reported UNRESOLVED: no credit',  DATE_ADD(NOW(), INTERVAL -2 DAY)),
    (3, 'ESCALATED',          'Escalation opened, priority P1',           DATE_ADD(NOW(), INTERVAL -2 DAY)),
    (4, 'CREATED',            'Commitment created for Karan Mehta',       DATE_ADD(NOW(), INTERVAL -7 DAY)),
    (4, 'VALIDATION_SENT',    'Automated validation request sent',        DATE_ADD(NOW(), INTERVAL -5 DAY)),
    (4, 'CUSTOMER_RESPONDED', 'Customer reported UNRESOLVED',             DATE_ADD(NOW(), INTERVAL -4 DAY)),
    (4, 'ESCALATED',          'Escalation opened, priority P1',           DATE_ADD(NOW(), INTERVAL -4 DAY));
