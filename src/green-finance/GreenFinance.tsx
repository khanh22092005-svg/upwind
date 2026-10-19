import { useState, useEffect, useRef } from "react";
import ApplyModal from "./ApplyModal";
import "./GreenFinance.css";

type Track = "scholarship" | "refundable";

export default function GreenFinance() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTrack, setModalTrack] = useState<Track>("refundable");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqRefs = useRef<(HTMLDivElement | null)[]>([]);

  function openModal(track: Track) {
    setModalTrack(track);
    setModalOpen(true);
    setMenuOpen(false);
  }

  function closeMenu() { setMenuOpen(false); }

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".rev").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function toggleFaq(i: number) {
    setOpenFaq(prev => (prev === i ? null : i));
  }

  const faqs = [
    {
      q: 'What does "100% refund on completion" actually mean?',
      a: "You pay 2,000,000₫ upfront to confirm your slot. When you complete all 6 weeks of the program — all deliverables, all sessions — we refund 100% of it. Not a partial refund. Not credits. The full 2,000,000₫, returned to you. If you finish, your net cost is zero. The deposit is there to keep everyone committed, including us. If you don't finish, you forfeit the deposit — that's the accountability mechanic.",
    },
    {
      q: "I have zero finance knowledge. Is that going to be a problem?",
      a: "No — and this is genuinely the right moment to join. Week 0 is a full onboarding that covers finance fundamentals from scratch. You'll build real fluency by doing the work week by week, not by reading about it first. The students who get the most out of Upwind usually start knowing very little. What matters is that you show up and engage.",
    },
    {
      q: "How much time does this actually take each week?",
      a: "Around 4–6 hours a week — one live session plus async project work that you do on your own schedule. The program is designed to fit around a full university timetable. You don't need to clear your calendar; you need to carve out a few consistent hours per week and protect them.",
    },
    {
      q: "Will this work for someone still in high school?",
      a: "Yes. High school students get the same program, the same deliverables, and the same recommendation letter. The difference is what it signals: getting real finance work experience before university is genuinely impressive for applications — and gives you a clearer sense of whether finance is actually the direction you want to go before committing to a major.",
    },
    {
      q: "Can I use the certificate for my graduation internship requirement?",
      a: "Many participants have used it for exactly this. We'll give you the official certificate of completion and any supporting documentation your faculty might ask for. That said, every university has its own rules — please confirm with your academic department before joining specifically for this reason. We won't promise something that isn't in our control.",
    },
    {
      q: "What if I fall behind or struggle during the program?",
      a: "You'll have direct mentor access throughout — this isn't a self-paced course where you're on your own. If you're stuck, you ask, and you get a real answer. Cohort 1 is small on purpose: close mentorship only works when there's actually room to give real feedback. We can guide you; we can't do the work for you. But we won't let you fall silently behind either.",
    },
  ];

  const curriculum = [
    { wk: "0", mod: "Onboarding", learn: "How a fund operates, key roles, finance fundamentals, the green mandate", do: "Read the fund brief · Complete finance primer · Set up your workspace" },
    { wk: "1", mod: "Investment Thesis", learn: "What makes a good thesis, investment criteria, ESG screening", do: "Draft the fund's investment thesis and screening criteria" },
    { wk: "2", mod: "Project Scouting", learn: "How deals are sourced, market mapping, deal flow fundamentals", do: "Scout and shortlist 2–3 real green projects to evaluate" },
    { wk: "3", mod: "Project Evaluation", learn: "Financial modelling, impact analysis, risk assessment", do: "Produce a full evaluation report on your top-pick project" },
    { wk: "4", mod: "Investment Committee", learn: "How investment decisions are made, how to pitch and handle questions", do: "Build your IC deck · Present and defend your recommendation live" },
    { wk: "5", mod: "Stress-Testing", learn: "Sensitivity analysis, deal structuring, what happens when assumptions break", do: "Revise your recommendation based on IC feedback" },
    { wk: "6", mod: "Portfolio Monitoring", learn: "Post-investment: tracking performance, reporting to stakeholders", do: "Build a portfolio monitoring and reporting summary" },
  ];

  return (
    <>
      {/* ── NAV ── */}
      <nav className="gf-nav">
        <div className="gf-logo">Upwind</div>
        <div className="gf-nav-links">
          <a href="#problem" onClick={closeMenu}>The Problem</a>
          <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
          <a href="#curriculum" onClick={closeMenu}>Curriculum</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
        </div>
        <div className="gf-nav-cta">
          <a href="#pricing" className="gf-btn gf-btn-ghost">See pricing</a>
          <button className="gf-btn gf-btn-primary" onClick={() => openModal("refundable")}>Claim your slot →</button>
          <div className={`gf-burger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(v => !v)}>
            <span /><span /><span />
          </div>
        </div>
      </nav>
      {/* ── MOBILE MENU ── */}
      <div className={`gf-mmenu${menuOpen ? " show" : ""}`}>
        <a href="#problem" onClick={closeMenu}>The Problem</a>
        <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="#curriculum" onClick={closeMenu}>Curriculum</a>
        <a href="#pricing" onClick={closeMenu}>Pricing</a>
        <a href="#faq" onClick={closeMenu}>FAQ</a>
        <button className="gf-btn gf-btn-primary" onClick={() => openModal("refundable")}>Claim your slot →</button>
      </div>
      {/* ── HERO ── */}
      <section className="gf-hero">
        <div className="gf-hero-grid">
          <div>
            <div className="gf-eyebrow">
              <span className="gf-eyebrow-dot" />
              Cohort 1 · 3 scholarship slots remaining
            </div>
            <h1 className="gf-h1">
              You are an analyst at a{" "}
              <span className="gf-hl">green investment fund.</span>{" "}
              For 6 weeks, that's your job.
            </h1>
            <p className="gf-hero-sub">
              Not a course. Not videos to watch. A simulated job with real briefs from a{" "}
              <strong>Real Investment Company</strong> — so you walk into every interview with a portfolio, not a blank CV.
            </p>
            <div className="gf-hero-cta">
              <button className="gf-btn gf-btn-yellow gf-btn-lg" onClick={() => openModal("scholarship")}>
                Apply for a scholarship →
              </button>
              <button className="gf-btn gf-btn-ghost gf-btn-lg" onClick={() => openModal("refundable")}>
                Reserve a slot (refundable)
              </button>
            </div>
            <p className="gf-hero-note">
              No finance background needed &nbsp;·&nbsp; 100% online &nbsp;·&nbsp; Fits around your university schedule
            </p>
          </div>
          <div>
            <div className="gf-hero-card">
              <div className="gf-card-lbl">What you get</div>
              <div className="gf-stat-row"><span className="gf-v">6</span><span className="gf-k">weeks as a fund analyst</span></div>
              <div className="gf-stat-row"><span className="gf-v">4</span><span className="gf-k">real portfolio deliverables</span></div>
              <div className="gf-stat-row"><span className="gf-v">1</span><span className="gf-k">personal rec. letter from the founder</span></div>
              <div className="gf-stat-row"><span className="gf-v">0₫</span><span className="gf-k">net cost if you complete the program</span></div>
              <div className="gf-refund-callout">
                <span className="gf-rc-icon">↩</span>
                <span><strong>100% refund on completion.</strong> Pay 2,000,000₫ to reserve your slot — get every dong back when you finish all 6 weeks.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="gf-partner-strip">
          <span className="gf-ps-t">Real project briefs from</span>
          <span className="gf-smartsolar-wordmark text-[color:var(--yellow)] bg-[color:var(--lt-color-gray-100)]">SmartSolar</span>
          <span className="gf-ps-meta">· $3.15M raised · Sustainable energy financing</span>
        </div>
      </section>
      {/* ── STATS BAR ── */}
      <div className="gf-stats-bar rev">
        {[
          { num: "$3.15M", desc: "raised by SmartSolar — the company behind the real project briefs you'll evaluate" },
          { num: "4", desc: "portfolio pieces you walk away with — not certificates of watching videos" },
          { num: "6 wks", desc: "from zero finance experience to an analyst portfolio you can open in any interview" },
          { num: "0₫", desc: "net cost if you complete it — your 2,000,000₫ deposit is fully refunded when you finish" },
        ].map((s, i) => (
          <div key={i} className="gf-s-item">
            <div className="gf-s-num">{s.num}</div>
            <div className="gf-s-desc">{s.desc}</div>
          </div>
        ))}
      </div>
      {/* ── PROBLEM ── */}
      <section id="problem" className="gf-section gf-bg">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">The Problem</div>
            <h2>You're not losing to better candidates.<br />You're losing to candidates with <em>more evidence.</em></h2>
            <p className="gf-section-intro">Grades matter. Clubs look fine. But when a recruiter has 200 CVs, they're scanning for proof you can do real work — and most students just don't have it.</p>
          </div>
          <div className="gf-problem-grid rev">
            {[
              { n: "→ 01", title: "The loop: you need experience to get experience.", text: "Companies want candidates who've done the work. But you can only do the work if someone hires you. Most students spend 2–3 years stuck in this before they figure a way out." },
              { n: "→ 02", title: "University teaches you to pass exams. Jobs need something else.", text: "Writing a real recommendation, defending your analysis under pressure, producing work with a deadline — none of that gets taught in lectures. The gap between campus and company is real." },
              { n: "→ 03", title: "If you're waiting until year 3 to start, you're already behind.", text: "While you're waiting, students who started in year 1 are quietly building 2–3 projects in their CV. By the time you're applying for the same roles, that head start is nearly impossible to close." },
              { n: "→ 04", title: "Most internships don't give you anything to show for it.", text: "Making coffee. Shadow-following. Doing tasks you can't describe in an interview. Your time is worth more — and Upwind is built specifically around work you can actually talk about." },
            ].map((card, i) => (
              <div key={i} className={`gf-problem-card${i === 0 ? " gf-problem-card-first" : ""}`}>
                <div className="gf-card-n">{card.n}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="gf-section gf-white">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">How It Works</div>
            <h2>Six weeks of real analyst work.<br /><em>Not a single lecture.</em></h2>
          </div>
          <p className="gf-exp-lead rev">
            You're onboarded as an <em>intern analyst</em> inside a green investment fund. Every week you learn one skill in a live session — then immediately apply it to a real deal from SmartSolar's pipeline. The output is yours to keep.
          </p>
          <div className="gf-steps rev">
            {[
              { n: "01", title: "You receive a real investment brief", text: "A real company. Real numbers. A green investment mandate and a set of constraints — exactly what an analyst gets handed on day one.", tag: "Real scenario" },
              { n: "02", title: "You run the analysis", text: "Assess the financials, evaluate impact, identify risk. You have mentors — but the thinking is yours. This is how you actually get good at it.", tag: "Real analysis" },
              { n: "03", title: "You produce a deliverable", text: "A report. A pitch deck. A monitoring summary. Something you can open in an interview and walk the interviewer through, line by line.", tag: "Real output" },
              { n: "04", title: "You defend your recommendation", text: "Present to a mock Investment Committee. Get challenged. Sharpen your reasoning. This is the part that makes you actually interview-ready.", tag: "Real pressure" },
            ].map((step, i) => (
              <div key={i} className="gf-step">
                <div className="gf-step-num">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="gf-step-tag">{step.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── PARTNER ── */}
      <section id="partner" className="gf-section gf-bg">
        <div className="gf-wrap">
          <div className="gf-partner-block">
            <div className="gf-partner-visual rev">
              <div className="gf-ss-wordmark-lg text-[color:var(--yellow)]">SmartSolar</div>
            </div>
            <div className="gf-partner-copy rev">
              <div className="gf-section-label">Our Partner</div>
              <h3>The briefs come from a <em>real funded company</em> — not a textbook.</h3>
              <p>All project briefs are sourced from <strong>SmartSolar</strong> — a sustainable energy financing company that has raised <strong>$3.15M USD</strong>. The scenarios you evaluate are drawn from their actual deal pipeline.</p>
              <p>This is the difference between Upwind and every other finance course: you're not solving made-up problems. You're working with the kind of numbers, constraints, and trade-offs a real analyst sees on a real deal.</p>
              <div className="gf-partner-metrics">
                {[
                  { num: "$3.15M", lbl: "raised to date" },
                  { num: "100", lbl: "paying customers" },
                ].map((m, i) => (
                  <div key={i} className="gf-metric-chip">
                    <span className="gf-mc-num">{m.num}</span>
                    <span className="gf-mc-lbl">{m.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── CURRICULUM ── */}
      <section id="curriculum" className="gf-section gf-bg2">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">Week by Week</div>
            <h2>Exactly what happens — <em>no surprises.</em></h2>
            <p className="gf-section-intro">We show you the full curriculum upfront because we have nothing to hide. Every week has a clear learning goal and a concrete output that goes straight into your portfolio.</p>
          </div>
          <div className="rev" style={{ marginTop: 56 }}>
            <div className="gf-curr-row gf-curr-head">
              <span>Week</span><span>Module</span><span>What you learn</span><span>What you produce</span>
            </div>
            {curriculum.map((row, i) => (
              <div key={i} className="gf-curr-row">
                <div className="gf-wk">{row.wk}</div>
                <div className="gf-mod">{row.mod}</div>
                <div className="gf-learn">{row.learn}</div>
                <div className="gf-do">{row.do}</div>
              </div>
            ))}
            <p className="gf-focus-note">Deal focus areas: renewable energy · sustainable agriculture · clean water · EVs & mobility · waste & circular economy · ESG-driven businesses</p>
          </div>
        </div>
      </section>
      {/* ── DELIVERABLES ── */}
      <section id="deliverables" className="gf-section gf-white">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">Your Portfolio</div>
            <h2>Most applicants bring their GPA.<br /><em>You'll bring four pieces of real work.</em></h2>
            <p className="gf-section-intro">Every deliverable is something you produced under real constraints, on a real brief — not a certificate of watching a video. Open it in an interview and explain your thinking. That's the difference.</p>
          </div>
          <div className="gf-deliv-grid rev">
            {[
              { n: "DELIVERABLE 01", title: "Investment Thesis", text: "A sharp 1–2 page statement of what the fund backs, why, and what it screens out. Your strategic framework." },
              { n: "DELIVERABLE 02", title: "Project Evaluation Report", text: "Full analysis of your chosen project — financials, impact metrics, risk factors, and your recommendation." },
              { n: "DELIVERABLE 03", title: "Investment Committee Deck", text: "The actual pitch deck you built and defended in front of a mock IC. Shows you can communicate under pressure." },
              { n: "DELIVERABLE 04", title: "Portfolio Monitoring Report", text: "Post-investment: how you'd track the deal's performance and report back to stakeholders." },
            ].map((d, i) => (
              <div key={i} className="gf-deliv">
                <div className="gf-deliv-n">{d.n}</div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── REWARDS ── */}
      <section id="rewards" className="gf-section gf-bg">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">What Else You Earn</div>
            <h2>Two more things that <em>open doors</em> — not just look good on paper.</h2>
          </div>
          <div className="gf-reward-grid rev">
            <div className="gf-reward">
              <div className="gf-reward-ic">✦</div>
              <h3>A personal recommendation letter — written by a practitioner</h3>
              <p>Đặng Nam Khánh writes this himself. It's specific to what you did, how you showed up, and what he actually observed about your work over 6 weeks.</p>
              <div className="gf-reward-note">This carries real weight because it comes from a Founding Member of SmartSolar — someone who raises capital and evaluates deals for a living. Not a course instructor.</div>
            </div>
            <div className="gf-reward">
              <div className="gf-reward-ic">❖</div>
              <h3>A certificate of completion — for your CV and your university</h3>
              <p>An official certificate from Upwind that you can list on your CV, add to LinkedIn, and — at many universities — submit to satisfy graduation internship requirements.</p>
              <div className="gf-reward-note">We'll give you everything you need to make the case to your faculty. Specific rules vary by school, so confirm with your academic advisor.</div>
            </div>
          </div>
        </div>
      </section>
      {/* ── PRICING ── */}
      <section id="pricing" className="gf-section gf-bg2">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">Two Ways In</div>
            <h2>A competitive scholarship for three.<br /><em>A refundable slot for everyone else.</em></h2>
            <p className="gf-section-intro">These aren't competing options — they're two different paths to the same program. Pick the one that fits your situation.</p>
          </div>
          <div className="gf-offers-grid rev">
            {/* Scholarship */}
            <div className="gf-offer">
              <div className="gf-offer-kind">Circle 1 · Scholarship</div>
              <h3>Apply for a Free Slot</h3>
              <div className="gf-price">Free</div>
              <p className="gf-offer-sub">A real selection process — only 3 spots. You apply, we review, we pick the people who are serious. Deadline: <strong>15 June 2026.</strong></p>
              <ul className="gf-offer-list">
                <li>Full 6-week analyst program — identical to the paid track</li>
                <li>All 4 portfolio deliverables</li>
                <li>Personal recommendation letter + certificate</li>
                <li>What we ask in return: a testimonial and permission to showcase your work as an example for future cohorts</li>
              </ul>
              <button className="gf-btn gf-btn-ghost gf-offer-btn" onClick={() => openModal("scholarship")}>Apply for the scholarship →</button>
              <p className="gf-offer-deadline">Applications close 15 June 2026 · 3 slots only</p>
            </div>

            {/* Refundable */}
            <div className="gf-offer gf-offer-feat">
              <div className="gf-offer-kind">Circle 2 · Fully Refundable</div>
              <h3>Reserve a Guaranteed Slot</h3>
              <div className="gf-price gf-price-yellow">2,000,000₫</div>
              <p className="gf-offer-sub">Pay to hold your place. Finish the program — <strong>get every dong back.</strong></p>
              <ul className="gf-offer-list">
                <li>Full 6-week simulated analyst experience</li>
                <li>All 4 portfolio deliverables</li>
                <li>Personal recommendation letter + certificate</li>
                <li>Guaranteed spot — no application, no selection risk</li>
              </ul>
              <div className="gf-refund-box">
                <div className="gf-rb-head">↩ The 100% Completion Refund</div>
                <div className="gf-rb-body">When you complete all 6 weeks, your 2,000,000₫ deposit is refunded in full. If you finish, it costs you nothing. The deposit exists so everyone who joins is committed — including us.</div>
              </div>
              <button className="gf-btn gf-btn-yellow gf-offer-btn" onClick={() => openModal("refundable")}>Reserve my refundable slot →</button>
              <p className="gf-offer-deadline gf-offer-deadline-inv">Finish the program · it will be worth every penny.</p>
            </div>
          </div>
        </div>
      </section>
      {/* ── FOUNDER ── */}
      <section id="founder" className="gf-section gf-white">
        <div className="gf-wrap">
          <div className="gf-founder-grid">
            <div className="gf-founder-card rev">
              <div className="gf-avatar">NK</div>
              <div className="gf-founder-nm">Đặng Nam Khánh</div>
              <div className="gf-founder-rl">Founder, Upwind<br />Founding Member, SmartSolar</div>
              <ul className="gf-creds">
                <li><span className="gf-cred-b">→</span> Founding Member at <strong>SmartSolar</strong> — part of the team that raised $3.15M USD in sustainable energy financing</li>
                <li><span className="gf-cred-b">→</span> <strong>Nguyễn Phương Scholar</strong> — full-ride scholarship at Fulbright University Vietnam</li>
                <li><span className="gf-cred-b">→</span> Started interning in grade 11. Learned, the hard way, what actually works</li>
              </ul>
            </div>
            <div className="gf-founder-quote rev">
              <blockquote>"I didn't build this because I had a smooth path into finance. I built it because mine was <em>exhausting</em> — and I got lucky it worked out."</blockquote>
              <p>Starting in grade 11 gave me a head start. But I paid for it: burnout, missed friendships, and a few years of grinding in directions that didn't matter. I don't recommend doing it that way.</p>
              <p>Upwind exists so you can get the real, finance-specific experience that matters — without sacrificing everything else to get it. The recommendation letter isn't a template. I write it for every person who earns it. That's the commitment I'm making to Cohort 1.</p>
            </div>
          </div>
        </div>
      </section>
      {/* ── FAQ ── */}
      <section id="faq" className="gf-section gf-bg2">
        <div className="gf-wrap">
          <div className="rev">
            <div className="gf-section-label">FAQ</div>
            <h2>The questions you're actually thinking.</h2>
          </div>
          <div className="rev" style={{ marginTop: 48 }}>
            {faqs.map((item, i) => (
              <div key={i} className={`gf-faq-item${openFaq === i ? " open" : ""}`}>
                <button className="gf-faq-q" onClick={() => toggleFaq(i)}>
                  {item.q}
                </button>
                <div
                  className="gf-faq-a"
                  ref={el => { faqRefs.current[i] = el; }}
                  style={{ maxHeight: openFaq === i ? faqRefs.current[i]?.scrollHeight + "px" : "0px" }}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── FINAL CTA ── */}
      <section className="gf-final-cta">
        <div className="gf-final-watermark">UPWIND</div>
        <div className="gf-final-inner">
          <div className="gf-section-label rev" style={{ color: "rgba(255,255,255,.6)", display: "inline-block", marginBottom: 20 }}>Ready?</div>
          <h2 className="gf-final-h2 rev">Six weeks. Four real deliverables.<br /><em>Zero net cost if you finish.</em></h2>
          <p className="gf-final-sub rev">Cohort 1 is small by design — close mentorship doesn't scale. When it fills, it fills. If you've been thinking about it, this is the moment.</p>
          <div className="gf-final-refund-note rev">
            <span className="gf-dot" />
            Deposit fully refunded on completion · 2,000,000₫ → 0₫ net cost
          </div>
          <div className="gf-final-btns rev">
            <button className="gf-btn gf-btn-yellow gf-btn-lg" onClick={() => openModal("refundable")}>Reserve my refundable slot →</button>
            <button className="gf-btn gf-btn-outline-inv gf-btn-lg" onClick={() => openModal("scholarship")}>Apply for the scholarship</button>
          </div>
          <small className="rev">No finance background needed &nbsp;·&nbsp; 100% online &nbsp;·&nbsp; Scholarship deadline: 15 June 2026</small>
        </div>
      </section>
      {/* ── FOOTER ── */}
      <footer className="gf-footer">
        <div className="gf-footer-logo">Upwind</div>
        <p className="gf-footer-text">
          Green Finance Track · Cohort 1 · In partnership with SmartSolar · Questions?{" "}
          <a href="mailto:team@upwind.asia">team@upwind.asia</a> · © 2025 Upwind
        </p>
      </footer>
      <ApplyModal isOpen={modalOpen} defaultTrack={modalTrack} onClose={() => setModalOpen(false)} />
    </>
  );
}
