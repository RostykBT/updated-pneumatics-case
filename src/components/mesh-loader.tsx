"use client";

import { Box } from "@react-three/drei";
import { useEffect, useState } from "react";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

export interface GltfModelProps {
  gltfUrl: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export function GltfModel(props: GltfModelProps) {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      props.gltfUrl,
      (data) => setGltf(data), // Success callback
      undefined, // Progress callback (optional)
      (err) => setError(`Error loading model: ${JSON.stringify(err)}`), // Error callback
    );
  }, [props.gltfUrl]);

  if (error) {
    console.error(error);
    return (
      <mesh {...props}>
        <Box
          args={[1, 1, 1]}
          material={new THREE.MeshStandardMaterial({ color: "#FF0000" })}
        />
      </mesh>
    );
  }

  if (!gltf || !gltf.scene) {
    return (
      <mesh>
        <Box
          args={[1, 1, 1]}
          material={new THREE.MeshStandardMaterial({ color: "#FFFF00" })}
        />
      </mesh>
    );
  }

  // Apply cast and recieve shadows to all children
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.name = "GltfModel";
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={gltf.scene} {...props} />;
}
