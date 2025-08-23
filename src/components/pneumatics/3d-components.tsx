"use client";

import { SnapBase } from "@/components/pneumatics-interactions/snap";
import React, { useState } from "react";
import * as THREE from "three";
import { GltfModel } from "@/components/mesh-loader";
import {
  PneumaticButtonState,
  PneumaticCompressorState,
  PneumaticCylinderState,
  PneumaticSplitterState,
} from "@/types/PneumaticTypes";
import { useFrame } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import { Image } from "@react-three/drei";
import { Text } from "@react-three/drei";

export function PneumaticCompressor({
  id,
  state,
}: {
  id: string;
  state: PneumaticCompressorState;
}) {
  return (
    <group>
      <mesh scale={[0.15, 0.2, 0.15]}>
        <boxGeometry />
        <meshStandardMaterial color="gray" />
      </mesh>
      <group scale={0.1} position={[0, -0.02, 0.08]} >
        <Image url="/compressor.jpg" position={[0, 0, 0]} zoom={0.8} scale={[0.5, 1.2]} transparent opacity={0.8} />
      </group>

      <Text color="black" fontSize={0.03} position={[0, 0.12, 0.05]} maxWidth={1}>
        AIR SOURCE
      </Text>

      <SnapBase position={[0, 0.1, 0]} id={`${id}/1`} />
    </group>
  );
}

export function PneumaticPiston({
  id,
  state,
}: {
  id: string;
  state: PneumaticCylinderState;
}) {
  console.log("PneumaticPiston");

  const cylinderRef = React.useRef<THREE.Group>(null);

  useFrame(() => {
    if (cylinderRef.current) {
      let expansionFraction = 0;

      if (state.expansion < 0) {
        expansionFraction = 0;
      } else if (expansionFraction >= 1) {
        expansionFraction = 1;
      } else {
        expansionFraction = state.expansion;
      }

      cylinderRef.current.position.x = -expansionFraction * 0.06;
    }
  });

  return (
    <group>
      <group
        scale={0.002}
        position={[0, -0.003, 0.005]}
        rotation={[0, 0, Math.PI]}
        ref={cylinderRef}
      >
        <GltfModel gltfUrl="/models/piston.glb" />
      </group>{" "}
      <group scale={0.3} position={[0, -0.15, -0.04]} >
        <Image url="/piston.jpg" position={[0, 0, 0]} zoom={0.8} scale={[0.5, 0.3]} transparent opacity={0.8} />
      </group>
      <group scale={0.002} rotation={[Math.PI / 2, 0, 0]}>
        <GltfModel gltfUrl="/models/cylinder.glb" />
      </group>
      <SnapBase position={[0.19, 0.08, 0]} id={`${id}/1`} />
      {/* <SnapBase position={[0.19, 0.08, 0]} id={`${id}/2`} /> */}
    </group>
  );
}

