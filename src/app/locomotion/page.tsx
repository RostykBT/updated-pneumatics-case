"use client"
import { Environment, Grid } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { createXRStore, useXRInputSourceState, XR, XROrigin } from "@react-three/xr"
import { useRef } from "react"
import { Group, Vector3 } from "three"

const store = createXRStore()

export default function App() {
    return (
        <>
            {/* <button onClick={() => store.enterVR()}>Enter VR</button> */}
            <Canvas>
                <XR store={store}>
                    {/* <ambientLight /> */}
                    <Environment preset="sunset" />
                    <Locomotion />
                    <mesh scale={[1, 0.5, 1]} position={[0, 0.25, 0]}>
                        <boxGeometry />
                        <meshBasicMaterial color="red" />
                    </mesh>
                    <Grid args={[10, 10]} />
                </XR>
            </Canvas>
        </>
    )
}

function Locomotion() {
    const leftController = useXRInputSourceState('controller', 'left')
    const rightController = useXRInputSourceState('controller', 'right')
    const ref = useRef<Group>(null)
    const pivotSphereRef = useRef<Group>(null)
    const { camera } = useThree()

    useFrame((_, delta) => {
        if (ref.current == null) {
            return
        }

        // Update pivot sphere position to follow player (camera position)
        if (pivotSphereRef.current) {
            const cameraPosition = new Vector3()
            camera.getWorldPosition(cameraPosition)
            // Position sphere at camera height (player head level)
            pivotSphereRef.current.position.set(cameraPosition.x, 1.6, cameraPosition.z)
        }

        // Handle movement with left controller
        if (leftController != null) {
            const leftThumbstickState = leftController.gamepad['xr-standard-thumbstick']
            if (leftThumbstickState != null) {
                // Get thumbstick input
                const xAxis = -1 * (leftThumbstickState.xAxis ?? 0)
                const yAxis = leftThumbstickState.yAxis ?? 0

                // Apply movement if thumbstick is being used
                if (Math.abs(xAxis) >= 0.1 || Math.abs(yAxis) >= 0.1) {
                    // Get camera's forward direction (gaze direction)
                    const cameraDirection = new Vector3()
                    camera.getWorldDirection(cameraDirection)

                    // Get camera's right direction
                    const cameraRight = new Vector3()
                    cameraRight.crossVectors(camera.up, cameraDirection).normalize()

                    // Create movement vector based on thumbstick input and camera orientation
                    const moveVector = new Vector3()

                    // Forward/backward movement (yAxis) along camera's forward direction
                    // Note: yAxis is typically inverted for forward movement
                    const forwardMovement = cameraDirection.clone().multiplyScalar(-yAxis * delta)

                    // Left/right movement (xAxis) along camera's right direction
                    const rightMovement = cameraRight.clone().multiplyScalar(xAxis * delta)

                    // Combine movements
                    moveVector.add(forwardMovement).add(rightMovement)

                    // Apply movement to the XROrigin (flatten Y to prevent vertical movement)
                    moveVector.y = 0

                    ref.current.position.add(moveVector)
                }
            }
        }

        // Handle rotation with right controller
        if (rightController != null) {
            const rightThumbstickState = rightController.gamepad['xr-standard-thumbstick']
            if (rightThumbstickState != null) {
                // Get right thumbstick X-axis for rotation (left/right)
                const rotationInput = rightThumbstickState.xAxis ?? 0

                // Apply rotation if thumbstick is being used
                if (Math.abs(rotationInput) >= 0.1) {
                    // Rotation speed (radians per second)
                    const rotationSpeed = 2.0

                    // Calculate rotation amount
                    const rotationAmount = rotationInput * rotationSpeed * delta

                    // Get current camera position (player head position)
                    const cameraPosition = new Vector3()
                    camera.getWorldPosition(cameraPosition)

                    // Get current XROrigin position
                    const originPosition = new Vector3()
                    ref.current.getWorldPosition(originPosition)

                    // Calculate the offset from origin to camera (head)
                    const cameraOffset = cameraPosition.clone().sub(originPosition)

                    // To rotate around the camera position, we need to:
                    // 1. Translate the origin so camera is at the center
                    // 2. Apply rotation
                    // 3. Translate back

                    // First, move origin so camera position becomes the pivot
                    ref.current.position.add(cameraOffset)

                    // Apply the rotation
                    ref.current.rotation.y += rotationAmount

                    // Now rotate the offset vector and move origin back
                    const rotatedOffset = cameraOffset.clone()
                    rotatedOffset.applyAxisAngle(new Vector3(0, 1, 0), -rotationAmount)
                    ref.current.position.sub(rotatedOffset)
                }
            }
        }
    })
    return (
        <>
            <XROrigin ref={ref} />
            {/* Pivot point sphere that follows the player */}
            <group ref={pivotSphereRef}>
                <mesh>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="blue" />
                </mesh>
            </group>
        </>
    )
}
