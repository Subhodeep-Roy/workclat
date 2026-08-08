-- Seed data for local development

INSERT INTO roles (name, description) VALUES
  ('administrator', 'Platform administrator'),
  ('finance_executive', 'Finance executive'),
  ('finance_manager', 'Finance manager'),
  ('cfo', 'Chief financial officer'),
  ('vendor', 'Vendor portal user');

INSERT INTO users (email, password_hash, full_name, role_id)
SELECT 'admin@vendorflow.ai', '$2b$12$Q0u6m8y2qG7XbG9Y4fO0c.0a2P5l6O8Nq7nM3Y8R0wI2mN5uS7zAq', 'Admin User', id FROM roles WHERE name = 'administrator';

INSERT INTO users (email, password_hash, full_name, role_id)
SELECT 'finance@vendorflow.ai', '$2b$12$Q0u6m8y2qG7XbG9Y4fO0c.0a2P5l6O8Nq7nM3Y8R0wI2mN5uS7zAq', 'Finance Lead', id FROM roles WHERE name = 'finance_executive';

INSERT INTO vendors (name, email, tax_id, bank_account, status) VALUES
  ('Northwind Supplies', 'billing@northwind.com', 'GST-001', 'BANK-001', 'active'),
  ('Acme Components', 'ap@acme.com', 'GST-002', 'BANK-002', 'active'),
  ('Globex Industrial', 'payables@globex.com', 'GST-003', 'BANK-003', 'active');

INSERT INTO departments (name, manager_id, budget_limit) VALUES
  ('Engineering', NULL, 1000000),
  ('Operations', NULL, 750000),
  ('Sales', NULL, 500000);

INSERT INTO budgets (department_id, fiscal_year, allocated_amount, spent_amount, remaining_amount)
SELECT id, 2026, 1000000, 320000, 680000 FROM departments WHERE name = 'Engineering';

INSERT INTO budgets (department_id, fiscal_year, allocated_amount, spent_amount, remaining_amount)
SELECT id, 2026, 750000, 240000, 510000 FROM departments WHERE name = 'Operations';

INSERT INTO budgets (department_id, fiscal_year, allocated_amount, spent_amount, remaining_amount)
SELECT id, 2026, 500000, 180000, 320000 FROM departments WHERE name = 'Sales';
