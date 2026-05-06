-- 002_add_user_goal.sql
ALTER TABLE users ADD COLUMN weekly_goal_seconds INTEGER DEFAULT 36000;
