/**
 * Robert Schmitz ID Portfolio — light JS
 * 1) Mobile nav toggle
 * 2) Artifact lightbox: click any lesson-page image to inspect it full size
 */
(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      toggle.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });
  }

  /* ---------- Artifact lightbox ---------- */
  var zoomTargets = document.querySelectorAll(
    ".hero-pair__item img, .pair-fig img, .artifact img, .cover-row img, " +
    ".practice-tile__img img, .walkthrough-frame__media img"
  );
  if (!zoomTargets.length) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Enlarged artifact view");
  box.innerHTML =
    '<button type="button" class="lightbox__close">Close ✕</button>' +
    '<img alt="">' +
    '<p class="lightbox__caption"></p>';
  document.body.appendChild(box);

  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector(".lightbox__caption");
  var closeBtn = box.querySelector(".lightbox__close");
  var lastFocus = null;

  function openBox(img) {
    lastFocus = img;
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt || "";
    boxCap.textContent = img.alt || "";
    box.classList.add("is-open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeBox() {
    box.classList.remove("is-open");
    boxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  zoomTargets.forEach(function (img) {
    img.classList.add("zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Enlarge: " + (img.alt || "artifact image"));
    img.addEventListener("click", function () { openBox(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBox(img);
      }
    });
  });

  closeBtn.addEventListener("click", closeBox);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target === boxCap) closeBox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box.classList.contains("is-open")) closeBox();
  });
})();
