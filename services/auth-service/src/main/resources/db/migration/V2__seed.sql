-- Seed roles and permissions. Demo users are created programmatically by DataInitializer.

INSERT INTO roles (name) VALUES ('ADMIN'), ('MANAGER'), ('AGENT'), ('USER');

INSERT INTO permissions (name) VALUES
    ('user:read'), ('user:write'),
    ('commitment:read'), ('commitment:write'),
    ('escalation:read'), ('escalation:manage'),
    ('analytics:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
    ON p.name IN ('user:read','commitment:read','commitment:write','escalation:read','escalation:manage','analytics:read')
WHERE r.name = 'MANAGER';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
    ON p.name IN ('commitment:read','commitment:write','escalation:read','escalation:manage')
WHERE r.name = 'AGENT';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
    ON p.name IN ('commitment:read')
WHERE r.name = 'USER';
