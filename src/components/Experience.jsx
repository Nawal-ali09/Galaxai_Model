import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import { useState, useEffect } from "react";

export const Experience = () => {
  const viewport = useThree((state) => state.viewport);

  // State to trigger HelloGalax audio
  const [triggerHello, setTriggerHello] = useState(false);

  useEffect(() => {
    const input = document.getElementById("user-input");
    const handleEnter = (e) => {
      if (e.key === "Enter") {
        const value = e.target.value.trim().toLowerCase();
        if (value === "hello" || value === "hi") {
          setTriggerHello((prev) => !prev); // toggle to trigger effect
        }
        e.target.value = ""; // clear input
      }
    };
    input.addEventListener("keydown", handleEnter);

    return () => input.removeEventListener("keydown", handleEnter);
  }, []);

  return (
    <>
      <Avatar position={[0, -3.35, 6.8]} scale={2} triggerHello={triggerHello} />
      <Environment preset="sunset" />
    </>
  );
};
