"""Cover + body -> one PDF with a bookmark tree (parts > chapters). Called by make-ebook.mjs."""
import json
import sys

from pypdf import PdfReader, PdfWriter

cover, body, out, meta = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4])
w = PdfWriter()
w.append(PdfReader(cover))
w.append(PdfReader(body), import_outline=False)
off = len(PdfReader(cover).pages)  # body page 1 is PDF page off+1
pages = meta["pages"]
labels = [("Mục lục", None), ("Cách dùng sách này", "HOW"), ("Bài kiểm tra đầu vào", "PT"), ("Bảng tiền tố và hậu tố", "AFF"), ("Bản đồ 40 gốc từ", "MAP")]
w.add_outline_item("Bìa", 0)
for title, key in labels:
    w.add_outline_item(title, off + (pages[key] - 1 if key else 1))
for part in meta["outline"]:
    if not part.get("page"):
        continue
    p = w.add_outline_item(part["title"], off + part["page"] - 1)
    for ch in part["kids"]:
        if ch.get("page"):
            w.add_outline_item(ch["title"], off + ch["page"] - 1, parent=p)
for title, key in [("Bài kiểm tra cuối sách", "FT"), ("Đáp án", "ANS"), ("Từ vựng theo chủ đề", "TOP"), ("Chỉ mục A–Z", "IDX")]:
    if key in pages:
        w.add_outline_item(title, off + pages[key] - 1)
w.page_mode = "/UseOutlines"
w.add_metadata({"/Title": "UpWind · Giải mã từ vựng IELTS bằng từ gốc", "/Author": "UpWind IELTS"})
with open(out, "wb") as f:
    w.write(f)
