import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useRef } from 'react'
import { NovaHeadphones } from './NovaHeadphones'

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, 3]} intensity={0.5} color="#6666ff" />
      <pointLight position={[0, 2, 0]} intensity={0.8} />
      <NovaHeadphones />
      <Environment preset="studio" />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
