import type { Answers, Homework, ItemResult } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Có lỗi, thử lại sau");
  return data as T;
}

export interface HomeworkRow {
  lesson: string;
  title: string;
  lesson_date: string;
  due_at: string;
  submitted_at: string | null;
  is_late: number | null;
  score: number | null;
  total: number | null;
  has_draft: number | null;
}

export type ResultItem = ItemResult & { reason?: string };
export interface OpenResult {
  sectionId: string;
  q: string;
  kind: string;
  value: string;
  released: boolean;
  comment: string | null;
  correct: number | null;
}
export interface Result {
  score: number;
  total: number;
  items: ResultItem[];
  open: OpenResult[];
}

export const api = {
  classStudents: (classId: string, code: string) => call<{ class: { id: string; name: string }; students: { id: number; name: string }[] }>("POST", "/class", { classId, code }),
  login: (classId: string, code: string, studentId: number) => call<{ ok: true }>("POST", "/login", { classId, code, studentId }),
  logout: () => call<{ ok: true }>("POST", "/logout"),
  me: () => call<{ me: { id: number; name: string; class_id: string; class_name: string }; homeworks: HomeworkRow[] }>("GET", "/me"),
  homework: (lesson: string) =>
    call<{ homework: Homework; draft: Answers; submittedAt: string | null; late: boolean; result: Result | null }>("GET", `/hw/${encodeURIComponent(lesson)}`),
  saveDraft: (lesson: string, answers: Answers) => call<{ ok: true }>("PUT", `/hw/${encodeURIComponent(lesson)}/draft`, { answers }),
  submit: (lesson: string, answers: Answers) => call<{ result: Result; late: boolean; already?: boolean }>("POST", `/hw/${encodeURIComponent(lesson)}/submit`, { answers }),
  setReason: (lesson: string, sectionId: string, q: string, reason: string) => call<{ ok: true }>("PUT", `/hw/${encodeURIComponent(lesson)}/reason`, { sectionId, q, reason }),
  errors: () => call<{ score: number; total: number; homeworks: number; errors: (ResultItem & { lesson: string; date: string; late: boolean; test: string })[] }>("GET", "/errors"),

  teacherLogin: (code: string) => call<{ ok: true }>("POST", "/teacher/login", { code }),
  classes: () => call<{ classes: { id: string; name: string; has_code: number }[]; students: { id: number; class_id: string; name: string; active: number }[] }>("GET", "/teacher/classes"),
  saveClass: (id: string, name: string, code: string, students: string[]) => call<{ ok: true }>("PUT", `/teacher/classes/${encodeURIComponent(id)}`, { name, code, students }),
  overview: (classId: string) => call<Overview>("GET", `/teacher/overview?class=${encodeURIComponent(classId)}`),
  teacherHomework: (classId: string, lesson: string) => call<{ homework: Homework }>("GET", `/teacher/hw/${encodeURIComponent(classId)}/${encodeURIComponent(lesson)}`),
  stats: (classId: string, lesson: string) =>
    call<{ submitted: number; stats: Record<string, { wrong: number; done: number; values: Record<string, number> }> }>(
      "GET",
      `/teacher/hw/${encodeURIComponent(classId)}/${encodeURIComponent(lesson)}/stats`,
    ),
  saveHomework: (classId: string, lesson: string, homework: Homework) => call<{ ok: true }>("PUT", `/teacher/hw/${encodeURIComponent(classId)}/${encodeURIComponent(lesson)}`, { homework }),
  resetSubmission: (id: number) => call<{ ok: true }>("POST", `/teacher/submissions/${id}/reset`),
};

export interface Overview {
  students: { id: number; name: string }[];
  homeworks: { id: string; lesson: string; title: string; lesson_date: string; due_at: string; status: string }[];
  cells: { id?: number; homeworkId: string; studentId: number; submittedAt?: string; late?: boolean; score?: number; total?: number; pending?: number; started?: boolean; device?: string }[];
  codes: Record<number, Record<string, number>>;
}
