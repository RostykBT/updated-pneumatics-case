"use client";

import React, { useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import ClientOnly from "@/components/ClientOnly";

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
import { useFrame } from "@react-three/fiber";
import Link from "next/link";

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
                {description.alert}
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
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* Environment */}
            <Environment preset="studio" />

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

            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="lightgreen" />
            </mesh>
        </>
    );
}

export default function DesktopPneumaticsPage() {
    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                zIndex: 1000,
                display: "flex",
                gap: "10px"
            }}>
                <Link
                    href="/"
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "5px"
                    }}
                >
                    ← Home
                </Link>
                <Link
                    href="/ar"
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#ff6b6b",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "5px"
                    }}
                >
                    AR Mode
                </Link>
            </div>

            <ClientOnly>
                <Canvas
                    shadows
                    camera={{ position: [0, 2, 5], fov: 50 }}
                    gl={{ antialias: true }}
                >
                    <Scene />
                    <OrbitControls enablePan enableZoom enableRotate />
                </Canvas>
            </ClientOnly>
        </div>
    );
}
