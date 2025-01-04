-- Enable the pgcrypto extension for UUID generation (if needed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the Roadmap Table
CREATE TABLE
  Roadmap (
    problem_id SERIAL PRIMARY KEY,
    problem_number INT NOT NULL,
    link TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
    topic TEXT NOT NULL
  );

-- Create the Groups Table
CREATE TABLE
  Groups (
    group_id SERIAL PRIMARY KEY,
    group_name TEXT NOT NULL
  );

-- Create the Users Table
CREATE TABLE
  Users (
    user_id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    username TEXT NOT NULL,
    group_id INT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES Groups (group_id) ON DELETE CASCADE
  );

-- Create the Group Progress Table
CREATE TABLE
  Group_Progress (
    group_id INT PRIMARY KEY,
    current_problem INT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES Groups (group_id) ON DELETE CASCADE
  );

-- Create the Daily Progress Table
CREATE TABLE
  Daily_Progress (
    date DATE NOT NULL,
    problem_id INT NOT NULL,
    group_id INT NOT NULL,
    user_id UUID NOT NULL,
    status TEXT CHECK (status IN ('checked', 'not checked')) NOT NULL,
    PRIMARY KEY (date, problem_id, group_id, user_id),
    FOREIGN KEY (problem_id) REFERENCES Roadmap (problem_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES Groups (group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE
  );

-- Create the Problem Statistics Table
CREATE TABLE
  Problem_Statistics (
    problem_id INT NOT NULL,
    date DATE NOT NULL,
    total_users INT NOT NULL,
    solved_count INT NOT NULL,
    PRIMARY KEY (problem_id, date),
    FOREIGN KEY (problem_id) REFERENCES Roadmap (problem_id) ON DELETE CASCADE
  );
