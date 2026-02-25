import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface ProjectBarProps {
  position: [number, number, number];
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay?: number;
}

export function ProjectBar({
  position,
  label,
  value,
  maxValue,
  color,
  delay = 0,
}: ProjectBarProps) {
  const barRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const targetHeight = (value / maxValue) * 2.5;

  useFrame((state) => {
    if (!barRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Animate bar growing
    const progress = Math.min(1, (t - delay * 0.3) * 0.8);
    const eased = 1 - Math.pow(1 - Math.max(0, progress), 3);
    barRef.current.scale.y = eased;

    // Subtle float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + delay) * 0.05;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Bar */}
      <mesh ref={barRef} position={[0, targetHeight / 2, 0]}>
        <boxGeometry args={[0.4, targetHeight, 0.4]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.3}
          roughness={0.3}
          transparent
          opacity={0.85}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, -0.25, 0.3]}
        fontSize={0.12}
        color="#a0a0b8"
        anchorX="center"
        anchorY="middle"
        rotation={[-0.3, 0, 0]}
      >
        {label}
      </Text>

      {/* Value */}
      <Text
        position={[0, targetHeight + 0.2, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {value.toString()}
      </Text>
    </group>
  );
}
