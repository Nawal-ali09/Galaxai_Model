import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function AvatarParticles({ nodes }) {
  const particlesRef = useRef([]);
  const circleTexture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/sprites/circle.png"
  );

  // === Increase particle density on shoulders and chest ===
  useEffect(() => {
    const body = nodes.Wolf3D_Body.geometry;
    const posAttr = body.attributes.position;
    const original = posAttr.array;
    const upperPoints = [];

    // duplicate points where Y > 0.05 (shoulder/chest area)
    for (let i = 0; i < original.length; i += 3) {
      const x = original[i];
      const y = original[i + 1];
      const z = original[i + 2];

      if (y > 0.05) {
        for (let j = 0; j < 3; j++) {
          upperPoints.push(
            x + (Math.random() - 0.5) * 0.003,
            y + (Math.random() - 0.5) * 0.003,
            z + (Math.random() - 0.5) * 0.003
          );
        }
      }
    }

    // merge new points with original geometry
    const newPositions = new Float32Array([...original, ...upperPoints]);
    body.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
  }, [nodes]);

  // Store original geometry positions for breathing effect
  useEffect(() => {
    particlesRef.current = [
      nodes.Wolf3D_Body,
      nodes.Wolf3D_Outfit_Bottom,
      nodes.Wolf3D_Outfit_Footwear,
      nodes.Wolf3D_Outfit_Top,
      nodes.Wolf3D_Hair,
      nodes.Wolf3D_Head,
      nodes.Wolf3D_Teeth,
      nodes.EyeLeft,
      nodes.EyeRight,
    ].map((part) => part.geometry.attributes.position.array.slice());
  }, [nodes]);

  // Apply breathing motion
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    particlesRef.current.forEach((original, idx) => {
      const part = [
        nodes.Wolf3D_Body,
        nodes.Wolf3D_Outfit_Bottom,
        nodes.Wolf3D_Outfit_Footwear,
        nodes.Wolf3D_Outfit_Top,
        nodes.Wolf3D_Hair,
        nodes.Wolf3D_Head,
        nodes.Wolf3D_Teeth,
        nodes.EyeLeft,
        nodes.EyeRight,
      ][idx];

      const positions = part.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 10) {
        positions[i] = original[i] + 0.002 * Math.sin(time + i * 0.01);
        positions[i + 1] = original[i + 1] + 0.002 * Math.sin(time + i * 0.01);
        positions[i + 2] = original[i + 2] + 0.002 * Math.sin(time + i * 0.01);
      }
      part.geometry.attributes.position.needsUpdate = true;
    });
  });

  // Render particles
  return (
    <>
      {[
        nodes.Wolf3D_Body,
        nodes.Wolf3D_Outfit_Bottom,
        nodes.Wolf3D_Outfit_Footwear,
        nodes.Wolf3D_Outfit_Top,
        nodes.Wolf3D_Hair,
        nodes.Wolf3D_Head,
        nodes.Wolf3D_Teeth,
        nodes.EyeLeft,
        nodes.EyeRight,
      ].map((part, i) => (
        <points
          key={i}
          geometry={part.geometry}
          skeleton={part.skeleton}
          morphTargetDictionary={part.morphTargetDictionary}
          morphTargetInfluences={part.morphTargetInfluences}
        >
          <pointsMaterial
            size={0.001}
            color="#ffffff"
            transparent
            opacity={1.0}
            depthWrite={false}
            alphaMap={circleTexture}
            alphaTest={0.1}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}
