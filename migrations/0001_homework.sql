-- Homework LMS (/homework/). Applied with: wrangler d1 migrations apply DB [--local|--remote]
-- No student names or class codes live in the repo: the teacher adds them on /homework/#/giao-vien.

CREATE TABLE classes (
  id TEXT PRIMARY KEY,            -- e.g. "l3-1"
  name TEXT NOT NULL,             -- e.g. "UpWind L3-1"
  code_hash TEXT                  -- SHA-256 of the class code; NULL = student login closed
);

CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id TEXT NOT NULL REFERENCES classes(id),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (class_id, name)
);

CREATE TABLE homeworks (
  id TEXT PRIMARY KEY,            -- "<class>:<lesson>", e.g. "l3-1:L6"
  class_id TEXT NOT NULL REFERENCES classes(id),
  lesson TEXT NOT NULL,
  title TEXT NOT NULL,
  lesson_date TEXT NOT NULL,      -- YYYY-MM-DD
  due_at TEXT NOT NULL,           -- ISO 8601 with offset
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | approved
  content TEXT NOT NULL,          -- JSON (src/homework/types.ts Homework)
  updated_at TEXT NOT NULL
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id TEXT NOT NULL REFERENCES homeworks(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  draft TEXT,                     -- JSON answers saved while working
  started_at TEXT NOT NULL,
  submitted_at TEXT,              -- first submission; later tries do not change the score
  is_late INTEGER,
  score INTEGER,
  total INTEGER,
  device TEXT,
  UNIQUE (homework_id, student_id)
);

CREATE TABLE answers (
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  section_id TEXT NOT NULL,
  q TEXT NOT NULL,
  kind TEXT NOT NULL,             -- auto | open | writing
  value TEXT,
  is_correct INTEGER,             -- NULL for open/writing until the teacher marks it
  marks INTEGER,
  max INTEGER,
  error_code TEXT,                -- suggested by the homework (or BLANK / E5 from the marker)
  self_reason TEXT,               -- code the student picked under "Vì sao mình sai?"
  review_state TEXT,              -- open/writing: not_marked | in_marking | ready | released
  comment TEXT,
  PRIMARY KEY (submission_id, section_id, q)
);

CREATE INDEX answers_wrong ON answers (submission_id, is_correct);
CREATE INDEX submissions_by_hw ON submissions (homework_id);
