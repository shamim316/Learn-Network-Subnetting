import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useScenePalette } from '../../theme'

/** Cached canvas textures for the tiny 0/1 glyphs drawn on each bit. */
const textureCache = new Map<string, THREE.CanvasTexture>()

export function glyphTexture(text: string): THREE.CanvasTexture {
  const cached = textureCache.get(text)
  if (cached) return cached
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  context.clearRect(0, 0, size, size)
  context.fillStyle = '#ffffff'
  context.font = `bold ${Math.round(size * (text.length > 2 ? 0.42 : 0.72))}px ui-monospace, monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, size / 2, size / 2 + 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  textureCache.set(text, texture)
  return texture
}

/**
 * Mounts the WebGL canvas only once the figure scrolls into view, so a page
 * with several scenes does not open every context up front.
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return { ref, inView }
}

/**
 * Pulls the camera in or out so a box of `width` x `height` world units fills
 * the viewport, whatever its aspect ratio. Without this the wide scenes are
 * postage stamps on a laptop and clipped on a phone.
 */
function FitToContent({ width, height, padding = 1.12 }: { width: number; height: number; padding?: number }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const controls = useThree((state) => state.controls) as { target?: THREE.Vector3; update?: () => void } | null
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    if (!perspective.isPerspectiveCamera || size.width === 0 || size.height === 0) return
    const fov = (perspective.fov * Math.PI) / 180
    const aspect = size.width / size.height
    const forHeight = height / 2 / Math.tan(fov / 2)
    const forWidth = width / 2 / (Math.tan(fov / 2) * aspect)
    const distance = Math.max(forHeight, forWidth) * padding
    const target = controls?.target ?? new THREE.Vector3()
    const direction = perspective.position.clone().sub(target)
    if (direction.lengthSq() === 0) direction.set(0, 0, 1)
    perspective.position.copy(target.clone().add(direction.normalize().multiplyScalar(distance)))
    perspective.updateProjectionMatrix()
    controls?.update?.()
    invalidate()
  }, [camera, controls, invalidate, size.width, size.height, width, height, padding])

  return null
}

export type SceneProps = {
  children: ReactNode
  height?: string
  cameraPosition?: [number, number, number]
  fov?: number
  target?: [number, number, number]
  minDistance?: number
  maxDistance?: number
  enableRotate?: boolean
  overlay?: ReactNode
  /** World-space box the view should frame; the camera distance follows it. */
  fit?: { width: number; height: number }
}

export function Scene({
  children,
  height = 'h-[22rem] sm:h-[26rem]',
  cameraPosition = [0, 6, 18],
  fov = 45,
  target = [0, 0, 0],
  minDistance = 4,
  maxDistance = 60,
  enableRotate = true,
  overlay,
  fit,
}: SceneProps) {
  const palette = useScenePalette()
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div ref={ref} className={`relative w-full ${height}`} style={{ background: palette.background }}>
      {inView ? (
        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
          camera={{ position: cameraPosition, fov, near: 0.1, far: 400 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => gl.setClearColor(palette.background)}
        >
          <color attach="background" args={[palette.background]} />
          <ambientLight intensity={1.15} />
          <directionalLight position={[8, 14, 10]} intensity={1.5} />
          <directionalLight position={[-10, 6, -8]} intensity={0.5} />
          {children}
          {fit ? <FitToContent width={fit.width} height={fit.height} /> : null}
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.12}
            enablePan
            enableRotate={enableRotate}
            target={target}
            minDistance={minDistance}
            maxDistance={maxDistance}
          />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-ink-3">Loading 3D view…</div>
      )}
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  )
}

/** A cube with a 0/1 (or short text) glyph on its front face. */
export function GlyphBox({
  position,
  size,
  color,
  glyph,
  glyphColor,
  opacity = 1,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  glyph?: string
  glyphColor?: string
  opacity?: number
  onClick?: () => void
  onPointerOver?: () => void
  onPointerOut?: () => void
}) {
  return (
    <group position={position}>
      <mesh
        onClick={onClick ? (event) => { event.stopPropagation(); onClick() } : undefined}
        onPointerOver={onPointerOver ? (event) => { event.stopPropagation(); onPointerOver() } : undefined}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>
      {glyph ? (
        <mesh position={[0, 0, size[2] / 2 + 0.012]} raycast={() => null}>
          <planeGeometry args={[size[0] * 0.8, size[1] * 0.8]} />
          <meshBasicMaterial
            map={glyphTexture(glyph)}
            transparent
            color={glyphColor ?? '#ffffff'}
            depthWrite={false}
            opacity={opacity}
          />
        </mesh>
      ) : null}
    </group>
  )
}

/** Thin box used as a rule/edge marker; cheaper and crisper than a line at this scale. */
export function Bar({
  position,
  size,
  color,
  opacity = 1,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  opacity?: number
}) {
  return (
    <mesh position={position} raycast={() => null}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
    </mesh>
  )
}
