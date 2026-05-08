let slideIndex = 0;
const slides = document.querySelectorAll(".slide");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");

slideShow(slideIndex);
function slideShow(index) {
	slides.forEach((slide) => slide.classList.remove("active"));
	slides[index].classList.add("active");
}
function nextSlide() {
	slideIndex = (slideIndex + 1) % slides.length;
	slideShow(slideIndex);
}
function prevSlide() {
	slideIndex = (slideIndex - 1 + slides.length) % slides.length;
	slideShow(slideIndex);
}
next.addEventListener("click", nextSlide);
prev.addEventListener("click", prevSlide);

setInterval(nextSlide, 5000); 
