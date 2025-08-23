# Modern AR Pneumatics Interactions - @react-three/xr 6.6

This document describes the complete AR-focused pneumatics simulation using the latest @react-three/xr 6.6 API.

## Overview

The pneumatics simulation now features modern AR interactions built from scratch with:

- **Modern XR API**: Full compatibility with @react-three/xr 6.6
- **Physics-based interactions**: Realistic grabbing and movement
- **Multi-modal support**: Touch interactions and traditional mouse controls
- **Advanced assembly system**: Snap-to-fit components with visual feedback
- **Measurement tools**: Real-time distance and pressure measurements
- **Enhanced component visualization**: Dynamic pressure flow and status indicators

## Core Components

### 1. XRDraggable (`modern-xr-interactions.tsx`)

Modern draggable component that works across all input methods:

```tsx
<XRDraggable
  position={[0, 1, 0]}
  onGrab={(controller) => console.log("Grabbed")}
  onRelease={(position) => console.log("Released")}
  onSnap={(snapTarget) => console.log("Snapped")}
  snapDistance={0.15}
>
  <YourComponent />
</XRDraggable>
```

**Features:**

- Automatic touch detection
- Fallback to mouse when not in AR
- Snap-to-target functionality
- Physics-based movement

### 2. XRSnapTarget (`modern-xr-interactions.tsx`)

Visual snap targets for precise component connections:

```tsx
<XRSnapTarget
  position={[0, 0, 0]}
  id="terminal-1"
  radius={0.03}
  visible={true}
/>
```

**Features:**

- Glowing visual indicators
- Customizable snap radius
- ID-based connection tracking
- Show/hide based on interaction state

### 3. XRInteractiveButton (`modern-xr-interactions.tsx`)

Pressure-sensitive buttons for AR:

```tsx
<XRInteractiveButton
  position={[0, 0.1, 0]}
  onPress={() => console.log("Pressed")}
  onRelease={() => console.log("Released")}
  pressDepth={0.02}
>
  <ButtonMesh />
</XRInteractiveButton>
```

**Features:**

- Touch collision detection
- Visual press feedback
- Customizable press depth
- Haptic feedback integration

### 4. XRPhysicsObject (`xr-physics.tsx`)

Physics-enabled objects with realistic behavior:

```tsx
<XRPhysicsObject position={[0, 2, 0]} mass={2} friction={0.8} restitution={0.4}>
  <ComponentMesh />
</XRPhysicsObject>
```

**Features:**

- Gravity simulation
- Collision detection
- Friction and restitution
- Ground collision handling

### 5. XRPneumaticComponent (`xr-pneumatics.tsx`)

Specialized pneumatic components with XR interactions:

```tsx
<XRPneumaticComponent
  component={pneumaticState}
  onInteraction={(comp, interaction) => handleInteraction(comp, interaction)}
  onStateChange={(comp) => updateComponent(comp)}
/>
```

**Features:**

- Component-specific interactions (buttons, compressors, cylinders)
- Real-time pressure visualization
- Snap point generation
- Status and alert displays

## AR Experience (`/ar`)

Immersive AR laboratory with:

### Environment Features

- **Real-world integration**: Place components in your environment
- **Interactive surfaces**: Snap components to detected surfaces
- **Information panels**: Floating screens with component data

### Interaction Methods

- **Touch controls**: Tap and drag components
- **Gesture recognition**: Pinch and move gestures
- **Button activation**: Touch to activate pneumatic controls

### Visual Feedback

- **Pressure flow**: Animated pressure visualization
- **Component states**: Color-coded status indicators
- **Snap guides**: Glowing connection points
- **Haptic responses**: Controller vibration for actions

## AR Experience (`/ar`)

Augmented reality lab overlay with:

### AR-Optimized Features

- **Surface detection**: Place lab on any flat surface
- **Scaled components**: Appropriately sized for AR viewing
- **Minimal UI**: Clean, unobtrusive interface
- **Touch interactions**: Tap, pinch, and drag gestures

### Mobile Compatibility

- **Hand tracking**: Where supported (WebXR)
- **Touch fallback**: Mouse/touch for non-XR devices
- **Performance optimization**: Reduced complexity for mobile

## Physics System

### Realistic Interactions

- **Gravity**: Components fall naturally
- **Friction**: Surface interaction simulation
- **Bounce**: Realistic collision responses
- **Mass**: Different weights for different components

### Constraint System

- **Grab constraints**: Smooth controller-to-object binding
- **Assembly constraints**: Snap-fit connections
- **Joint constraints**: Flexible tube connections

