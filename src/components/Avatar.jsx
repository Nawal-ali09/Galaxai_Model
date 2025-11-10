import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import AvatarParticles from "./AvatarParticles";

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

export function Avatar({ scriptProp, triggerHello, ...props }) {
  const group = useRef();

  // State to manage which script/audio is playing
  const [currentScript, setCurrentScript] = useState(scriptProp || "HelloGalax");

  // Audio and lipsync
  const audio = useMemo(() => new Audio(`/audios/${currentScript}.mp3`), [currentScript]);
  const jsonFile = useLoader(THREE.FileLoader, `audios/${currentScript}.json`);
  const lipsync = JSON.parse(jsonFile);

  // Load 3D model and animations
  const { nodes } = useGLTF("/models/646d9dcdc8a5f5bddbfac913.glb");
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

  // Handle animation transitions
  useEffect(() => {
    actions[animation].reset().fadeIn(0.5).play();
    return () => actions[animation].fadeOut(0.5);
  }, [animation]);

  // Trigger HelloGalax audio when triggerHello prop changes
  useEffect(() => {
    if (triggerHello) {
      setCurrentScript("HelloGalax");
      audio.play().catch(() => console.warn("Autoplay prevented"));
      setAnimation("Greeting");
    }
  }, [triggerHello]);

  // Ensure lips slightly open initially
  useEffect(() => {
    if (nodes.Wolf3D_Head && nodes.Wolf3D_Teeth) {
      nodes.Wolf3D_Head.morphTargetInfluences[
        nodes.Wolf3D_Head.morphTargetDictionary["viseme_I"]
      ] = 1;
      nodes.Wolf3D_Teeth.morphTargetInfluences[
        nodes.Wolf3D_Teeth.morphTargetDictionary["viseme_I"]
      ] = 1;
    }
  }, [nodes]);

  // Main frame loop for head follow and lipsync
  useFrame((state) => {
    const delta = state.clock.getDelta();
    const currentAudioTime = audio.currentTime;
    const smoothingFactor = 100;

    // Head follows camera
    if (group.current) {
      group.current.getObjectByName("Head")?.lookAt(state.camera.position);
    }

    // Lipsync
    if (!audio.paused && !audio.ended) {
      Object.values(corresponding).forEach((value) => {
        const index = nodes.Wolf3D_Head.morphTargetDictionary[value];
        const lerpFactor = 1 - Math.exp(-smoothingFactor * delta);
        nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[index],
          0,
          lerpFactor
        );
        nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[index],
          0,
          lerpFactor
        );
      });

      for (let cue of lipsync.mouthCues) {
        if (currentAudioTime >= cue.start && currentAudioTime <= cue.end) {
          const targetValue = corresponding[cue.value];
          const index = nodes.Wolf3D_Head.morphTargetDictionary[targetValue];
          const lerpFactor = 1 - Math.exp(-smoothingFactor * delta);
          nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Head.morphTargetInfluences[index],
            1,
            lerpFactor
          );
          nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[index],
            0.8,
            lerpFactor
          );
          break;
        }
      }
    } else {
      setAnimation("Idle");
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <AvatarParticles nodes={nodes} />
    </group>
  );
}

useGLTF.preload("/models/646d9dcdc8a5f5bddbfac913.glb");
