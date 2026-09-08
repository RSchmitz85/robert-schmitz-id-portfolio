document.querySelector('.gsi-load').addEventListener('click', function () {
  const frame = document.createElement('iframe');
  frame.src = '../courses/graphing-slope-intercept/story.html';
  frame.title = 'Graphing Slope-Intercept Form — interactive Storyline lesson';
  frame.allowFullscreen = true;
  document.getElementById('gsi-player').replaceChildren(frame);
  frame.addEventListener('load', () => frame.focus());
});
