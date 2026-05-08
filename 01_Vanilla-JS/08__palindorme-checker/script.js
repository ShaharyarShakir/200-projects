const result = document.getElementById("output");

function checkPalindrome() {
  let input = document.getElementById("input").value;
  let check = document.querySelector("#check");
  const cleanInput = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = cleanInput.split("").reverse().join("");
  const isPalindrome = cleanInput && cleanInput === reversed;
  if (!input.trim()) {
    result.textContent = `Please enter some text`;
    result.style.color = "red";
  } else if (!isPalindrome) {
    result.textContent = `${input} is not palindrome`;
    result.style.color = "orange";
  } else {
    result.textContent = `${input} is palindrome`;
    result.style.color = "green";
  }
}
check.addEventListener("click", () => {
  checkPalindrome();
});
