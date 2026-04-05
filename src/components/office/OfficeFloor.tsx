'use client';

import { Grid, Environment, ContactShadows } from '@react-three/drei';

export default function OfficeFloor({ theme }: { theme: 'dark' | 'light' }) {
  // We removed the generic directionalLight/ambientLight here because 
  // they are now managed dynamically from the Scene.tsx component.
  
  const envPreset = theme === 'dark' ? 'city' : 'apartment'; // apartment is brighter
  
  // Grid Colors
  const sectionColor = theme === 'dark' ? '#38bdf8' : '#e2e8f0'; // bright blue vs light slate
  const cellColor = theme === 'dark' ? '#0ea5e9' : '#f1f5f9'; // darker pool vs lighter slate
  
  return (
    <>
      <Environment preset={envPreset as any} environmentIntensity={theme === 'dark' ? 0.3 : 0.8} />
      
      {/* Contact Shadows for realism */}
      <ContactShadows 
        position={[0, -0.01, 0]} 
        opacity={theme === 'dark' ? 0.6 : 0.25} 
        scale={30} 
        blur={2} 
        far={4} 
        color={theme === 'dark' ? '#000000' : '#334155'}
      />
      
      {/* Physical Floor Mesh for raycasting and visual grounding */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={theme === 'dark' ? '#020617' : '#ffffff'} />
      </mesh>
      
      {/* Grid Overlay */}
      <Grid 
        infiniteGrid 
        fadeDistance={40}
        sectionColor={sectionColor}
        cellColor={cellColor}
        sectionSize={2}
        cellSize={0.5}
        sectionThickness={theme === 'dark' ? 1.5 : 2.5}
        cellThickness={theme === 'dark' ? 0.8 : 1.5}
        position={[0, -0.04, 0]}
      />
    </>
  );
}
