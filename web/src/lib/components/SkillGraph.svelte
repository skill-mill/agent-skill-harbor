<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { FlatSkillEntry } from '$lib/types';
	import { buildSkillGraph, getColors, type GraphNodeAttrs } from '$lib/utils/graph';

	interface Props {
		skills: FlatSkillEntry[];
		searchQuery?: string;
		onNodeSelect?: (nodeId: string | null, attrs: GraphNodeAttrs | null) => void;
	}

	let { skills, searchQuery = '', onNodeSelect }: Props = $props();

	export function zoomIn() {
		sigmaInstance?.getCamera().animatedZoom();
	}

	export function zoomOut() {
		sigmaInstance?.getCamera().animatedUnzoom();
	}

	export function zoomReset() {
		sigmaInstance?.getCamera().animatedReset();
	}

	let container: HTMLDivElement;
	let sigmaInstance = $state<any>(null);
	let graphInstance: any = null;

	let hoveredNode = $state<string | null>(null);
	let selectedNode = $state<string | null>(null);
	let draggedNode = $state<string | null>(null);
	let isDragging = $state(false);
	let dark = $state(false);

	function checkDark(): boolean {
		return document.documentElement.classList.contains('dark');
	}

	/** Faded color for non-highlighted nodes */
	let fadedColor = $derived(dark ? '#334155' : '#e2e8f0');

	/** Custom hover draw that respects dark mode */
	function drawHover(context: CanvasRenderingContext2D, data: any, settings: any) {
		const size = settings.labelSize;
		const font = settings.labelFont;
		const weight = settings.labelWeight;
		context.font = `${weight} ${size}px ${font}`;

		const bgColor = dark ? '#1e293b' : '#ffffff';
		const shadowColor = dark ? '#000000' : '#00000040';

		context.fillStyle = bgColor;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 2;
		context.shadowBlur = 8;
		context.shadowColor = shadowColor;

		const PADDING = 2;
		if (typeof data.label === 'string') {
			const textWidth = context.measureText(data.label).width;
			const boxWidth = Math.round(textWidth + 5);
			const boxHeight = Math.round(size + 2 * PADDING);
			const radius = Math.max(data.size, size / 2) + PADDING;
			const angleRadian = Math.asin(boxHeight / 2 / radius);
			const xDeltaCoord = Math.sqrt(Math.abs(radius ** 2 - (boxHeight / 2) ** 2));

			context.beginPath();
			context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
			context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
			context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
			context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
			context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
			context.closePath();
			context.fill();
		} else {
			context.beginPath();
			context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
			context.closePath();
			context.fill();
		}

		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 0;

		// Draw label
		if (typeof data.label === 'string') {
			const labelColor = dark ? '#e2e8f0' : '#1e293b';
			context.fillStyle = labelColor;
			context.font = `${weight} ${size}px ${font}`;
			context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
		}
	}

	// Reactive: when hover/select/dark change, update rendering
	$effect(() => {
		if (!sigmaInstance) return;
		void selectedNode;
		void hoveredNode;
		void dark;
		void searchQuery;
		sigmaInstance.refresh();
	});

	let darkModeObserver: MutationObserver | null = null;

	onMount(async () => {
		const [
			{ default: Sigma },
			{ default: Graph },
			{ default: forceAtlas2 },
			{ createEdgeArrowProgram }
		] = await Promise.all([
			import('sigma'),
			import('graphology'),
			import('graphology-layout-forceatlas2'),
			import('sigma/rendering')
		]);

		const LargeArrowProgram = createEdgeArrowProgram({
			lengthToThicknessRatio: 5,
			widenessToThicknessRatio: 4
		});

		dark = checkDark();
		const graph = buildSkillGraph(skills, dark);
		graphInstance = graph;

		// Apply ForceAtlas2 layout
		forceAtlas2.assign(graph, {
			iterations: 100,
			settings: {
				gravity: 1,
				scalingRatio: 10,
				barnesHutOptimize: graph.order > 100,
				strongGravityMode: true
			}
		});

		const sigma = new Sigma(graph, container, {
			labelRenderedSizeThreshold: 8,
			labelDensity: 0.3,
			labelSize: 13,
			labelColor: { color: dark ? '#e2e8f0' : '#1e293b' },
			defaultEdgeColor: getColors(dark).edgeLivesIn,
			defaultNodeColor: getColors(dark).skill,
			edgeProgramClasses: {
				arrow: LargeArrowProgram
			},
			defaultDrawNodeHover: drawHover,
			zIndex: true,
			nodeReducer: (node: string, data: any) => {
				const res = { ...data };
				const neighborSet = hoveredNode
					? new Set(graph.neighbors(hoveredNode))
					: null;

				// Hover highlight (takes priority)
				if (hoveredNode) {
					if (node === hoveredNode) {
						res.highlighted = true;
						res.zIndex = 2;
					} else if (neighborSet && neighborSet.has(node)) {
						res.zIndex = 1;
					} else {
						res.color = fadedColor;
						res.label = '';
						res.zIndex = 0;
					}
				} else if (searchQuery) {
					// Search highlight (only when not hovering)
					const match = data.label?.toLowerCase().includes(searchQuery.toLowerCase());
					if (match) {
						res.highlighted = true;
						res.zIndex = 1;
					} else {
						res.color = fadedColor;
						res.label = '';
						res.zIndex = 0;
					}
				}

				// Selected node
				if (selectedNode && node === selectedNode) {
					res.highlighted = true;
					res.zIndex = 2;
				}

				return res;
			},
			edgeReducer: (edge: string, data: any) => {
				const res = { ...data };

				if (hoveredNode) {
					const ends = graph.extremities(edge);
					if (!ends.includes(hoveredNode)) {
						res.hidden = true;
					} else {
						res.zIndex = 1;
					}
				} else if (searchQuery) {
					const ends = graph.extremities(edge);
					const anyMatch = ends.some((n: string) => {
						const label = graph.getNodeAttribute(n, 'label') as string;
						return label?.toLowerCase().includes(searchQuery.toLowerCase());
					});
					if (!anyMatch) {
						res.hidden = true;
					}
				}

				return res;
			}
		});

		sigmaInstance = sigma;

		// Event: hover
		sigma.on('enterNode', ({ node }) => {
			hoveredNode = node;
			container.style.cursor = 'pointer';
		});
		sigma.on('leaveNode', () => {
			hoveredNode = null;
			container.style.cursor = 'default';
		});

		// Event: click node
		sigma.on('clickNode', ({ node }) => {
			selectedNode = node;
			const attrs = graph.getNodeAttributes(node) as GraphNodeAttrs;
			onNodeSelect?.(node, attrs);
		});

		// Event: click stage (deselect)
		sigma.on('clickStage', () => {
			selectedNode = null;
			onNodeSelect?.(null, null);
		});

		// Node drag
		sigma.on('downNode', (e: any) => {
			isDragging = true;
			draggedNode = e.node;
			sigma.getCamera().disable();
		});

		sigma.getMouseCaptor().on('mousemovebody', (e: any) => {
			if (!isDragging || !draggedNode) return;
			const pos = sigma.viewportToGraph(e);
			graph.setNodeAttribute(draggedNode, 'x', pos.x);
			graph.setNodeAttribute(draggedNode, 'y', pos.y);
			e.preventSigmaDefault();
			e.original.preventDefault();
			e.original.stopPropagation();
		});

		const handleUp = () => {
			if (isDragging) {
				isDragging = false;
				draggedNode = null;
				sigma.getCamera().enable();
			}
		};
		sigma.getMouseCaptor().on('mouseup', handleUp);

		// Dark mode observer
		darkModeObserver = new MutationObserver(() => {
			dark = checkDark();
			const c = getColors(dark);
			sigma.setSetting('labelColor', { color: dark ? '#e2e8f0' : '#1e293b' });
			sigma.setSetting('defaultDrawNodeHover', drawHover);

			graph.forEachNode((node: string) => {
				const nt = graph.getNodeAttribute(node, 'nodeType');
				graph.setNodeAttribute(node, 'color', nt === 'skill' ? c.skill : c.repo);
			});
			graph.forEachEdge((edge: string) => {
				const et = graph.getEdgeAttribute(edge, 'edgeType');
				graph.setEdgeAttribute(
					edge,
					'color',
					et === 'derived_from' ? c.edgeDerivedFrom : c.edgeLivesIn
				);
			});
		});

		darkModeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
	});

	onDestroy(() => {
		darkModeObserver?.disconnect();
		sigmaInstance?.kill();
		sigmaInstance = null;
		graphInstance = null;
	});
</script>

<div bind:this={container} class="absolute inset-0"></div>
