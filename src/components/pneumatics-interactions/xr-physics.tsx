"use client";

import React, { useRef, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useXRControllerState, useXR } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface XRPhysicsProps {
    children: React.ReactNode;
    position: [number, number, number];
    mass?: number;
    friction?: number;
    restitution?: number;
    onCollision?: (other: THREE.Object3D) => void;
}

interface XRGrabConstraintProps {
    object: THREE.Object3D;
    controller: any;
    grabPoint: THREE.Vector3;
    stiffness?: number;
    damping?: number;
}

// Advanced XR Physics Object
export function XRPhysicsObject({
    children,
    position,
    mass = 1,
    friction = 0.6,
    restitution = 0.4,
    onCollision,
}: XRPhysicsProps) {
    const groupRef = useRef<THREE.Group>(null);
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const angularVelocity = useRef(new THREE.Vector3(0, 0, 0));
    const [isGrabbed, setIsGrabbed] = useState(false);
    const lastPosition = useRef(new THREE.Vector3(...position));

    // Apply physics simulation
    useFrame((state, delta) => {
        if (!groupRef.current || isGrabbed) return;

        // Apply gravity
        const gravity = new THREE.Vector3(0, -9.81 * mass, 0);
        velocity.current.add(gravity.clone().multiplyScalar(delta));

        // Apply drag
        const dragForce = velocity.current.clone().multiplyScalar(-friction);
        velocity.current.add(dragForce.multiplyScalar(delta));

        // Update position
        const deltaPosition = velocity.current.clone().multiplyScalar(delta);
        groupRef.current.position.add(deltaPosition);

        // Ground collision
        if (groupRef.current.position.y <= 0) {
            groupRef.current.position.y = 0;
            velocity.current.y = Math.abs(velocity.current.y * restitution);

            // Apply friction when on ground
            velocity.current.x *= (1 - friction * delta);
            velocity.current.z *= (1 - friction * delta);
        }

        lastPosition.current.copy(groupRef.current.position);
    });

    return (
        <group
            ref={groupRef}
            position={position}
            userData={{
                isPhysicsObject: true,
                mass,
                friction,
                restitution,
                setIsGrabbed
            }}
        >
            {children}
        </group>
    );
}

// XR Constraint System for realistic grabbing
export function XRGrabConstraint({
    object,
    controller,
    grabPoint,
    stiffness = 100,
    damping = 10,
}: XRGrabConstraintProps) {
    useFrame(() => {
        if (!controller?.controller || !object) return;

        const controllerPosition = new THREE.Vector3();
        controller.controller.getWorldPosition(controllerPosition);

        const targetPosition = controllerPosition.add(grabPoint);
        const currentPosition = object.position.clone();

        // Calculate constraint force
        const displacement = targetPosition.sub(currentPosition);
        const velocity = object.userData.velocity || new THREE.Vector3();

        const force = displacement
            .multiplyScalar(stiffness)
            .sub(velocity.clone().multiplyScalar(damping));

        // Apply force to object
        if (object.userData.setVelocity) {
            object.userData.setVelocity(force);
        }
    });

    return null;
}

// XR Tool System
interface XRToolProps {
    children: React.ReactNode;
    toolType: 'hammer' | 'screwdriver' | 'wrench' | 'pliers';
    onUse?: (target: THREE.Object3D, force: number) => void;
}

export function XRTool({ children, toolType, onUse }: XRToolProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useThree();
    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");

    const [isInUse, setIsInUse] = useState(false);
    const lastControllerPosition = useRef(new THREE.Vector3());

    // Check for tool use
    useFrame(() => {
        if (!groupRef.current) return;

        const checkToolUse = (controller: any) => {
            if (!controller?.inputSource?.gamepad) return;

            const triggerPressed = controller.inputSource.gamepad.buttons[0]?.pressed;

            if (triggerPressed && !isInUse) {
                setIsInUse(true);

                // Calculate force based on movement
                const currentPosition = new THREE.Vector3();
                controller.controller.getWorldPosition(currentPosition);

                const force = currentPosition.distanceTo(lastControllerPosition.current);

                // Find nearby objects to interact with
                const toolPosition = new THREE.Vector3();
                if (groupRef.current) {
                    groupRef.current.getWorldPosition(toolPosition);
                }

                scene.traverse((obj) => {
                    if (obj !== groupRef.current && obj.userData.isInteractable) {
                        const objPosition = new THREE.Vector3();
                        obj.getWorldPosition(objPosition);

                        if (toolPosition.distanceTo(objPosition) < 0.2) {
                            onUse?.(obj, force);
                        }
                    }
                });

                lastControllerPosition.current.copy(currentPosition);
            } else if (!triggerPressed && isInUse) {
                setIsInUse(false);
            }
        };

        checkToolUse(leftController);
        checkToolUse(rightController);
    });

    return (
        <group
            ref={groupRef}
            userData={{
                isTool: true,
                toolType,
                isInUse
            }}
        >
            {children}
            {isInUse && (
                <pointLight
                    color="#ffff00"
                    intensity={0.5}
                    distance={1}
                    decay={2}
                />
            )}
        </group>
    );
}

