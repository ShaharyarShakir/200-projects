import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { NovaHeadphones } from './NovaHeadphones'

export function ProductStoryScene({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const camTarget = useRef({ x: 0, y: 0, z: 5 })

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    // 4 stages, 0-1 mapped
    const stage = Math.min(3, Math.floor(progress * 4))
    const t = (progress * 4) % 1

    // Camera choreography
    if (progress < 0.25) {
      // Stage 1: normal
      camTarget.current = { x: 0, y: 0, z: 5 }
    } else if (progress < 0.5) {
      // Stage 2: closer
      camTarget.current = { x: 0, y: 0, z: 3.5 }
    } else if (progress < 0.75) {
      // Stage 3: offset closer
      camTarget.current = { x: 0.2, y: 0.1, z: 3.2 }
    } else {
      // Stage 4: pull back
      camTarget.current = { x: 0, y: 0, z: 4.8 }
    }

    camera.position.x += (camTarget.current.x - camera.position.x) * 0.05
    camera.position.y += (camTarget.current.y - camera.position.y) * 0.05
    camera.position.z += (camTarget.current.z - camera.position.z) * 0.05
    camera.lookAt(0, 0, 0)

    // Product choreography
    groupRef.current.rotation.y = 0.1 + Math.sin(progress * Math.PI * 2) * 0.2
    groupRef.current.position.z = progress < 0.5 ? 0 : 0.1

    // Stage 3 technical: slight separation
    if (stage === 2) {
      groupRef.current.scale.setScalar(1.1 + t * 0.05)
    } else if (stage === 3) {
      groupRef.current.scale.setScalar(1.15 - t * 0.15)
    } else {
      groupRef.current.scale.setScalar(1 + Math.sin(progress * 3) * 0.02)
    }
  })

  return (
    <group ref={groupRef}>
      <NovaHeadphones />
    </group>
  )
}
