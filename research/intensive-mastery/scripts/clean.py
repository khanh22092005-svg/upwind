import json, re, sys
S = sys.argv[1]
def parse(t):
    lines = t.split("\n")
    author = lines[0].strip()
    i = 1
    while i < len(lines) and not re.match(r"^(\d{1,2}/\d{1,2}/\d{4}|\d+ (giờ|ngày|phút|tuần))", lines[i]): i += 1
    body = lines[i+1:] if i < len(lines) else lines[1:]
    while body and re.match(r"^[\d.,]+K?$|^$", body[-1].strip()): body.pop()
    body = [b for b in body if b.strip() not in ("Dịch", "Tác giả")]
    return author, "\n".join(body).strip()
posts, replies, seen = {}, [], set()
for l in open(f"{S}/threads_replies.jsonl"):
    x = json.loads(l)
    for k, it in enumerate(x["items"]):
        a, body = parse(it["text"])
        key = it["url"] or body[:100]
        if key in seen or not body: continue
        seen.add(key)
        rec = {"post": x["post"], "author": a, "time": it["time"], "text": body, "is_op": k == 0}
        (posts.__setitem__(x["post"], rec) if k == 0 else replies.append(rec))
json.dump({"posts": list(posts.values()), "replies": replies}, open(f"{S}/threads_clean.json", "w"), ensure_ascii=False)
print(len(posts), "posts", len(replies), "replies")
