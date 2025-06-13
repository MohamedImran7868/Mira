-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types first
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE feedback_type AS ENUM ('response', 'application');
CREATE TYPE sender_type AS ENUM ('human', 'bot');
CREATE TYPE resource_type AS ENUM ('association', 'consultant');

-- User table (linked to Supabase auth)
CREATE TABLE "user" (
    userID UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(50) NOT NULL,
    user_email VARCHAR(50) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_image VARCHAR(255) NOT NULL DEFAULT 'Default_pfp.jpg',
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    studentID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_birthday DATE NOT NULL,
    student_age INT NOT NULL,
    status account_status NOT NULL,
    userID UUID NOT NULL REFERENCES "user"(userID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin table
CREATE TABLE admin (
    adminID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_birthday DATE NOT NULL,
    admin_age INT NOT NULL,
    userID UUID NOT NULL REFERENCES "user"(userID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    feedbackID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_by VARCHAR(20) NOT NULL,
    feedback_type feedback_type NOT NULL,
    feedback_content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studentID UUID NOT NULL REFERENCES students(studentID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ChatSession table
CREATE TABLE chatSession (
    chatID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    chatDuration INTERVAL,
    studentID UUID NOT NULL REFERENCES students(studentID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message table
CREATE TABLE message (
    messageID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender sender_type NOT NULL,
    message_content TEXT NOT NULL,
    message_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chatID UUID NOT NULL REFERENCES chatSession(chatID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    resourceID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type resource_type NOT NULL,
    resource_name VARCHAR(50) NOT NULL,
    resource_details TEXT NOT NULL,
    resource_contact VARCHAR(15) NOT NULL,
    adminID UUID NOT NULL REFERENCES admin(adminID) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Statistic History table
CREATE TABLE statistics_history (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_count INTEGER NOT NULL,
  feedback_count INTEGER NOT NULL,
  resource_count INTEGER NOT NULL,
  student_count INTEGER NOT NULL,
  UNIQUE(date) -- Ensures only one entry per date
);

create table public.invite_emails (
  id uuid not null default extensions.uuid_generate_v4(),
  email varchar(255) not null,
  password varchar(255) not null,
  invited_by uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint invite_emails_pkey primary key (id),
  constraint invite_emails_invited_by_fkey foreign key (invited_by) references auth.users(id)
);

CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'resource', 'student', or 'feedback'
  entity_id TEXT, -- ID of the affected entity
  entity_name TEXT, -- Name to display
  message TEXT NOT NULL, -- Pre-formatted message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- RLS POLICIES
-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatSession ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user" 
    WHERE "userID" = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user" 
    WHERE "userID" = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get student ID for current user
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT studentID FROM students 
    WHERE "userID" = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin ID for current user
CREATE OR REPLACE FUNCTION get_admin_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT adminID FROM admin 
    WHERE "userID" = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USER TABLE POLICIES
-- Admin can select all users
CREATE POLICY "Admin can view all users" ON "user"
FOR SELECT USING (is_admin());

-- Admin can update all users
CREATE POLICY "Admin can update all users" ON "user"
FOR UPDATE USING (is_admin());

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON "user"
FOR SELECT USING ("userID" = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON "user"
FOR UPDATE USING ("userID" = auth.uid());

-- 2. STUDENTS TABLE POLICIES
-- Admin can select all students
CREATE POLICY "Admin can view all students" ON students
FOR SELECT USING (is_admin());

-- Admin can update all students
CREATE POLICY "Admin can update all students" ON students
FOR UPDATE USING (is_admin());

-- Admin can delete students
CREATE POLICY "Admin can delete students" ON students
FOR DELETE USING (is_admin());

-- Students can view their own profile
CREATE POLICY "Students can view their own profile" ON students
FOR SELECT USING ("userID" = auth.uid());

-- Students can update their own profile
CREATE POLICY "Students can update their own profile" ON students
FOR UPDATE USING ("userID" = auth.uid());

-- 3. ADMIN TABLE POLICIES
-- Admin can select all admin profiles
CREATE POLICY "Admin can view all admin profiles" ON admin
FOR SELECT USING (is_admin());

-- Admin can update all admin profiles
CREATE POLICY "Admin can update all admin profiles" ON admin
FOR UPDATE USING (is_admin());

-- Admins can view their own profile
CREATE POLICY "Admins can view their own profile" ON admin
FOR SELECT USING ("userID" = auth.uid());

-- Admins can update their own profile
CREATE POLICY "Admins can update their own profile" ON admin
FOR UPDATE USING ("userID" = auth.uid());

-- 4. CHAT SESSION POLICIES
-- Admin can view all chat sessions
CREATE POLICY "Admin can view all chat sessions" ON chatSession
FOR SELECT USING (is_admin());

-- Students can view their own chat sessions
CREATE POLICY "Students can view their own chat sessions" ON chatSession
FOR SELECT USING (studentID = get_student_id());

-- Students can create chat sessions
CREATE POLICY "Students can create chat sessions" ON chatSession
FOR INSERT WITH CHECK (studentID = get_student_id());

-- Students can update their own chat sessions
CREATE POLICY "Students can update their own chat sessions" ON chatSession
FOR UPDATE USING (studentID = get_student_id());

-- Students can delete their own chat sessions
CREATE POLICY "Students can delete their own chat sessions" ON chatSession
FOR DELETE USING (studentID = get_student_id());

-- 5. MESSAGE POLICIES
-- Admin can view all messages
CREATE POLICY "Admin can view all messages" ON message
FOR SELECT USING (is_admin());

-- Students can view messages in their chats
CREATE POLICY "Students can view their messages" ON message
FOR SELECT USING (
  chatID IN (SELECT chatID FROM chatSession WHERE studentID = get_student_id())
);

-- Students can create messages in their chats
CREATE POLICY "Students can create messages" ON message
FOR INSERT WITH CHECK (
  chatID IN (SELECT chatID FROM chatSession WHERE studentID = get_student_id())
);

-- Students can update their messages
CREATE POLICY "Students can update their messages" ON message
FOR UPDATE USING (
  sender = 'human' AND 
  chatID IN (SELECT chatID FROM chatSession WHERE studentID = get_student_id())
);

-- Students can delete their messages
CREATE POLICY "Students can delete their messages" ON message
FOR DELETE USING (
  sender = 'human' AND 
  chatID IN (SELECT chatID FROM chatSession WHERE studentID = get_student_id())
);

-- 6. FEEDBACK POLICIES
-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback" ON feedback
FOR SELECT USING (is_admin());

-- Admin can update all feedback
CREATE POLICY "Admin can update all feedback" ON feedback
FOR UPDATE USING (is_admin());

-- Admin can delete feedback
CREATE POLICY "Admin can delete feedback" ON feedback
FOR DELETE USING (is_admin());

-- Students can view their own feedback
CREATE POLICY "Students can view their own feedback" ON feedback
FOR SELECT USING ("user_Id" = get_student_id());

-- Students can create feedback
CREATE POLICY "Students can create feedback" ON feedback
FOR INSERT WITH CHECK ("user_Id" = get_student_id());

-- Students can update their feedback
CREATE POLICY "Students can update their feedback" ON feedback
FOR UPDATE USING ("user_Id" = get_student_id());

-- Students can delete their feedback
CREATE POLICY "Students can delete their feedback" ON feedback
FOR DELETE USING ("user_Id" = get_student_id());

-- 7. RESOURCES POLICIES
-- Admin can view all resources
CREATE POLICY "Admin can view all resources" ON resources
FOR SELECT USING (is_admin());

-- Admin can create resources
CREATE POLICY "Admin can create resources" ON resources
FOR INSERT WITH CHECK (adminID = get_admin_id());

-- Admin can update resources
CREATE POLICY "Admin can update resources" ON resources
FOR UPDATE USING (is_admin());

-- Admin can delete resources
CREATE POLICY "Admin can delete resources" ON resources
FOR DELETE USING (is_admin());

-- Students can view resources
CREATE POLICY "Students can view resources" ON resources
FOR SELECT USING (is_student());

-- 8. STATISTICS HISTORY POLICIES
-- Admin can view statistics
CREATE POLICY "Admin can view statistics" ON statistics_history
FOR SELECT USING (is_admin());

-- Admin can create statistics
CREATE POLICY "Admin can create statistics" ON statistics_history
FOR INSERT WITH CHECK (is_admin());

-- Admin can update statistics
CREATE POLICY "Admin can update statistics" ON statistics_history
FOR UPDATE USING (is_admin());


-- FUNCTIONS
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
CREATE TRIGGER update_user_timestamp
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_student_timestamp
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_admin_timestamp
BEFORE UPDATE ON admin
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_chat_session_timestamp
BEFORE UPDATE ON chatSession
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_resources_timestamp
BEFORE UPDATE ON resources
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to hash password
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_password IS NOT NULL THEN
        NEW.user_password = crypt(NEW.user_password, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hash_user_password
BEFORE INSERT OR UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION hash_password();

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_user_password(email TEXT, password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    hashed_pw TEXT;
BEGIN
    SELECT user_password INTO hashed_pw FROM "user" WHERE user_email = email;
    IF hashed_pw IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN hashed_pw = crypt(password, hashed_pw);
END;
$$ LANGUAGE plpgsql;

-- Function to update chat duration when end_date is set
CREATE OR REPLACE FUNCTION update_chat_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NOT NULL AND OLD.end_date IS DISTINCT FROM NEW.end_date THEN
        NEW.chatDuration = NEW.end_date - NEW.start_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER calculate_chat_duration
BEFORE UPDATE ON chatSession
FOR EACH ROW EXECUTE FUNCTION update_chat_duration();

-- Fucntion to update chat history
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS void AS $$
BEGIN
  -- Get counts from all tables
  DECLARE
    user_count INTEGER;
    feedback_count INTEGER;
    resource_count INTEGER;
    student_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO user_count FROM "user";
    SELECT COUNT(*) INTO feedback_count FROM feedback;
    SELECT COUNT(*) INTO resource_count FROM resources;
    SELECT COUNT(*) INTO student_count FROM students;
    
    -- Upsert the data (insert or update if date exists)
    INSERT INTO statistics_history (date, user_count, feedback_count, resource_count, student_count)
    VALUES (CURRENT_DATE, user_count, feedback_count, resource_count, student_count)
    ON CONFLICT (date) 
    DO UPDATE SET
      user_count = EXCLUDED.user_count,
      feedback_count = EXCLUDED.feedback_count,
      resource_count = EXCLUDED.resource_count,
      student_count = EXCLUDED.student_count;
  END;
END;
$$ LANGUAGE plpgsql;


-- Set up daily cron job
-- This will run the function every day at 00:00 UTC
SELECT cron.schedule(
  'update-daily-stats',
  '0 0 * * *', -- Every day at midnight
  $$SELECT update_daily_statistics()$$
);

-- Insert a sample value to the Statistic History
INSERT INTO statistics_history (date, user_count, feedback_count, resource_count, student_count)
VALUES (CURRENT_DATE - INTERVAL '1 day', 
        2,  /* yesterday's user count */
        8,  /* yesterday's feedback count */ 
        3,  /* yesterday's resource count */
        1   /* yesterday's student count */
);

--- ADMIN
-- For user table
CREATE POLICY "Admins can view all student users" 
ON "user"
FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin' AND role = 'student');

-- For students table
CREATE POLICY "Admins can view all student profiles"
ON students
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE "user"."userID" = auth.uid()
        AND "user".role = 'admin'
    )
);


CREATE OR REPLACE FUNCTION delete_student_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This will cascade to delete from both user and students tables
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Admin - read, write, update, delete (students, feedback, resources)
--       - read, write, update (user and admin) 
--       - read (chatSeesion and message)
-- Student - read, write, update, delete (chatSeesion , message, feedback) 
--         - read, write, update (user, student) 
--         - read (resources)

CREATE OR REPLACE FUNCTION public.delete_auth_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will delete the auth user which cascades to your custom tables
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Allow admins to delete from students table
CREATE POLICY "Enable delete for admins on students" 
ON students
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE "user"."userID" = auth.uid()
    AND "user".role = 'admin'
  )
);

-- Allow admins to delete from user table
CREATE POLICY "Enable delete for admins on user" 
ON "user"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "user" u
    WHERE u."userID" = auth.uid()
    AND u.role = 'admin'
  )
);

-- Grant your database role permission to execute the function
GRANT EXECUTE ON FUNCTION public.delete_auth_user(uuid) TO postgres;
-- Or whatever role your Supabase connection uses