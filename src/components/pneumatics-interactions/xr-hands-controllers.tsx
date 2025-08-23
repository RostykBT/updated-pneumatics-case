"use client";

import React from "react";
import { useXR } from "@react-three/xr";
import dynamic from "next/dynamic";

// Combined XR Hands and Controllers component using latest API
function XRHandsControllersInternal() {
    // When using the latest @react-three/xr API with createXRStore({ hand: true, controller: true }),
    // hands and controllers are automatically rendered by the XR system.
    // This component can be used for additional customizations or debugging.

    return (
        <group>
            {/* 
            Controllers and Hands are now automatically handled by the XR store configuration.
            The store.hand and store.controller options in the AR page enable:
            - Automatic hand tracking visualization
            - Automatic controller models
            - Built-in ray casting and interactions
            
            No manual implementation needed!
            */}
        </group>
    );
}

// Export with dynamic import to prevent SSR issues
export const XRHandsControllers = dynamic(() => Promise.resolve(XRHandsControllersInternal), {
    ssr: false,
});