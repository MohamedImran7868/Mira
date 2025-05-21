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