# Simple Background System

## How to Use

The AMM component is designed to work with any background wrapper. Simply wrap it with your desired background styling in `page.tsx`.

## Current Background (Dark Purple Glow)

```tsx
import AMM from "@/components/AMM";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#020617] relative">
      {/* Purple Radial Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle 500px at 50% 100px, rgba(139,92,246,0.4), transparent)`,
        }}
      />
      <AMM />
    </div>
  );
}
```

## Background Examples

### 1. Simple Gradient
```tsx
<div className="min-h-screen w-full bg-gradient-to-br from-blue-900 to-purple-900 relative">
  <AMM />
</div>
```

### 2. Solana Green Glow
```tsx
<div className="min-h-screen w-full bg-[#0a0a0a] relative">
  <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: `radial-gradient(circle 600px at 30% 40%, rgba(20,184,166,0.3), transparent)`,
    }}
  />
  <AMM />
</div>
```

### 3. Clean White
```tsx
<div className="min-h-screen w-full bg-gray-50 relative">
  <AMM />
</div>
```

### 4. Multiple Glows
```tsx
<div className="min-h-screen w-full bg-black relative">
  <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: `
        radial-gradient(circle 400px at 20% 30%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 300px at 80% 70%, rgba(59,130,246,0.3), transparent)
      `,
    }}
  />
  <AMM />
</div>
```

## Key Points

- The AMM component uses glassmorphism styling (semi-transparent panels) so it works with any background
- Always use `relative` positioning on the wrapper and `z-0` for background elements
- The AMM component doesn't contain any background logic - it's completely flexible
- Just replace the wrapper div in `page.tsx` to change the background

That's it! No complex components, no providers, just simple and flexible background styling.
