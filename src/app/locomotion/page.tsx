"use client"
import { Environment, Grid, OrbitControls, Text, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { createXRStore, useXRInputSourceState, XR, XROrigin } from "@react-three/xr"
import { useRef, Suspense } from "react"
import { Group, Vector3 } from "three"

const store = createXRStore()

// GLTF Model Component
function RuinsModel() {
    const { scene } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ruins/model.gltf')

    return (
        <primitive
            object={scene}
            scale={[1, 1, 1]}
            position={[-210, 0, 10]}
            castShadow
            receiveShadow
        />
    )
}

// Preload the model
useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/ruins/model.gltf')

export default function App() {
    return (
        <>
            <button onClick={() => store.enterVR()}>Enter VR</button>
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

                    <RuinsModel />
                    {/* <OrbitControls /> */}


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
                const rotationInput = -1 * (rightThumbstickState.xAxis ?? 0)

                // Apply rotation if thumbstick is being used
                if (Math.abs(rotationInput) >= 0.1) {
                    // Rotation speed (radians per second)
                    const rotationSpeed = 2.0

                    // Calculate rotation amount
                    const rotationAmount = rotationInput * rotationSpeed * delta

                    // Get current camera position in world space (actual head position)
                    const cameraWorldPosition = new Vector3()
                    camera.getWorldPosition(cameraWorldPosition)

                    // Store the current camera world position as our pivot point
                    const pivotPoint = cameraWorldPosition.clone()

                    // Get the current XROrigin world position
                    const originWorldPosition = new Vector3()
                    ref.current.getWorldPosition(originWorldPosition)

                    // Calculate the vector from pivot (head) to origin
                    const originToPivotVector = pivotPoint.clone().sub(originWorldPosition)

                    // Rotate this vector around Y-axis
                    const rotatedVector = originToPivotVector.clone()
                    rotatedVector.applyAxisAngle(new Vector3(0, 1, 0), rotationAmount)

                    // Calculate the new origin position
                    const newOriginPosition = pivotPoint.clone().sub(rotatedVector)

                    // Update the XROrigin position
                    ref.current.position.copy(newOriginPosition)

                    // Apply the rotation to the XROrigin
                    ref.current.rotation.y += rotationAmount
                }
            }
        }
    })
    return (
        <>
            <XROrigin ref={ref} />
            {/* Pivot point sphere that follows the player */}
        </>
    )
}





