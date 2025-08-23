"use client";

import React, { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
    PneumaticComponentState,
    PneumaticButtonState,
    PneumaticCylinderState,
    PneumaticCompressorState,
    PneumapicTubeState,
} from "@/types/PneumaticTypes";

interface ARPneumaticComponentProps {
    component: PneumaticComponentState;
    onInteraction?: (component: PneumaticComponentState, interaction: string) => void;
    onStateChange?: (component: PneumaticComponentState) => void;
    position?: [number, number, number];
    scale?: number;
}

interface ARTubeConnectionProps {
    tube: PneumapicTubeState;
    onConnect?: (from: string, to: string) => void;
    onDisconnect?: (tubeId: string) => void;
    position?: [number, number, number];
    scale?: number;
}

// Simplified AR Pneumatic Component (optimized for mobile AR)
export function ARPneumaticComponent({
    component,
    onInteraction,
    onStateChange,
    position = [0, 0, 0],
    scale = 1
}: ARPneumaticComponentProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const { session } = useXR();

    const handleClick = useCallback((event: any) => {
        event.stopPropagation();
        setIsHighlighted(!isHighlighted);
        onInteraction?.(component, "click");
    }, [component, onInteraction, isHighlighted]);

    const handlePointerOver = useCallback((event: any) => {
        event.stopPropagation();
        setIsHighlighted(true);
        setShowInfo(true);
    }, []);

    const handlePointerOut = useCallback((event: any) => {
        event.stopPropagation();
        setIsHighlighted(false);
        setShowInfo(false);
    }, []);

    // Component-specific rendering
    const renderComponent = () => {
        switch (component._kind) {
            case "compressor":
                return <ARCompressorComponent state={component as PneumaticCompressorState} onStateChange={onStateChange} />;
            case "button":
                return <ARButtonComponent state={component as PneumaticButtonState} onStateChange={onStateChange} />;
            case "cylinder":
                return <ARCylinderComponent state={component as PneumaticCylinderState} onStateChange={onStateChange} />;
            default:
                return <ARDefaultComponent state={component} />;
        }
    };

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            {/* Highlight outline */}
            {isHighlighted && (
                <mesh>
                    <sphereGeometry args={[0.2, 16, 8]} />
                    <meshBasicMaterial
                        color="#00ff88"
                        transparent
                        opacity={0.2}
                        wireframe
                    />
                </mesh>
            )}

            {renderComponent()}

            {/* Component info display */}
            {showInfo && (
                <Text
                    position={[0, 0.3, 0]}
                    fontSize={0.03}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {component._id}
                    {component.alert && `\n⚠️ ${component.alert}`}
                </Text>
            )}

            {/* Terminal indicators */}
            {Object.entries(component.terminalPressures).map(([terminalId, pressure], index) => {
                const angle = (index / Object.keys(component.terminalPressures).length) * Math.PI * 2;
                const radius = 0.15;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                return (
                    <group key={terminalId} position={[x, 0, z]}>
                        <mesh>
                            <cylinderGeometry args={[0.01, 0.01, 0.02]} />
                            <meshStandardMaterial
                                color={pressure > 0 ? "#ff4444" : "#cccccc"}
                            />
                        </mesh>
                        <Text
                            position={[0, 0.04, 0]}
                            fontSize={0.02}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {pressure.toFixed(1)}
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}

// Simplified AR Compressor Component
function ARCompressorComponent({
    state,
    onStateChange
}: {
    state: PneumaticCompressorState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    return (
        <group>
            <mesh>
                <cylinderGeometry args={[0.08, 0.08, 0.12]} />
                <meshStandardMaterial color="#444444" />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.04]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
            {/* Pressure indicator */}
            <mesh position={[0, 0.15, 0]} scale={[1, Math.max(0.1, state.terminalPressures[1] / 6), 1]}>
                <cylinderGeometry args={[0.02, 0.02, 0.06]} />
                <meshStandardMaterial color="#00ff00" transparent opacity={0.7} />
            </mesh>
        </group>
    );
}

// Simplified AR Button Component
function ARButtonComponent({
    state,
    onStateChange
}: {
    state: PneumaticButtonState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    const handleLeftPress = useCallback(() => {
        const newPressed = !state.leftPressed;
        const updatedState = { ...state, leftPressed: newPressed };
        onStateChange?.(updatedState);
    }, [state, onStateChange]);

    const handleRightPress = useCallback(() => {
        const newPressed = !state.rightPressed;
        const updatedState = { ...state, rightPressed: newPressed };
        onStateChange?.(updatedState);
    }, [state, onStateChange]);

    return (
        <group>
            {/* Valve Body */}
            <mesh>
                <boxGeometry args={[0.12, 0.08, 0.12]} />
                <meshStandardMaterial color="#888888" />
            </mesh>

            {/* Left Button */}
            <group position={[-0.05, 0.06, 0]} onClick={handleLeftPress}>
                <mesh position={[0, state.leftPressed ? -0.01 : 0, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.025]} />
                    <meshStandardMaterial color={state.leftPressed ? "#ff4444" : "#cccccc"} />
                </mesh>
            </group>

            {/* Right Button */}
            <group position={[0.05, 0.06, 0]} onClick={handleRightPress}>
                <mesh position={[0, state.rightPressed ? -0.01 : 0, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.025]} />
                    <meshStandardMaterial color={state.rightPressed ? "#ff4444" : "#cccccc"} />
                </mesh>
            </group>
        </group>
    );
}

// Simplified AR Cylinder Component
function ARCylinderComponent({
    state,
    onStateChange
}: {
    state: PneumaticCylinderState;
    onStateChange?: (component: PneumaticComponentState) => void;
}) {
    return (
        <group>
            {/* Cylinder Body */}
            <mesh>
                <cylinderGeometry args={[0.06, 0.06, 0.2]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
            {/* Piston Rod */}
            <mesh position={[0, 0.1 + state.expansion * 0.1, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.08]} />
                <meshStandardMaterial color="#cccccc" />
            </mesh>
            {/* Piston Head */}
            <mesh position={[0, 0.14 + state.expansion * 0.1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.02]} />
                <meshStandardMaterial color="#444444" />
            </mesh>
        </group>
    );
}

// Default component for unknown types
function ARDefaultComponent({ state }: { state: PneumaticComponentState }) {
    return (
        <group>
            <mesh>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            <Text
                position={[0, 0.15, 0]}
                fontSize={0.03}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                {state._kind}
            </Text>
        </group>
    );
}

// Simplified AR Tube Connection
export function ARTubeConnection({
    tube,
    onConnect,
    onDisconnect,
    position = [0, 0, 0],
    scale = 1
}: ARTubeConnectionProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    const handleClick = useCallback((event: any) => {
        event.stopPropagation();
        setIsHighlighted(!isHighlighted);
        onConnect?.(tube.from, tube.to);
    }, [tube, onConnect, isHighlighted]);

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onClick={handleClick}
            onPointerOver={() => setIsHighlighted(true)}
            onPointerOut={() => setIsHighlighted(false)}
        >
            {/* Tube representation */}
            <mesh>
                <cylinderGeometry args={[0.01, 0.01, 0.2]} />
                <meshStandardMaterial
                    color={isHighlighted ? "#00ff88" : "#444444"}
                    transparent
                    opacity={tube.residualMass > 0 ? 0.8 : 0.4}
                />
            </mesh>

            {/* Connection points */}
            <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.015]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
            <mesh position={[0, -0.1, 0]}>
                <sphereGeometry args={[0.015]} />
                <meshStandardMaterial color="#666666" />
            </mesh>

            {/* Air flow visualization */}
            {tube.residualMass > 0 && (
                <mesh>
                    <cylinderGeometry args={[0.005, 0.005, 0.18]} />
                    <meshBasicMaterial color="#88ccff" transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    );
}

// AR-specific measurement tool
export function ARMeasurementTool() {
    const [isActive, setIsActive] = useState(false);
    const [measurement, setMeasurement] = useState<number | null>(null);

    const handleToggle = useCallback(() => {
        setIsActive(!isActive);
        if (!isActive) {
            // Simulate measurement
            setMeasurement(Math.random() * 0.5);
        } else {
            setMeasurement(null);
        }
    }, [isActive]);

    return (
        <group position={[0.4, 0, 0.4]} onClick={handleToggle}>
            <mesh>
                <boxGeometry args={[0.02, 0.02, 0.1]} />
                <meshStandardMaterial color={isActive ? "#00ff00" : "#666666"} />
            </mesh>
            {measurement && (
                <Text
                    position={[0, 0.08, 0]}
                    fontSize={0.025}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {(measurement * 100).toFixed(1)} cm
                </Text>
            )}
        </group>
    );
}
