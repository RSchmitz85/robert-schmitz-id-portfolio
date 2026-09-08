/** Progressive enhancement for navigation and full-page artifact inspection. */
(function () {
  "use strict";
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    var mobileNav = window.matchMedia("(max-width: 860px)");
    var setOpen = function (open, restoreFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.textContent = open ? "Close" : "Menu";
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      setOpen(false);
      var destination = new URL(link.href);
      if (destination.origin === location.origin && destination.pathname === location.pathname &&
          destination.search === location.search && destination.hash) {
        var target;
        try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); } catch (_) { return; }
        if (target) {
          if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
            target.addEventListener("blur", function () { target.removeAttribute("tabindex"); }, { once: true });
          }
          target.focus({ preventScroll: true });
        }
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) setOpen(false, true);
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.documentElement.classList.add("nav-ready");
    mobileNav.addEventListener("change", function () {
      var active = document.activeElement;
      setOpen(false);
      if (mobileNav.matches && nav.contains(active)) toggle.focus();
      else if (!mobileNav.matches && active === toggle) nav.querySelector("a").focus();
    });
  }
  // Wrapped navigation and enlarged text change the space above anchor targets.
  var header = document.querySelector(".site-header");
  var tabs = document.querySelector(".case-tabs");
  var updateStickySpace = function () {
    [[header, "--sticky-header-h"], [tabs, "--sticky-tabs-h"]].forEach(function (entry) {
      var element = entry[0];
      var height = element && getComputedStyle(element).position === "sticky" ? element.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty(entry[1], height + "px");
    });
  };
  updateStickySpace();
  window.addEventListener("resize", updateStickySpace);
  if (typeof ResizeObserver !== "undefined") {
    var stickyObserver = new ResizeObserver(updateStickySpace);
    if (header) stickyObserver.observe(header);
    if (tabs) stickyObserver.observe(tabs);
  }
  var targets = document.querySelectorAll("a.artifact-zoom");
  if (!targets.length || typeof HTMLDialogElement === "undefined") return;
  var box = document.createElement("dialog");
  box.className = "lightbox";
  box.setAttribute("aria-label", "Enlarged artifact");
  box.innerHTML = '<div class="lightbox__toolbar">' +
    '<a class="lightbox__original" target="_blank" rel="noopener noreferrer" aria-label="Open full-size image (new tab)" title="Open full-size image (new tab)">Full-size image ↗</a>' +
    '<button type="button" class="lightbox__close" autofocus>Close ✕</button></div>' +
    '<div class="lightbox__image-area"><img alt=""></div>' +
    '<p class="lightbox__caption"></p>';
  document.body.appendChild(box);
  var boxImg = box.querySelector("img");
  var caption = box.querySelector(".lightbox__caption");
  var original = box.querySelector(".lightbox__original");
  var close = box.querySelector(".lightbox__close");
  var lastFocus;
  var previousOverflow;
  targets.forEach(function (link) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      var img = link.querySelector("img");
      lastFocus = link;
      boxImg.src = link.href;
      boxImg.alt = img.alt;
      var figure = link.closest("figure");
      var figureCaption = figure && figure.querySelector("figcaption");
      caption.textContent = figureCaption ? figureCaption.textContent.trim() : img.alt;
      original.href = link.href;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      box.showModal();
      box.scrollTop = 0;
      close.focus();
    });
  });
  close.addEventListener("click", function () { box.close(); });
  box.addEventListener("click", function (event) {
    if (event.target === box || event.target.classList.contains("lightbox__image-area")) box.close();
  });
  box.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === original) {
      event.preventDefault(); close.focus();
    } else if (!event.shiftKey && document.activeElement === close) {
      event.preventDefault(); original.focus();
    }
  });
  box.addEventListener("close", function () {
    document.body.style.overflow = previousOverflow;
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  });
})();

/** Playable interaction checks — per-choice feedback exactly as storyboarded. */
(function () {
  "use strict";
  document.querySelectorAll(".mcq").forEach(function (mcq) {
    var feedback = mcq.querySelector(".mcq__feedback");
    var options = mcq.querySelectorAll(".mcq__option");
    if (!feedback || !options.length) return;
    options.forEach(function (option) {
      option.setAttribute("aria-pressed", "false");
      option.addEventListener("click", function () {
        var correct = option.getAttribute("data-correct") === "true";
        options.forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === option));
          other.classList.remove("is-correct", "is-wrong");
        });
        option.classList.add(correct ? "is-correct" : "is-wrong");
        feedback.classList.toggle("is-correct", correct);
        feedback.classList.toggle("is-wrong", !correct);
        feedback.innerHTML = "";
        var label = document.createElement("strong");
        label.textContent = option.getAttribute("data-feedback-label") || (correct ? "Correct" : "Not yet — here is why");
        var body = document.createElement("span");
        // Feedback prose carries real math, so it needs italic variables like the
        // choices above it. A plain-text attribute cannot hold that markup, so the
        // rich copy lives in a <template> and data-fb stays as the no-template
        // fallback. Authored markup only — nothing here parses untrusted input.
        var richId = option.getAttribute("data-fb-id");
        var rich = richId ? document.getElementById(richId) : null;
        if (rich && "content" in rich) body.appendChild(rich.content.cloneNode(true));
        else body.textContent = option.getAttribute("data-fb") || "";
        feedback.appendChild(label);
        feedback.appendChild(body);
      });
    });
  });
})();
