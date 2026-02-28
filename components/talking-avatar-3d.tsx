"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import type * as THREE from "three"

interface TalkingAvatar3DProps {
  isActive: boolean
  isSpeaking: boolean
  isListening: boolean
  lipSyncData?: {
    currentWord: string
    mouthShape: string
    mouthOpenness: number
  }
}

function AvatarHead({ isSpeaking, lipSyncData }: { isSpeaking: boolean; lipSyncData?: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [mouthOpenness, setMouthOpenness] = useState(0)
  const [headRotation, setHeadRotation] = useState(0)

  useFrame((state) => {
    if (!meshRef.current) return

    // Smooth mouth animation based on lip sync data
    if (isSpeaking && lipSyncData) {
      const targetOpenness = lipSyncData.mouthOpenness * 0.3
      setMouthOpenness((prev) => prev + (targetOpenness - prev) * 0.3)
    } else {
      setMouthOpenness((prev) => prev * 0.9)
    }

    // Subtle head movement when listening
    if (!isSpeaking) {
      const time = state.clock.getElapsedTime()
      setHeadRotation(Math.sin(time * 0.5) * 0.1)
    }

    // Apply transformations
    meshRef.current.rotation.y = headRotation
  })

  return (
    <group>
      {/* Head */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#f5d5c0" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#2c1810" />
      </mesh>
      <mesh position={[0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#2c1810" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0, 0.9]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#f5d5c0" />
      </mesh>

      {/* Mouth - animated based on speech */}
      <mesh position={[0, -0.3, 0.85]} scale={[1, mouthOpenness + 0.1, 1]}>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2c1810" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#f5d5c0" />
      </mesh>

      {/* Shoulders */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.8]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  )
}

export default function TalkingAvatar3D({ isActive, isSpeaking, isListening, lipSyncData }: TalkingAvatar3DProps) {
  const [status, setStatus] = useState("Ready")

  useEffect(() => {
    if (isSpeaking) {
      setStatus("Speaking...")
    } else if (isListening) {
      setStatus("Listening...")
    } else {
      setStatus("Ready")
    }
  }, [isSpeaking, isListening])

  if (!isActive) {
    return null
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} className="w-full h-full">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, 5, 5]} intensity={0.5} />

        <AvatarHead isSpeaking={isSpeaking} lipSyncData={lipSyncData} />

        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
      </Canvas>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isSpeaking ? "bg-green-500 animate-pulse" : isListening ? "bg-blue-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-white text-sm font-medium">{status}</span>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && lipSyncData && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-white text-sm text-center">{lipSyncData.currentWord}</p>
        </div>
      )}
    </div>
  )
}
