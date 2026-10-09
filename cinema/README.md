# Continuous camera scene

Blender 4.2, Cycles CPU, 1280 × 720, 24 frames/s, 168 frames.

The laptop display and keyboard use photo-projected details from the approved generated laptop reference. The architecture background is a generated matching room plate. Camera geometry, desk, lamp, lighting, shadows and camera trajectory are rendered locally. No Higgsfield generation is used.

Run `blender -b --python build.py`, then `blender -b --python track.py`, then `blender -b --python render.py` in this folder. `track.py` measures the four corners of the photographed active display on the 3D lid. It outputs normalized coordinates for every frame. The site applies a projective matrix to the same live HTML panel at the media frame being displayed, including paused and reverse seeks.

Encode frames with `ffmpeg -framerate 24 -start_number 1 -i frames/%04d.png -c:v libx264 -crf 17 -preset slow -g 1 -pix_fmt yuv420p -movflags +faststart camera-descent.mp4`.

Source materials: Poly Haven Wood Table 001 and Lebombo, CC0; generated laptop and room references created for this project.


## Browser playback revision — 2026-10-07

The site now displays a deterministic canvas image sequence, with a single presentation clock for the camera frame and the live HTML screen. `video-stage.js` no longer seeks an HTMLVideoElement. The original MP4 and 168 tracked frames remain source assets.

`dist/assets/cinema/frames/` contains 267 WebP frames at 48 fps, made with motion interpolation from the first 135 source frames. The final physical overshoot is intentionally excluded. `sequence.json` contains the corresponding interpolated corner track. The final approach uses a monotone, tangent-matched screen path and applies one shared projective correction to the room and display, ending at the viewport without zooming the display backwards.

Frame bytes are prefetched with five concurrent requests. At most 28 decoded image bitmaps are kept; stale bitmaps are explicitly closed. Reduced-motion viewers receive the final interactive composition immediately. The cinematic and interactive conversations describe GrowNomy websites, AI assistants and enquiry workflows.

Observed defects in the previous version:
- Browser inspection showed the video stuck at time 0 with a seekable range of [0, 0], although the seven-second file was buffered.
- First scroll cancelled the intro and requested frame 48 regardless of the currently visible frame.
- DOM projection and video seeks ran on independent callbacks.
- Final screen corners grew well beyond the viewport, then the portal was shrunk back to it.
- Viewport-based screen content was squeezed onto the laptop's fixed display ratio.
- Multiple obsolete cinematic CSS implementations overrode each other.
- Both conversations contained unrelated roof-service placeholders.


Browser QA refinement: the final approach starts from source sequence frame 140 (the front-facing view), keeping that image as the camera plate while the shared projective camera moves the room and live display to the viewport. This avoids exposing empty borders from later source frames that had already cropped the laptop. Only sequence images 0–140 are requested (about 8 MB); later indices are virtual-camera positions. Initial loading shows the poster, never an opaque unpainted canvas. The intro, forward/reverse motion, final viewport alignment and complete interactive service demo were exercised in the cloud browser.
