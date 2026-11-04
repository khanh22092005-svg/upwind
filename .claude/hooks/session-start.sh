#!/bin/bash
# Installs graphify (knowledge-graph tool) and its /graphify skill in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

GRAPHIFY_VERSION=0.9.102

if ! command -v graphify >/dev/null || ! python3 -m pip show graphifyy 2>/dev/null | grep -qx "Version: $GRAPHIFY_VERSION"; then
  python3 -m pip install --quiet --root-user-action=ignore "graphifyy==$GRAPHIFY_VERSION"
fi

if [ ! -f "$HOME/.claude/skills/graphify/SKILL.md" ]; then
  graphify install --platform claude >/dev/null
fi
