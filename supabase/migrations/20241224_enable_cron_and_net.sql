-- Enable pg_cron for job scheduling
create extension if not exists pg_cron;

-- Enable pg_net for making HTTP requests (to trigger API endpoints)
create extension if not exists pg_net;
