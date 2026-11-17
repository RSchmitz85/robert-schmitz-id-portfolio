const screens = Array.from(document.querySelectorAll(".screen"));
const progress = document.querySelector("#progress");
const video = document.querySelector("video");
const chapter = document.querySelector("#chapter");
const start = document.querySelector("#start");
const returnButton = document.querySelector("#return-to-activity");
let current = 0;
let activity = 0;
let pendingSeek = null;

const responses = {
  "a-reteach": "Look at the second line. The student already chose subtraction to isolate x. Ask a question that makes their fraction reasoning visible.",
  "a-gap": "The second line shows a valid algebra step. The number line lets you see how the student locates ¾ and interprets the gap to one whole.",
  "a-replace": "Giving the answer repairs this line of work. You still need to hear how the student thinks about 1 − ¾.",
  "d-opinion": "That tells you how useful it felt. A fresh problem tomorrow can show what the student retained and can explain.",
  "d-fresh": "Keep both pieces of evidence. The student’s reaction describes the experience. A delayed, independent explanation helps you see what carried over.",
  "d-repeat": "Copying rehearses the steps. A new equation gives the student a chance to use the fraction idea independently.",
  "b-praise": "Encouragement can help. Name the specific step the student can use again on a new problem.",
  "b-repeat": "The work already shows a successful strategy and a check. Give the student a chance to use both independently.",
  "b-transfer": "This feedback points to a success the student can repeat. Have the student explain the add-back check, then try it independently with eighths.",
  "e-growth": "The 4 describes confidence on the ribbon task. You need written work on a comparable symbolic problem to judge independent symbolic reasoning.",
  "e-same": "The quantities match, but the ribbon adds a concrete cue and multiple choice changes what the student has to produce. Hold both features steady when comparing ratings.",
  "e-context": "The rating is task-specific. To compare confidence before and after instruction, keep the context, written response, timing, and rating scale comparable.",
  "c-partner": "Partners can rehearse explanations. Collect individual predictions and written work when you need evidence of each student’s independent reasoning.",
  "c-before": "This keeps the timing, scale, and written format comparable. Look separately at the rating, the answer, and how the student got it.",
  "c-after": "The answer reveal changes what the rating measures. Keep the prediction before solving and collect written reasoning on both attempts.",
  "f-confidence": "Student A’s rating shows confidence, but the answer still points to a fraction error. Student B’s add-back check is evidence of sound reasoning.",
  "f-next": "The two signals point to different next steps. Probe Student A’s understanding of eighths. Help Student B connect confidence to a success they can explain.",
  "f-same": "Both ratings stayed steady. Their written work gives you different reasons for what to teach or reinforce next."
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

function seek(seconds) {
  if (video.readyState === 0) pendingSeek = seconds;
  else video.currentTime = seconds;
  video.focus({ preventScroll: true });
  video.play().catch(() => {
    // Native controls remain available if the browser requires a play gesture.
  });
}

video.addEventListener("loadedmetadata", () => {
  if (pendingSeek !== null) {
    video.currentTime = pendingSeek;
    pendingSeek = null;
  }
});

chapter.addEventListener("change", () => {
  if (chapter.value !== "") seek(Number(chapter.value));
});

for (const button of document.querySelectorAll("[data-watch]")) {
  button.addEventListener("click", () => {
    activity = current;
    start.hidden = true;
    returnButton.hidden = false;
    show(0);
    const option = Array.from(chapter.options).find(item => item.dataset.scene === button.dataset.watch);
    chapter.value = option.value;
    seek(Number(option.value));
  });
}

returnButton.addEventListener("click", () => {
  show(activity);
  activity = 0;
  start.hidden = false;
  returnButton.hidden = true;
});

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
  chapter.value = "";
  show(0);
});
