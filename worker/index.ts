// API for the homework LMS (/homework/). Everything else on upwind.asia is static and served by the
// assets binding; wrangler.jsonc routes only /api/* to this Worker ("run_worker_first").
import { answerKey, gradeHomework, publicHomework } from "../src/homework/grading";
import type { Answers, Homework, ItemResult } from "../src/homework/types";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Teacher password for /homework/#/giao-vien (Worker secret). */
  TEACHER_CODE: string;
  /** Key used to sign login cookies (Worker secret, any long random string). */
  SESSION_SECRET: string;
}

type Session = { r: "s"; sid: number; cid: string } | { r: "t" };

const COOKIE = "hw_session";
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const fail = (status: number, message: string) => json({ error: message }, status);
const nowIso = () => new Date().toISOString();

// ---------- crypto helpers ----------
const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
export async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(code.trim().toUpperCase()));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function makeCookie(env: Env, s: Session) {
  const payload = b64url(enc.encode(JSON.stringify(s)));
  const value = `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
  return `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 180}`;
}
async function readSession(env: Env, req: Request): Promise<Session | null> {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [payload, sig] = m[1].split(".");
  if (!payload || !sig || !safeEqual(sig, await hmac(env.SESSION_SECRET, payload))) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  } catch {
    return null;
  }
}

// ---------- data helpers ----------
const hwId = (classId: string, lesson: string) => `${classId}:${lesson}`;

async function loadHomework(env: Env, id: string): Promise<Homework | null> {
  const row = await env.DB.prepare("SELECT content FROM homeworks WHERE id = ?").bind(id).first<{ content: string }>();
  return row ? JSON.parse(row.content) : null;
}

type AnswerRow = { section_id: string; q: string; kind: string; value: string | null; self_reason: string | null; review_state: string | null; comment: string | null; is_correct: number | null };

async function storedAnswers(env: Env, submissionId: number) {
  const { results } = await env.DB.prepare("SELECT section_id, q, kind, value, self_reason, review_state, comment, is_correct FROM answers WHERE submission_id = ?")
    .bind(submissionId)
    .all<AnswerRow>();
  const answers: Answers = {};
  for (const r of results) {
    if (r.value == null) continue;
    try {
      const v = JSON.parse(r.value);
      answers[answerKey(r.section_id, r.q)] = v;
    } catch {
      answers[answerKey(r.section_id, r.q)] = r.value;
    }
  }
  return { rows: results, answers };
}

/** Marks a submission with the homework as it is now, so a corrected answer key or explanation reaches everyone. */
async function resultFor(env: Env, hw: Homework, submissionId: number) {
  const { rows, answers } = await storedAnswers(env, submissionId);
  const g = gradeHomework(hw, answers);
  const reasons = new Map(rows.map((r) => [answerKey(r.section_id, r.q), r.self_reason]));
  const items = g.items.map((it) => ({ ...it, reason: reasons.get(answerKey(it.sectionId, it.q)) || undefined }));
  const open = rows
    .filter((r) => r.kind !== "auto")
    .map((r) => ({
      sectionId: r.section_id,
      q: r.q,
      kind: r.kind,
      value: r.value ? JSON.parse(r.value) : "",
      released: r.review_state === "released",
      comment: r.review_state === "released" ? r.comment : null,
      correct: r.review_state === "released" ? r.is_correct : null,
    }));
  return { score: g.score, total: g.total, items, open };
}

function lessonCodeOf(item: ItemResult & { reason?: string }) {
  return item.reason || item.code;
}

// ---------- routes ----------
async function handle(req: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");
  const method = req.method;
  const body = async <T>() => (await req.json().catch(() => ({}))) as T;

  // Public: list students of a class once the class code is right.
  if (method === "POST" && path === "/api/class") {
    const { classId, code } = await body<{ classId?: string; code?: string }>();
    if (!classId || !code) return fail(400, "Thiếu mã lớp");
    const cls = await env.DB.prepare("SELECT id, name, code_hash FROM classes WHERE id = ?").bind(classId.toLowerCase()).first<{ id: string; name: string; code_hash: string | null }>();
    if (!cls?.code_hash || !safeEqual(cls.code_hash, await hashCode(code))) return fail(403, "Mã lớp chưa đúng");
    const { results } = await env.DB.prepare("SELECT id, name FROM students WHERE class_id = ? AND active = 1 ORDER BY name").bind(cls.id).all();
    return json({ class: { id: cls.id, name: cls.name }, students: results });
  }

  if (method === "POST" && path === "/api/login") {
    const { classId, code, studentId } = await body<{ classId?: string; code?: string; studentId?: number }>();
    const cls = await env.DB.prepare("SELECT id, code_hash FROM classes WHERE id = ?").bind(String(classId).toLowerCase()).first<{ id: string; code_hash: string | null }>();
    if (!cls?.code_hash || !code || !safeEqual(cls.code_hash, await hashCode(code))) return fail(403, "Mã lớp chưa đúng");
    const st = await env.DB.prepare("SELECT id FROM students WHERE id = ? AND class_id = ? AND active = 1").bind(studentId, cls.id).first();
    if (!st) return fail(404, "Không tìm thấy học viên");
    return json({ ok: true }, 200, { "set-cookie": await makeCookie(env, { r: "s", sid: Number(studentId), cid: cls.id }) });
  }

  if (method === "POST" && path === "/api/teacher/login") {
    const { code } = await body<{ code?: string }>();
    if (!env.TEACHER_CODE || !code || !safeEqual(code.trim(), env.TEACHER_CODE)) return fail(403, "Mã giáo viên chưa đúng");
    return json({ ok: true }, 200, { "set-cookie": await makeCookie(env, { r: "t" }) });
  }

  if (method === "POST" && path === "/api/logout")
    return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });

  const session = await readSession(env, req);
  if (!session) return fail(401, "Chưa đăng nhập");

  if (path.startsWith("/api/teacher/")) {
    if (session.r !== "t") return fail(403, "Chỉ dành cho giáo viên");
    return teacher(req, env, path, method, body);
  }
  if (session.r !== "s") return fail(403, "Đăng nhập bằng tài khoản học viên");
  return student(req, env, session, path, method, body);
}

async function student(req: Request, env: Env, s: { sid: number; cid: string }, path: string, method: string, body: <T>() => Promise<T>) {
  if (method === "GET" && path === "/api/me") {
    const me = await env.DB.prepare("SELECT s.id, s.name, c.id AS class_id, c.name AS class_name FROM students s JOIN classes c ON c.id = s.class_id WHERE s.id = ?")
      .bind(s.sid)
      .first();
    if (!me) return fail(401, "Chưa đăng nhập");
    const { results } = await env.DB.prepare(
      `SELECT h.lesson, h.title, h.lesson_date, h.due_at, sub.submitted_at, sub.is_late, sub.score, sub.total, sub.draft IS NOT NULL AS has_draft
         FROM homeworks h LEFT JOIN submissions sub ON sub.homework_id = h.id AND sub.student_id = ?
        WHERE h.class_id = ? AND h.status = 'approved' ORDER BY h.lesson_date DESC`,
    )
      .bind(s.sid, s.cid)
      .all();
    return json({ me, homeworks: results });
  }

  if (method === "GET" && path === "/api/errors") {
    const { results } = await env.DB.prepare(
      `SELECT sub.id, h.id AS hid, h.lesson, h.lesson_date, sub.is_late FROM submissions sub JOIN homeworks h ON h.id = sub.homework_id
        WHERE sub.student_id = ? AND sub.submitted_at IS NOT NULL ORDER BY h.lesson_date DESC`,
    )
      .bind(s.sid)
      .all<{ id: number; hid: string; lesson: string; lesson_date: string; is_late: number }>();
    const out: unknown[] = [];
    let score = 0,
      total = 0;
    for (const sub of results) {
      const hw = await loadHomework(env, sub.hid);
      if (!hw) continue;
      const r = await resultFor(env, hw, sub.id);
      score += r.score;
      total += r.total;
      for (const it of r.items) {
        if (it.correct) continue;
        const sec = hw.sections.find((x) => x.id === it.sectionId);
        out.push({ lesson: sub.lesson, date: sub.lesson_date, late: !!sub.is_late, test: sec?.kind === "auto" ? sec.test : "", ...it, code: lessonCodeOf(it) });
      }
    }
    return json({ score, total, homeworks: results.length, errors: out });
  }

  const m = path.match(/^\/api\/hw\/([^/]+)(?:\/(draft|submit|reason))?$/);
  if (!m) return fail(404, "Không có trang này");
  const id = hwId(s.cid, decodeURIComponent(m[1]));
  const row = await env.DB.prepare("SELECT content, status, due_at FROM homeworks WHERE id = ?").bind(id).first<{ content: string; status: string; due_at: string }>();
  if (!row || row.status !== "approved") return fail(404, "Bài tập chưa mở");
  const hw: Homework = JSON.parse(row.content);
  let sub = await env.DB.prepare("SELECT id, draft, submitted_at, is_late FROM submissions WHERE homework_id = ? AND student_id = ?")
    .bind(id, s.sid)
    .first<{ id: number; draft: string | null; submitted_at: string | null; is_late: number | null }>();

  if (method === "GET" && !m[2]) {
    const result = sub?.submitted_at ? await resultFor(env, hw, sub.id) : null;
    return json({ homework: publicHomework(hw), draft: sub?.draft ? JSON.parse(sub.draft) : {}, submittedAt: sub?.submitted_at ?? null, late: !!sub?.is_late, result });
  }

  if (method === "PUT" && m[2] === "draft") {
    const { answers } = await body<{ answers?: Answers }>();
    const draft = JSON.stringify(answers ?? {});
    if (sub) await env.DB.prepare("UPDATE submissions SET draft = ? WHERE id = ?").bind(draft, sub.id).run();
    else
      await env.DB.prepare("INSERT INTO submissions (homework_id, student_id, draft, started_at, device) VALUES (?, ?, ?, ?, ?)")
        .bind(id, s.sid, draft, nowIso(), (req.headers.get("user-agent") || "").slice(0, 200))
        .run();
    return json({ ok: true });
  }

  if (method === "POST" && m[2] === "submit") {
    if (sub?.submitted_at) return json({ already: true, result: await resultFor(env, hw, sub.id), late: !!sub.is_late });
    const { answers = {} } = await body<{ answers?: Answers }>();
    const at = nowIso();
    const late = new Date(at) > new Date(row.due_at) ? 1 : 0;
    if (!sub) {
      await env.DB.prepare("INSERT INTO submissions (homework_id, student_id, started_at, device) VALUES (?, ?, ?, ?)")
        .bind(id, s.sid, at, (req.headers.get("user-agent") || "").slice(0, 200))
        .run();
      sub = await env.DB.prepare("SELECT id, draft, submitted_at, is_late FROM submissions WHERE homework_id = ? AND student_id = ?").bind(id, s.sid).first();
    }
    const g = gradeHomework(hw, answers);
    const stmts: D1PreparedStatement[] = [];
    const ins = env.DB.prepare(
      "INSERT OR REPLACE INTO answers (submission_id, section_id, q, kind, value, is_correct, marks, max, error_code, review_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const it of g.items)
      stmts.push(ins.bind(sub!.id, it.sectionId, it.q, "auto", JSON.stringify(answers[answerKey(it.sectionId, it.q)] ?? ""), it.correct ? 1 : 0, it.marks, it.max, it.code ?? null, null));
    for (const sec of hw.sections) {
      if (sec.kind === "open")
        for (const it of sec.items) stmts.push(ins.bind(sub!.id, sec.id, it.q, "open", JSON.stringify(answers[answerKey(sec.id, it.q)] ?? ""), null, null, null, null, "not_marked"));
      if (sec.kind === "writing") stmts.push(ins.bind(sub!.id, sec.id, "essay", "writing", JSON.stringify(answers[answerKey(sec.id, "essay")] ?? ""), null, null, null, null, "not_marked"));
    }
    stmts.push(
      env.DB.prepare("UPDATE submissions SET submitted_at = ?, is_late = ?, score = ?, total = ?, draft = ? WHERE id = ?").bind(at, late, g.score, g.total, JSON.stringify(answers), sub!.id),
    );
    await env.DB.batch(stmts);
    return json({ result: await resultFor(env, hw, sub!.id), late: !!late });
  }

  if (method === "PUT" && m[2] === "reason") {
    if (!sub?.submitted_at) return fail(400, "Chưa nộp bài");
    const { sectionId, q, reason } = await body<{ sectionId?: string; q?: string; reason?: string }>();
    await env.DB.prepare("UPDATE answers SET self_reason = ? WHERE submission_id = ? AND section_id = ? AND q = ?").bind(reason || null, sub.id, sectionId, q).run();
    return json({ ok: true });
  }
  return fail(405, "Không hỗ trợ");
}

async function teacher(req: Request, env: Env, path: string, method: string, body: <T>() => Promise<T>) {
  if (method === "GET" && path === "/api/teacher/classes") {
    const { results: classes } = await env.DB.prepare("SELECT id, name, code_hash IS NOT NULL AS has_code FROM classes ORDER BY id").all();
    const { results: students } = await env.DB.prepare("SELECT id, class_id, name, active FROM students ORDER BY name").all();
    return json({ classes, students });
  }

  let m = path.match(/^\/api\/teacher\/classes\/([^/]+)$/);
  if (m && method === "PUT") {
    const id = decodeURIComponent(m[1]).toLowerCase();
    const { name, code, students = [] } = await body<{ name?: string; code?: string; students?: string[] }>();
    const names = [...new Set(students.map((n) => n.trim()).filter(Boolean))];
    const stmts = [
      env.DB.prepare("INSERT INTO classes (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name").bind(id, name || id),
      env.DB.prepare("UPDATE students SET active = 0 WHERE class_id = ?").bind(id),
      ...names.map((n) => env.DB.prepare("INSERT INTO students (class_id, name) VALUES (?, ?) ON CONFLICT(class_id, name) DO UPDATE SET active = 1").bind(id, n)),
    ];
    if (code?.trim()) stmts.push(env.DB.prepare("UPDATE classes SET code_hash = ? WHERE id = ?").bind(await hashCode(code), id));
    await env.DB.batch(stmts);
    return json({ ok: true });
  }

  if (method === "GET" && path === "/api/teacher/overview") {
    const classId = new URL(req.url).searchParams.get("class") || "";
    const { results: students } = await env.DB.prepare("SELECT id, name FROM students WHERE class_id = ? AND active = 1 ORDER BY name").bind(classId).all<{ id: number; name: string }>();
    const { results: hws } = await env.DB.prepare("SELECT id, lesson, title, lesson_date, due_at, status, content FROM homeworks WHERE class_id = ? ORDER BY lesson_date").bind(classId).all<{
      id: string; lesson: string; title: string; lesson_date: string; due_at: string; status: string; content: string;
    }>();
    const { results: subs } = await env.DB.prepare(
      "SELECT sub.id, sub.homework_id, sub.student_id, sub.submitted_at, sub.is_late, sub.device FROM submissions sub JOIN homeworks h ON h.id = sub.homework_id WHERE h.class_id = ?",
    )
      .bind(classId)
      .all<{ id: number; homework_id: string; student_id: number; submitted_at: string | null; is_late: number; device: string }>();
    const parsed = new Map(hws.map((h) => [h.id, JSON.parse(h.content) as Homework]));
    const cells: unknown[] = [];
    const codes: Record<number, Record<string, number>> = {};
    for (const sub of subs) {
      const hw = parsed.get(sub.homework_id)!;
      if (!sub.submitted_at) {
        cells.push({ homeworkId: sub.homework_id, studentId: sub.student_id, started: true });
        continue;
      }
      const r = await resultFor(env, hw, sub.id);
      const pending = r.open.filter((o) => !o.released).length;
      cells.push({ id: sub.id, homeworkId: sub.homework_id, studentId: sub.student_id, submittedAt: sub.submitted_at, late: !!sub.is_late, score: r.score, total: r.total, pending, device: sub.device });
      for (const it of r.items) if (!it.correct) {
        const c = lessonCodeOf(it) || "?";
        const bucket = (codes[sub.student_id] ??= {});
        bucket[c] = (bucket[c] || 0) + 1;
      }
    }
    return json({ students, homeworks: hws.map(({ content, ...h }) => h), cells, codes });
  }

  if (method === "GET" && path === "/api/teacher/hw") {
    const classId = new URL(req.url).searchParams.get("class") || "";
    const { results } = await env.DB.prepare("SELECT id, lesson, title, lesson_date, due_at, status, updated_at FROM homeworks WHERE class_id = ? ORDER BY lesson_date DESC").bind(classId).all();
    return json({ homeworks: results });
  }

  m = path.match(/^\/api\/teacher\/hw\/([^/]+)\/([^/]+)(\/stats)?$/);
  if (m) {
    const classId = decodeURIComponent(m[1]).toLowerCase();
    const lesson = decodeURIComponent(m[2]);
    const id = hwId(classId, lesson);
    if (method === "GET" && !m[3]) {
      const row = await env.DB.prepare("SELECT content, status FROM homeworks WHERE id = ?").bind(id).first<{ content: string; status: string }>();
      // The status column is the source of truth (the content copy can lag behind).
      return row ? json({ homework: { ...JSON.parse(row.content), status: row.status } }) : fail(404, "Chưa có bài này");
    }
    if (method === "GET" && m[3]) {
      const hw = await loadHomework(env, id);
      if (!hw) return fail(404, "Chưa có bài này");
      const { results: subs } = await env.DB.prepare("SELECT id FROM submissions WHERE homework_id = ? AND submitted_at IS NOT NULL").bind(id).all<{ id: number }>();
      const stats: Record<string, { wrong: number; done: number; values: Record<string, number> }> = {};
      for (const sub of subs) {
        const r = await resultFor(env, hw, sub.id);
        for (const it of r.items) {
          const k = answerKey(it.sectionId, it.q);
          const st = (stats[k] ??= { wrong: 0, done: 0, values: {} });
          st.done++;
          if (!it.correct) {
            st.wrong++;
            const v = it.value || "(bỏ trống)";
            st.values[v] = (st.values[v] || 0) + 1;
          }
        }
      }
      return json({ submitted: subs.length, stats });
    }
    if (method === "PUT") {
      const { homework } = await body<{ homework?: Homework }>();
      if (!homework?.sections || !homework.title || !homework.due) return fail(400, "Thiếu nội dung bài");
      const hw: Homework = { ...homework, classId, lesson };
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ?").bind(classId).first();
      if (!cls) await env.DB.prepare("INSERT INTO classes (id, name) VALUES (?, ?)").bind(classId, classId).run();
      await env.DB.prepare(
        `INSERT INTO homeworks (id, class_id, lesson, title, lesson_date, due_at, status, content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, lesson_date = excluded.lesson_date, due_at = excluded.due_at,
           status = excluded.status, content = excluded.content, updated_at = excluded.updated_at`,
      )
        .bind(id, classId, lesson, hw.title, hw.date, hw.due, hw.status === "approved" ? "approved" : "draft", JSON.stringify(hw), nowIso())
        .run();
      // Keep stored scores and late flags in step with the (possibly corrected) key and deadline.
      const { results: subs } = await env.DB.prepare("SELECT id, submitted_at FROM submissions WHERE homework_id = ? AND submitted_at IS NOT NULL").bind(id).all<{ id: number; submitted_at: string }>();
      for (const sub of subs) {
        const r = await resultFor(env, hw, sub.id);
        await env.DB.prepare("UPDATE submissions SET score = ?, total = ?, is_late = ? WHERE id = ?")
          .bind(r.score, r.total, new Date(sub.submitted_at) > new Date(hw.due) ? 1 : 0, sub.id)
          .run();
      }
      return json({ ok: true });
    }
  }

  m = path.match(/^\/api\/teacher\/submissions\/(\d+)\/reset$/);
  if (m && method === "POST") {
    const sid = Number(m[1]);
    await env.DB.batch([env.DB.prepare("DELETE FROM answers WHERE submission_id = ?").bind(sid), env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(sid)]);
    return json({ ok: true });
  }
  return fail(404, "Không có trang này");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      return await handle(req, env, url);
    } catch (e) {
      console.error(e);
      return fail(500, "Lỗi máy chủ, thử lại sau ít phút");
    }
  },
} satisfies ExportedHandler<Env>;
