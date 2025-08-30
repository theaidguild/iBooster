import React, { useRef } from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Mesh } from 'three';

function Orb({ healthScore }: { healthScore: number }) {
  const meshRef = useRef<Mesh>(null!);

  // Gentle rotation (still rotates even for low scores)
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (0.4 + healthScore / 200);
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  const color = healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <mesh ref={meshRef} scale={1.1}>
      <sphereGeometry args={[1, 48, 48]} />
      {/* meshBasicMaterial ensures visibility even if lighting misbehaves */}
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export function HealthScoreOrb({ healthScore }: { healthScore: number }) {
  return (
    <View style={styles.container}>
      <Canvas
        // Make the GLView fill the sized container reliably on native
        style={StyleSheet.absoluteFillObject}
        // Explicit camera to ensure the sphere is in view
        camera={{ position: [0, 0, 3], fov: 50 }}
        // Smooth edges if available
        gl={{ antialias: true }}
        // Set DPR in native via onCreated (native Canvas omits the `dpr` prop)
        onCreated={({ gl }) => {
          const target = Math.min(1.5, Math.max(1, PixelRatio.get()));
          gl.setPixelRatio?.(target);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1} />
        <pointLight position={[-3, -2, 4]} intensity={0.8} />

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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#0b1020', // uncomment temporarily to verify the area
  },
});