export function PneumaticButton({
  id,
  state,
}: {
  id: string;
  state: PneumaticButtonState;
}) {
  const leftButtonRef = React.useRef<THREE.Mesh>(null);
  const rightButtonRef = React.useRef<THREE.Mesh>(null);

  const [leftButtonPressed, setLeftButtonPressed] = useState(false);
  const [rightButtonPressed, setRightButtonPressed] = useState(false);

  useFrame(() => {
    if (leftButtonRef.current) {
      leftButtonRef.current.position.z = state.leftPressed ? 0.096 : 0.1;
      leftButtonRef.current.updateMatrix();
    }
    if (rightButtonRef.current) {
      rightButtonRef.current.position.z = state.rightPressed ? 0.096 : 0.1;
      rightButtonRef.current.updateMatrix();
    }
  });

  return (
    <group>
      {/* <boxGeometry args={[0.4, 0.4, 0.1]} /> */}
      <group scale={5} rotation={[Math.PI / 2, 0, 0]}>
        <GltfModel gltfUrl="/models/SAI2017.glb" />
      </group>

      {/* <group scale={0.3} position={[0.14, 0.0, -0.04]} rotation={[0, Math.PI / 2, Math.PI]}>
        <Image url="/valve1.jpg" position={[0, 0, 0]} zoom={0.8} scale={[0.5, 0.3]} transparent opacity={0.8} />
      </group>
      <group scale={0.3} position={[-0.14, 0.0, -0.04]} rotation={[0, -Math.PI / 2, Math.PI]}>
        <Image url="/valve1.jpg" position={[0, 0, 0]} zoom={0.8} scale={[0.5, 0.3]} transparent opacity={0.8} />
      </group> */}
      <group scale={0.3} position={[0, -0.15, 0.02]} rotation={[0, 0, Math.PI]}>
        <Image url="/valve1.jpg" position={[0, 0, 0]} zoom={0.8} scale={[0.5, 0.3]} transparent opacity={0.8} />
      </group>
      <Text color="black" fontSize={0.03} position={[-0.1, 0.1, 0.05]} maxWidth={1}>
        IN
      </Text>
      <Text color="black" fontSize={0.03} position={[0.1, 0.1, 0.05]} maxWidth={1}>
        IN
      </Text>
      <Text color="black" fontSize={0.03} position={[0.1, -0.1, 0.05]} maxWidth={1}>
        OUT
      </Text>
      <Text color="black" fontSize={0.03} position={[-0.1, -0.1, 0.05]} maxWidth={1}>
        OUT
      </Text>

      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[-0.1, 0.002, 0.1]}
        ref={leftButtonRef}
        onPointerEnter={() => {
          setLeftButtonPressed(true);
          state.leftPressed = true;
        }}
        onPointerLeave={() => {
          setLeftButtonPressed(false);
          console.log("onPointerLeave");
          state.leftPressed = false;
        }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.04, 32]} />
        <meshStandardMaterial color={leftButtonPressed ? "green" : "red"} />
      </mesh>

      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0.1, 0.002, 0.1]}
        ref={rightButtonRef}
        onPointerEnter={() => {
          setRightButtonPressed(true);
          state.rightPressed = true;
        }}
        onPointerLeave={() => {
          setRightButtonPressed(false);
          console.log("onPointerLeave");
          state.rightPressed = false;
        }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.04, 32]} />
        <meshStandardMaterial color={rightButtonPressed ? "green" : "red"} />
      </mesh>
      <SnapBase position={[-0.1, 0.18, -0.04]} id={`${id}/1`} />
      <SnapBase position={[0.1, 0.18, -0.04]} id={`${id}/3`} />
      <group rotation={[0, 0, Math.PI]}>
        <SnapBase position={[0.1, 0.17, -0.04]} id={`${id}/2`} />
      </group>
      <group rotation={[0, 0, Math.PI]}>
        <SnapBase position={[-0.1, 0.17, -0.04]} id={`${id}/4`} />
      </group>
    </group >
  );
}

export function PneumaticMuptiplier({
  id,
  numberOfTerminals,
  state,
}: {
  id: string;
  numberOfTerminals: number;
  state: PneumaticSplitterState;
}) {
  return (
    <group>
      <mesh>
        {/* <boxGeometry args={[numberOfTerminals * 0.1, 0.1, 0.1]} /> */}
        <meshStandardMaterial color="gray" />
        <group scale={0.01} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <GltfModel gltfUrl="/models/t-tap.glb" />
        </group>
      </mesh>
      <SnapBase position={[0, 0.22, 0]} id={`${id}/1`} />
      <group rotation={[0, 0, -Math.PI / 2]}>
        <SnapBase position={[0, 0.22, 0]} id={`${id}/2`} />
      </group>
      <group rotation={[0, 0, Math.PI / 2]}>
        <SnapBase position={[0, 0.22, 0]} id={`${id}/3`} />
      </group>
    </group>
  );
}
