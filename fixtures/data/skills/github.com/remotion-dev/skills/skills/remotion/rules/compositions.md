# Composition Rules

## Registering Compositions

```tsx
import { Composition } from "remotion";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

## Best Practices

- Each video should be its own composition
- Use `calculateMetadata()` for dynamic duration
- Set sensible defaults for width/height/fps
- Use `defaultProps` for preview parameters
- Keep composition IDs kebab-case or PascalCase
