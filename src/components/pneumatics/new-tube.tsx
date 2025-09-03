"use client";

import { useThree } from "@react-three/fiber";
import React from "react";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { QuadraticBezierLine } from "@react-three/drei";
import {
    PneumapicTubeState,
    PneumaticComponentState,
} from "@/types/PneumaticTypes";

// Helper to check if event is from XR (similar to legacy isXIntersection)
const isXREvent = (e: any) => {
    // In the new XR system, we can check for XR-specific properties
    return e.nativeEvent && (e.nativeEvent.inputSource || e.nativeEvent.hand);
};

const CableTip = React.forwardRef<THREE.Mesh, {
    downState: React.MutableRefObject<{
        pointerId: number;
        pointToObjectOffset: THREE.Vector3;
    } | null>;
    attachmentRef: React.MutableRefObject<THREE.Object3D | null>;
    position: [number, number, number];
    onPut: (id: string | null) => void;
}>(
    (
        {
            downState,
            attachmentRef,
            position,
            onPut,
        },
        ref,
    ) => {
        const { scene } = useThree();

        return (
            <group
                userData={{
                    kind: "snap-tag",
                }}
                onPointerDown={(e) => {
                    // Skip if basic conditions aren't met
                    if (
                        !ref ||
                        typeof ref !== 'object' ||
                        !('current' in ref) ||
                        !ref.current ||
                        downState.current !== null
                    ) {
                        return;
                    }

                    // Additional check for valid point data
                    if (!e.point || typeof e.point !== 'object') {
                        return;
                    }

                    try {
                        e.stopPropagation();
                        (e.target as any).setPointerCapture(e.pointerId);

                        // Create a safe Vector3 from the event point
                        let eventPoint: THREE.Vector3;
                        if (e.point instanceof THREE.Vector3) {
                            eventPoint = e.point.clone();
                        } else if (e.point && typeof e.point === 'object') {
                            const point = e.point as any;
                            eventPoint = new THREE.Vector3(
                                Number(point.x) || 0,
                                Number(point.y) || 0,
                                Number(point.z) || 0
                            );
                        } else {
                            console.warn('Invalid point data in pointer down event');
                            return;
                        }

                        downState.current = {
                            pointerId: e.pointerId,
                            pointToObjectOffset: ref.current.position.clone().sub(eventPoint),
                        };
                    } catch (error) {
                        console.warn('Error in pointer down:', error);
                        return;
                    }
                }}
                onPointerUp={(e) => {
                    if (downState.current?.pointerId != e.pointerId) {
                        onPut(null);
                        attachmentRef.current = null;
                        return;
                    }

                    downState.current = null;

                    // Check if there are any snappable objects in the scene by traversing closer than 0.1 units
                    const snappableObjects: THREE.Object3D[] = [];

                    scene.traverse((obj) => {
                        if (obj.userData.kind === "snap-base") {
                            snappableObjects.push(obj);
                        }
                    });

                    // Find the closest snappable object
                    let closestObject: THREE.Object3D | undefined;
                    let closestDistance = Infinity;

                    for (const obj of snappableObjects) {
                        if (ref &&
                            typeof ref === 'object' &&
                            'current' in ref &&
                            obj === ref.current) {
                            console.log("skipping self");
                            continue;
                        }

                        const worldPosition = new THREE.Vector3();
                        obj.getWorldPosition(worldPosition);

                        const myWorldPosition = new THREE.Vector3();
                        if (ref &&
                            typeof ref === 'object' &&
                            'current' in ref) {
                            ref.current?.getWorldPosition(myWorldPosition);
                        }

                        const distance = worldPosition.distanceTo(myWorldPosition);
                        console.log("distance", distance);

                        if (distance < closestDistance && distance < 0.3) {
                            closestDistance = distance;
                            closestObject = obj;
                        }
                    }

                    // Snap to the closest object (Legacy style - direct attachment)
                    if (closestObject) {
                        console.log("Attaching to", closestObject);
                        attachmentRef.current = closestObject;
                        onPut(closestObject.userData.id || null);
                    } else {
                        console.log("Not attaching to anything");
                        attachmentRef.current = null;
                        onPut(null);
                    }
                }}
                onPointerMove={(e) => {
                    // Skip if basic conditions aren't met
                    if (
                        !ref ||
                        typeof ref !== 'object' ||
                        !('current' in ref) ||
                        !ref.current ||
                        !downState.current ||
                        e.pointerId !== downState.current.pointerId
                    ) {
                        return;
                    }

                    // Additional check for valid point data
                    if (!e.point || typeof e.point !== 'object') {
                        return;
                    }

                    try {
                        // Legacy style movement - direct position copy with offset
                        // Create a safe Vector3 from the event point
                        let eventPoint: THREE.Vector3;
                        if (e.point instanceof THREE.Vector3) {
                            eventPoint = e.point.clone();
                        } else if (e.point && typeof e.point === 'object') {
                            const point = e.point as any;
                            eventPoint = new THREE.Vector3(
                                Number(point.x) || 0,
                                Number(point.y) || 0,
                                Number(point.z) || 0
                            );
                        } else {
                            console.warn('Invalid point data in pointer move event');
                            return;
                        }

                        // Ensure we have valid offset
                        if (!downState.current.pointToObjectOffset ||
                            !(downState.current.pointToObjectOffset instanceof THREE.Vector3)) {
                            console.warn('Invalid pointToObjectOffset');
                            return;
                        }

                        ref.current.position
                            .copy(downState.current.pointToObjectOffset)
                            .add(eventPoint);
                    } catch (error) {
                        console.warn('Error in pointer move:', error);
                        return;
                    }
                }}
                position={
                    Array.isArray(position) && position.length >= 3
                        ? [position[0] || 0, (position[1] || 0) + 1, (position[2] || 0) + 1]
                        : [0, 1, 1]
                }
            >
                {/* Legacy style cable tip - cylindrical blue connector */}
                <mesh
                    ref={ref}
                    position={[0, 0.1, 0]}
                    userData={{ kind: "snap-tag" }}
                >
                    <cylinderGeometry args={[0.04, 0.04, 0.15, 32]} />
                    <meshStandardMaterial color="blue" transparent opacity={0.5} />
                </mesh>
            </group>
        );
    },
);

