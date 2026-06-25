-- Alter profiles table to add AI evaluation subscription tracking
alter table public.profiles 
add column if not exists ai_payment_screenshot_url text,
add column if not exists ai_status text not null default 'unpaid', -- 'unpaid', 'pending', 'approved', 'rejected'
add column if not exists ai_approved_until timestamp with time zone,
add column if not exists ai_rejection_reason text;
