# GrowNomy cinematic revision

The v16 restore point is commit f64317bdcef93cf17445c4a1296c616f7bd833d2.
Its original code and assets are also preserved in the task's v16 source ZIP.

## Audit

The v16 page used luxury-stage.js, app.js and luxury.css. Its WebGL failure
path removed the studio entirely. Mobile hero copy overlapped the laptop.
The final homography changed the screen aspect ratio to the viewport ratio.
The hinge cylinder was rotated along the wrong axis. Replay did not reset
the cinematic conversation. The website option in the brief form had a
malformed closing option tag, so browsers discarded that choice.

The repository contains the earlier Blender scene, scripts, source textures,
267 interpolated landscape frames and their old camera tracks. It does not
contain the later studio-render.py or a finished vertical Blender sequence.
The retained Blender scripts are historical and contain old /tmp paths.
They are not dependencies of the current page.

## Current production path

studio-scene.js preserves and refines the existing Three.js studio. A local
production page renders two independent camera tracks into WebP files:

| Composition | Dimensions | Frames | Intro end |
| --- | --- | --- | --- |
| Desktop | 1600 x 1000 | 181 | 90 |
| Mobile | 720 x 1280 | 181 | 90 |

Each frame's four screen corners are projected from the real 3D display.
track.json and the image are produced in the same render iteration.
The renderer is a source tool, not a runtime dependency. The public page
uses Canvas 2D and live HTML; it does not instantiate WebGL.

The first half of each track descends to the hero composition. The second
half approaches the front-facing display. The final approach applies the
same homography to that last camera plate and the HTML plane. The target
rectangle covers the viewport while retaining the physical 3.32 / 2.024
aspect ratio. The inner content adapts to the visible area.

One presentation state drives the bitmap and its corners. If a required
image is still loading, the previous paired image and transform remain
visible. Scroll interrupts the intro without resetting the presentation
state. Reverse scroll follows the same path. Decoded caches are capped at
12 mobile or 16 desktop images, and evicted images are closed. At most
three requests run concurrently, with bounded nearby prefetches.

The player stops scheduling animation frames at rest or offscreen. Hidden
conversations and background audio pause. Replay cancels the old story
generation before creating a new one. Reduced motion retains a static
studio composition and all normal page sections.

## Reproduction and checks

Run the local preview server from this checkout. Open
/__tools/render-studio.html, render control frames first, inspect them,
then render each complete composition. Run node source/cinema/validate.mjs
to verify the files, track geometry, final screen ratio and HTML assets.

Open /__tools/browser-qa.html for the browser suite. It tests seven viewport
sizes, intro interruption, forward and reverse movement, screen geometry,
canvas pixels, bounded decoded memory, replay, conversation pausing, demo
completion/reset, service selection, form validity and static layouts.
The ?motion=still parameter exercises the same static player path without
changing the operating system's accessibility preferences.

Browser viewport checks are not physical iPhone/Android testing.
Manual screenshots, download checks, sound toggling and published-page
verification supplement the automated suite.

## Scope

The assistant remains an explicitly labelled scripted demonstration.
The brief form downloads a local text file. It does not send an enquiry,
connect to a CRM, or call a live AI model. Audio remains opt-in.
Original asset attribution and font licences are retained.
