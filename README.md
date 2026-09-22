# Digital Pillars — cinematic rebuild

From-scratch motion-first marketing site with a native WebGL hero, glass UI, connected service destinations, testimonials and click-only FAQ assistant.

## Stack
- Semantic HTML/CSS/vanilla JS
- Three.js for the hero scene
- GSAP + ScrollTrigger for choreography
- Lenis for smooth desktop scrolling
- CDN runtime, no framework required

## Performance
- WebGL pixel ratio capped at 1.5
- Mobile particle count reduced
- Pointer effects only on fine pointers
- prefers-reduced-motion static fallback
- Transform/opacity motion for DOM choreography

## Architecture
System → Performance → Social Presence → Web Experiences → Strategy & Consulting → Proof → Contact → FAQ assistant

The generated `hero-cinematic.mp4` is supplied separately in the deliverables; the hero also remains fully functional without it because the WebGL scene is the primary visual system.
