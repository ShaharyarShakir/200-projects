const quizData = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language"
    ],
    answer: "Hyper Text Markup Language"
  },
  {
    question:
      "Which CSS property is used to set the background color of an element?",
    options: ["background-color", "color", "bgcolor"],
    answer: "background-color"
  },

  {
    question: "Which property changes text color in CSS?",
    options: ["font-color", "color", "text-color"],
    answer: "color"
  },
  {
    question: "How do you declare a JavaScript variable?",
    options: ["v = 5", "let v = 5", "int v = 5"],
    answer: "let v = 5"
  }
];

let currentQuestion = 0;
let score = 0;
let userAnswers = [];

const questionEl = document.getElementById("question");
const optionsForm = document.getElementById("optionsForm");
const submitBtn = document.getElementById("submitBtn");
const scoreEl = document.getElementById("score");
const reviewEl = document.getElementById("review");
const restartBtn = document.getElementById("restartBtn");

function loadQuestion() {
  const quiz = quizData[currentQuestion];
  questionEl.textContent = quiz.question;
  optionsForm.innerHTML = "";

  quiz.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="option" value="${option}">
      ${option}
    `;
    optionsForm.appendChild(label);
  });
}

submitBtn.onclick = () => {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) {
    alert("Please select an option.");
    return;
  }

  const answer = selected.value;
  userAnswers.push({
    question: quizData[currentQuestion].question,
    selected: answer,
    correct: quizData[currentQuestion].answer
  });

  if (answer === quizData[currentQuestion].answer) {
    score++;
  }

  currentQuestion++;
  if (currentQuestion < quizData.length) {
    loadQuestion();
  } else {
    showResults();
  }
};

function showResults() {
  questionEl.textContent = "Quiz Completed!";
  optionsForm.innerHTML = "";
  submitBtn.style.display = "none";
  restartBtn.style.display = "block";
  scoreEl.textContent = `Your score: ${score} / ${quizData.length}`;

  let reviewHTML = "<h3>Review:</h3>";
  userAnswers.forEach((item, index) => {
    if (item.selected !== item.correct) {
      reviewHTML += `
        <p><strong>Q${index + 1}:</strong> ${item.question}<br>
        <span style="color:red;">Your answer:</span> ${item.selected}<br>
        <span style="color:green;">Correct answer:</span> ${item.correct}</p>
      `;
    }
  });
  reviewEl.innerHTML = reviewHTML;
}

restartBtn.onclick = () => {
  currentQuestion = 0;
  score = 0;
  userAnswers = [];
  scoreEl.textContent = "";
  reviewEl.innerHTML = "";
  submitBtn.style.display = "block";
  restartBtn.style.display = "none";
  loadQuestion();
};

loadQuestion();

