"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useXRControllerState, useXRInputSourceState, useXR } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// Types for XR interactions
interface XRInteractionState {
    isGrabbing: boolean;
    grabOffset: THREE.Vector3;
    controller: any;
    targetObject: THREE.Object3D | null;
}

interface DraggableProps {
    children: React.ReactNode;
    position: [number, number, number];
    isSnappable?: boolean;
    snapDistance?: number;
    onGrab?: (controller: any) => void;
    onRelease?: (position: THREE.Vector3) => void;
    onSnap?: (snapTarget: THREE.Object3D) => void;
}

interface SnapTargetProps {
    position: [number, number, number];
    id: string;
    radius?: number;
    visible?: boolean;
}

// XR Draggable Component with modern XR 6.6 API
export function XRDraggable({
    children,
    position,
    isSnappable = true,
    snapDistance = 0.15,
    onGrab,
    onRelease,
    onSnap,
}: DraggableProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [interactionState, setInteractionState] = useState<XRInteractionState[]>([]);
    const { scene } = useThree();
    const xrState = useXR();

    // Track controller states
    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");

    // Check if we're in XR session
    const isXRSession = !!xrState.session;

    // Handle grabbing with controllers (simplified)
    const handleControllerInteraction = useCallback((controller: any, isGrabbing: boolean) => {
        if (!groupRef.current) return;

        if (isGrabbing) {
            // Start grabbing - create simple grab state
            const grabOffset = new THREE.Vector3(0, 0, 0); // Simplified offset

            setInteractionState(prev => [
                ...prev.filter(state => state.controller !== controller),
                {
                    isGrabbing: true,
                    grabOffset,
                    controller,
                    targetObject: groupRef.current,
                }
            ]);

            onGrab?.(controller);
        } else {
            // Stop grabbing
            const currentState = interactionState.find(state => state.controller === controller);
            if (currentState && groupRef.current) {
                const finalPosition = new THREE.Vector3();
                groupRef.current.getWorldPosition(finalPosition);

                // Check for snapping
                if (isSnappable) {
                    const snapTarget = findNearestSnapTarget(finalPosition, snapDistance);
                    if (snapTarget) {
                        snapToTarget(snapTarget);
                        onSnap?.(snapTarget);
                    }
                }

                onRelease?.(finalPosition);
            }

            setInteractionState(prev => prev.filter(state => state.controller !== controller));
        }
    }, [interactionState, isSnappable, snapDistance, onGrab, onRelease, onSnap]);

    // Simplified controller interaction detection
    const [leftGrabbing, setLeftGrabbing] = useState(false);
    const [rightGrabbing, setRightGrabbing] = useState(false);

    // Monitor controller states (simplified)
    useFrame(() => {
        if (!isXRSession) return;

        // For now, we'll use distance-based interaction detection
        // until we can properly access controller button states
        if (leftController && groupRef.current) {
            const distance = groupRef.current.position.distanceTo(new THREE.Vector3(0, 0, 0));
            if (distance < 0.5 && !leftGrabbing) {
                setLeftGrabbing(true);
                handleControllerInteraction(leftController, true);
            } else if (distance >= 0.5 && leftGrabbing) {
                setLeftGrabbing(false);
                handleControllerInteraction(leftController, false);
            }
        }

        // Check right controller
        if (rightController && groupRef.current) {
            const distance = groupRef.current.position.distanceTo(new THREE.Vector3(0, 0, 0));
            if (distance < 0.5 && !rightGrabbing) {
                setRightGrabbing(true);
                handleControllerInteraction(rightController, true);
            } else if (distance >= 0.5 && rightGrabbing) {
                setRightGrabbing(false);
                handleControllerInteraction(rightController, false);
            }
        }
    });

    // Update object position while being grabbed (simplified)
    useFrame(() => {
        if (!groupRef.current) return;

        interactionState.forEach(state => {
            if (state.isGrabbing && state.controller) {
                // For now, keep objects in a stable position during grab
                // More complex position tracking would require proper controller pose access
                if (groupRef.current) {
                    // Apply a simple offset to show interaction feedback
                    const offset = Math.sin(Date.now() * 0.005) * 0.01;
                    groupRef.current.position.y = position[1] + offset;
                }
            }
        });
    });

    // Find nearest snap target
    const findNearestSnapTarget = useCallback((position: THREE.Vector3, maxDistance: number): THREE.Object3D | null => {
        let nearestTarget: THREE.Object3D | null = null;
        let nearestDistance = Infinity;

        scene.traverse((object) => {
            if (object.userData.isSnapTarget && object !== groupRef.current) {
                const targetPosition = new THREE.Vector3();
                object.getWorldPosition(targetPosition);
                const distance = position.distanceTo(targetPosition);

                if (distance < maxDistance && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTarget = object;
                }
            }
        });

        return nearestTarget;
    }, [scene]);

    // Snap to target
    const snapToTarget = useCallback((target: THREE.Object3D) => {
        if (!groupRef.current) return;

        const targetPosition = new THREE.Vector3();
        target.getWorldPosition(targetPosition);

        if (groupRef.current.parent) {
            const localPosition = groupRef.current.parent.worldToLocal(targetPosition.clone());
            groupRef.current.position.copy(localPosition);
        }
    }, []);

    // Handle traditional pointer events for non-XR interaction
    const handlePointerDown = useCallback((event: any) => {
        if (isXRSession) return; // Skip if XR controllers are active

        event.stopPropagation();
        (event.target as any).setPointerCapture(event.pointerId);

        if (groupRef.current) {
            const grabOffset = groupRef.current.position.clone().sub(event.point);
            setInteractionState([{
                isGrabbing: true,
                grabOffset,
                controller: { pointerId: event.pointerId },
                targetObject: groupRef.current,
            }]);
        }
    }, [isXRSession]);

    const handlePointerUp = useCallback((event: any) => {
        if (isXRSession) return; // Skip if XR controllers are active

        const state = interactionState.find(s => s.controller.pointerId === event.pointerId);
        if (state && groupRef.current) {
            if (isSnappable) {
                const worldPosition = new THREE.Vector3();
                groupRef.current.getWorldPosition(worldPosition);
                const snapTarget = findNearestSnapTarget(worldPosition, snapDistance);

                if (snapTarget) {
                    snapToTarget(snapTarget);
                    onSnap?.(snapTarget);
                }
            }
        }

        setInteractionState(prev => prev.filter(s => s.controller.pointerId !== event.pointerId));
    }, [isXRSession, interactionState, isSnappable, snapDistance, findNearestSnapTarget, snapToTarget, onSnap]);

    const handlePointerMove = useCallback((event: any) => {
        if (isXRSession) return; // Skip if XR controllers are active

        const state = interactionState.find(s => s.controller.pointerId === event.pointerId);
        if (state && groupRef.current) {
            const newPosition = event.point.clone().add(state.grabOffset);
            groupRef.current.position.copy(newPosition);
        }
    }, [isXRSession, interactionState]);

    // Handle click/tap for AR interactions
    const handleClick = useCallback((event: any) => {
        if (isXRSession) {
            // In AR, treat clicks as grab interactions
            onGrab?.(null); // Pass null as controller for tap interaction
        }
        event.stopPropagation();
    }, [isXRSession, onGrab]);

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onClick={handleClick}
            userData={{ isDraggable: true }}
        >
            {children}
        </group>
    );
}

