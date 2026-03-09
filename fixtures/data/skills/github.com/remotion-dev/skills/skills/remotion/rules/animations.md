# Animation Rules

## interpolate()

```tsx
import { interpolate, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

- Always set `extrapolateLeft: "clamp"` and `extrapolateRight: "clamp"`
- Use multiple `interpolate()` calls for complex animations
- Prefer easing functions for natural motion

## spring()

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const scale = spring({ frame, fps, config: { damping: 200 } });
```

- `damping`: Higher = less bouncy (default: 10)
- `mass`: Higher = slower (default: 1)
- `stiffness`: Higher = faster (default: 100)