CableTip.displayName = "CableTip";

// Legacy-style Tube component (matching ivar-pneumatics exactly)
export function Tube({
    downState,
    position,
    id,
    simulationState,
}: {
    downState: React.MutableRefObject<{
        pointerId: number;
        pointToObjectOffset: THREE.Vector3;
    } | null>;
    position: [number, number, number];
    id: string;
    simulationState: PneumapicTubeState;
}) {
    const ref1 = useRef<THREE.Mesh>(null);
    const ref2 = useRef<THREE.Mesh>(null);
    const { scene } = useThree();

    const ref1AttachedTo = useRef<THREE.Object3D | null>(null);
    const ref2AttachedTo = useRef<THREE.Object3D | null>(null);

    const v1 = new THREE.Vector3(0, 1, 0);
    const v1Orientation = new THREE.Vector3(0, 2, 0);

    const v2 = new THREE.Vector3(0, 1, 0);
    const v2Orientation = new THREE.Vector3(0, 2, 0);

    console.log("Rebuilding tube", id);

    useFrame(() => {
        ref1.current?.getWorldPosition(v1);
        ref1.current?.getWorldDirection(v1Orientation);

        ref2.current?.getWorldPosition(v2);
        ref2.current?.getWorldDirection(v2Orientation);

        // Legacy style attachment handling with world position/quaternion
        if (ref1AttachedTo.current && ref1.current) {
            const baseWorldPosition = new THREE.Vector3();
            const baseWorldQuaternion = new THREE.Quaternion();

            ref1AttachedTo.current.getWorldPosition(baseWorldPosition);
            ref1AttachedTo.current.getWorldQuaternion(baseWorldQuaternion);

            const baseWorldEuler = new THREE.Euler();
            baseWorldEuler.setFromQuaternion(baseWorldQuaternion);

            ref1.current.rotation.copy(baseWorldEuler);
            ref1.current.updateMatrixWorld();

            ref1.current.position
                .copy(baseWorldPosition)
                .add(new THREE.Vector3(0, 0, 0));
        } else if (ref1.current) {
            ref1.current.rotation.set(0, Math.PI / 6, 0);
            ref1.current.updateMatrixWorld();
        }

        if (ref2AttachedTo.current && ref2.current) {
            const baseWorldPosition = new THREE.Vector3();
            const baseWorldQuaternion = new THREE.Quaternion();

            ref2AttachedTo.current.getWorldPosition(baseWorldPosition);
            ref2AttachedTo.current.getWorldQuaternion(baseWorldQuaternion);

            const baseWorldEuler = new THREE.Euler();
            baseWorldEuler.setFromQuaternion(baseWorldQuaternion);

            ref2.current.rotation.copy(baseWorldEuler);

            ref2.current.position
                .copy(baseWorldPosition)
                .add(new THREE.Vector3(0, 0, 0));

            ref2.current.updateMatrixWorld();
        } else if (ref2.current) {
            ref2.current.rotation.set(0, Math.PI / 6, 0);
            ref2.current.updateMatrixWorld();
        }
    });

    return (
        <group position={position}>
            <CableTip
                ref={ref1}
                attachmentRef={ref1AttachedTo}
                downState={downState}
                position={position}
                onPut={(id) => {
                    simulationState.from = id || "atmosphere";
                }}
            />
            <CableTip
                ref={ref2}
                attachmentRef={ref2AttachedTo}
                downState={downState}
                position={position}
                onPut={(id) => {
                    simulationState.to = id || "atmosphere";
                }}
            />

            <Cable start={ref1} end={ref2} v1={v1} v2={v2} simulationState={simulationState} />
        </group>
    );
}

