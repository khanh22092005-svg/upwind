# Progress
v4 (Vbee narration): out/upwind-are-v4-vbee.mp4 (build bld_20261020T123226471Z_8F244B6440), 58.3s.
- Vietnamese lines cut from productions/are/voice/source/vbee-narration.mp3 (one take, ~1s pauses); English lines kept.
- Speech onsets match beats within ~0.1s; peak -6.7 dB.

v3 (voiced): out/upwind-are-v3-voice.mp4 (build bld_20261020T110211143Z_93992EF4BB), 68.5s.
- Real UpWind logo (from upwind.asia Landing.tsx) in header + end card.
- Voiceover: edge-tts voices. Narrator vi-VN-HoaiMyNeural, examiner en-GB-RyanNeural, candidate en-US-EmmaNeural.
- Timing is generated from the recordings: edit LINES in tools/build_voice.py, run `python3 -I tools/build_voice.py`,
  then `hypit build productions/are/main.svrun --runtime hypit.runtime.json --follow`.
Checked: speech onsets match beats within ~0.2s; peak -6.2 dB. Not yet checked by a human listener.
