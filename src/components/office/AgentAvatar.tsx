'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations, Clone } from '@react-three/drei';
import * as THREE from 'three';

// Preload the robot model so copies share memory
useGLTF.preload('/RobotExpressive.glb');

export default function AgentAvatar({ 
  agent, 
  position, 
  rotation, 
  avatarStyle = 'robot',
  currentTaskTitle
}: { 
  agent: any, 
  position: [number, number, number], 
  rotation?: [number, number, number],
  avatarStyle?: 'robot' | 'human' | 'geometric' | 'hologram',
  currentTaskTitle?: string | null
}) {
  const groupRef = useRef<THREE.Group>(null);
  const robotRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Always load GLTF because hooks cannot be conditional, but only use it if needed
  const { scene, animations } = useGLTF('/RobotExpressive.glb');
  const { actions } = useAnimations(animations, robotRef);

  useEffect(() => {
    // Only play idle animation if we are using the Robot mesh
    if ((avatarStyle === 'robot' || avatarStyle === 'hologram') && actions && actions['Idle']) {
      actions['Idle'].reset().play();
    }
  }, [actions, avatarStyle]);

  // Gentle float for non-robot avatars or hovered state
  useFrame((state) => {
    if (groupRef.current) {
      if (avatarStyle === 'geometric' || avatarStyle === 'hologram') {
         // geometric float continuously
         groupRef.current.position.y = position[1] + (Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1);
      } else {
         // normal hop on hover
         groupRef.current.position.y = position[1] + (hovered ? Math.sin(state.clock.elapsedTime * 4) * 0.05 : 0);
      }
    }
  });

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <group 
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Render Avatar based on Style */}
        {avatarStyle === 'robot' && (
          <group ref={robotRef} scale={0.3} rotation={[0, Math.PI / 8, 0]}>
            <Clone object={scene} castShadow receiveShadow />
          </group>
        )}

        {avatarStyle === 'hologram' && (
          <group ref={robotRef} scale={0.3} rotation={[0, Math.PI / 8, 0]}>
            <Clone 
              object={scene} 
              inject={<meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} transparent opacity={0.6} wireframe />} 
            />
          </group>
        )}

        {avatarStyle === 'human' && (
          <group position={[0, 0.4, 0]}>
            {/* Head */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color={hovered ? "#38bdf8" : "#fbbf24"} />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.6, 0.25]} />
              <meshStandardMaterial color="#3b82f6" />
            </mesh>
            {/* Arms */}
            <mesh position={[-0.35, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>
            <mesh position={[0.35, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.15, -0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.2, 0.4, 0.2]} />
              <meshStandardMaterial color="#1e3a8a" />
            </mesh>
            <mesh position={[0.15, -0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.2, 0.4, 0.2]} />
              <meshStandardMaterial color="#1e3a8a" />
            </mesh>
          </group>
        )}

        {avatarStyle === 'geometric' && (
          <group position={[0, 0.6, 0]}>
            <mesh castShadow>
              <icosahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.5} wireframe={hovered} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.5, 0.02, 16, 100]} />
              <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* Lighting Effects */}
      {hovered && avatarStyle !== 'hologram' && (
        <pointLight position={[0, 1.5, 0]} intensity={1.5} color="#10b981" distance={3} />
      )}
      {avatarStyle === 'hologram' && (
        <pointLight position={[0, 1, 0]} intensity={2} color="#06b6d4" distance={2} />
      )}
      {avatarStyle === 'geometric' && (
        <pointLight position={[0, 1, 0]} intensity={1} color="#ec4899" distance={2} />
      )}

      {/* HTML Nametag & Ticket Info */}
      <Html position={[0, 2.0, 0]} center zIndexRange={[100, 0]}>
        <div style={{
          background: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(12px)',
          border: hovered 
            ? '1px solid #10b981' 
            : (currentTaskTitle ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)'),
          padding: '8px 14px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: hovered ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
          minWidth: '150px'
        }}>
          {/* Top Row: Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span style={{ fontSize: '18px' }}>{agent.identity?.emoji || '🤖'}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{agent.name}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>
                {agent.identity?.role || 'Agent Worker'}
              </div>
            </div>
            {currentTaskTitle && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            )}
          </div>

          {/* Bottom Row: Active Ticket */}
          {currentTaskTitle && (
            <div style={{ 
              marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', 
              width: '100%', fontSize: '11px', color: '#60a5fa', textAlign: 'left'
            }}>
              <strong style={{ color: '#9ca3af' }}>Working on:</strong><br/>
              {currentTaskTitle.length > 25 ? currentTaskTitle.slice(0, 25) + '...' : currentTaskTitle}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
