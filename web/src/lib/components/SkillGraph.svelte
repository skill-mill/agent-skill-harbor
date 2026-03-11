<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import type { FlatSkillEntry } from '$lib/types';
	import { buildGraphData, getColors, type GraphNodeAttrs, type GraphNode } from '$lib/utils/graph';

	interface Props {
		skills: FlatSkillEntry[];
		searchQuery?: string;
		onNodeSelect?: (nodeId: string | null, attrs: GraphNodeAttrs | null) => void;
	}

	let { skills, searchQuery = '', onNodeSelect }: Props = $props();

	let container: HTMLDivElement;
	let graph3d: any = null;
	let dark = $state(false);
	let darkModeObserver: MutationObserver | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let rafId: number | null = null;
	let interactionResumeTimer: ReturnType<typeof setTimeout> | null = null;
	let initialCameraPos: { x: number; y: number; z: number } | null = null;
	let previousFrameTimestamp: number | null = null;
	let rotationPausedUntil = 0;
	let graphInitialized = false;

	const LABEL_DISTANCE_PADDING = 40;
	const MAX_VISIBLE_LABELS = 18;
	const AUTO_ROTATE_SPEED = 0.00012;

	function checkDark(): boolean {
		return document.documentElement.classList.contains('dark');
	}

	function createTextSprite(text: string, isDark: boolean): THREE.Sprite {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		const fontSize = 64;
		ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
		const metrics = ctx.measureText(text);
		const pad = 16;
		canvas.width = metrics.width + pad * 2;
		canvas.height = fontSize * 1.4 + pad * 2;

		ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		texture.minFilter = THREE.LinearFilter;
		const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
		const sprite = new THREE.Sprite(material);
		const scale = 0.12;
		sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
		sprite.visible = false;
		return sprite;
	}

	function disposeSprite(sprite: THREE.Sprite) {
		(sprite.material as THREE.SpriteMaterial).map?.dispose();
		sprite.material.dispose();
	}

	export function zoomIn() {
		if (!graph3d) return;
		const pos = graph3d.cameraPosition();
		const scale = 0.75;
		graph3d.cameraPosition({ x: pos.x * scale, y: pos.y * scale, z: pos.z * scale }, graph3d.scene().position, 300);
	}

	export function zoomOut() {
		if (!graph3d) return;
		const pos = graph3d.cameraPosition();
		const scale = 1.33;
		graph3d.cameraPosition({ x: pos.x * scale, y: pos.y * scale, z: pos.z * scale }, graph3d.scene().position, 300);
	}

	export function zoomReset() {
		if (!graph3d) return;
		const target = initialCameraPos ?? { x: 0, y: 0, z: 300 };
		graph3d.cameraPosition(target, { x: 0, y: 0, z: 0 }, 1000);
	}

	export function getCanvasDataURL(): string | null {
		if (!graph3d) return null;
		const renderer = graph3d.renderer();
		if (!renderer) return null;
		renderer.render(graph3d.scene(), graph3d.camera());
		return renderer.domElement.toDataURL('image/png');
	}

	// --- Color & label updates (called from $effect) ---

	let colorsDirty = false;
	let labelsDirty = false;

	function markColorsDirty() {
		colorsDirty = true;
	}

	function markLabelsDirty() {
		labelsDirty = true;
	}

	function normalizeQuery(): string {
		return searchQuery.trim().toLowerCase();
	}

	function nodeMatchesQuery(node: GraphNode): boolean {
		const query = normalizeQuery();
		if (!query) return true;
		return node.label?.toLowerCase().includes(query) ?? false;
	}

	function getNodeDisplayColor(node: GraphNode): string {
		const colors = getColors(dark);
		const dimColor = dark ? '#334155' : '#cbd5e1';
		const baseColor = node.nodeType === 'repo' ? colors.repo : colors.skill;
		return nodeMatchesQuery(node) ? baseColor : dimColor;
	}

	function linkMatchesQuery(link: any): boolean {
		const query = normalizeQuery();
		if (!query) return true;
		const sourceNode = typeof link.source === 'object' ? (link.source as GraphNode) : null;
		const targetNode = typeof link.target === 'object' ? (link.target as GraphNode) : null;
		return Boolean((sourceNode && nodeMatchesQuery(sourceNode)) || (targetNode && nodeMatchesQuery(targetNode)));
	}

	function getLinkDisplayColor(link: any): string {
		if (!linkMatchesQuery(link)) {
			return dark ? '#334155' : '#dbe4ee';
		}
		const colors = getColors(dark);
		return link.edgeType === 'derived_from' ? colors.edgeDerivedFrom : colors.edgeLivesIn;
	}

	function applyPendingUpdates() {
		if (!graph3d) return;

		if (colorsDirty) {
			colorsDirty = false;
			const bgColor = dark ? '#0f172a' : '#ffffff';

			// Background
			const renderer = graph3d.renderer?.();
			if (renderer) {
				renderer.setClearColor(bgColor);
			}

			const { nodes, links } = graph3d.graphData();
			graph3d.nodeColor((node: GraphNode) => getNodeDisplayColor(node));
			graph3d.linkColor((link: any) => getLinkDisplayColor(link));
			graph3d.linkOpacity((link: any) => (linkMatchesQuery(link) ? 0.6 : 0.18));
			graph3d.linkDirectionalArrowColor((link: any) =>
				link.edgeType === 'derived_from' ? getLinkDisplayColor(link) : null,
			);

			for (const node of nodes) {
				const displayColor = getNodeDisplayColor(node);
				node.color = displayColor;
				const mesh = node.__threeObj?.children?.[0] ?? node.__threeObj;
				if (mesh?.material?.color) {
					mesh.material.color.set(displayColor);
				}
			}

			for (const link of links) {
				const c = getLinkDisplayColor(link);
				link.color = c;
				const lineObj = link.__lineObj;
				if (lineObj?.material?.color) {
					lineObj.material.color.set(c);
				}
				if (lineObj?.material) {
					lineObj.material.opacity = linkMatchesQuery(link) ? 0.6 : 0.18;
					lineObj.material.transparent = true;
				}
			}
		}

		if (labelsDirty) {
			labelsDirty = false;
			const { nodes } = graph3d.graphData();
			for (const node of nodes) {
				const oldSprite = node.__labelSprite;
				const parent = node.__threeObj;
				if (!parent) continue;

				if (oldSprite) {
					parent.remove(oldSprite);
					disposeSprite(oldSprite);
				}
				const sprite = createTextSprite(node.label ?? '', dark);
				sprite.position.set(0, (node.size ?? 1.5) + 3, 0);
				const isMatch = nodeMatchesQuery(node);
				(sprite.material as THREE.SpriteMaterial).opacity = isMatch ? 1 : 0.45;
				parent.add(sprite);
				node.__labelSprite = sprite;
			}
		}
	}

	function updateLabelVisibility() {
		if (!graph3d) return;
		const camera = graph3d.camera();
		if (!camera) return;

		const { nodes } = graph3d.graphData();
		if (!Array.isArray(nodes) || nodes.length === 0) return;

		const cameraPos = camera.position;
		const cameraDir = new THREE.Vector3();
		camera.getWorldDirection(cameraDir);

		const scored = nodes
			.map((node: any) => {
				const sprite = node.__labelSprite;
				if (!sprite) return null;
				const nodePos = new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0);
				const toNode = nodePos.clone().sub(cameraPos);
				const distance = toNode.length();
				if (distance === 0) {
					return { node, sprite, distance, facing: 1 };
				}
				const facing = toNode.normalize().dot(cameraDir);
				return { node, sprite, distance, facing };
			})
			.filter((entry): entry is { node: any; sprite: THREE.Sprite; distance: number; facing: number } => Boolean(entry))
			.sort((a, b) => a.distance - b.distance);

		const distanceThreshold =
			scored.length > 0
				? scored[Math.min(MAX_VISIBLE_LABELS - 1, scored.length - 1)].distance + LABEL_DISTANCE_PADDING
				: 0;

		for (const [index, entry] of scored.entries()) {
			const matchesSearch =
				searchQuery.length > 0 && entry.node.label?.toLowerCase().includes(searchQuery.toLowerCase());
			entry.sprite.visible =
				matchesSearch || (entry.facing > 0.15 && index < MAX_VISIBLE_LABELS && entry.distance <= distanceThreshold);
		}
	}

	function applyAutoRotate(timestamp: number) {
		if (!graph3d || timestamp < rotationPausedUntil) return;
		const camera = graph3d.camera();
		if (!camera) return;

		const center = graph3d.scene()?.position ?? { x: 0, y: 0, z: 0 };
		const dx = camera.position.x - center.x;
		const dz = camera.position.z - center.z;
		const radius = Math.hypot(dx, dz);
		if (radius < 1) return;

		const delta = previousFrameTimestamp === null ? 16 : Math.max(0, timestamp - previousFrameTimestamp);
		const angle = Math.atan2(dz, dx) + AUTO_ROTATE_SPEED * delta;
		camera.position.x = center.x + Math.cos(angle) * radius;
		camera.position.z = center.z + Math.sin(angle) * radius;
		camera.lookAt(center.x, center.y, center.z);
		graph3d.controls?.().update?.();
	}

	// RAF loop: label distance + pending updates
	function rafLoop(timestamp: number) {
		applyPendingUpdates();
		applyAutoRotate(timestamp);
		updateLabelVisibility();
		previousFrameTimestamp = timestamp;
		rafId = requestAnimationFrame(rafLoop);
	}

	$effect(() => {
		dark;
		searchQuery;
		if (!graph3d) return;
		markColorsDirty();
	});

	$effect(() => {
		dark;
		if (!graph3d) return;
		markLabelsDirty();
	});

	$effect(() => {
		skills;
		if (!graph3d || !graphInitialized) return;
		graph3d.graphData(buildGraphData(skills, dark));
		graph3d.d3ReheatSimulation?.();
		if (initialCameraPos === null) {
			initialCameraPos = { ...graph3d.cameraPosition() };
		}
		markColorsDirty();
		markLabelsDirty();
	});

	onMount(async () => {
		const ForceGraph3D = (await import('3d-force-graph')).default as any;

		dark = checkDark();
		const data = buildGraphData(skills, dark);
		const colors = getColors(dark);
		const bgColor = dark ? '#0f172a' : '#ffffff';

		graph3d = ForceGraph3D()(container)
			.width(container.clientWidth)
			.height(container.clientHeight)
			.backgroundColor(bgColor)
			.graphData(data)
			.nodeVal((node: GraphNode) => node.size)
			.nodeColor((node: GraphNode) => node.color)
			.nodeLabel((node: GraphNode) => {
				const d = checkDark();
				const type = node.nodeType === 'repo' ? 'Repository' : 'Skill';
				return `<div style="background:${d ? '#1e293b' : '#fff'};color:${d ? '#e2e8f0' : '#1e293b'};padding:4px 8px;border-radius:4px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
					<strong>${node.label}</strong><br/>
					<span style="opacity:0.7">${type}</span>
				</div>`;
			})
			.nodeOpacity(0.9)
			.nodeThreeObjectExtend(true)
			.nodeThreeObject((node: any) => {
				const sprite = createTextSprite(node.label ?? '', dark);
				sprite.position.set(0, (node.size ?? 1.5) + 3, 0);
				node.__labelSprite = sprite;
				return sprite;
			})
			.linkColor((link: any) => link.color)
			.linkWidth((link: any) => (link.edgeType === 'derived_from' ? 0.8 : 0.3))
			.linkOpacity(0.6)
			.linkDirectionalArrowLength((link: any) => (link.edgeType === 'derived_from' ? 3 : 0))
			.linkDirectionalArrowRelPos(1)
			.linkDirectionalArrowColor((link: any) => (link.edgeType === 'derived_from' ? colors.edgeDerivedFrom : null))
			.onNodeClick((node: GraphNode) => {
				onNodeSelect?.(node.id, node as GraphNodeAttrs);
			})
			.onBackgroundClick(() => {
				onNodeSelect?.(null, null);
			});

		// Capture initial camera position once the graph engine stabilizes
		graph3d.onEngineStop(() => {
			if (!initialCameraPos) {
				initialCameraPos = { ...graph3d.cameraPosition() };
			}
		});

		// Resize canvas when container resizes
		resizeObserver = new ResizeObserver(() => {
			if (graph3d && container) {
				graph3d.width(container.clientWidth).height(container.clientHeight);
			}
		});
		resizeObserver.observe(container);

		const controls = graph3d.controls();
		controls.autoRotate = false;
		controls.enableDamping = true;
		controls.dampingFactor = 0.08;

		const pauseRotation = () => {
			rotationPausedUntil = performance.now() + 5000;
			if (interactionResumeTimer) clearTimeout(interactionResumeTimer);
			interactionResumeTimer = setTimeout(() => {
				rotationPausedUntil = 0;
			}, 5000);
		};
		container.addEventListener('mousedown', pauseRotation);
		container.addEventListener('wheel', pauseRotation);
		container.addEventListener('touchstart', pauseRotation);

		// Dark mode observer
		darkModeObserver = new MutationObserver(() => {
			dark = checkDark();
		});
		darkModeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		graphInitialized = true;

		// Start RAF loop for label visibility & deferred updates
		rafLoop(performance.now());
	});

	onDestroy(() => {
		if (rafId !== null) cancelAnimationFrame(rafId);
		if (interactionResumeTimer) clearTimeout(interactionResumeTimer);
		darkModeObserver?.disconnect();
		resizeObserver?.disconnect();
		graphInitialized = false;
		if (graph3d) {
			graph3d._destructor?.();
			graph3d = null;
		}
	});
</script>

<div bind:this={container} class="absolute inset-0"></div>
