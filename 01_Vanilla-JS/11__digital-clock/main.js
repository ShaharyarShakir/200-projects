let clock = document.getElementById("clock");

function updateClock() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const amPm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = String(hours).padStart(2, "0");
  const timeString = `${hours}:${minutes}:${seconds} ${amPm}`;
  clock.textContent = timeString;
}

setInterval(updateClock, 1000);

updateClock();
