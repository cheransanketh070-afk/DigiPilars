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
