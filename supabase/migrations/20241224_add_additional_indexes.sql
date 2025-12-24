-- Add missing indexes for performance optimization

-- Visa History indexes
create index if not exists idx_visa_history_employee_id on visa_history(employee_id);
create index if not exists idx_visa_history_changed_at on visa_history(changed_at desc);

-- Notification Logs indexes
create index if not exists idx_notification_logs_email_sent on notification_logs(email_sent);
create index if not exists idx_notification_logs_type on notification_logs(type);
create index if not exists idx_notification_logs_created_at on notification_logs(created_at desc);
create index if not exists idx_notification_logs_emp_id on notification_logs(employee_id);

-- Audit Logs indexes
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

-- Employee Table additional indexes (if missing from previous migration)
create index if not exists idx_employee_passport_no on employee_table(passport_no);
create index if not exists idx_employee_email_id on employee_table(email_id);

-- Admin Invites (new table) indexes
create index if not exists idx_admin_invites_invited_by on admin_invites(invited_by);

-- Analyze tables to update stats
analyze visa_history;
analyze notification_logs;
analyze audit_logs;
analyze employee_table;
analyze admin_invites;
