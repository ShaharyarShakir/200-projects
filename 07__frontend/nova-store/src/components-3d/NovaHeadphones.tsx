import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function NovaHeadphones() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.05
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {/* Headband */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 8]}>
        <torusGeometry args={[0.7, 0.08, 12, 40, Math.PI]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Left ear cup */}
      <mesh position={[-0.7, 0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.18, 32]} />
        <meshStandardMaterial color="#c2c2c2" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Right ear cup */}
      <mesh position={[0.7, 0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.18, 32]} />
        <meshStandardMaterial color="#c2c2c2" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Cushions */}
      <mesh position={[-0.7, 0.2, 0.15]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.36, 0.06, 8, 24]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      <mesh position={[0.7, 0.2, 0.15]}>
        <torusGeometry args={[0.36, 0.06, 8, 24]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>

      {/* Center connector */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.3]} />
        <meshStandardMaterial color="#999" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Accent detail */}
      <mesh position={[0, 0.2, -0.15]}>
        <boxGeometry args={[0.02, 0.02, 0.1]} />
        <meshStandardMaterial color="#f0f0f0" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}
