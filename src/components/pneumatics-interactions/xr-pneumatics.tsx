"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useXRControllerState, useXR } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
    XRDraggable,
    XRSnapTarget,
    XRInteractiveButton
} from "./modern-xr-interactions";
import { XRPhysicsObject, XRTool, XRAssemblySlot, useXRHaptics } from "./xr-physics";
import {
    PneumaticComponentState,
    PneumaticButtonState,
    PneumaticCylinderState,
    PneumaticCompressorState,
    PneumapicTubeState,
} from "@/types/PneumaticTypes";

interface XRPneumaticComponentProps {
    component: PneumaticComponentState;
    onInteraction?: (component: PneumaticComponentState, interaction: string) => void;
    onStateChange?: (component: PneumaticComponentState) => void;
}

interface XRTubeConnectionProps {
    tube: PneumapicTubeState;
    onConnect?: (from: string, to: string) => void;
    onDisconnect?: (tubeId: string) => void;
}

// XR Enhanced Pneumatic Component
export function XRPneumaticComponent({
    component,
    onInteraction,
    onStateChange
}: XRPneumaticComponentProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { playHaptic, playSuccessHaptic } = useXRHaptics();
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleGrab = useCallback((controller: any) => {
        playHaptic(controller.handedness === "left" ? "left" : "right", 0.3, 100);
        setIsHighlighted(true);
        onInteraction?.(component, "grab");
    }, [component, onInteraction, playHaptic]);

    const handleRelease = useCallback((position: THREE.Vector3) => {
        setIsHighlighted(false);
        onInteraction?.(component, "release");
    }, [component, onInteraction]);

    const handleSnap = useCallback((snapTarget: THREE.Object3D) => {
        playSuccessHaptic("left");
        playSuccessHaptic("right");
        onInteraction?.(component, "snap");
    }, [component, onInteraction, playSuccessHaptic]);

    // Component-specific interactions
    const renderComponent = () => {
        switch (component._kind) {
            case "compressor":
                return (
                    <XRCompressorComponent
                        state={component as PneumaticCompressorState}
                        onStateChange={onStateChange}
                    />
                );
            case "button":
                return (
                    <XRButtonComponent
                        state={component as PneumaticButtonState}
                        onStateChange={onStateChange}
                    />
                );
            case "cylinder":
                return (
                    <XRCylinderComponent
                        state={component as PneumaticCylinderState}
                        onStateChange={onStateChange}
                    />
                );
            default:
                return <DefaultXRComponent state={component} />;
        }
    };

    // Create snap targets for terminals
    const renderSnapTargets = () => {
        const terminals = Object.keys(component.terminalPressures);
        return terminals.map((terminalId, index) => {
            const angle = (index / terminals.length) * Math.PI * 2;
            const radius = 0.3;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return (
                <XRSnapTarget
                    key={`${component._id}-terminal-${terminalId}`}
                    position={[x, 0, z]}
                    id={`${component._id}/${terminalId}`}
                    visible={isHighlighted}
                />
            );
        });
    };

    return (
        <group ref={groupRef}>
            <XRPhysicsObject
                position={[0, 0, 0]}
                mass={2}
                friction={0.8}
            >
                <XRDraggable
                    position={[0, 0, 0]}
                    onGrab={handleGrab}
                    onRelease={handleRelease}
                    onSnap={handleSnap}
                    snapDistance={0.2}
                >
                    {renderComponent()}

                    {/* Component Info Display */}
                    {showInfo && (
                        <group position={[0, 0.5, 0]}>
                            <mesh>
                                <planeGeometry args={[0.4, 0.2]} />
                                <meshStandardMaterial
                                    color="black"
                                    transparent
                                    opacity={0.8}
                                />
                            </mesh>
                            <Text
                                position={[0, 0.05, 0.01]}
                                fontSize={0.03}
                                color="white"
                                anchorX="center"
                            >
                                {component._id}
                            </Text>
                            <Text
                                position={[0, 0, 0.01]}
                                fontSize={0.02}
                                color="cyan"
                                anchorX="center"
                            >
                                {component._kind.toUpperCase()}
                            </Text>
                            <Text
                                position={[0, -0.05, 0.01]}
                                fontSize={0.015}
                                color="yellow"
                                anchorX="center"
                            >
                                {component.alert || "Status: OK"}
                            </Text>
                        </group>
                    )}

                    {/* Pressure Visualization */}
                    {Object.entries(component.terminalPressures).map(([terminalId, pressure]) => {
                        const angle = (parseInt(terminalId) / Object.keys(component.terminalPressures).length) * Math.PI * 2;
                        const radius = 0.25;
                        const x = Math.cos(angle) * radius;
                        const z = Math.sin(angle) * radius;

                        return (
                            <group key={terminalId} position={[x, 0.1, z]}>
                                <mesh>
                                    <sphereGeometry args={[0.02, 8, 8]} />
                                    <meshStandardMaterial
                                        color={pressure > 0 ? "#ff4444" : "#444444"}
                                        emissive={pressure > 0 ? "#ff2222" : "#000000"}
                                        emissiveIntensity={pressure * 0.5}
                                    />
                                </mesh>
                                <Text
                                    position={[0, 0.04, 0]}
                                    fontSize={0.015}
                                    color="white"
                                    anchorX="center"
                                >
                                    {pressure.toFixed(1)}
                                </Text>
                            </group>
                        );
                    })}
                </XRDraggable>
            </XRPhysicsObject>

            {renderSnapTargets()}
        </group>
    );
}

