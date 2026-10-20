# upwind.asia site map

Two landing pages plus a few static files. Each page is one long scroll; the boxes under a page
are its sections in scroll order (`#anchor` = the section's link target). Sections marked ★ are in
that page's top nav.

```mermaid
flowchart TD
  root["upwind.asia"]

  root --> gf["/ — Upwind Green Finance<br/>index.html · src/green-finance/"]
  root --> ie["/ielts-self-study/ — UpWind IELTS & Self Study<br/>ielts-self-study/index.html · src/ielts/"]
  root --> files["Static files (public/)"]

  subgraph GF["Green Finance sections"]
    direction TB
    gf1["Hero"] --> gf2["★ #problem — The Problem"] --> gf3["★ #how-it-works — How It Works"]
    gf3 --> gf4["#partner — SmartSolar"] --> gf5["★ #curriculum — Curriculum"] --> gf6["#deliverables"]
    gf6 --> gf7["#rewards"] --> gf8["★ #pricing — Pricing"] --> gf9["#founder"] --> gf10["★ #faq — FAQ"] --> gf11["Final CTA"]
  end
  gf --> gf1
  gf -. "Claim your slot / Apply for a scholarship" .-> modal["Apply modal<br/>(ApplyModal.tsx — logs to console only)"]
  gf -. mailto .-> mail["team@upwind.asia"]

  subgraph IE["IELTS sections"]
    direction TB
    ie1["#hero"] --> ie2["★ #giangvien — Giảng viên"] --> ie3["Tagline band"] --> ie4["#haiketqua"]
    ie4 --> ie5["★ #tuhoc — Tự học"] --> ie6["★ #cognitive — Cognitive skills"] --> ie7["★ #lotrinh — Lộ trình"]
    ie7 --> ie8["#nhanduoc — Những thứ bạn nhận về"] --> ie9["★ #hocphi — Học phí"] --> ie10["Quote band"]
    ie10 --> ie11["#khongdanhcho"] --> ie12["#faq"] --> ie13["#dangky — Đăng ký"]
  end
  ie --> ie1
  ie -. "Đặt lịch thi thử" .-> cal["Google Calendar booking"]
  ie -. "Zalo" .-> zalo["zalo.me/84375810412"]
  ie -. "Lộ trình PDF" .-> drive["Google Drive roadmap"]

  files --> f1["404.html — links to both pages"]
  files --> f2["robots.txt"]
  files --> f3["/ielts-self-study/roadmap.pdf"]
  files --> f4["favicon, opengraph images, _headers"]
```

There is no `sitemap.xml` yet.
