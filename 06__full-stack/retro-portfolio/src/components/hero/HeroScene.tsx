'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── Particle cloud ──────────────────────────────────────────────
function Particles({ count = 2500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const clock = useRef(0)

  // Generate random positions once
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 12   // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12   // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6    // z (shallower depth)
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    clock.current += delta
    ref.current.rotation.y = clock.current * 0.04
    ref.current.rotation.x = Math.sin(clock.current * 0.02) * 0.15
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#c8f135"
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  )
}

// ── Wireframe grid plane ─────────────────────────────────────────
function GridPlane() {
  return (
    <gridHelper
      args={[20, 24, '#1a1a1a', '#1a1a1a']}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

// ── Floating wireframe torus ──────────────────────────────────────
function WireframeTorus() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.3
    ref.current.rotation.y += delta * 0.15
  })

  return (
    <mesh ref={ref} position={[2, 0, -1]}>
      <torusGeometry args={[1.4, 0.4, 12, 48]} />
      <meshBasicMaterial color="#c8f135" wireframe opacity={0.15} transparent />
    </mesh>
  )
}

// ── Scene root ────────────────────────────────────────────────────
export default function HeroScene() {
  return (
    <Canvas
      className="absolute inset-0 w-full h-full"
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.2} />
      <Particles />
      <GridPlane />
      <WireframeTorus />
    </Canvas>
  )
}