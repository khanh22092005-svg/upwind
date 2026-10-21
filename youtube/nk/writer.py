"""Research a topic and write a STRABO-style script with Claude."""

import json

import anthropic

MODEL = "claude-opus-5-5"
FALLBACK_BETA = "server-side-fallback-2026-07-01"

RESEARCH_PROMPT = """You are the researcher for "NK Exploring", a YouTube channel of 8-10 minute
geopolitics and geography explainers (borders, power, resources, places, and the stories
hiding in them).

Topic: {topic}

Search the web and write research notes for the scriptwriter:
- The core question and the one surprising answer the video should build to.
- 10-20 concrete, checkable facts (numbers, dates, places, names), each with its source.
- Which countries, regions, seas, and cities the story moves through, in order.
- What is genuinely disputed or uncertain, and the main viewpoints on it.
- What happened most recently (this is often news-driven, so be current).
Plain markdown. No script yet."""

SCRIPT_PROMPT = """You write scripts for "NK Exploring", a faceless YouTube channel of
geopolitics explainers narrated over maps.

Topic: {topic}

Research notes (use only facts from here; do not invent numbers):
<research>
{research}
</research>

Write one {minutes}-minute video ({words} spoken words, give or take 10%).

Structure that works for this format:
1. Cold open, 2-4 scenes: a surprising claim or question stated in the first sentence,
   then why it matters now. No "welcome to the channel".
2. Context: the geography first (where it is, what is around it, what it controls).
3. Three or four acts, each a chapter with a short title, each ending on a question
   that pulls into the next one.
4. The twist or counter-argument: what most people get wrong.
5. Close: answer the opening question, then one forward-looking line.

Rules:
- Spoken English, short sentences, one idea per scene, 15-45 words per scene.
- Neutral and fair on contested issues; say "according to" for claims.
- Every scene gets a visual; vary them so no kind runs more than 3 scenes in a row.
  Aim for roughly: 35% map, 30% footage, 15% chart, 10% image, 10% text.
  - "map": ISO 3166-1 alpha-3 codes in "highlight" (painted red) and "focus" (the area
    to frame; can include neighbours).
  - "footage": real video of people and places (protests, parliament, streets, ports).
    footage_query is a short Wikimedia Commons search, often best in the local
    language ("manifestation retraites Paris", "Assemblée nationale hémicycle").
    Free footage is usually archive: when it is not from the events being described,
    the caption must say what and when ("PENSION PROTEST, 2019").
  - "image": a real photo; footage_query is the Commons search for it.
  - "chart": a number that changes over time or compares countries. Use only numbers
    from the research. chart.type "bar" or "line", 3-8 labels with matching values,
    unit like "%" or "bn €", and the source name.
  - "text": one big number or short quote.
  Unused fields are empty strings, empty lists, or a chart with type "".
- "caption" is 1-4 punchy words shown on screen (like "AT WHAT COST?"), or "".
- "chapter" is the chapter title on the first scene of each chapter, else "".
  The first scene's chapter is "Intro".
- thumbnail.headline: 1-3 words, ends with "?" or "!". thumbnail.highlight: 1-2 ISO3 codes.
- title_options: 3 curiosity-gap titles under 70 characters (the "Why X ...?" pattern).
- description: 2 short paragraphs, then a "Sources:" list with URLs from the research.
- sources: every source used, as "Publisher - title (URL)"; shown on the end card."""

CHART_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["type", "title", "unit", "labels", "values", "source"],
    "properties": {
        "type": {"type": "string", "enum": ["bar", "line", ""]},
        "title": {"type": "string"},
        "unit": {"type": "string"},
        "labels": {"type": "array", "items": {"type": "string"}},
        "values": {"type": "array", "items": {"type": "number"}},
        "source": {"type": "string"},
    },
}

SCENE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["chapter", "narration", "visual"],
    "properties": {
        "chapter": {"type": "string"},
        "narration": {"type": "string"},
        "visual": {
            "type": "object",
            "additionalProperties": False,
            "required": ["kind", "highlight", "focus", "caption", "footage_query", "chart"],
            "properties": {
                "kind": {"type": "string", "enum": ["map", "footage", "image", "chart", "text"]},
                "highlight": {"type": "array", "items": {"type": "string"}},
                "focus": {"type": "array", "items": {"type": "string"}},
                "caption": {"type": "string"},
                "footage_query": {"type": "string"},
                "chart": CHART_SCHEMA,
            },
        },
    },
}

SCRIPT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["title_options", "description", "tags", "thumbnail", "sources", "scenes"],
    "properties": {
        "sources": {"type": "array", "items": {"type": "string"}},
        "title_options": {"type": "array", "items": {"type": "string"}},
        "description": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "thumbnail": {
            "type": "object",
            "additionalProperties": False,
            "required": ["headline", "highlight"],
            "properties": {
                "headline": {"type": "string"},
                "highlight": {"type": "array", "items": {"type": "string"}},
            },
        },
        "scenes": {"type": "array", "items": SCENE_SCHEMA},
    },
}


def _check(message):
    if message.stop_reason == "refusal":
        raise SystemExit(f"Claude declined this topic: {message.stop_details}")
    if message.stop_reason == "max_tokens":
        raise SystemExit("Claude hit max_tokens; try a shorter video (--minutes).")


def research(topic: str) -> str:
    """Web-searched research notes in markdown, with a source list."""
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": RESEARCH_PROMPT.format(topic=topic)}]
    text, sources = [], {}
    # Web search can pause a long turn; resend the conversation to let it continue.
    for _ in range(5):
        with client.beta.messages.stream(
            model=MODEL,
            max_tokens=64000,
            betas=[FALLBACK_BETA],
            fallbacks="default",
            output_config={"effort": "high"},
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 10}],
            messages=messages,
        ) as stream:
            message = stream.get_final_message()
        _check(message)
        for block in message.content:
            if block.type == "text":
                text.append(block.text)
                for c in block.citations or []:
                    if getattr(c, "url", None):
                        sources[c.url] = c.title or c.url
        if message.stop_reason != "pause_turn":
            break
        messages.append({"role": "assistant", "content": message.content})
    notes = "".join(text).strip()
    if sources:
        notes += "\n\n## Sources\n" + "\n".join(f"- [{t}]({u})" for u, t in sources.items())
    return notes + "\n"


def write_script(topic: str, notes: str, minutes: int) -> dict:
    client = anthropic.Anthropic()
    prompt = SCRIPT_PROMPT.format(
        topic=topic, research=notes, minutes=minutes, words=minutes * 150
    )
    with client.beta.messages.stream(
        model=MODEL,
        max_tokens=64000,
        betas=[FALLBACK_BETA],
        fallbacks="default",
        output_config={
            "effort": "high",
            "format": {"type": "json_schema", "schema": SCRIPT_SCHEMA},
        },
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = stream.get_final_message()
    _check(message)
    raw = "".join(b.text for b in message.content if b.type == "text")
    return json.loads(raw)
