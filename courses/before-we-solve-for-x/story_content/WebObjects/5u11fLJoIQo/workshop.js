const screens = Array.from(document.querySelectorAll(".screen"));
const progress = document.querySelector("#progress");
const video = document.querySelector("video");
let current = 0;

const responses = {
  "a-reteach": "Look at the second line. The student already chose subtraction to isolate x. Ask a question that makes their fraction reasoning visible.",
  "a-gap": "The second line shows a valid algebra step. The number line lets you see how the student locates ¾ and interprets the gap to one whole.",
  "a-replace": "Giving the answer repairs this line of work. You still need to hear how the student thinks about 1 − ¾.",
  "b-praise": "Encouragement can help. Name the specific step the student can use again on a new problem.",
  "b-repeat": "The work already shows a successful strategy and a check. Give the student a chance to use both independently.",
  "b-transfer": "This feedback points to evidence the student can use again. The new problem lets you see whether the strategy transfers.",
  "c-partner": "Partners can rehearse explanations. Collect individual predictions and written work when you need evidence of each student’s independent reasoning.",
  "c-before": "This keeps the timing, scale, and written format comparable. Look separately at the rating, the answer, and how the student got it.",
  "c-after": "The answer reveal changes what the rating measures. Keep the prediction before solving and collect written reasoning on both attempts."
};

function show(index) {
  if (current === 0 && index !== 0) video.pause();
  screens[current].hidden = true;
  current = index;
  const screen = screens[index];
  screen.hidden = false;
  progress.textContent = index === 0 ? "Overview" : `${index} of ${screens.length - 1} · ${screen.dataset.name}`;
  const heading = screen.querySelector("h1, h2");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function respond(button, group, success, message) {
  const screen = button.closest(".screen");
  const feedback = screen.querySelector(".feedback");
  for (const choice of group) {
    choice.classList.remove("selected", "correct");
    choice.setAttribute("aria-pressed", String(choice === button));
  }
  button.classList.add(success ? "correct" : "selected");
  feedback.classList.toggle("success", success);
  feedback.textContent = message;
  screen.querySelector("[data-next]").disabled = !success;
}

for (const button of document.querySelectorAll("[data-next]")) {
  button.addEventListener("click", () => show(current + 1));
}
for (const button of document.querySelectorAll("[data-back]")) {
  button.addEventListener("click", () => show(current - 1));
}
for (const button of document.querySelectorAll("[data-choice]")) {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    respond(button, button.parentElement.querySelectorAll("button"), button.hasAttribute("data-best"), responses[button.dataset.choice]);
  });
}

const ticks = Array.from(document.querySelectorAll("[data-tick]"));
const line = document.querySelector(".number-line");
for (const [index, button] of ticks.entries()) {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    const success = index === 3;
    const message = success
      ? "Three equal spaces from 0 reach ¾. One equal space remains to 1, so 1 − ¾ = ¼ and x = ¼."
      : `That mark is ${index} ${index === 1 ? "space" : "spaces"} from 0. Count three equal spaces from 0 to locate ¾.`;
    line.classList.toggle("shown", success);
    respond(button, ticks, success, message);
  });
}

document.querySelector("#restart").addEventListener("click", () => {
  for (const button of document.querySelectorAll("[aria-pressed]")) {
    button.classList.remove("selected", "correct");
    button.setAttribute("aria-pressed", "false");
  }
  for (const feedback of document.querySelectorAll(".feedback")) {
    feedback.textContent = "";
    feedback.classList.remove("success");
  }
  for (const button of document.querySelectorAll("[data-next]")) {
    button.disabled = !button.closest(".hero");
  }
  line.classList.remove("shown");
  video.currentTime = 0;
  show(0);
});
