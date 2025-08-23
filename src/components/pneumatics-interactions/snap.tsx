"use client";

import { createRef, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export function SnapBase({
    position,
    id,
}: {
    position: [number, number, number];
    id: string;
}) {
    const ref = createRef<THREE.Group>();

    return (
        <group
            userData={{ kind: "snap-base", id: id }}
            position={position}
            ref={ref}
        >
            <mesh>
                <cylinderGeometry args={[0.02, 0.02, 0.1, 32]} />
                <meshStandardMaterial color="red" transparent opacity={0.5} />
            </mesh>
            <group position={[0, 0, 0.1]}>
                <Text color="black" fontSize={0.02} position={[0, 0, 0.01]}>
                    {"T" + id.split("/")[1]}
                </Text>
            </group>
        </group>
    );
}

export function Draggable({
    downState,
    position,
    children,
    isSnappable = true,
    isRotatable = false,
}: {
    downState: React.MutableRefObject<
        | {
            pointerId: number;
            pointToObjectOffset: THREE.Vector3;
        }
        | undefined
    >;
    position: [number, number, number];
    children?: React.ReactNode;
    isSnappable?: boolean;
    isRotatable?: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const { scene } = useThree();

    return (
        <group
            userData={{
                kind: "snappable",
            }}
            onPointerDown={(e) => {
                console.log("onPointerDown");
                if (
                    ref.current != null &&
                    downState.current == null
                ) {
                    e.stopPropagation();
                    (e.target as any).setPointerCapture(e.pointerId);
                    console.log("Capture", e.point);
                    downState.current = {
                        pointerId: e.pointerId,
                        pointToObjectOffset: ref.current.position.clone().sub(e.point),
                    };
                }
            }}
            onPointerUp={(e) => {
                console.log("onPointerUp");
                if (downState.current?.pointerId != e.pointerId) {
                    return;
                }
                downState.current = undefined;

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
                    if (obj === ref.current) {
                        console.log("skipping self");
                        continue;
                    }

                    const worldPosition = new THREE.Vector3();
                    obj.getWorldPosition(worldPosition);

                    const myWorldPosition = new THREE.Vector3();
                    ref.current?.getWorldPosition(myWorldPosition);

                    const distance = worldPosition.distanceTo(myWorldPosition);

                    if (distance < closestDistance && distance < 0.1) {
                        closestDistance = distance;
                        closestObject = obj;
                    }
                }

                // Snap to the closest object
                if (closestObject && ref.current) {
                    const worldPosition = new THREE.Vector3();
                    closestObject.getWorldPosition(worldPosition);

                    // convert world position to local position
                    const parent = ref.current.parent;
                    if (parent) {
                        const localPosition = parent.worldToLocal(worldPosition.clone());
                        ref.current.position.copy(localPosition);
                    }

                    console.log("snapped");
                }
            }}
            onPointerMove={(e) => {
                if (downState.current?.pointerId != e.pointerId) {
                    return;
                }
                if (ref.current == null || downState.current == null) {
                    return;
                }

                ref.current.position.copy(
                    e.point.clone().add(downState.current.pointToObjectOffset),
                );
            }}
            position={position}
            ref={ref}
        >
            {children}
        </group>
    );
}
