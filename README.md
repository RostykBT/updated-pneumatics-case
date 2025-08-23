# AR Pneumatics Simulation

An interactive pneumatic system simulation built with Next.js, React Three Fiber, and WebXR for Augmented Reality experiences.

## 🥽 Features

- **AR Experience**: Immersive augmented reality pneumatic system visualization
- **Touch Interactions**: Tap to interact with valves, buttons, and components
- **Real-time Physics**: Live pressure simulation and air flow visualization
- **Mobile Optimized**: Designed for mobile AR experiences
- **Educational Focus**: Learn pneumatic principles through hands-on interaction

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [https://localhost:3000](https://localhost:3000) with your browser to see the result.

## 📱 Usage

1. **Desktop Version**: Visit `/desktop` for traditional 3D interaction
2. **AR Experience**: Visit `/ar` and tap "Launch AR Experience"
3. Point your device at a flat surface and tap to place components
4. Interact with pneumatic components by tapping them
5. Watch real-time pressure changes and air flow

## 🔧 AR Components

- **Air Compressor**: Generates pressurized air
- **Control Valves**: Button-operated valves to control air flow
- **Pneumatic Cylinders**: Linear actuators that extend/retract
- **Tubes**: Connect components to create pneumatic circuits
- **Measurement Tool**: Measure distances in AR space

## 📋 Requirements

- HTTPS connection (required for WebXR)
- Modern mobile browser with AR support (Chrome/Edge recommended)
- Device with camera for AR tracking
- Flat surface for AR placement

## 🛠 Technology Stack

- **Next.js 15**: React framework with App Router
- **React Three Fiber**: 3D rendering in React
- **@react-three/xr**: WebXR implementation for AR
- **@react-three/drei**: 3D utilities and helpers
- **TypeScript**: Type-safe development

## 🌐 Browser Support

- ✅ **Chrome/Edge**: Full AR support
- ✅ **Firefox**: Limited AR support
- ✅ **Safari**: WebXR polyfill required
- ✅ **Mobile Chrome**: Native AR support

## 📚 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [WebXR Device API](https://www.w3.org/TR/webxr/)
- [Three.js](https://threejs.org/docs/)

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