## Haptic Feedback System

### Feedback Types

- **Grab feedback**: Light pulse when grabbing objects
- **Button feedback**: Sharp pulse when pressing buttons
- **Collision feedback**: Impact-based vibration
- **Success feedback**: Confirmation vibrations

### Implementation

```tsx
const { playHaptic, playCollisionHaptic, playSuccessHaptic } = useXRHaptics();

// Basic haptic
playHaptic("left", 0.5, 200); // hand, intensity, duration

// Collision-based haptic
playCollisionHaptic("right", force);

// Success confirmation
playSuccessHaptic("both");
```

## Measurement Tools

### XR Measurement Tool

- **Point-to-point**: Measure distances between objects
- **Real-time display**: Live measurement updates
- **Multi-point**: Support for complex measurements
- **Units**: Metric measurements with precision

### Usage in AR

1. Touch measurement tool button to start
2. Point at first location
3. Point at second location
4. Distance displayed in 3D space

## Assembly System

### Snap-to-Fit Connections

- **Visual guides**: Glowing snap points
- **Magnetic attraction**: Automatic alignment
- **Confirmation feedback**: Visual and haptic confirmation
- **Type checking**: Compatible component validation

### Connection Types

- **Pneumatic terminals**: Pressure connection points
- **Tube endpoints**: Flexible connection system
- **Component mounting**: Snap to workbench/surfaces

## Performance Optimizations

### AR Optimizations

- **LOD system**: Level-of-detail for distant objects
- **Culling**: Only render visible components
- **Physics optimization**: Simplified collision shapes
- **Texture compression**: Optimized materials
- **Reduced polygon count**: Mobile-friendly meshes
- **Simplified lighting**: Performance-focused illumination
- **Efficient shaders**: Fast material rendering
- **Occlusion culling**: Hide occluded objects

## Browser Compatibility

### WebXR Support

- **Chrome/Edge**: Full AR support
- **Firefox**: Limited AR support
- **Safari**: WebXR support on iOS
- **Mobile browsers**: Native AR support

### Fallback Support

- **Mouse/Touch**: Full functionality without AR
- **Keyboard shortcuts**: Alternative control methods
- **2D mode**: Traditional camera controls

## Getting Started

### Prerequisites

```bash
npm install @react-three/xr@^6.6.25
npm install @react-three/fiber@^9.3.0
npm install @react-three/drei@^10.7.4
```

### HTTPS Requirement

XR requires HTTPS. Development server runs with:

```bash
npm run dev  # Uses --experimental-https
```

### Testing

1. **Desktop**: Use browser dev tools XR emulator
2. **AR Mobile**: Use compatible mobile browser

## File Structure

```
src/components/pneumatics-interactions/
├── modern-xr-interactions.tsx    # Core XR interaction components
├── xr-physics.tsx                # Physics and advanced tools
├── xr-pneumatics.tsx            # Pneumatic-specific XR components
└── enhanced-xr.tsx              # Legacy file (empty)

src/app/
├── ar/page.tsx                  # AR experience
└── desktop/page.tsx             # Desktop fallback
```

## API Reference

### Hook APIs

- `useXRHandTracking()` - Hand joint tracking (simplified)
- `useXRGestures()` - Gesture recognition (basic)

### Component Props

All XR components support standard Three.js props plus XR-specific enhancements.

### Event System

- `onGrab` - Object grabbed by touch
- `onRelease` - Object released
- `onSnap` - Object snapped to target
- `onInteraction` - General interaction events
- `onStateChange` - Component state updates

## Troubleshooting

### Common Issues

1. **No XR button**: Check HTTPS and browser compatibility
2. **Poor performance**: Reduce component complexity
3. **No haptics**: Check controller battery/connection
4. **Tracking issues**: Ensure good lighting conditions

### Debug Mode

Enable debug logging:

```tsx
// In your component
console.log("XR State:", xrState);
console.log("Controllers:", leftController, rightController);
```

## Future Enhancements

### Planned Features

- **Advanced hand tracking**: Full gesture recognition
- **Collaborative mode**: Multi-user AR sessions
- **AI assistance**: Intelligent component suggestions
- **Training modes**: Guided learning experiences
- **Export/Import**: Save and share configurations

### Performance Improvements

- **WebGPU support**: Next-gen graphics performance
- **Streaming**: Progressive component loading
- **Compression**: Advanced asset optimization

---

This AR system provides a comprehensive, modern foundation for pneumatic system simulation in AR environments, built specifically for @react-three/xr 6.6 and future WebXR standards.
