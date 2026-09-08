/* Authored portfolio scenario. Choices stay in memory; nothing is submitted. */
(function () {
  "use strict";
  var steps = [
    { title: "Open the conversation", prompt: "You know the impact, but not the cause. How do you begin?", options: [
      { text: "The notes arrived after 3 p.m., delaying the review. What got in the way?", reply: "I was waiting for Priya’s figures. I thought sending incomplete notes would create more work.", feedback: "You named the event and impact without assuming the cause. Now check what Alex could send before the figures arrive.", strength: "You opened with observation and inquiry." },
      { text: "Can we agree that future notes will arrive by 3 p.m.? The reviewers need that time.", reply: "I can try, but Priya’s figures often arrive after 3. What should I do when that happens?", feedback: "The expectation is clear, but the dependency is still unresolved. Ask about the obstacle before seeking a commitment.", strength: "You clarified the expectation before understanding the dependency." },
      { text: "Would it help if I took responsibility for collecting the figures?", reply: "Maybe. Should I wait for you to send them before I start the notes?", feedback: "Offering support may help, but it also introduces uncertainty about ownership. Establish what Alex can complete independently.", strength: "You offered support before clarifying ownership." }
    ]},
    { title: "Understand the obstacle", prompt: "The figures arrive late. What do you explore next?", options: [
      { text: "Which parts could go out by 3, and how could we flag the missing figures?", reply: "Most of the notes are ready by 2:30. I could send those, mark the figures as pending, and update them later.", feedback: "You found a workable partial handoff. The reviewers still need to confirm that this gives them enough to begin.", strength: "You investigated a partial handoff instead of assuming all work was blocked." },
      { text: "Could you ask Priya to deliver earlier so the complete notes can arrive by 3?", reply: "I can ask, but Priya depends on another team. I cannot promise their figures will be ready earlier.", feedback: "An earlier input would help, but it is outside Alex’s control. A plan also needs a fallback when the input is late.", strength: "Your plan still depends on an earlier input Alex cannot guarantee." },
      { text: "Send everything to me at 2:30 and I’ll handle the reviewers.", reply: "Okay. If you are unavailable, should I hold the notes until you can review them?", feedback: "You have become a new bottleneck. Clarify Alex’s ownership and a route that still works when you are unavailable.", strength: "Taking over created another dependency on you." }
    ]},
    { title: "Agree on the next handoff", prompt: "Choose an agreement that addresses the dependency and lets the reviewers plan.", options: [
      { text: "Let’s confirm the reviewers can start with partial notes. You send them by 3, flag risks by 2:30, and post an update time for missing figures. We’ll review how it went tomorrow.", reply: "I’ll confirm that with the reviewers today and own the handoff. If partial notes will not work, I’ll flag that at 2:30 so we can agree on a revised review time.", feedback: "This agreement names an owner, a deadline, an early-warning step, and a check-in. It also checks whether the partial handoff meets the receiving team’s needs.", strength: "You established a specific, testable agreement.", complete: true },
      { text: "Let’s keep 3 p.m. as the deadline and communicate more proactively next time.", reply: "Okay. Should I message you as soon as Priya is late, or wait until I know when the figures will arrive?", feedback: "The intention is useful, but “proactively” is ambiguous. Specify who receives the warning, when to send it, and what happens next.", strength: "The agreement needs a concrete early-warning step.", complete: false },
      { text: "Let’s move the handoff to 4 p.m. so there is more time for the figures.", reply: "That would help me finish. Will the reviewers still have enough time before their own deadline?", feedback: "More time may solve Alex’s problem while shifting it to the reviewers. Confirm their needs before changing the agreement.", strength: "The revised deadline still needs agreement from the receiving team.", complete: false }
    ]}
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = steps;
  if (typeof document === "undefined") return;
  var root = document.getElementById("conversation");
  if (!root) return;
  var stage = 0, path = [], selected = null;
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function render(moveFocus) {
    root.replaceChildren();
    selected = null;
    var heading = el("h3", stage < 3 ? steps[stage].title : "Your conversation, reviewed");
    heading.tabIndex = -1;
    root.append(el("p", stage < 3 ? "Decision " + (stage + 1) + " of 3" : "Conversation complete", "eyebrow"), heading);
    if (stage === 3) {
      var last = steps[2].options[path[2]];
      root.append(el("p", last.complete ? "You reached a workable agreement. Review the route you took to get there." : "You reached an agreement that needs clarification. Review what remains unresolved."));
      var list = el("ol", null, "conversation-review");
      path.forEach(function (choice, i) { list.append(el("li", steps[i].options[choice].strength)); });
      root.append(list, el("p", "Transfer it: how would you handle a late client summary caused by conflicting reviewer edits? Use the conversation aid below to write your own response."));
      var restart = el("button", "Try another conversation", "btn btn--primary");
      restart.type = "button";
      restart.addEventListener("click", function () { stage = 0; path = []; render(true); });
      root.append(restart);
    } else {
      if (stage > 0) root.append(el("blockquote", "Alex: “" + steps[stage - 1].options[path[stage - 1]].reply + "”", "alex-reply"));
      root.append(el("p", steps[stage].prompt));
      var choices = el("div", null, "conversation-options");
      var feedback = el("div", "Choose a response to see its effect. You can compare choices before continuing.", "conversation-feedback");
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      var next = el("button", stage === 2 ? "Review this conversation" : "Hear Alex and continue", "btn btn--primary");
      next.type = "button";
      next.disabled = true;
      steps[stage].options.forEach(function (option, i) {
        var button = el("button", option.text);
        button.type = "button";
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
          selected = i;
          Array.from(choices.children).forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
          feedback.replaceChildren(el("p", "Alex: “" + option.reply + "”"), el("p", option.feedback));
          next.disabled = false;
        });
        choices.append(button);
      });
      next.addEventListener("click", function () {
        if (selected === null) return;
        path.push(selected); stage += 1; render(true);
      });
      root.append(choices, feedback, next);
    }
    if (moveFocus) heading.focus();
  }
  render(false);
})();
