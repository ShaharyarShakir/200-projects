<script lang="ts">
	let {
		customNiche = $bindable(''),
		selectedNiche = $bindable('Celebrity Drama & Pop Culture')
	}: {
		customNiche: string;
		selectedNiche: string;
	} = $props();

	const niches = [
		{ title: 'Making Money Online', icon: '💸' },
		{ title: 'Credit Cards & Credit Score', icon: '💳' },
		{ title: 'Algorithms & Social Media Growth', icon: '📈' },
		{ title: 'AI Tools & Automation', icon: '🤖' },
		{ title: 'Side Hustles for Beginners', icon: '🛠️' },
		{ title: 'Real Estate Basics', icon: '🏡' },
		{ title: 'Crypto & Web3 Education', icon: '🪙' },
		{ title: 'Ecommerce & Dropshipping', icon: '🛒' },
		{ title: 'Career Advice & Resumes', icon: '👨‍💼' },
		{ title: 'College Shortcuts & Survival Tips', icon: '🎓' },
		{ title: 'Productivity & Focus', icon: '⏱️' },
		{ title: 'Fitness Myths & Fat Loss', icon: '🏋️' },
		{ title: 'Nutrition & Supplements', icon: '🥗' },
		{ title: 'Tech Startups & Apps', icon: '🚀' },
		{ title: 'Investing for Beginners', icon: '📊' },
		{ title: 'Sales Psychology', icon: '🧠' },
		{ title: 'Marketing & Paid Ads', icon: '📣' },
		{ title: 'Freelancing & Solopreneur Life', icon: '💼' },
		{ title: 'Internet Scams & Warnings', icon: '🚨' },
		{ title: 'Conspiracy Theories & Cover-Ups', icon: '🕵️' },
		{ title: 'Paranormal & UFO Sightings', icon: '🛸' },
		{ title: 'True Crime & Unsolved Cases', icon: '🔍' },
		{ title: 'Celebrity Drama & Pop Culture', icon: '🎬' },
		{ title: 'Dark Psychology & Manipulation', icon: '👁️' },
		{ title: 'Geopolitics & World Events', icon: '🌍' },
		{ title: 'History Mysteries & Lost Civilizations', icon: '🏛️' },
		{ title: 'Weird Facts & Shower Thoughts', icon: '💡' },
		{ title: 'Business Stories & Lessons', icon: '📚' }
	];
</script>

<div class="space-y-6 animate-in fade-in duration-200">
	<div>
		<h3 class="font-heading text-2xl font-black text-white">Pick your niche</h3>
		<p class="text-xs text-gray-400 mt-1">
			Choose one niche to generate video ideas for. You can also type a custom niche below.
		</p>
	</div>

	<!-- Custom Niche Input -->
	<div>
		<input
			type="text"
			bind:value={customNiche}
			placeholder="Type a custom niche..."
			class="input w-full bg-[#131624] border-white/10 focus:border-emerald-500 text-sm text-white placeholder:text-gray-500 rounded-xl p-3.5"
		/>
	</div>

	<div class="relative text-center my-4">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
		<span class="relative bg-[#0d0f17] px-4 text-[10px] font-bold text-gray-500 tracking-widest uppercase">
			OR PICK ONE
		</span>
	</div>

	<!-- Niches Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
		{#each niches as niche}
			<button
				onclick={() => (selectedNiche = niche.title)}
				class="flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all {selectedNiche === niche.title ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md shadow-emerald-500/10' : 'border-white/5 bg-[#131624] text-gray-300 hover:border-white/20 hover:text-white'}"
			>
				<span class="text-base">{niche.icon}</span>
				<span class="truncate">{niche.title}</span>
			</button>
		{/each}
	</div>
</div>
