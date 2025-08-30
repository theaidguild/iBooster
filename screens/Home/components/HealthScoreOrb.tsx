import React, { useRef } from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Mesh } from 'three';

function Orb({ healthScore }: { healthScore: number }) {
  const meshRef = useRef<Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (0.4 + healthScore / 200);
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  const color = healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <mesh ref={meshRef} scale={0.95}>
      <sphereGeometry args={[1, 48, 48]} />
      {/* Use a lit material so it looks like a real sphere */}
      <meshStandardMaterial
        color={color}
        metalness={0.15}
        roughness={0.35}
        emissive={color}
        emissiveIntensity={0.06}
      />
    </mesh>
  );
}

export function HealthScoreOrb({ healthScore }: { healthScore: number }) {
  return (
    <View style={styles.container}>
      <Canvas
        style={StyleSheet.absoluteFillObject}
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          const target = Math.min(1.5, Math.max(1, PixelRatio.get()));
          gl.setPixelRatio?.(target);
        }}
      >
        {/* Lights for proper shading */}
        <hemisphereLight args={['#ffffff', '#bbbbff', 0.4]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <pointLight position={[-3, -2, 4]} intensity={0.6} />

        <Orb healthScore={healthScore} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    borderRadius: 110,
    // If you see any odd cropping/“teardrop” edges, temporarily comment out overflow:
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#0b1020', // debug backdrop
  },
});
