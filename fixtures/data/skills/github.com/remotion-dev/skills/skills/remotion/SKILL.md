---
name: remotion-best-practices
description: "Best practices for Remotion - Video creation in React."
metadata:
  tags: remotion, video, react, animation, composition
_from: skill-mill/sk-creative-tools@d20608c5fcf813d430a2e8599eac1a2cb0d6ebb4
---

# Remotion Best Practices

## Key Concepts

- **Composition**: A React component that represents a video
- **useCurrentFrame()**: Returns the current frame number
- **useVideoConfig()**: Returns fps, width, height, durationInFrames
- **interpolate()**: Map frame ranges to values for animations
- **spring()**: Physics-based animations

## Project Structure

```
src/
  Root.tsx              # Register all compositions
  MyVideo/
    index.tsx           # Main composition
    components/         # Reusable pieces
    assets/             # Static images, fonts
```

## Animation Guidelines

- Use `interpolate()` for linear animations
- Use `spring()` for natural-feeling motion
- Always set `extrapolateLeft: 'clamp'` and `extrapolateRight: 'clamp'`
- Prefer composition over inheritance for complex scenes

## Rendering

```bash
npx remotion render src/index.ts MyComp out/video.mp4
npx remotion still src/index.ts MyComp out/thumbnail.png --frame=30
```