// Specialized XR Components
function XRCompressorComponent({
    state,
    onStateChange
}: {
    state: PneumaticCompressorState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    const [isRunning, setIsRunning] = useState(false);
    const { playHaptic } = useXRHaptics();

    const toggleCompressor = useCallback(() => {
        setIsRunning(!isRunning);
        playHaptic("left", 0.5, 200);
        playHaptic("right", 0.5, 200);

        // Update component state
        const updatedState = { ...state };
        updatedState.terminalPressures[1] = isRunning ? 0 : 6; // Toggle pressure
        onStateChange?.(updatedState);
    }, [isRunning, state, onStateChange, playHaptic]);

    return (
        <group>
            {/* Compressor Body */}
            <mesh>
                <boxGeometry args={[0.2, 0.15, 0.2]} />
                <meshStandardMaterial
                    color={isRunning ? "#00ff00" : "#666666"}
                    emissive={isRunning ? "#004400" : "#000000"}
                />
            </mesh>

            {/* Power Button */}
            <XRInteractiveButton
                position={[0, 0.1, 0.11]}
                onPress={toggleCompressor}
                pressDepth={0.01}
            >
                <mesh>
                    <cylinderGeometry args={[0.02, 0.02, 0.02]} />
                    <meshStandardMaterial color={isRunning ? "#00ff00" : "#ff0000"} />
                </mesh>
            </XRInteractiveButton>

            {/* Running Animation */}
            {isRunning && (
                <group>
                    <pointLight color="#00ff00" intensity={0.5} distance={2} />
                    <mesh position={[0, 0.2, 0]}>
                        <sphereGeometry args={[0.01, 8, 8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </group>
            )}
        </group>
    );
}

function XRButtonComponent({
    state,
    onStateChange
}: {
    state: PneumaticButtonState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    const [leftPressed, setLeftPressed] = useState(state.leftPressed);
    const [rightPressed, setRightPressed] = useState(state.rightPressed);
    const { playHaptic } = useXRHaptics();

    const handleLeftPress = useCallback(() => {
        const newPressed = !leftPressed;
        setLeftPressed(newPressed);
        playHaptic("left", 0.7, 150);

        const updatedState = { ...state, leftPressed: newPressed };
        onStateChange?.(updatedState);
    }, [leftPressed, state, onStateChange, playHaptic]);

    const handleRightPress = useCallback(() => {
        const newPressed = !rightPressed;
        setRightPressed(newPressed);
        playHaptic("right", 0.7, 150);

        const updatedState = { ...state, rightPressed: newPressed };
        onStateChange?.(updatedState);
    }, [rightPressed, state, onStateChange, playHaptic]);

    return (
        <group>
            {/* Valve Body */}
            <mesh>
                <boxGeometry args={[0.15, 0.1, 0.15]} />
                <meshStandardMaterial color="#888888" />
            </mesh>

            {/* Left Button */}
            <XRInteractiveButton
                position={[-0.06, 0.08, 0]}
                onPress={handleLeftPress}
                pressDepth={0.02}
            >
                <mesh>
                    <cylinderGeometry args={[0.02, 0.02, 0.03]} />
                    <meshStandardMaterial color={leftPressed ? "#ff4444" : "#cccccc"} />
                </mesh>
            </XRInteractiveButton>

            {/* Right Button */}
            <XRInteractiveButton
                position={[0.06, 0.08, 0]}
                onPress={handleRightPress}
                pressDepth={0.02}
            >
                <mesh>
                    <cylinderGeometry args={[0.02, 0.02, 0.03]} />
                    <meshStandardMaterial color={rightPressed ? "#ff4444" : "#cccccc"} />
                </mesh>
            </XRInteractiveButton>
        </group>
    );
}

function XRCylinderComponent({
    state,
    onStateChange
}: {
    state: PneumaticCylinderState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    const pistonRef = useRef<THREE.Group>(null);

    // Animate piston extension
    useFrame(() => {
        if (pistonRef.current) {
            const targetExtension = state.expansion * 0.1; // Scale expansion
            pistonRef.current.position.x = THREE.MathUtils.lerp(
                pistonRef.current.position.x,
                targetExtension,
                0.1
            );
        }
    });

    return (
        <group>
            {/* Cylinder Body */}
            <mesh>
                <cylinderGeometry args={[0.04, 0.04, 0.2, 16]} />
                <meshStandardMaterial color="#4444ff" />
            </mesh>

            {/* Piston Rod */}
            <group ref={pistonRef}>
                <mesh>
                    <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
                    <meshStandardMaterial color="#888888" />
                </mesh>

                {/* Piston Head */}
                <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            </group>

            {/* Extension Indicator */}
            <Text
                position={[0, -0.15, 0]}
                fontSize={0.02}
                color="white"
                anchorX="center"
            >
                {(state.expansion * 100).toFixed(0)}%
            </Text>
        </group>
    );
}

function DefaultXRComponent({ state }: { state: PneumaticComponentState }) {
    return (
        <group>
            <mesh>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshStandardMaterial color="#888888" />
            </mesh>
            <Text
                position={[0, 0.08, 0]}
                fontSize={0.02}
                color="white"
                anchorX="center"
            >
                {state._kind}
            </Text>
        </group>
    );
}

// XR Tube Connection System
export function XRTubeConnection({
    tube,
    onConnect,
    onDisconnect
}: XRTubeConnectionProps) {
    const tubeRef = useRef<THREE.Group>(null);
    const [isBeingConnected, setIsBeingConnected] = useState(false);
    const leftController = useXRControllerState("left");
    const rightController = useXRControllerState("right");
    const { scene } = useThree();

    // Dynamic tube connection logic
    const updateTubeConnection = useCallback(() => {
        if (!tubeRef.current) return;

        // Find nearby snap targets
        let nearestTarget: THREE.Object3D | null = null;
        let nearestDistance = Infinity;

        scene.traverse((obj) => {
            if (obj.userData.isSnapTarget) {
                const distance = tubeRef.current!.position.distanceTo(obj.position);
                if (distance < nearestDistance && distance < 0.1) {
                    nearestDistance = distance;
                    nearestTarget = obj;
                }
            }
        });

        if (nearestTarget && tube.from === "atmosphere") {
            // Connect tube start
            const snapId = (nearestTarget as any).userData?.snapId;
            if (snapId) onConnect?.(snapId, tube.to);
        } else if (nearestTarget && tube.to === "atmosphere") {
            // Connect tube end
            const snapId = (nearestTarget as any).userData?.snapId;
            if (snapId) onConnect?.(tube.from, snapId);
        }
    }, [tube, onConnect, scene]);

    return (
        <group ref={tubeRef}>
            <mesh>
                <cylinderGeometry args={[0.005, 0.005, 1, 8]} />
                <meshStandardMaterial
                    color={tube.residualMass > 0 ? "#ff4444" : "#444444"}
                    emissive={tube.residualMass > 0 ? "#440000" : "#000000"}
                />
            </mesh>

            {/* Connection points */}
            <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshStandardMaterial
                    color={tube.from !== "atmosphere" ? "#00ff00" : "#ff0000"}
                />
            </mesh>

            <mesh position={[0, -0.5, 0]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshStandardMaterial
                    color={tube.to !== "atmosphere" ? "#00ff00" : "#ff0000"}
                />
            </mesh>
        </group>
    );
}
