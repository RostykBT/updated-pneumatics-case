"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { Environment, OrbitControls, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";
import ClientOnly from "@/components/ClientOnly";

// Import XR Hands and Controllers component
import { XRHandsControllers } from "@/components/pneumatics-interactions/xr-hands-controllers";

// Import old components for compatibility
import {
    PneumaticButton,
    PneumaticCompressor,
    PneumaticMuptiplier,
    PneumaticPiston
} from "@/components/pneumatics/3d-components";
import { Tube } from "@/components/pneumatics/new-tube";
import { Draggable } from "@/components/pneumatics-interactions/snap";

import {
    PneumapicTubeState,
    PneumaticComponentState,
    PneumaticButtonState,
    PneumaticCylinderState,
    PneumaticSplitterState,
    PneumaticCompressorState
} from "@/types/PneumaticTypes";
import { iterateSimulation } from "@/helpers/simulation";

const initialPneumaticComponentSet: PneumaticComponentState[] = [
    {
        _id: "Pressure source 1",
        _kind: "compressor",
        terminalPressures: { 1: 0 },
        alert: null,
        connectedTubes: [],
    },
    {
        _id: "Valve with push button 1",
        _kind: "button",
        leftPressed: false,
        rightPressed: false,
        alert: null,
        terminalPressures: { 1: 0, 2: 0, 3: 0, 4: 0 },
        connectedTubes: [],
    },
    {
        _id: "Spring loaded Single acting cylinder 1",
        _kind: "cylinder",
        expansion: 0,
        alert: null,
        terminalPressures: { 1: 0 },
        connectedTubes: [],
    },
];

const initialTubeSet: PneumapicTubeState[] = [
    { id: "tube1", from: "atmosphere", to: "atmosphere", residualMass: 0 },
    { id: "tube2", from: "atmosphere", to: "atmosphere", residualMass: 0 },
    { id: "tube3", from: "atmosphere", to: "atmosphere", residualMass: 0 },
    { id: "tube4", from: "atmosphere", to: "atmosphere", residualMass: 0 },
    { id: "tube5", from: "atmosphere", to: "atmosphere", residualMass: 0 },
    { id: "tube6", from: "atmosphere", to: "atmosphere", residualMass: 0 },
];

function PneumaticComponent({
    description,
    simulationState,
}: {
    description: PneumaticComponentState;
    simulationState: PneumaticComponentState;
}) {
    const { _id: id, _kind: kind } = description;

    switch (kind) {
        case "compressor":
            return (
                <group>
                    <PneumaticCompressor
                        id={id}
                        state={simulationState as PneumaticCompressorState}
                    />
                    <PneumaticComponentStateViz id={"1"} description={description} />
                </group>
            );

        case "button":
            return (
                <group>
                    <PneumaticButton
                        id={id}
                        state={simulationState as PneumaticButtonState}
                    />
                    <PneumaticComponentStateViz id={"2"} description={description} />
                </group>
            );

        case "cylinder":
            return (
                <group>
                    <PneumaticPiston
                        id={id}
                        state={simulationState as PneumaticCylinderState}
                    />
                    <PneumaticComponentStateViz id={"3"} description={description} />
                </group>
            );
        case "splitter":
            return (
                <group>
                    <PneumaticMuptiplier
                        id={id}
                        numberOfTerminals={3}
                        state={simulationState as PneumaticSplitterState}
                    />
                    <PneumaticComponentStateViz id={"4"} description={description} />
                </group>
            );
        default:
            return null;
    }
}

function PneumaticComponentStateViz({
    id,
    description,
}: {
    id: string;
    description: PneumaticComponentState;
}) {
    return (
        <group position={[0, 0.5, 0]}>
            <Text color="black" fontSize={0.05} position={[0, 0, 0.01]}>
                {description._id}
            </Text>
            <Text color="red" fontSize={0.03} position={[0, -0.05, 0.01]}>
                {description.alert || ""}
            </Text>
        </group>
    );
}

