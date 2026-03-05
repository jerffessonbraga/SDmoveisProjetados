import { ReactNode, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function Card3D({ children, className = "", intensity = 8 }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const isMobile = useIsMobile();

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      setStyle({
        transform: `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(10px)`,
        boxShadow: `${-x * 20}px ${y * 20}px 40px hsl(43 74% 52% / 0.08), 0 8px 24px hsl(0 0% 0% / 0.06)`,
      });
    },
    [intensity, isMobile]
  );

  const handleLeave = useCallback(() => {
    if (isMobile) return;
    setStyle({
      transform: "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)",
      boxShadow: "0 4px 12px hsl(0 0% 0% / 0.05)",
    });
  }, [isMobile]);

  // On mobile, render children directly without 3D transforms
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 ease-out ${className}`}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}
