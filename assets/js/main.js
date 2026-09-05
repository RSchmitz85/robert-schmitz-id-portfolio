/** Progressive enhancement for navigation and full-page artifact inspection. */
(function () {
  "use strict";
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
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
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) setOpen(false, true);
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.documentElement.classList.add("nav-ready");
  }
  var targets = document.querySelectorAll("a.artifact-zoom");
  if (!targets.length || typeof HTMLDialogElement === "undefined") return;
  var box = document.createElement("dialog");
  box.className = "lightbox";
  box.setAttribute("aria-label", "Enlarged artifact");
  box.innerHTML = '<div class="lightbox__toolbar">' +
    '<a class="lightbox__original" target="_blank" rel="noopener noreferrer">Open full-size image (new tab)</a>' +
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
      caption.textContent = img.alt;
      original.href = link.href;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      box.showModal();
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
