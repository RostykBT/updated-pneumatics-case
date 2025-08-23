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
                    if (
                        ref &&
                        typeof ref === 'object' &&
                        'current' in ref &&
                        ref.current != null &&
                        downState.current == null
                    ) {
                        e.stopPropagation();
                        (e.target as any).setPointerCapture(e.pointerId);
                        downState.current = {
                            pointerId: e.pointerId,
                            pointToObjectOffset: ref.current.position.clone().sub(e.point),
                        };
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

                    // Snap to the closest object
                    if (closestObject &&
                        ref &&
                        typeof ref === 'object' &&
                        'current' in ref &&
                        ref.current) {
                        const worldPosition = new THREE.Vector3();
                        closestObject.getWorldPosition(worldPosition);

                        // convert world position to local position
                        const parent = ref.current.parent;
                        if (parent) {
                            const localPosition = parent.worldToLocal(worldPosition.clone());
                            ref.current.position.copy(localPosition);
                        }

                        console.log("snapped", closestObject.userData.id);
                        onPut(closestObject.userData.id);
                        attachmentRef.current = closestObject;
                    } else {
                        onPut(null);
                        attachmentRef.current = null;
                    }
                }}
                onPointerMove={(e) => {
                    if (downState.current?.pointerId != e.pointerId) {
                        return;
                    }
                    if (!(ref &&
                        typeof ref === 'object' &&
                        'current' in ref &&
                        ref.current != null) ||
                        downState.current == null) {
                        return;
                    }
                    ref.current.position.copy(
                        e.point.clone().add(downState.current.pointToObjectOffset),
                    );
                }}
                position={position}
            >
                <mesh ref={ref}>
                    <sphereGeometry args={[0.02]} />
                    <meshStandardMaterial color="blue" />
                </mesh>
            </group>
        );
    },
);

CableTip.displayName = "CableTip";

export function Tube({
    state,
    onTubeUpdate,
}: {
    state: PneumapicTubeState;
    onTubeUpdate: (tubeState: PneumapicTubeState) => void;
}) {
    const tip1Ref = useRef<THREE.Mesh>(null);
    const tip2Ref = useRef<THREE.Mesh>(null);

    const tip1DownState = useRef<
        | {
            pointerId: number;
            pointToObjectOffset: THREE.Vector3;
        }
        | null
    >(null);

    const tip2DownState = useRef<
        | {
            pointerId: number;
            pointToObjectOffset: THREE.Vector3;
        }
        | null
    >(null);

    const tip1AttachmentRef = useRef<THREE.Object3D | null>(null);
    const tip2AttachmentRef = useRef<THREE.Object3D | null>(null);

    const [currentState, setCurrentState] = React.useState(state);

    useFrame(() => {
        // Update tube attachment positions based on snap-bases
        if (tip1AttachmentRef.current && tip1Ref.current) {
            const worldPosition = new THREE.Vector3();
            tip1AttachmentRef.current.getWorldPosition(worldPosition);

            const parent = tip1Ref.current.parent;
            if (parent) {
                const localPosition = parent.worldToLocal(worldPosition.clone());
                tip1Ref.current.position.copy(localPosition);
            }
        }

        if (tip2AttachmentRef.current && tip2Ref.current) {
            const worldPosition = new THREE.Vector3();
            tip2AttachmentRef.current.getWorldPosition(worldPosition);

            const parent = tip2Ref.current.parent;
            if (parent) {
                const localPosition = parent.worldToLocal(worldPosition.clone());
                tip2Ref.current.position.copy(localPosition);
            }
        }
    });

    const tip1Position = tip1Ref.current?.position || new THREE.Vector3(-1, 0, 0);
    const tip2Position = tip2Ref.current?.position || new THREE.Vector3(1, 0, 0);

    const midpoint = new THREE.Vector3()
        .addVectors(tip1Position, tip2Position)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, -0.3, 0));

    return (
        <group>
            <CableTip
                ref={tip1Ref}
                downState={tip1DownState}
                attachmentRef={tip1AttachmentRef}
                position={[-1, 0, 0]}
                onPut={(id) => {
                    const newState = { ...currentState, from: id || "atmosphere" };
                    setCurrentState(newState);
                    onTubeUpdate(newState);
                }}
            />

            <CableTip
                ref={tip2Ref}
                downState={tip2DownState}
                attachmentRef={tip2AttachmentRef}
                position={[1, 0, 0]}
                onPut={(id) => {
                    const newState = { ...currentState, to: id || "atmosphere" };
                    setCurrentState(newState);
                    onTubeUpdate(newState);
                }}
            />

            <QuadraticBezierLine
                start={tip1Position}
                end={tip2Position}
                mid={midpoint}
                color={currentState.residualMass > 0.5 ? "green" : "gray"}
                lineWidth={Math.max(2, currentState.residualMass * 5)}
            />
        </group>
    );
}
