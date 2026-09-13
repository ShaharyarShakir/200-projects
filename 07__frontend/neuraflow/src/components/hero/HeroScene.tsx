import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function AiCore() {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  const { viewport } = useThree();

  // Portrait / narrow screens get a smaller core pushed above the text.
  const compact = viewport.width / viewport.height < 1.25;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;
    const anchorY = compact ? viewport.height * 0.2 : 0.28;
    const amplitude = compact ? 0.05 : 0.12;

    // Whole core: slow spin + subtle float.
    group.rotation.y += delta * 0.15;
    group.position.y = anchorY + Math.sin(time * 0.9) * amplitude;

    if (shellRef.current) {
      // Wireframe shell rotates on its own axis.
      shellRef.current.rotation.y += delta * 0.2;
      shellRef.current.rotation.z += delta * 0.06;
    }

    if (coreRef.current) {
      // Inner core breathing pulse so it feels "alive".
      const pulse = 1 + Math.sin(time * 2) * 0.04;
      coreRef.current.scale.setScalar(pulse);
    }

    if (ringARef.current) {
      ringARef.current.rotation.z += delta * 0.22;
      ringARef.current.rotation.x += delta * 0.1;
    }

    if (ringBRef.current) {
      ringBRef.current.rotation.z -= delta * 0.3;
      ringBRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef} scale={compact ? 0.5 : 0.85}>
      {/* Inner glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#6366f1"
          emissiveIntensity={1}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      {/* Wireframe lattice shell */}
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.35}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Orbit rings */}
      <mesh ref={ringARef} rotation={[Math.PI / 2.1, 0.35, 0]}>
        <torusGeometry args={[1.5, 0.018, 12, 96]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ringBRef} rotation={[Math.PI / 3, 1.1, 0]}>
        <torusGeometry args={[1.72, 0.012, 12, 96]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function HeroScene() {
  return (
    <div className="hero__scene" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <AiCore />
      </Canvas>
    </div>
  );
}

export default HeroScene;
