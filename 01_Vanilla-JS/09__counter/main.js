let count = 0;
let counter = document.querySelector("#counter");
let increment = document.querySelector("#increment");
let decrement = document.querySelector("#decrement");
let reset = document.querySelector("#reset");
let container = document.querySelector(".container");

const increase = () => {
	count++;
	updateCounter();
	removeError();
};

const decrease = () => {
	if (count > 0) {
		count--;
		updateCounter();
		removeError();
	} else {
		showError("Value must not be less than zero");
	}
};

const updateCounter = () => {
	counter.textContent = count;
};

const resetCounter = () => {
	count = 0;
	updateCounter();
	removeError();
};

const showError = (message) => {
	if (!document.querySelector(".error")) {
		const span = document.createElement("span");
		span.textContent = message;
		span.className = "error";
		span.style.color = "red";
		span.style.fontSize = "1.2rem";
		span.style.display = "block";
		span.style.marginTop = "10px";
		container.appendChild(span);
	}
};

const removeError = () => {
	const existing = document.querySelector(".error");
	if (existing) existing.remove();
};

increment.addEventListener("click", increase);
decrement.addEventListener("click", decrease);
reset.addEventListener("click", resetCounter);