// XR Assembly System
interface XRAssemblySlotProps {
    position: [number, number, number];
    acceptedTypes: string[];
    onAssemble?: (component: THREE.Object3D) => void;
    onDisassemble?: (component: THREE.Object3D) => void;
}

export function XRAssemblySlot({
    position,
    acceptedTypes,
    onAssemble,
    onDisassemble,
}: XRAssemblySlotProps) {
    const slotRef = useRef<THREE.Group>(null);
    const [assembledComponent, setAssembledComponent] = useState<THREE.Object3D | null>(null);
    const { scene } = useThree();

    useFrame(() => {
        if (!slotRef.current) return;

        const slotPosition = new THREE.Vector3();
        slotRef.current.getWorldPosition(slotPosition);

        // Check for components near the slot
        scene.traverse((obj) => {
            if (obj.userData.isAssemblyComponent && acceptedTypes.includes(obj.userData.componentType)) {
                const objPosition = new THREE.Vector3();
                obj.getWorldPosition(objPosition);

                const distance = slotPosition.distanceTo(objPosition);

                // Assemble component
                if (distance < 0.1 && !assembledComponent) {
                    setAssembledComponent(obj);
                    onAssemble?.(obj);

                    // Snap to slot position
                    if (obj.parent) {
                        const localPosition = obj.parent.worldToLocal(slotPosition.clone());
                        obj.position.copy(localPosition);
                    }
                }

                // Disassemble if pulled away
                if (distance > 0.2 && assembledComponent === obj) {
                    setAssembledComponent(null);
                    onDisassemble?.(obj);
                }
            }
        });
    });

    return (
        <group
            ref={slotRef}
            position={position}
            userData={{
                isAssemblySlot: true,
                acceptedTypes,
                isOccupied: !!assembledComponent
            }}
        >
            <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
                <meshStandardMaterial
                    color={assembledComponent ? "#00ff00" : "#ffff00"}
                    transparent
                    opacity={0.7}
                />
            </mesh>
            <Text
                position={[0, 0.08, 0]}
                fontSize={0.02}
                color="white"
                anchorX="center"
            >
                {acceptedTypes.join('/')}
            </Text>
        </group>
    );
}

// XR Measurement Tool
export function XRMeasurementTool() {
    const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
    const [isActive, setIsActive] = useState(false);
    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");

    const addMeasurePoint = useCallback((controller: any) => {
        if (!controller?.controller) return;

        const position = new THREE.Vector3();
        controller.controller.getWorldPosition(position);

        setMeasurePoints(prev => [...prev, position]);

        if (measurePoints.length >= 1) {
            const distance = measurePoints[0].distanceTo(position);
            console.log(`Measured distance: ${distance.toFixed(3)}m`);
        }
    }, [measurePoints]);

    useFrame(() => {
        const checkMeasurement = (controller: any) => {
            if (!controller?.inputSource?.gamepad) return;

            const buttonPressed = controller.inputSource.gamepad.buttons[3]?.pressed; // Y/X button

            if (buttonPressed && !isActive) {
                setIsActive(true);
                addMeasurePoint(controller);
            } else if (!buttonPressed && isActive) {
                setIsActive(false);
            }
        };

        checkMeasurement(leftController);
        checkMeasurement(rightController);
    });

    return (
        <group>
            {measurePoints.map((point, index) => (
                <group key={index} position={point.toArray()}>
                    <mesh>
                        <sphereGeometry args={[0.01, 8, 8]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                    <Text
                        position={[0, 0.03, 0]}
                        fontSize={0.015}
                        color="red"
                        anchorX="center"
                    >
                        {index + 1}
                    </Text>
                </group>
            ))}

            {measurePoints.length >= 2 && (
                <mesh>
                    <cylinderGeometry
                        args={[0.001, 0.001, measurePoints[0].distanceTo(measurePoints[measurePoints.length - 1]), 8]}
                    />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
            )}
        </group>
    );
}

// XR Haptic Feedback Hook
export function useXRHaptics() {
    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");

    const playHaptic = useCallback((
        hand: "left" | "right",
        intensity: number = 0.5,
        duration: number = 100
    ) => {
        const controller = hand === "left" ? leftController : rightController;

        if (controller?.inputSource?.gamepad?.hapticActuators?.[0]) {
            controller.inputSource.gamepad.hapticActuators[0].playEffect("dual-rumble", {
                duration,
                strongMagnitude: intensity,
                weakMagnitude: intensity * 0.7,
            });
        }
    }, [leftController, rightController]);

    const playCollisionHaptic = useCallback((hand: "left" | "right", force: number) => {
        const intensity = Math.min(force * 0.3, 1.0);
        const duration = Math.min(force * 50, 300);
        playHaptic(hand, intensity, duration);
    }, [playHaptic]);

    const playSuccessHaptic = useCallback((hand: "left" | "right") => {
        playHaptic(hand, 0.8, 200);
    }, [playHaptic]);

    return {
        playHaptic,
        playCollisionHaptic,
        playSuccessHaptic,
    };
}
