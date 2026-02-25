import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface FloatingCardProps {
  position: [number, number, number];
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
  delay?: number;
}

export function FloatingCard({
  position,
  title,
  value,
  subtitle,
  color,
  icon,
  delay = 0,
}: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + delay;
    
    // Floating animation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;
    
    // Subtle rotation
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;

    // Scale on hover
    const targetScale = hovered ? 1.08 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card body */}
      <RoundedBox args={[2.8, 1.6, 0.12]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          color={hovered ? "#2a2a3a" : "#1e1e2e"}
          metalness={0.1}
          roughness={0.4}
          transparent
          opacity={0.92}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>

      {/* Glow edge */}
      <RoundedBox args={[2.84, 1.64, 0.08]} radius={0.09} smoothness={4} position={[0, 0, -0.03]}>
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.4 : 0.15} />
      </RoundedBox>

      {/* Icon circle */}
      <mesh position={[-0.9, 0.25, 0.08]}>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <Text
        position={[-0.9, 0.25, 0.1]}
        fontSize={0.22}
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>

      {/* Title */}
      <Text
        position={[-0.2, 0.35, 0.08]}
        fontSize={0.13}
        color="#a0a0b8"
        anchorX="left"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
      >
        {title}
      </Text>

      {/* Value */}
      <Text
        position={[-0.2, 0.0, 0.08]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
      >
        {value}
      </Text>

      {/* Subtitle */}
      <Text
        position={[-0.2, -0.35, 0.08]}
        fontSize={0.11}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {subtitle}
      </Text>

      {/* Accent line */}
      <mesh position={[0, -0.7, 0.07]}>
        <planeGeometry args={[2.4, 0.025]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
