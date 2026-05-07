document.getElementById("searchBtn").addEventListener("click", fetchPokemon);

async function fetchPokemon() {
	const nameOrId = document
		.getElementById("pokemonInput")
		.value.toLowerCase()
		.trim();
	const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
	const cardContainer = document.getElementById("cardContainer");
	const errorMessage = document.getElementById("errorMessage");

	// Clear previous content
	cardContainer.innerHTML = "";
	errorMessage.textContent = "";

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error("Pokémon not found");
		}
		const data = await response.json();

		const { name, sprites, types, abilities, stats } = data;

		// Create Card
		const card = document.createElement("div");
		card.className = "card";

		card.style.background = getTypeColor(types[0].type.name);
		// Image and Name
		const img = document.createElement("img");
		img.src = sprites.front_default;

		const title = document.createElement("h2");
		title.textContent = name.charAt(0).toUpperCase() + name.slice(1);

		// Types
		const typeContainer = document.createElement("div");
		typeContainer.className = "types";
		types.forEach((t) => {
			const type = document.createElement("span");
			type.textContent = t.type.name;
			type.style.backgroundColor = getTypeColor(t.type.name);
			typeContainer.appendChild(type);
		});

		// Abilities
		const abilityList = document.createElement("div");
		abilityList.className = "abilities";
		const abilityTitle = document.createElement("h4");
		abilityTitle.textContent = "Abilities";
		abilityList.appendChild(abilityTitle);
		abilities.forEach((a) => {
			const ability = document.createElement("p");
			ability.textContent = a.ability.name;
			abilityList.appendChild(ability);
		});

		// Stats
		const statsList = document.createElement("div");
		statsList.className = "stats";
		const statsTitle = document.createElement("h4");
		statsTitle.textContent = "Stats";
		statsList.appendChild(statsTitle);
		stats.forEach((s) => {
			const stat = document.createElement("p");
			stat.textContent = `${s.stat.name}: ${s.base_stat}`;
			statsList.appendChild(stat);
		});

		// Append All
		card.appendChild(img);
		card.appendChild(title);
		card.appendChild(typeContainer);
		card.appendChild(abilityList);
		card.appendChild(statsList);
		cardContainer.appendChild(card);
	} catch (error) {
		errorMessage.textContent = error.message;
	}
}

function getTypeColor(type) {
	const gradients = {
		fire: "linear-gradient(to right, #ff416c, #ff4b2b)",
		water: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
		grass: "linear-gradient(to right, #11998e, #38ef7d)",
		electric: "linear-gradient(to right, #f7971e, #ffd200)",
		psychic: "linear-gradient(to right, #a770ef, #cf8bf3, #fdb99b)",
		dark: "linear-gradient(to right, #232526, #414345)",
		ghost: "linear-gradient(to right, #434343, #000000)",
		dragon: "linear-gradient(to right, #6441a5, #2a0845)",
		steel: "linear-gradient(to right, #757f9a, #d7dde8)",
		normal: "linear-gradient(to right, #4b6cb7, #182848)",
		fairy: "linear-gradient(to right, #ff9a9e, #fad0c4)",
		ice: "linear-gradient(to right, #83a4d4, #b6fbff)",
		bug: "linear-gradient(to right, #a8c0ff, #3f2b96)",
		rock: "linear-gradient(to right, #e0eafc, #cfdef3)",
		poison: "linear-gradient(to right, #6a3093, #a044ff)",
		flying: "linear-gradient(to right, #2980b9, #6dd5fa)",
		ground: "linear-gradient(to right, #ba8b02, #181818)",
		fighting: "linear-gradient(to right, #cb2d3e, #ef473a)",
	};

	return (
		gradients[type] ||
		"linear-gradient(to right, cyan, purple, yellow, red, blue, green, magenta)"
	);
}
