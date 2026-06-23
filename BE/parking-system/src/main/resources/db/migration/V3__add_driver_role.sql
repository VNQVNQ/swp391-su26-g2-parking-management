-- ============================================================
-- V3: Add DRIVER role for user self-registration
-- The UserService.createUser() assigns DRIVER role to new users,
-- but this role was missing from the initial seed data.
-- ============================================================

INSERT INTO roles (role_code, role_name, role_description)
VALUES ('DRIVER', 'Driver', 'Người dùng đăng ký tài khoản để sử dụng dịch vụ đỗ xe')
ON CONFLICT (role_code) DO NOTHING;
