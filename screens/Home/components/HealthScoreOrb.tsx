import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Mesh } from 'three';

function Orb({ healthScore }: { healthScore: number }) {
  const meshRef = useRef<Mesh>(null!);

  // Animate the orb based on the health score
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate faster for a higher score
      meshRef.current.rotation.y += delta * (healthScore / 100);
    }
  });

  // Change color based on score
  const color = healthScore > 80 ? '#4CAF50' : healthScore > 50 ? '#FFC107' : '#F44336';

  return (
    <mesh ref={meshRef} scale={2}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

export function HealthScoreOrb({ healthScore }: { healthScore: number }) {
  return (
    <Canvas style={{ height: 200, width: 200 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Orb healthScore={healthScore} />
    </Canvas>
  );
}
