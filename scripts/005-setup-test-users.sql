-- Set up test admin user
update public.users
set password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role = 'admin',
    status = 'approved'
where email = 'admin@kbc.co.za';

-- Set up test client user
update public.users
set password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    status = 'approved',
    business_id = 'TFS-001'
where email = 'clients@kbc.co.za';
