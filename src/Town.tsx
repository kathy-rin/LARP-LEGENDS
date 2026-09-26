import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, RoundedBox, useGLTF } from '@react-three/drei';
import { Box3, Group, MathUtils, Mesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Effect, GameState, Sector } from './engine';
import { money, portfolio } from './engine';

type Point = [number, number, number];
const spots: Record<string, Point> = { home: [-3.4, 0.15, 2.5], bank: [-3.5, 0.15, -2.5], technology: [0, 0.15, -3.2], energy: [3.6, 0.15, -2.9], retail: [3.5, 0.15, 0.9], goal: [1.1, 0.15, 3.4], maya: [-0.8, 0.15, 0.8], debt: [-5.25, 0.15, 0] };

function Model({ name, size = 2, position = [0, 0, 0], rotation = 0 }: { name: string; size?: number; position?: Point; rotation?: number }) {
  const { scene } = useGLTF(`/models/${name}.glb`);
  const object = useMemo(() => {
    const copy = clone(scene); const box = new Box3().setFromObject(copy);
    const extent = box.getSize(new Vector3()); const center = box.getCenter(new Vector3());
    const scale = size / Math.max(extent.x, extent.y, extent.z);
    copy.scale.setScalar(scale); copy.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    copy.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
    return copy;
  }, [scene, size]);
  return <group position={position} rotation={[0, rotation, 0]}><primitive object={object} /></group>;
}
function Label({ position, title, value, tone = 'neutral' }: { position: Point; title: string; value?: string; tone?: string }) {
  return <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}><div className={`town-label ${tone}`}><span className="label-dot" />{title}{value && <strong>{value}</strong>}</div></Html>;
}
function Plot({ position, tint = '#c9d9ae', width = 2.8, depth = 2.6 }: { position: Point; tint?: string; width?: number; depth?: number }) {
  return <RoundedBox args={[width, 0.1, depth]} radius={0.12} smoothness={2} position={position} receiveShadow><meshStandardMaterial color={tint} /></RoundedBox>;
}
function Shield({ amount, reduced }: { amount: number; reduced: boolean }) {
  const mesh = useRef<Mesh>(null); const target = amount ? 0.75 + amount / 1500 * 0.5 : 0;
  useFrame((_, delta) => { if (mesh.current) mesh.current.scale.setScalar(reduced ? target : MathUtils.damp(mesh.current.scale.x, target, 5, delta)); });
  return <group position={spots.home}><mesh ref={mesh} position={[0, 0.05, 0]} scale={0}><sphereGeometry args={[2, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#79dcad" transparent opacity={0.2} roughness={0.12} metalness={0.1} depthWrite={false} side={2} /></mesh>{amount > 0 && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><ringGeometry args={[1.58, 1.63, 64]} /><meshBasicMaterial color="#69c995" transparent opacity={0.7} /></mesh>}</group>;
}
function SectorBuilding({ sector, value, reduced }: { sector: Sector; value: number; reduced: boolean }) {
  const group = useRef<Group>(null); const size = sector === 'technology' ? 3 : sector === 'energy' ? 1.8 : 1.8;
  const target = 0.82 + Math.min(value / 900, 1.2) * 0.28;
  useFrame((_, delta) => { if (group.current) group.current.scale.y = reduced ? target : MathUtils.damp(group.current.scale.y, target, 4, delta); });
  const p = spots[sector];
  return <group><Plot position={p} tint={sector === 'technology' ? '#d8d4e2' : sector === 'energy' ? '#dfe0ba' : '#e4d5c2'} /><group ref={group} position={p}><Model name={sector === 'energy' ? 'factory' : sector} size={size} rotation={Math.PI / 2} />{sector === 'energy' && <Model name="solar" size={1.15} position={[0.4, 0, 1.2]} />}</group><Label position={[p[0], p[1] + size + 0.45, p[2]]} title={sector === 'technology' ? 'Technology' : sector === 'energy' ? 'Energy' : 'Retail'} value={money(value)} tone={sector} /></group>;
}
function Turbine({ reduced }: { reduced: boolean }) {
  const rotor = useRef<Group>(null);
  useFrame((_, delta) => { if (rotor.current && !reduced) rotor.current.rotation.z += delta * 0.45; });
  return <group position={[5.3, 0.1, -3.9]}><mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.045, 0.1, 1.6, 8]} /><meshStandardMaterial color="#f6f1df" /></mesh><group ref={rotor} position={[0, 1.6, 0.08]}>{[0, 2.094, 4.188].map(a => <group rotation={[0, 0, a]} key={a}><mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.09, 0.8, 0.035]} /><meshStandardMaterial color="#fffaf0" /></mesh></group>)}</group></group>;
}
function Maya({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => { if (group.current && !reduced) group.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.035; });
  return <group position={spots.maya}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><ringGeometry args={[0.36, 0.43, 40]} /><meshBasicMaterial color="#fdfbef" /></mesh><group ref={group}><Model name="maya" size={0.95} rotation={0.5} /></group><Label position={[0, 1.3, 0]} title="Maya" /></group>;
}
function CoinTrail({ from, to, amount, red = false, reduced }: { from: Point; to: Point; amount: number; red?: boolean; reduced: boolean }) {
  const group = useRef<Group>(null); const start = useRef<number | null>(null);
  const count = Math.max(1, Math.min(12, Math.ceil(amount / 100)));
  useFrame(({ clock }) => {
    if (!group.current || reduced) return;
    start.current ??= clock.elapsedTime;
    const elapsed = clock.elapsedTime - start.current;
    group.current.visible = elapsed < 5;
    group.current.children.forEach((coin, i) => {
      const t = Math.max(0, Math.min(1, (elapsed - i * 0.1) / 1.7));
      coin.position.set(MathUtils.lerp(from[0], to[0], t), MathUtils.lerp(from[1] + 0.7, to[1] + 0.5, t) + Math.sin(t * Math.PI) * 1.6, MathUtils.lerp(from[2], to[2], t));
      coin.rotation.set(Math.PI / 2, elapsed * 2, 0); coin.visible = t > 0 && t < 1;
    });
  });
  if (reduced) return null;
  return <group ref={group}>{Array.from({ length: count }, (_, i) => <mesh key={i}><cylinderGeometry args={[0.095, 0.095, 0.04, 12]} /><meshStandardMaterial color={red ? '#ec7270' : '#f8cd52'} metalness={0.45} roughness={0.25} emissive={red ? '#8f2424' : '#af6c0b'} emissiveIntensity={0.2} /></mesh>)}</group>;
}
function Effects({ effects, reduced }: { effects: Effect[]; reduced: boolean }) {
  return <>{effects.filter(e => e.amount !== 0).map((e, i) => {
    let from = spots.bank; let to = spots.maya;
    if (e.kind === 'income') { from = spots.maya; to = spots.bank; }
    if (e.kind === 'save') to = spots.home;
    if (e.kind === 'debt' || e.kind === 'interest') to = spots.debt;
    if (e.kind === 'invest' && e.sector) to = spots[e.sector];
    if (e.kind === 'sell' && e.sector) { from = spots[e.sector]; to = spots.bank; }
    if (e.kind === 'goal') to = spots.goal;
    if (e.kind === 'repair') { from = spots.home; to = spots.maya; }
    if (e.kind === 'market') return null;
    return <CoinTrail key={i} from={from} to={to} amount={Math.abs(e.amount)} red={e.kind === 'interest' || e.kind === 'debt'} reduced={reduced} />;
  })}</>;
}
function Storm({ state, reduced }: { state: GameState; reduced: boolean }) {
  const group = useRef<Group>(null); const start = useRef<number | null>(null);
  useFrame(({ clock }) => { start.current ??= clock.elapsedTime; if (group.current) group.current.visible = clock.elapsedTime - start.current < (reduced ? 0 : 6); });
  return <group ref={group}>{(['technology', 'energy', 'retail'] as Sector[]).filter(s => state.investmentsBySector[s] > 0).map(sector => <group key={sector} position={[spots[sector][0], sector === 'technology' ? 3.8 : 2.9, spots[sector][2]]}>{[-0.45, 0, 0.45].map((x, i) => <mesh key={x} position={[x, i % 2 * 0.17, 0]} scale={[0.7, 0.35, 0.45]}><sphereGeometry args={[0.6, 8, 6]} /><meshStandardMaterial color="#9daabb" /></mesh>)}<Line points={[[0, -0.25, 0], [-0.15, -0.6, 0], [0.12, -0.55, 0], [-0.1, -0.95, 0]]} color="#ffd776" lineWidth={3} /></group>)}</group>;
}
function CameraMotion({ trigger, reduced, zoom }: { trigger: string; reduced: boolean; zoom: number }) {
  const { camera, size } = useThree(); const time = useRef(0);
  useEffect(() => { time.current = 0; }, [trigger]);
  useFrame((_, delta) => {
    time.current += delta;
    const pulse = reduced ? 0 : Math.sin(Math.min(time.current / 2.8, 1) * Math.PI) * 1.1;
    camera.zoom = Math.min(size.width / 20, size.height / 13.2) * zoom + pulse;
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  }); return null;
}
function World({ state, reduced, zoom, onReady }: { state: GameState; reduced: boolean; zoom: number; onReady: () => void }) {
  useEffect(onReady, [onReady]);
  const trigger = `${state.month}-${state.phase}-${state.decisionHistory.length}`;
  return <>
    <ambientLight intensity={1.5} /><hemisphereLight args={['#fff9e9', '#b9c7a5', 1.5]} />
    <directionalLight position={[-5, 12, 6]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={0.05} />
    <CameraMotion trigger={trigger} reduced={reduced} zoom={zoom} />
    <RoundedBox args={[13.6, 0.65, 11.6]} radius={0.3} smoothness={3} position={[0, -0.4, 0]} receiveShadow castShadow><meshStandardMaterial color="#c6c5a5" /></RoundedBox>
    <RoundedBox args={[13.7, 0.22, 11.7]} radius={0.1} smoothness={3} position={[0, -0.03, 0]} receiveShadow><meshStandardMaterial color="#c6d7ad" /></RoundedBox>
    {[-5, -2.5, 0, 2.5, 5].map(x => <Model key={`h${x}`} name={x === 0 ? 'crossroad' : 'road'} size={2.5} position={[x, 0.13, 0]} rotation={Math.PI / 2} />)}
    {[-5, -2.5, 2.5, 5].map(z => <Model key={z} name="road" size={2.5} position={[0, 0.13, z]} />)}
    <Plot position={spots.home} tint="#bdce9e" width={3.1} depth={3} /><Model name="home" position={spots.home} size={2.4} rotation={Math.PI / 2} /><Shield amount={state.emergencySavings} reduced={reduced} />
    <Label position={[-3.5, 2.45, 2.5]} title="Your home" value={state.emergencySavings ? `${money(state.emergencySavings)} protected` : 'A fresh start'} tone="savings" />
    <Plot position={spots.bank} tint="#ced9da" /><Model name="bank" position={spots.bank} size={2.35} rotation={Math.PI / 2} /><Label position={[-3.5, 2.95, -2.5]} title="Bank" value={money(state.cash)} tone="cash" />
    {(['technology', 'energy', 'retail'] as Sector[]).map(sector => <SectorBuilding key={sector} sector={sector} value={state.investmentsBySector[sector]} reduced={reduced} />)}
    <Plot position={spots.goal} tint="#d8ceb1" width={2.4} depth={2.2} />
    <group position={spots.goal}><group scale={[1, 0.12 + state.goalSavings / 1500 * 0.88, 1]}><Model name="goal" size={1.8} /></group>{state.goalSavings < 1500 && <>{[-0.9, 0.9].map(x => <mesh key={x} position={[x, 0.55 + state.goalSavings / 3000, 0]}><boxGeometry args={[0.055, 1.1 + state.goalSavings / 1500, 1.85]} /><meshStandardMaterial color="#d6b27c" wireframe /></mesh>)}</>}</group>
    <Label position={[1.1, 2.3, 3.5]} title="Tuition goal" value={`${Math.round(state.goalSavings / 1500 * 100)}% built`} tone="goal" />
    <Maya reduced={reduced} /><Turbine reduced={reduced} />
    {state.creditCardDebt > 0 && <><Line points={[[-3.5, 0.35, -2.5], [-5.25, 0.35, -1.8], [-5.25, 0.35, 0]]} color="#e97670" lineWidth={5} /><group position={spots.debt}><mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.65, 0.7, 0.7]} /><meshStandardMaterial color="#bd655f" /></mesh></group><Label position={[-5.25, 1.2, 0]} title="Debt drain" value={money(state.creditCardDebt)} tone="debt" /></>}
    {[[-5.6, -4.5], [-4.9, -4.7], [1.6, -4.8], [5.7, 3.5], [5.6, 4.5], [-5.7, 3.7], [-5, 4.6], [-2.5, 4.8], [3.6, 4.6], [5.8, -1.3]].map(([x, z], i) => <Model key={i} name={['tree-oak', 'tree-pine', 'tree-round'][i % 3]} size={1.05 + i % 3 * 0.22} position={[x, 0.12, z]} rotation={i} />)}
    {[[-5.9, 2.5], [4.7, 4.8], [2.5, -5]].map(([x, z], i) => <Model key={i} name="rock" size={0.35} position={[x, 0.13, z]} />)}
    <Effects key={trigger} effects={state.effects} reduced={reduced} />
    {state.month === 10 && <Storm key={trigger} state={state} reduced={reduced} />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.77, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={0.12} /></mesh>
  </>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function TextTown({ state }: { state: GameState }) {
  return <div className="text-town"><span className="eyebrow">Your town, in words</span><h3>Every choice still counts.</h3><p>The 3D view is unavailable. Your full game and financial results are ready to play.</p><div><span>Bank <b>{money(state.cash)}</b></span><span>Home shield <b>{money(state.emergencySavings)}</b></span><span>Debt drain <b>{money(state.creditCardDebt)}</b></span><span>Sector buildings <b>{money(portfolio(state))}</b></span><span>Tuition building <b>{Math.round(state.goalSavings / 1500 * 100)}%</b></span></div></div>;
}
export default function Town({ state, reduced, zoom }: { state: GameState; reduced: boolean; zoom: number }) {
  const [ready, setReady] = useState(false);
  const [available] = useState(() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } });
  const fallback = <TextTown state={state} />;
  if (!available) return fallback;
  return <SceneBoundary fallback={fallback}><Canvas orthographic shadows dpr={[1, 1.8]} camera={{ position: [13, 13, 17], near: 0.1, far: 200, zoom: 40 }} gl={{ antialias: true, alpha: true }} fallback={fallback} aria-label="A miniature town showing your bank, home shield, debt drain, investment sectors, and tuition goal"><Suspense fallback={null}><World state={state} reduced={reduced} zoom={zoom} onReady={() => setReady(true)} /></Suspense></Canvas>{!ready && <div className="scene-loading"><span className="loading-leaf">✦</span>Growing your little town…</div>}</SceneBoundary>;
}