function SimulationRunner({
    components,
    tubes,
}: {
    components: PneumaticComponentState[];
    tubes: PneumapicTubeState[];
}) {
    useFrame(() => {
        iterateSimulation(components, tubes);
    });

    return null;
}

function SimulationInfoIndicator({ tubes }: { tubes: PneumapicTubeState[] }) {
    return (
        <group position={[0, 1, 0]}>
            <Text color="black" fontSize={0.05} position={[0, 0, 0]}>
                Tubes: {tubes.length}
            </Text>
            {tubes.map((tube, index) => (
                <Text
                    key={tube.id}
                    color="blue"
                    fontSize={0.03}
                    position={[0, -0.1 - index * 0.05, 0]}
                >
                    {tube.id}: {tube.from} → {tube.to} (mass: {tube.residualMass.toFixed(2)})
                </Text>
            ))}
        </group>
    );
}

function ConditionalOrbitControls() {
    const { session } = useXR();

    // Only enable OrbitControls when not in XR session
    if (session) return null;

    return <OrbitControls enablePan enableZoom enableRotate />;
}

function Scene() {
    const [components, setComponents] = useState(initialPneumaticComponentSet);
    const [tubes, setTubes] = useState(initialTubeSet);

    const downState = useRef<
        | {
            pointerId: number;
            pointToObjectOffset: THREE.Vector3;
        }
        | undefined
    >(undefined);

    const handleTubeUpdate = useCallback((updatedTube: PneumapicTubeState) => {
        setTubes(prev =>
            prev.map(tube =>
                tube.id === updatedTube.id ? updatedTube : tube
            )
        );
    }, []);

    return (
        <group position={[0, 1, 0]}>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* Environment */}
            <Environment preset="apartment" />

            {/* Simulation Logic */}
            <SimulationRunner components={components} tubes={tubes} />

            {/* Components */}
            <Draggable
                downState={downState}
                position={[-2, 0, 0]}
                isSnappable={true}
            >
                <PneumaticComponent
                    description={components[0]}
                    simulationState={components[0]}
                />
            </Draggable>

            <Draggable
                downState={downState}
                position={[0, 0, 0]}
                isSnappable={true}
            >
                <PneumaticComponent
                    description={components[1]}
                    simulationState={components[1]}
                />
            </Draggable>

            <Draggable
                downState={downState}
                position={[2, 0, 0]}
                isSnappable={true}
            >
                <PneumaticComponent
                    description={components[2]}
                    simulationState={components[2]}
                />
            </Draggable>

            {/* Tubes */}
            {tubes.map((tube, index) => (
                <Tube
                    key={tube.id}
                    state={tube}
                    onTubeUpdate={handleTubeUpdate}
                />
            ))}

            {/* Info Panel */}
            <SimulationInfoIndicator tubes={tubes} />

            {/* XR Hands and Controllers */}
            <XRHandsControllers />

            {/* Ground Plane - commented out for AR */}
            {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="lightgray" />
            </mesh> */}
        </group>
    );
}

export default function ARPneumaticsPage() {
    const [store, setStore] = useState<ReturnType<typeof createXRStore> | null>(null);

    // Create XR store on client side only
    useEffect(() => {
        const xrStore = createXRStore({
            hand: true,
            controller: true,
        });
        setStore(xrStore);
    }, []);

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ClientOnly>
                {store && (
                    <>
                        <Canvas
                            shadows
                            camera={{ position: [0, 2, 5], fov: 50 }}
                            gl={{ antialias: true }}
                        >
                            <XR store={store}>
                                <Scene />
                                <ConditionalOrbitControls />
                            </XR>
                        </Canvas>
                    </>
                )}
                {!store && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        fontSize: '18px'
                    }}>
                        Loading AR Experience...
                    </div>
                )}
            </ClientOnly>
        </div>
    );
}
