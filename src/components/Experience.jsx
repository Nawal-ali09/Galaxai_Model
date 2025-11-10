import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";

export const Experience = () => {
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <Avatar position={[0, -3.35, 6.8]} scale={2} />
      <Environment preset="sunset" />
      {/* No background plane or color */}
    </>
  );
};
