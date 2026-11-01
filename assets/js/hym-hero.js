/** Hit Your Mark hero: muted autoplay with a visible "Tap for sound" button. */
(function () {
  "use strict";
  var video = document.querySelector(".hym-hero-player video");
  var button = document.querySelector(".hym-hero-player .hym-unmute");
  if (!video || !button) return;
  var hide = function () { button.hidden = true; };
  // Respect reduced motion: no autoplay; the learner starts it, with sound, from the controls.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.removeAttribute("autoplay");
    video.muted = false;
    video.pause();
    return;
  }
  video.muted = true;
  button.hidden = false;
  var attempt = video.play();
  if (attempt && attempt.catch) attempt.catch(function () {});
  button.addEventListener("click", function () {
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    hide();
    video.focus();
  });
  // Unmuting from the native controls also retires the button.
  video.addEventListener("volumechange", function () { if (!video.muted && video.volume > 0) hide(); });
})();
