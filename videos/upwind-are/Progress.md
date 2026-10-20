# Progress
v3 (voiced): out/upwind-are-v3-voice.mp4 (build bld_20261020T110211143Z_93992EF4BB), 68.5s.
- Real UpWind logo (from upwind.asia Landing.tsx) in header + end card.
- Voiceover: edge-tts voices. Narrator vi-VN-HoaiMyNeural, examiner en-GB-RyanNeural, candidate en-US-EmmaNeural.
- Timing is generated from the recordings: edit LINES in tools/build_voice.py, run `python3 -I tools/build_voice.py`,
  then `hypit build productions/are/main.svrun --runtime hypit.runtime.json --follow`.
Checked: speech onsets match beats within ~0.2s; peak -6.2 dB. Not yet checked by a human listener.

## Continue in a new session
```bash
npm install -g @hypit/hypit@0.3.1 && pip install edge-tts
cd videos/upwind-are && npm install && (cd packages/lesson-scene && npm install && npx tsc -p tsconfig.json) && npm install
python3 -I tools/build_voice.py      # re-record + re-time; uses Vbee for Vietnamese if VBEE_APP_ID/VBEE_TOKEN are set
hypit build productions/are/main.svrun --runtime hypit.runtime.json --follow
```
`hypit.runtime.json` points at the cloud container's Chromium (/opt/pw-browsers); remove `chromePath` on another machine.
Optional env: VBEE_VOICE (default hn_female_ngochuyen_full_48k-fhg), VBEE_SPEED (default 1.05).
