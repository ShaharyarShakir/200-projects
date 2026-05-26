<script lang="ts">
	import { isInstanceOf, T as Threlte } from '@threlte/core';
	import { createTransition, Float } from '@threlte/extras';
	import gsap from 'gsap';
	import { elasticIn, elasticOut } from 'svelte/easing';
	// @ts-ignore
	import * as THREE from 'three';
	export let position: [number, number, number] = [0, 0, 0];
	export let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(3);
	export let rate = 0.5;
	let soundEffects = [
		new Audio('/sounds/impact1.ogg'),
		new Audio('/sounds/impact2.ogg'),
		new Audio('/sounds/impact3.ogg'),
		new Audio('/sounds/impact4.ogg')
	];
	let visible = false;
	const randomMaterial = [
		{ color: 0x2ecc71, roughness: 0 },
		{ color: 0xf1c40f, roughness: 0.4 },
		{ color: 0xe74c3c, roughness: 0.1 },
		{ color: 0x8e44ad, roughness: 0.1 },
		{ color: 0x1abc9c, roughness: 0.1 },
		{ color: 0x2980b9, roughness: 0, metalness: 0.5 },
		{ color: 0x2c3e50, roughness: 0.1, metalness: 0.5 }
	];

	const getRandomMaterial = () => {
		const randomINT = gsap.utils.random(1, 10, 1);
		if (randomINT === 1) {
			return new THREE.MeshNormalMaterial();
		}
		return new THREE.MeshStandardMaterial(gsap.utils.random(randomMaterial));
	};
	const handleClick = (event: MouseEvent & { object?: unknown }) => {
		// play audio
		gsap.utils.random(soundEffects).play();
		// Check if event.object exists and is a THREE.Mesh
		if (event && 'object' in event && event.object instanceof THREE.Mesh) {
			const mesh = event.object as THREE.Mesh;
			gsap.to(mesh.rotation, {
				x: `+=${gsap.utils.random(0, 3)}`,
				y: `+=${gsap.utils.random(0, 3)}`,
				z: `+=${gsap.utils.random(0, 3)}`,
				duration: 1.3,
				ease: 'elastic.out(1, 0.3)',
				yoyo: true
			});
			mesh.material = getRandomMaterial();
		}
	};
	const bounce = createTransition((ref) => {
		return {
			tick(t) {
				if (t > 0) visible = true;
				ref.scale.set(t, t, t);
			},
			easing: elasticOut,
			duration: gsap.utils.random(800, 1200),
			delay: gsap.utils.random(0, 600)
		};
	});
</script>

<Threlte.Group position={position.map((p) => p * 2)}>
	<Float
		speed={6 * rate}
		rotationSpeed={6 * rate}
		rotationIntensity={7 * rate}
		floatIntensity={6 * rate}
	>
		<Threlte.Mesh
			in={bounce}
			{visible}
			{geometry}
			material={getRandomMaterial()}
			interactive
			onclick={handleClick}
		></Threlte.Mesh>
	</Float>
</Threlte.Group>
