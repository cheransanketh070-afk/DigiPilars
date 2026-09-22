# Digital Pillars — Robotics-grade growth system site

A production-oriented rebuild inspired by the supplied reference video: one cinematic WebGL machine, floating glass telemetry/UI cards, smooth scroll choreography, and service modules that control the central object.

## Stack
- Three.js 0.161 — native WebGL scene, procedural crystalline/robotic hardware, orbital particles and lighting.
- GSAP + ScrollTrigger — section choreography, reveals, module transitions and scroll-linked motion.
- Lenis — smooth scrolling.
- CSS glass UI — responsive, GPU-friendly transform/opacity motion.
- MP4 fallback — assets/hero-cinematic.mp4.

## Structure
- index.html — semantic page and all interactive UI modules.
- styles.css + styles-2.css — responsive robotics visual system.
- script.js — WebGL scene, scroll state machine, pointer interaction, magnetic controls and FAQ assistant.
- assets/hero-cinematic.mp4 — generated cinematic fallback asset.
- make_video.py — reproducible MP4 generator.

## Production notes
- Main copy is contained inside UI surfaces; the background is an object/scene rather than a flat text canvas.
- Service modules are clickable and update the central WebGL machine state.
- Touch layouts simplify the 3D/UI composition; fine-pointer tilt/magnetic effects are disabled on touch devices.
- prefers-reduced-motion uses the MP4 fallback and reduces WebGL motion/opacity.
- The contact form is intentionally front-end only. Connect it to the client's inbox/CRM endpoint before launch.
- Testimonials and performance figures are illustrative placeholders and must be replaced with verified client material before public launch.
- External runtime libraries currently load from jsDelivr; self-host them for a fully controlled production deployment if desired.

## QA status
- JavaScript syntax check: passed with node --check script.js.
- MP4: H.264, 640×360, 20 fps, 4 seconds.
- Lighthouse and real-device 60 fps / 4G timings still need to be run in the final hosting environment.


## Cinematic interaction layer
- `styles-motion.css` adds full-screen scene snapping, floating-card motion and cinematic navigation chrome.
- `motion-engine.js` converts wheel/trackpad gestures and touch swipes into one-scene-at-a-time transitions.
- UI cards continuously drift with GPU-friendly translate/rotate properties and pause for interaction.
- The existing WebGL renderer now contains four autonomous orbital drones plus lightweight wireframe shards, so the background behaves like a living 3D system instead of a static backdrop.
- The pager is disabled for `prefers-reduced-motion`; touch layouts remain responsive rather than forcing desktop-sized scenes.
