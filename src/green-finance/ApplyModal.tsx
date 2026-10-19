import { useState, useEffect, useRef } from "react";
import "./ApplyModal.css";

interface ApplyModalProps {
  isOpen: boolean;
  defaultTrack?: "scholarship" | "refundable";
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  university: string;
  year: string;
  track: "scholarship" | "refundable";
  motivation: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  university?: string;
  year?: string;
  motivation?: string;
}

export default function ApplyModal({ isOpen, defaultTrack = "refundable", onClose }: ApplyModalProps) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    university: "",
    year: "",
    track: defaultTrack,
    motivation: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(f => ({ ...f, track: defaultTrack }));
      setErrors({});
      setSubmitted(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultTrack]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Please enter your full name.";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "Please enter a valid email.";
    if (!form.university.trim()) errs.university = "Please enter your university or school.";
    if (!form.year) errs.year = "Please select your year of study.";
    if (!form.motivation.trim()) errs.motivation = "Please share a short motivation.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(er => ({ ...er, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    console.log("Application submitted:", form);
    setSubmitted(true);
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {submitted ? (
          <div className="modal-success">
            <div className="modal-success-icon">✓</div>
            <h2>Application received!</h2>
            <p>Thanks, <strong>{form.name}</strong>. We'll be in touch at <strong>{form.email}</strong> within 48 hours.</p>
            <p className="modal-success-note">In the meantime, feel free to reach us at <a href="mailto:team@upwind.asia">team@upwind.asia</a></p>
            <button className="modal-btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-label">
                {form.track === "scholarship" ? "Circle 1 · Scholarship" : "Circle 2 · Fully Refundable"}
              </div>
              <h2 id="modal-title">
                {form.track === "scholarship" ? "Apply for a Free Slot" : "Reserve Your Slot"}
              </h2>
              <p className="modal-sub">
                {form.track === "scholarship"
                  ? "3 scholarship spots · We review every application carefully."
                  : "Guaranteed spot · 100% refunded when you complete all 6 weeks."}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-track-toggle">
                <button
                  type="button"
                  className={`track-btn${form.track === "scholarship" ? " active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, track: "scholarship" }))}
                >
                  Scholarship (Free)
                </button>
                <button
                  type="button"
                  className={`track-btn${form.track === "refundable" ? " active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, track: "refundable" }))}
                >
                  Reserve (Refundable)
                </button>
              </div>

              <div className="modal-row">
                <div className={`modal-field${errors.name ? " has-error" : ""}`}>
                  <label htmlFor="m-name">Full name *</label>
                  <input
                    ref={firstInputRef}
                    id="m-name"
                    name="name"
                    type="text"
                    placeholder="Nguyen Van A"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className={`modal-field${errors.email ? " has-error" : ""}`}>
                  <label htmlFor="m-email">Email *</label>
                  <input
                    id="m-email"
                    name="email"
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label htmlFor="m-phone">Phone <span className="optional">(optional)</span></label>
                  <input
                    id="m-phone"
                    name="phone"
                    type="tel"
                    placeholder="+84 ..."
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className={`modal-field${errors.university ? " has-error" : ""}`}>
                  <label htmlFor="m-university">University / School *</label>
                  <input
                    id="m-university"
                    name="university"
                    type="text"
                    placeholder="Fulbright University Vietnam"
                    value={form.university}
                    onChange={handleChange}
                  />
                  {errors.university && <span className="field-error">{errors.university}</span>}
                </div>
              </div>

              <div className={`modal-field${errors.year ? " has-error" : ""}`}>
                <label htmlFor="m-year">Year of study *</label>
                <select id="m-year" name="year" value={form.year} onChange={handleChange}>
                  <option value="">Select year...</option>
                  <option value="high-school">High school</option>
                  <option value="year-1">University year 1</option>
                  <option value="year-2">University year 2</option>
                  <option value="year-3">University year 3</option>
                  <option value="year-4">University year 4</option>
                  <option value="graduate">Graduate / Other</option>
                </select>
                {errors.year && <span className="field-error">{errors.year}</span>}
              </div>

              <div className={`modal-field${errors.motivation ? " has-error" : ""}`}>
                <label htmlFor="m-motivation">
                  {form.track === "scholarship"
                    ? "Why should you get the scholarship? *"
                    : "Why do you want to join Upwind? *"}
                </label>
                <textarea
                  id="m-motivation"
                  name="motivation"
                  rows={4}
                  placeholder="Tell us what you're hoping to learn and why this matters to you..."
                  value={form.motivation}
                  onChange={handleChange}
                />
                {errors.motivation && <span className="field-error">{errors.motivation}</span>}
              </div>

              <div className="modal-actions">
                <button type="submit" className="modal-btn-primary">
                  {form.track === "scholarship" ? "Submit application →" : "Reserve my slot →"}
                </button>
                <p className="modal-fine">
                  {form.track === "scholarship"
                    ? "Applications reviewed within 5 business days · Deadline: 15 June 2026"
                    : "No charge until confirmed · 100% refunded on completion"}
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
