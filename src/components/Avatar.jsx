import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useControls } from "leva";
import React, { useEffect, useMemo, useRef, useState } from "react";


import * as THREE from "three";

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar(props) {
  const {
    playAudio,
    script,
    headFollow,
    smoothMorphTarget,
    morphTargetSmoothing,
  } = useControls({
    playAudio: false,
    headFollow: true,
    script: {
      value: "HelloGalax",
      options: ["HelloGalax", "AboutGalax"],
    },
  });

  const audio = useMemo(() => new Audio(`/audios/${script}.mp3`), [script]);
  const jsonFile = useLoader(THREE.FileLoader, `audios/${script}.json`);
  const lipsync = JSON.parse(jsonFile);

  const group = useRef();
  const particlesRef = useRef([]);

  const { nodes, materials } = useGLTF("/models/646d9dcdc8a5f5bddbfac913.glb");
  const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");
  const { animations: angryAnimation } = useFBX("/animations/Angry Gesture.fbx");
  const { animations: greetingAnimation } = useFBX("/animations/Standing Greeting.fbx");

  idleAnimation[0].name = "Idle";
  angryAnimation[0].name = "Angry";
  greetingAnimation[0].name = "Greeting";

  const [animation, setAnimation] = useState("Idle");
  const { actions } = useAnimations(
    [idleAnimation[0], angryAnimation[0], greetingAnimation[0]],
    group
  );

  // --- Store original positions for particle breathing ---
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

  // --- Handle animations ---
  useEffect(() => {
    actions[animation].reset().fadeIn(0.5).play();
    return () => actions[animation].fadeOut(0.5);
  }, [animation]);

  // --- Play audio and lipsync ---
  useEffect(() => {
    nodes.Wolf3D_Head.morphTargetInfluences[
      nodes.Wolf3D_Head.morphTargetDictionary["viseme_I"]
    ] = 1;
    nodes.Wolf3D_Teeth.morphTargetInfluences[
      nodes.Wolf3D_Teeth.morphTargetDictionary["viseme_I"]
    ] = 1;

    if (playAudio) {
      audio.play();
      if (script === "HelloGalax") setAnimation("Greeting");
    } else {
      setAnimation("Idle");
      audio.pause();
    }
  }, [playAudio, script]);

  // --- Main frame loop ---
  useFrame((state) => {
    const currentAudioTime = audio.currentTime;

    // --- Head follow ---
    if (headFollow) {
      group.current.getObjectByName("Head").lookAt(state.camera.position);
    }

    // --- Lipsync ---
    if (!audio.paused && !audio.ended) {
      Object.values(corresponding).forEach((value) => {
        if (!smoothMorphTarget) {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[value]
          ] = 0;
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[value]
          ] = 0;
        } else {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[value]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[value]
            ],
            0,
            morphTargetSmoothing
          );
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[value]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[value]
            ],
            0,
            morphTargetSmoothing
          );
        }
      });

      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          if (!smoothMorphTarget) {
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
            ] = 1;
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
            ] = 1;
          } else {
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
            ] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Head.morphTargetInfluences[
                nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
              ],
              1,
              morphTargetSmoothing
            );
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
            ] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Teeth.morphTargetInfluences[
                nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
              ],
              1,
              morphTargetSmoothing
            );
          }
          break;
        }
      }
    } else {
      setAnimation("Idle");
    }

    // --- Soft breathing particles ---
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
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = original[i] + 0.002 * Math.sin(time + i * 0.01);
        positions[i + 1] = original[i + 1] + 0.002 * Math.sin(time + i * 0.01);
        positions[i + 2] = original[i + 2] + 0.002 * Math.sin(time + i * 0.01);
      }
      part.geometry.attributes.position.needsUpdate = true;
    });
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
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
            size={0.01}
            color="#ffffffff"
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  );
}

useGLTF.preload("/models/646d9dcdc8a5f5bddbfac913.glb");
