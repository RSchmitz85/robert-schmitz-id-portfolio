/* Both collections remain available when JavaScript is disabled. */
const collectionSwitch = document.querySelector('.collection-switch');
if (collectionSwitch) {
  const buttons = [...collectionSwitch.querySelectorAll('button')];
  function selectCollection(name) {
    buttons.forEach(button => {
      const selected = button.dataset.collection === name;
      button.setAttribute('aria-pressed', String(selected));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => selectCollection(button.dataset.collection)));
  selectCollection('storyline');
  collectionSwitch.hidden = false;
}
