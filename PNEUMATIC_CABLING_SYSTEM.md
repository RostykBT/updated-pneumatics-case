# Pneumatic Cabling System - Detailed Implementation Guide

## Overview

The pneumatic cabling system implements a realistic drag-and-drop tube connection mechanism for pneumatic components in a 3D React Three Fiber environment. This system is based on the legacy ivar-pneumatics implementation and provides both desktop mouse interaction and XR/VR controller support.

## Core Architecture

### 1. Main Components

#### `CableTip` Component

- **Purpose**: Represents the connectable ends of pneumatic tubes
- **Visual**: Blue semi-transparent cylindrical connectors (radius: 0.04, height: 0.15)
- **Position**: Offset by `[position[0], position[1] + 1, position[2] + 1]` from parent
- **Mesh Details**: 32-segment cylinder with blue material at 50% opacity

#### `Tube` Component (Legacy Style)

- **Purpose**: Main container for a complete pneumatic tube with two cable tips
- **Structure**: Contains two `CableTip` instances and one `Cable` visual connector
- **State Management**: Uses refs for attachment tracking and world position updates

#### `Cable` Component

- **Purpose**: Visual representation of the flexible tube between connectors
- **Rendering**: QuadraticBezierLine with dynamic positioning and color
- **Physics**: Simulates cable sag with midpoint offset of `[0, -0.3, 0]`

### 2. Interaction System

#### Pointer Event Handling

**onPointerDown Event:**

```typescript
- Validates ref existence and availability
- Checks for valid point data (e.point)
- Captures pointer for exclusive control
- Creates pointToObjectOffset vector for smooth dragging
- Stores pointerId for event matching
```

**onPointerMove Event:**

```typescript
- Validates pointer ownership by ID matching
- Ensures valid point data exists
- Creates safe Vector3 from event point
- Updates cable tip position using offset calculation
- Handles both Vector3 and coordinate object formats
```

**onPointerUp Event:**

```typescript
- Releases pointer capture
- Scans scene for snap-base objects within 0.3 units
- Calculates closest snappable target
- Performs attachment or releases to atmosphere
- Updates simulation state (from/to connections)
```

#### Snap Detection Algorithm

1. **Scene Traversal**: Searches all objects with `userData.kind === "snap-base"`
2. **Distance Calculation**: Uses world position comparison between cable tip and snap bases
3. **Snap Threshold**: 0.3 units maximum distance for successful connection
4. **Self-Exclusion**: Prevents cable tips from snapping to themselves
5. **Closest Selection**: Chooses nearest valid target within threshold

### 3. Attachment System

#### World Position Tracking

```typescript
useFrame(() => {
  // Update world positions for both cable tips
  ref1.current?.getWorldPosition(v1);
  ref2.current?.getWorldPosition(v2);

  // Handle attachment positioning with quaternion rotation
  if (ref1AttachedTo.current && ref1.current) {
    const baseWorldPosition = new THREE.Vector3();
    const baseWorldQuaternion = new THREE.Quaternion();

    ref1AttachedTo.current.getWorldPosition(baseWorldPosition);
    ref1AttachedTo.current.getWorldQuaternion(baseWorldQuaternion);

    // Apply rotation and position from attached object
    const baseWorldEuler = new THREE.Euler();
    baseWorldEuler.setFromQuaternion(baseWorldQuaternion);

    ref1.current.rotation.copy(baseWorldEuler);
    ref1.current.position.copy(baseWorldPosition);
    ref1.current.updateMatrixWorld();
  }
});
```

#### State Synchronization

- **Simulation State**: Updates `simulationState.from` and `simulationState.to` on connection changes
- **Attachment Refs**: Maintains references to connected objects for position tracking
- **Connection Persistence**: Attachments survive component re-renders through ref storage

### 4. Visual Feedback System

#### Cable Appearance

- **Color Logic**:
  - Green (`#00ff00`): When `residualMass > 0.5` (pressurized)
  - Pink (`#ff2060`): Default state (unpressurized)
- **Line Width**: Fixed at 3 units for visibility
- **Curve Type**: QuadraticBezierLine for realistic cable physics
- **Sag Calculation**: Midpoint positioned below center for gravity effect

#### Cable Tip States

- **Default**: Blue semi-transparent cylinder
- **Dragging**: Follows pointer with smooth offset-based movement
- **Snapping**: Automatic positioning when within snap range
- **Connected**: Locked to attachment object's world transform

### 5. Data Flow

#### Input Events → Position Updates

```
Pointer Event → Event Validation → Safe Vector3 Creation → Position Calculation → Mesh Update
```

#### Snap Detection → Connection

```
Pointer Release → Scene Traversal → Distance Calculation → Closest Selection → Attachment Update → State Change
```

#### Frame Loop → Visual Update

```
useFrame → World Position Sync → Attachment Tracking → Cable Position Update → Visual Render
```

## Technical Implementation Details

### Error Handling Strategy

1. **Defensive Programming**: All Vector3 operations wrapped in validation
2. **Type Safety**: Runtime checks for object properties and methods
3. **Graceful Degradation**: Default values for undefined positions/states
4. **Error Logging**: Console warnings for debugging invalid states

### Performance Considerations

1. **Ref Usage**: Minimizes React re-renders through direct DOM manipulation
2. **Frame Loop Optimization**: Only updates when objects exist and are attached
3. **Event Debouncing**: Validates event ownership to prevent conflicts
4. **Memory Management**: Proper cleanup of attachment references

### XR/VR Compatibility

1. **Event Detection**: `isXREvent` helper for XR-specific interactions
2. **Pointer Abstraction**: Works with both mouse and VR controllers
3. **World Space Calculations**: Handles complex 3D transformations
4. **Controller Mapping**: Supports hand tracking and controller input

## Usage Patterns

### Creating a New Tube

```typescript
<Tube
  downState={downStateRef}
  position={[0, 0, 0]}
  id="tube-unique-id"
  simulationState={{
    id: "tube-unique-id",
    from: "atmosphere",
    to: "atmosphere",
    residualMass: 0,
  }}
/>
```

### Modern Wrapper Usage

```typescript
<ModernTubeWrapper
  state={tubeState}
  onTubeUpdate={(newState) => {
    // Handle state changes
    updateTubeInSimulation(newState);
  }}
/>
```

## Integration Requirements

### Required Dependencies

- `@react-three/fiber`: Core 3D rendering
- `@react-three/drei`: QuadraticBezierLine component
- `three`: 3D mathematics and objects

### Scene Setup

- Snap-base objects must have `userData.kind = "snap-base"`
- Snap-base objects must have `userData.id` for connection tracking
- Scene must be accessible via `useThree()` hook

### State Management

- Tube states follow `PneumapicTubeState` interface
- Connection updates trigger parent component callbacks
- Simulation state persists through component lifecycle

## Debugging Guide

### Common Issues

1. **"Cannot read properties of undefined"**: Check Vector3 initialization and null safety
2. **Attachment not working**: Verify snap-base userData configuration
3. **Position drift**: Ensure world matrix updates in frame loop
4. **Event conflicts**: Check pointer ID matching and capture logic

### Debug Logging

- Distance calculations logged during snap detection
- Attachment state changes logged to console
- Error cases wrapped with descriptive warnings

This system provides a robust, interactive cabling mechanism that closely mirrors real-world pneumatic tube behavior while maintaining compatibility with modern React Three Fiber applications and XR environments.
