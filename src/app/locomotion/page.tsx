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
                    <Grid />
                </XR>
            </Canvas>
        </>
    )
}

function Locomotion() {
    const controller = useXRInputSourceState('controller', 'left')
    const ref = useRef<Group>(null)
    const { camera } = useThree()

    useFrame((_, delta) => {
        if (ref.current == null || controller == null) {
            return
        }
        const thumstickState = controller.gamepad['xr-standard-thumbstick']
        if (thumstickState == null) {
            return
        }

        // Get thumbstick input
        const xAxis = -1 * (thumstickState.xAxis ?? 0)
        const yAxis = thumstickState.yAxis ?? 0

        // Skip movement if thumbstick is not being used
        if (Math.abs(xAxis) < 0.1 && Math.abs(yAxis) < 0.1) {
            return
        }

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
    })
    return <XROrigin ref={ref} />
}
