import React, { useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Timmy = ({ position = [0, 0, 0], scale = [1, 1, 1] }) => {
  const group = useRef();
  const { scene, animations } = useGLTF('/models/timmy.glb');
  const { actions } = useAnimations(animations, group);

  // Animation state
  const mixer = useRef(new THREE.AnimationMixer(scene));

  useFrame((state, delta) => {
    mixer.current.update(delta);
  });

  // Function to play sign language animation
  const playSignAnimation = (sign: string) => {
    // This would contain the logic to map speech to sign language animations
    // For now, we'll just play a default animation if it exists
    if (actions && actions['idle']) {
      actions['idle'].play();
    }
  };

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};

export default Timmy;