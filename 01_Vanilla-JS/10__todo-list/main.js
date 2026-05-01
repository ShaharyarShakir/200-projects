let submitBtn = document.querySelector("#submit");
let taskList = document.querySelector("#taskList");

submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  addTask();
});

function addTask() {
  const addTaskInput = document.getElementById("addTask");
  const taskText = addTaskInput.value.trim();
  if (taskText === "") return;

  const li = document.createElement("li");
  li.className = "task-item";
  li.innerHTML = `
    <span class="task-text">${taskText}</span>
    <button class="complete-btn">Complete</button>
    <button class="delete-btn">Delete</button>
  `;

  const completeBtn = li.querySelector(".complete-btn");
  const deleteBtn = li.querySelector(".delete-btn");
  const taskSpan = li.querySelector(".task-text");

  completeBtn.addEventListener("click", () => {
    taskSpan.classList.toggle("completed");
  });

  deleteBtn.addEventListener("click", () => {
    taskList.removeChild(li);
  });

  taskList.appendChild(li);
  addTaskInput.value = "";
}