// XR Snap Target Component
export function XRSnapTarget({ position, id, radius = 0.03, visible = true }: SnapTargetProps) {
    const ref = useRef<THREE.Group>(null);

    return (
        <group
            ref={ref}
            position={position}
            userData={{
                isSnapTarget: true,
                snapId: id,
                snapRadius: radius
            }}
        >
            {visible && (
                <>
                    <mesh>
                        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
                        <meshStandardMaterial
                            color="#ff4444"
                            transparent
                            opacity={0.6}
                            emissive="#ff2222"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                    <group position={[0, 0.06, 0]}>
                        <Text
                            color="white"
                            fontSize={0.02}
                            position={[0, 0, 0.01]}
                            anchorX="center"
                            anchorY="middle"
                        >
                            {`T${id.split("/")[1] || id}`}
                        </Text>
                    </group>
                </>
            )}
        </group>
    );
}

// XR Button Interaction Component
export function XRInteractiveButton({
    children,
    position,
    onPress,
    onRelease,
    pressDepth = 0.02,
}: {
    children: React.ReactNode;
    position: [number, number, number];
    onPress?: () => void;
    onRelease?: () => void;
    pressDepth?: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [isPressed, setIsPressed] = useState(false);
    const originalY = useRef(position[1]);

    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");

    // Check for controller collision (simplified)
    const checkControllerCollision = useCallback((controller: any) => {
        if (!groupRef.current || !controller) return false;

        // Simplified collision - for now just return false
        // In a real implementation, we'd need proper controller pose data
        return false;
    }, []);

    // Handle touch/click for button press
    const handleButtonClick = useCallback((event: any) => {
        setIsPressed(true);
        onPress?.();

        // Release after short delay
        setTimeout(() => {
            setIsPressed(false);
            onRelease?.();
        }, 150);

        event.stopPropagation();
    }, [onPress, onRelease]);

    // Handle button state
    useFrame(() => {
        const leftColliding = checkControllerCollision(leftController);
        const rightColliding = checkControllerCollision(rightController);
        const shouldBePressed = leftColliding || rightColliding;

        if (shouldBePressed !== isPressed) {
            setIsPressed(shouldBePressed);

            if (groupRef.current) {
                const targetY = shouldBePressed
                    ? originalY.current - pressDepth
                    : originalY.current;

                groupRef.current.position.y = THREE.MathUtils.lerp(
                    groupRef.current.position.y,
                    targetY,
                    0.1
                );
            }

            if (shouldBePressed) {
                onPress?.();
            } else {
                onRelease?.();
            }
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={handleButtonClick}
            userData={{ isInteractiveButton: true }}
        >
            {children}
        </group>
    );
}

// XR Hand Tracking Support (simplified for compatibility)
export function useXRHandTracking() {
    const xrState = useXR();

    // Simplified hand tracking - focusing on controller states
    const isHandTracking = false; // Temporarily disabled due to API compatibility

    const getHandJoint = useCallback((hand: "left" | "right", jointName: string) => {
        // Placeholder for hand joint tracking
        return null;
    }, []);

    return {
        isHandTracking,
        getHandJoint,
        leftHand: null,
        rightHand: null,
    };
}

// XR Gesture Recognition Hook (simplified)
export function useXRGestures() {
    const { isHandTracking } = useXRHandTracking();
    const [gestures] = useState<{
        leftHand: string | null;
        rightHand: string | null;
    }>({
        leftHand: null,
        rightHand: null,
    });

    // Simplified gesture detection - can be expanded later
    return gestures;
}
