'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import OfficeFloor from './OfficeFloor';
import AgentAvatar from './AgentAvatar';
import KanbanBoard from './KanbanBoard';
import { OpenClawConfig, Task } from '@/lib/types';
import { Suspense, useMemo } from 'react';

function Workstation({ position, rotation, theme }: { position: [number, number, number], rotation: [number, number, number], theme: 'dark' | 'light' }) {
  // Theme Materials
  const wallColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const deskColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const monitorBack = theme === 'dark' ? '#0f172a' : '#94a3b8';
  const screenColor = '#000000'; // screens are black

  return (
    <group position={position} rotation={rotation}>
      {/* Partition Wall Back */}
      <mesh position={[0, 1.2, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.4, 0.1]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Partition Wall Side */}
      <mesh position={[-0.95, 1.2, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2.4, 1.5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[0.95, 1.2, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2.4, 1.5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Desk Surface */}
      <mesh position={[0, 0.8, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.05, 0.9]} />
        <meshStandardMaterial color={deskColor} />
      </mesh>
      {/* Monitor Base */}
      <mesh position={[0, 0.825, -0.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.05, 16]} />
        <meshStandardMaterial color={monitorBack} />
      </mesh>
      {/* Monitor Stand */}
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <boxGeometry args={[0.05, 0.25, 0.05]} />
        <meshStandardMaterial color={monitorBack} />
      </mesh>
      {/* Monitor Screen */}
      <mesh position={[0, 1.15, -0.25]} rotation={[-0.05, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.6, 0.05]} />
        <meshStandardMaterial color={screenColor} />
      </mesh>
      {/* Screen Glow */}
      <mesh position={[0, 1.15, -0.22]} rotation={[-0.05, 0, 0]}>
        <planeGeometry args={[1.06, 0.56]} />
        <meshBasicMaterial color={theme === 'dark' ? '#10b981' : '#3b82f6'} transparent opacity={0.15} />
      </mesh>
      {/* Little Plant */}
      <group position={[0.6, 0.825, -0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.06, 0.15]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <dodecahedronGeometry args={[0.16]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </group>
    </group>
  );
}

export default function Scene({ 
  agents, 
  tasks, 
  theme = 'dark', 
  avatarStyle = 'robot' 
}: { 
  agents: any[], 
  tasks: Task[], 
  theme: 'dark' | 'light', 
  avatarStyle: 'robot' | 'human' | 'geometric' | 'hologram' 
}) {
  const getAgentSetup = (index: number, total: number) => {
    // We leave space for the Kanban board in the back (-Z)
    // We will place desks in a semi-circle or rows depending on total
    if (total === 1) return { deskPos: [0, 0, 0] as [number, number, number], rot: [0, 0, 0] as [number, number, number] };
    const radius = Math.max(3.5, total * 0.7);
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 2; // Shift entire layout forward +Z to make room for Kanban
    const rotY = -angle - Math.PI / 2; // Face inward towards center
    return { deskPos: [x, 0, z] as [number, number, number], rot: [0, rotY, 0] as [number, number, number] };
  };

  const bgColor = theme === 'dark' ? '#0a0a0a' : '#f8fafc';
  const ambientIntensity = theme === 'dark' ? 0.3 : 1.2;

  return (
    <div style={{ width: '100%', height: '100%', background: bgColor, transition: 'background 0.5s ease' }}>
      <Canvas shadows camera={{ position: [5, 5, 10], fov: 45 }}>
        <fog attach="fog" args={[bgColor, 10, 40]} />
        
        {/* Dynamic Lighting Based on Theme */}
        <ambientLight intensity={ambientIntensity} />
        {theme === 'dark' ? (
          <spotLight position={[0, 10, 0]} intensity={0.5} castShadow angle={Math.PI/3} penumbra={1} color="#38bdf8" />
        ) : (
          <directionalLight position={[5, 10, -5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} color="#fdf4ff" />
        )}

        <Suspense fallback={null}>
          <OfficeFloor theme={theme} />
          
          {/* Kanban Board in the Back */}
          <KanbanBoard position={[0, 2.5, -6]} rotation={[0, 0, 0]} tasks={tasks} theme={theme} />

          {agents.map((agent, index) => {
            const { deskPos, rot } = getAgentSetup(index, agents.length);
            // Agent sits slightly in front of the desk surface (+Z in local space)
            const agentX = deskPos[0] + Math.sin(rot[1]) * 0.6;
            const agentZ = deskPos[2] + Math.cos(rot[1]) * 0.6;
            
            // Find current task assigned to this agent
            // Find in-progress first, then anything assigned
            const assignedTasks = tasks.filter(t => t.agentId === agent.id);
            const inProgressTask = assignedTasks.find(t => t.status === 'in-progress');
            const currentTask = inProgressTask || (assignedTasks.length > 0 ? assignedTasks[0] : null);
            
            return (
              <group key={`${agent.id || 'agent'}-${index}`}>
                <Workstation position={deskPos} rotation={rot} theme={theme} />
                <AgentAvatar 
                  agent={agent} 
                  position={[agentX, 0.4, agentZ]} 
                  rotation={rot}
                  avatarStyle={avatarStyle}
                  currentTaskTitle={currentTask ? currentTask.title : null}
                />
              </group>
            );
          })}
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go under floor
          minDistance={2}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}
