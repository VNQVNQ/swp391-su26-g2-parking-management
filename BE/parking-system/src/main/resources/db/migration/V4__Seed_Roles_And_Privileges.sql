-- V4__Seed_Roles_And_Privileges.sql
-- Description: Insert initial roles and privileges required for the parking management system

-- ============================================================================
-- 1. Insert Privileges
-- ============================================================================
INSERT INTO privileges (privilege_name, privilege_code, is_active) VALUES
    ('View Dashboard', 'VIEW_DASHBOARD', true),
    ('Manage Users', 'MANAGE_USERS', true),
    ('Manage Roles', 'MANAGE_ROLES', true),
    ('Manage Pricing', 'MANAGE_PRICING', true),
    ('View Reports', 'VIEW_REPORTS', true),
    ('Manage Settings', 'MANAGE_SETTINGS', true),
    ('Manage Slots', 'MANAGE_SLOTS', true),
    ('Manage Passes', 'MANAGE_PASSES', true),
    ('Manage Exceptions', 'MANAGE_EXCEPTIONS', true),
    ('Vehicle Entry', 'VEHICLE_ENTRY', true),
    ('Vehicle Exit', 'VEHICLE_EXIT', true),
    ('View Own Profile', 'VIEW_OWN_PROFILE', true)
ON CONFLICT (privilege_code) DO NOTHING;

-- ============================================================================
-- 2. Insert Roles
-- ============================================================================
INSERT INTO roles (role_name, role_code, role_description, is_active) VALUES
    ('Administrator', 'ADMIN', 'System administrator with full access', true),
    ('Manager', 'MANAGER', 'Parking lot manager', true),
    ('Staff', 'STAFF', 'Parking lot staff for entry/exit operations', true),
    ('Driver', 'DRIVER', 'Registered driver/customer', true)
ON CONFLICT (role_code) DO NOTHING;

-- ============================================================================
-- 3. Assign Privileges to Roles
-- ============================================================================

-- Admin gets all privileges
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id
FROM roles r, privileges p
WHERE r.role_code = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.role_id AND rp.privilege_id = p.id
  );

-- Manager gets dashboard, slots, passes, exceptions, reports
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id
FROM roles r, privileges p
WHERE r.role_code = 'MANAGER'
  AND p.privilege_code IN ('VIEW_DASHBOARD', 'MANAGE_SLOTS', 'MANAGE_PASSES', 'MANAGE_EXCEPTIONS', 'VIEW_REPORTS', 'VIEW_OWN_PROFILE')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.role_id AND rp.privilege_id = p.id
  );

-- Staff gets vehicle entry/exit
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id
FROM roles r, privileges p
WHERE r.role_code = 'STAFF'
  AND p.privilege_code IN ('VEHICLE_ENTRY', 'VEHICLE_EXIT', 'VIEW_OWN_PROFILE')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.role_id AND rp.privilege_id = p.id
  );

-- Driver gets view own profile
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id
FROM roles r, privileges p
WHERE r.role_code = 'DRIVER'
  AND p.privilege_code IN ('VIEW_OWN_PROFILE')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.role_id AND rp.privilege_id = p.id
  );
