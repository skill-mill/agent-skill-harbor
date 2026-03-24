<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * WebGL water ripple background effect.
	 * Ported from sirxemic/jquery.ripples (MIT) without jQuery dependency.
	 * Uses heightmap ping-pong framebuffers with fragment shaders for wave simulation,
	 * and renders refraction + specular highlights over a gradient background texture.
	 */

	let { resolution = 768, dropRadius = 20, perturbance = 0.03, class: className = '', children } = $props();

	const COLORS = {
		darkStart: '#0a1628',
		darkEnd: '#000810',
		lightStart: '#b8d4e8',
		lightEnd: '#e8f0f8',
	};

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let isLight = $state(false);
	let glSupported = $state(true);

	let bgStyle = $derived.by(() => {
		const start = isLight ? COLORS.lightStart : COLORS.darkStart;
		const end = isLight ? COLORS.lightEnd : COLORS.darkEnd;
		return `radial-gradient(ellipse at bottom, ${start} 0%, ${end} 100%)`;
	});

	// --- Shaders (matching jquery.ripples) ---

	const VERT_SIMPLE = `
		attribute vec2 vertex;
		varying vec2 coord;
		void main() {
			coord = vertex * 0.5 + 0.5;
			gl_Position = vec4(vertex, 0.0, 1.0);
		}
	`;

	const VERT_RENDER = `
		precision highp float;
		attribute vec2 vertex;
		uniform vec2 containerRatio;
		varying vec2 ripplesCoord;
		varying vec2 backgroundCoord;
		void main() {
			backgroundCoord = vertex * 0.5 + 0.5;
			backgroundCoord.y = 1.0 - backgroundCoord.y;
			ripplesCoord = vec2(vertex.x, -vertex.y) * containerRatio * 0.5 + 0.5;
			gl_Position = vec4(vertex.x, -vertex.y, 0.0, 1.0);
		}
	`;

	const FRAG_DROP = `
		precision highp float;
		const float PI = 3.141592653589793;
		uniform sampler2D texture;
		uniform vec2 center;
		uniform float radius;
		uniform float strength;
		varying vec2 coord;
		void main() {
			vec4 info = texture2D(texture, coord);
			float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
			drop = 0.5 - cos(drop * PI) * 0.5;
			info.r += drop * strength;
			gl_FragColor = info;
		}
	`;

	const FRAG_UPDATE = `
		precision highp float;
		uniform sampler2D texture;
		uniform vec2 delta;
		varying vec2 coord;
		void main() {
			vec4 info = texture2D(texture, coord);
			vec2 dx = vec2(delta.x, 0.0);
			vec2 dy = vec2(0.0, delta.y);
			float average = (
				texture2D(texture, coord - dx).r +
				texture2D(texture, coord - dy).r +
				texture2D(texture, coord + dx).r +
				texture2D(texture, coord + dy).r
			) * 0.25;
			info.g += (average - info.r) * 2.0;
			info.g *= 0.995;
			info.r += info.g;
			gl_FragColor = info;
		}
	`;

	const FRAG_RENDER = `
		precision highp float;
		uniform sampler2D samplerBackground;
		uniform sampler2D samplerRipples;
		uniform vec2 delta;
		uniform float perturbance;
		varying vec2 ripplesCoord;
		varying vec2 backgroundCoord;
		void main() {
			float height = texture2D(samplerRipples, ripplesCoord).r;
			float heightX = texture2D(samplerRipples, vec2(ripplesCoord.x + delta.x, ripplesCoord.y)).r;
			float heightY = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y + delta.y)).r;
			vec3 dx = vec3(delta.x, heightX - height, 0.0);
			vec3 dy = vec3(0.0, heightY - height, delta.y);
			vec2 offset = -normalize(cross(dy, dx)).xz;
			float specular = pow(max(0.0, dot(offset, normalize(vec2(-0.6, 1.0)))), 4.0);
			gl_FragColor = texture2D(samplerBackground, backgroundCoord + offset * perturbance) + specular;
		}
	`;

	onMount(() => {
		// Theme detection (same pattern as StarsBackground)
		function checkTheme() {
			isLight = !document.documentElement.classList.contains('dark');
		}
		checkTheme();
		const themeObserver = new MutationObserver(checkTheme);
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		// WebGL init
		const gl = canvas.getContext('webgl');
		if (!gl) {
			glSupported = false;
			themeObserver.disconnect();
			return;
		}

		// Float texture support (try OES_texture_float first, then half_float)
		const floatExt = gl.getExtension('OES_texture_float');
		gl.getExtension('OES_texture_float_linear');
		const halfFloatExt = gl.getExtension('OES_texture_half_float');
		gl.getExtension('OES_texture_half_float_linear');

		let texType: number;
		if (floatExt) {
			texType = gl.FLOAT;
		} else if (halfFloatExt) {
			texType = halfFloatExt.HALF_FLOAT_OES;
		} else {
			// No float texture support — fall back to CSS background
			glSupported = false;
			themeObserver.disconnect();
			return;
		}

		// Quad buffer (TRIANGLE_FAN like original)
		const quad = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, quad);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

		function drawQuad() {
			gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
			gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
			gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4);
		}

		// Shader compilation
		function compileShader(type: number, source: string): WebGLShader {
			const s = gl!.createShader(type)!;
			gl!.shaderSource(s, source);
			gl!.compileShader(s);
			return s;
		}

		function linkProgram(vertSrc: string, fragSrc: string) {
			const id = gl!.createProgram()!;
			gl!.attachShader(id, compileShader(gl!.VERTEX_SHADER, vertSrc));
			gl!.attachShader(id, compileShader(gl!.FRAGMENT_SHADER, fragSrc));
			gl!.linkProgram(id);
			gl!.useProgram(id);
			gl!.enableVertexAttribArray(0);
			return {
				id,
				loc(name: string) {
					return gl!.getUniformLocation(id, name);
				},
			};
		}

		const dropProg = linkProgram(VERT_SIMPLE, FRAG_DROP);
		const updateProg = linkProgram(VERT_SIMPLE, FRAG_UPDATE);
		const renderProg = linkProgram(VERT_RENDER, FRAG_RENDER);

		const textureDelta = new Float32Array([1 / resolution, 1 / resolution]);

		// Set initial uniform for update program
		gl.useProgram(updateProg.id);
		gl.uniform2fv(updateProg.loc('delta'), textureDelta);

		// Set initial uniform for render program
		gl.useProgram(renderProg.id);
		gl.uniform2fv(renderProg.loc('delta'), textureDelta);

		// Heightmap framebuffers (ping-pong)
		const textures: WebGLTexture[] = [];
		const framebuffers: WebGLFramebuffer[] = [];
		let writeIdx = 0;
		let readIdx = 1;

		for (let i = 0; i < 2; i++) {
			const tex = gl.createTexture()!;
			const fb = gl.createFramebuffer()!;
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, texType, null);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

			// Verify framebuffer completeness; fallback to half_float
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && halfFloatExt) {
				texType = halfFloatExt.HALF_FLOAT_OES;
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, texType, null);
			}

			textures.push(tex);
			framebuffers.push(fb);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		function swapBuffers() {
			writeIdx = 1 - writeIdx;
			readIdx = 1 - readIdx;
		}

		// Background gradient texture (rendered via offscreen 2D canvas)
		const bgTexture = gl.createTexture()!;
		let bgNeedsUpdate = true;
		let prevIsLight: boolean | null = null;

		function updateBackgroundTexture() {
			const size = 2048;
			const offscreen = document.createElement('canvas');
			offscreen.width = size;
			offscreen.height = size;
			const ctx2d = offscreen.getContext('2d')!;

			const startColor = isLight ? COLORS.lightStart : COLORS.darkStart;
			const endColor = isLight ? COLORS.lightEnd : COLORS.darkEnd;

			// Radial gradient from bottom center
			const grd = ctx2d.createRadialGradient(size / 2, size, size * 0.1, size / 2, size / 2, size * 0.9);
			grd.addColorStop(0, startColor);
			grd.addColorStop(1, endColor);
			ctx2d.fillStyle = grd;
			ctx2d.fillRect(0, 0, size, size);

			gl!.bindTexture(gl!.TEXTURE_2D, bgTexture);
			gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, 1);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
			gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, offscreen);
		}
		updateBackgroundTexture();

		// Drop function (matching jquery.ripples coordinate system)
		function drop(x: number, y: number, radius: number, strength: number) {
			const elWidth = canvas.width;
			const elHeight = canvas.height;
			const longestSide = Math.max(elWidth, elHeight);

			const dropPosition = new Float32Array([(2 * x - elWidth) / longestSide, (elHeight - 2 * y) / longestSide]);

			gl!.viewport(0, 0, resolution, resolution);
			gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffers[writeIdx]);
			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, textures[readIdx]);
			gl!.useProgram(dropProg.id);
			gl!.enableVertexAttribArray(0);
			gl!.uniform1i(dropProg.loc('texture'), 0);
			gl!.uniform2fv(dropProg.loc('center'), dropPosition);
			gl!.uniform1f(dropProg.loc('radius'), radius / longestSide);
			gl!.uniform1f(dropProg.loc('strength'), strength);
			drawQuad();
			swapBuffers();
		}

		// Mouse events (matching jquery.ripples behavior)
		function getDpr() {
			return canvas.width / window.innerWidth;
		}

		function handleMouseMove(e: MouseEvent) {
			const dpr = getDpr();
			drop(e.clientX * dpr, e.clientY * dpr, dropRadius * dpr, 0.01);
		}

		function handleMouseDown(e: MouseEvent) {
			const dpr = getDpr();
			drop(e.clientX * dpr, e.clientY * dpr, dropRadius * 1.5 * dpr, 0.14);
		}

		container.addEventListener('mousemove', handleMouseMove);
		container.addEventListener('mousedown', handleMouseDown);

		let animationId: number | null = null;
		let rainInterval: ReturnType<typeof setInterval> | null = null;
		let isActive = false;

		function startRain() {
			if (rainInterval !== null) return;
			rainInterval = setInterval(() => {
				if (document.hidden) return;
				const dpr = getDpr();
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				drop(x, y, dropRadius * 0.6 * dpr, 0.03 + Math.random() * 0.02);
			}, 1200);
		}

		function stopRain() {
			if (rainInterval === null) return;
			clearInterval(rainInterval);
			rainInterval = null;
		}

		// Resize handling
		function resize() {
			const dpr = Math.min(window.devicePixelRatio, 2);
			const w = Math.floor(window.innerWidth * dpr);
			const h = Math.floor(window.innerHeight * dpr);
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
		}
		window.addEventListener('resize', resize);
		resize();

		function frame() {
			if (!isActive) return;

			// Update background texture on theme change
			if (prevIsLight !== isLight) {
				prevIsLight = isLight;
				updateBackgroundTexture();
			}

			// Update heightmap
			gl!.viewport(0, 0, resolution, resolution);
			gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffers[writeIdx]);
			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, textures[readIdx]);
			gl!.useProgram(updateProg.id);
			gl!.enableVertexAttribArray(0);
			drawQuad();
			swapBuffers();

			// Render to screen
			gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
			gl!.viewport(0, 0, canvas.width, canvas.height);
			gl!.enable(gl!.BLEND);
			gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
			gl!.clear(gl!.COLOR_BUFFER_BIT);

			gl!.useProgram(renderProg.id);
			gl!.enableVertexAttribArray(0);

			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, bgTexture);
			gl!.activeTexture(gl!.TEXTURE1);
			gl!.bindTexture(gl!.TEXTURE_2D, textures[readIdx]);

			gl!.uniform1i(renderProg.loc('samplerBackground'), 0);
			gl!.uniform1i(renderProg.loc('samplerRipples'), 1);
			gl!.uniform1f(renderProg.loc('perturbance'), perturbance);

			const maxSide = Math.max(canvas.width, canvas.height);
			gl!.uniform2f(renderProg.loc('containerRatio'), canvas.width / maxSide, canvas.height / maxSide);

			drawQuad();
			gl!.disable(gl!.BLEND);

			animationId = requestAnimationFrame(frame);
		}

		function startAnimation() {
			if (isActive) return;
			isActive = true;
			startRain();
			animationId = requestAnimationFrame(frame);
		}

		function stopAnimation() {
			isActive = false;
			stopRain();
			if (animationId !== null) {
				cancelAnimationFrame(animationId);
				animationId = null;
			}
		}

		function handleVisibilityChange() {
			if (document.hidden) {
				stopAnimation();
				return;
			}
			startAnimation();
		}

		gl.clearColor(0, 0, 0, 0);
		startAnimation();
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			themeObserver.disconnect();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			stopAnimation();
			window.removeEventListener('resize', resize);
			container.removeEventListener('mousemove', handleMouseMove);
			container.removeEventListener('mousedown', handleMouseDown);
			gl!.deleteBuffer(quad);
			gl!.deleteTexture(textures[0]);
			gl!.deleteTexture(textures[1]);
			gl!.deleteTexture(bgTexture);
			gl!.deleteFramebuffer(framebuffers[0]);
			gl!.deleteFramebuffer(framebuffers[1]);
			gl!.deleteProgram(dropProg.id);
			gl!.deleteProgram(updateProg.id);
			gl!.deleteProgram(renderProg.id);
		};
	});
</script>

<div
	bind:this={container}
	class="relative size-full overflow-hidden {className}"
	style:background={glSupported ? 'transparent' : bgStyle}
>
	<canvas bind:this={canvas} class="fixed inset-0 h-screen w-screen" style:pointer-events="none"></canvas>
	{#if children}
		<div class="relative z-10">
			{@render children()}
		</div>
	{/if}
</div>
