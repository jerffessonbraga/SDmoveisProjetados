import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import { FloatingCard } from "./FloatingCard";
import { ParticleField } from "./ParticleField";
import { ProjectBar } from "./ProjectBar";

const statsCards = [
  {
    position: [-3.5, 2.2, 0] as [number, number, number],
    title: "Total de Projetos",
    value: "47",
    subtitle: "+12% este mês",
    color: "#6366f1",
    icon: "📊",
    delay: 0,
  },
  {
    position: [0.5, 2.2, 0] as [number, number, number],
    title: "Clientes Ativos",
    value: "23",
    subtitle: "+5 novos",
    color: "#22d3ee",
    icon: "👥",
    delay: 1,
  },
  {
    position: [-3.5, 0.2, 0] as [number, number, number],
    title: "Faturamento",
    value: "R$ 89.5K",
    subtitle: "+18% vs anterior",
    color: "#10b981",
    icon: "💰",
    delay: 2,
  },
  {
    position: [0.5, 0.2, 0] as [number, number, number],
    title: "Taxa Conversão",
    value: "68%",
    subtitle: "+3% este mês",
    color: "#f59e0b",
    icon: "🎯",
    delay: 3,
  },
];

const projectBars = [
  { label: "Jan", value: 8, color: "#6366f1" },
  { label: "Fev", value: 12, color: "#6366f1" },
  { label: "Mar", value: 6, color: "#6366f1" },
  { label: "Abr", value: 15, color: "#22d3ee" },
  { label: "Mai", value: 10, color: "#22d3ee" },
  { label: "Jun", value: 18, color: "#10b981" },
];

export function Dashboard3DScene() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-[#0a0a14] rounded-xl overflow-hidden relative">
      {/* Overlay title */}
      <div className="absolute top-6 left-8 z-10 pointer-events-none">
        <h1 className="text-3xl font-bold text-white/90 tracking-tight">
          Dashboard 3D
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Visão interativa dos indicadores — arraste para explorar
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-8 z-10 flex gap-4 pointer-events-none">
        {[
          { color: "#6366f1", label: "Projetos" },
          { color: "#22d3ee", label: "Clientes" },
          { color: "#10b981", label: "Receita" },
          { color: "#f59e0b", label: "Conversão" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-white/50">{item.label}</span>
          </div>
        ))}
      </div>

      <Canvas
        camera={{ position: [0, 1.5, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0a0a14"]} />
        <fog attach="fog" args={["#0a0a14", 10, 25]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#c4b5fd" />
        <directionalLight position={[-5, 3, -2]} intensity={0.3} color="#22d3ee" />
        <pointLight position={[0, 4, 2]} intensity={0.5} color="#6366f1" />

        <Suspense fallback={null}>
          {/* Stats Cards */}
          {statsCards.map((card, i) => (
            <FloatingCard key={i} {...card} />
          ))}

          {/* Bar Chart */}
          <group position={[4.5, -1.5, -1]}>
            {projectBars.map((bar, i) => (
              <ProjectBar
                key={i}
                position={[i * 0.7 - 1.5, 0, 0]}
                label={bar.label}
                value={bar.value}
                maxValue={20}
                color={bar.color}
                delay={i}
              />
            ))}
          </group>

          {/* Floor grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial
              color="#0a0a14"
              transparent
              opacity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <gridHelper
            args={[30, 60, "#1a1a2e", "#1a1a2e"]}
            position={[0, -2.49, 0]}
          />

          {/* Particles */}
          <ParticleField count={300} />

          <Environment preset="night" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