function Cable({
    start,
    end,
    v1 = new THREE.Vector3(),
    v2 = new THREE.Vector3(),
    simulationState,
}: {
    start: React.RefObject<THREE.Mesh | null>;
    end: React.RefObject<THREE.Mesh | null>;
    v1?: THREE.Vector3;
    v2?: THREE.Vector3;
    simulationState: PneumapicTubeState | undefined;
}) {
    const [startPos, setStartPos] = React.useState(new THREE.Vector3());
    const [endPos, setEndPos] = React.useState(new THREE.Vector3());
    const [midPos, setMidPos] = React.useState(new THREE.Vector3());

    useFrame(() => {
        if (start.current && end.current) {
            const tempV1 = new THREE.Vector3();
            const tempV2 = new THREE.Vector3();

            const newStartPos = start.current.getWorldPosition(tempV1);
            const newEndPos = end.current.getWorldPosition(tempV2);

            setStartPos(newStartPos.clone());
            setEndPos(newEndPos.clone());

            // Calculate midpoint with sag for legacy style
            const newMidPos = new THREE.Vector3()
                .addVectors(newStartPos, newEndPos)
                .multiplyScalar(0.5)
                .add(new THREE.Vector3(0, -0.3, 0));
            setMidPos(newMidPos);
        }
    });

    return (
        <QuadraticBezierLine
            start={startPos}
            end={endPos}
            mid={midPos}
            lineWidth={3}
            color={simulationState?.residualMass && simulationState.residualMass > 0.5 ? "#00ff00" : "#ff2060"}
        />
    );
}

// Modern wrapper component for compatibility with current app structure
export function ModernTubeWrapper({
    state,
    onTubeUpdate,
}: {
    state: PneumapicTubeState;
    onTubeUpdate: (tubeState: PneumapicTubeState) => void;
}) {
    const downState = useRef<{
        pointerId: number;
        pointToObjectOffset: THREE.Vector3;
    } | null>(null);

    const [currentState, setCurrentState] = React.useState(state);

    React.useEffect(() => {
        setCurrentState(state);
    }, [state]);

    const handleStateUpdate = React.useCallback(() => {
        onTubeUpdate(currentState);
    }, [currentState, onTubeUpdate]);

    React.useEffect(() => {
        handleStateUpdate();
    }, [currentState, handleStateUpdate]);

    return (
        <Tube
            downState={downState}
            position={[0, 0, 0]}
            id={currentState.id}
            simulationState={currentState}
        />
    );
}
