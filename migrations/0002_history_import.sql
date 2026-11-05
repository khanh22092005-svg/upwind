-- Results brought in from before the site existed (Google Doc homework, graded by the teacher or by Claude).
-- An imported submission keeps its score and its wrong answers as they were graded: it is not re-marked
-- against the homework content, because the old homework has no full answer key on the site.
ALTER TABLE submissions ADD COLUMN imported INTEGER NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN summary TEXT;   -- JSON: [{ test, skill, score, total, status, note, grader }]
ALTER TABLE answers ADD COLUMN expected TEXT;      -- correct answer as graded (imported rows)
ALTER TABLE answers ADD COLUMN explain TEXT;       -- the teacher's explanation (imported rows)
