(() => {
  const jump = document.getElementById('mobileJump');
  const duck = document.getElementById('mobileDuck');
  if (!jump || !duck) return;

  const key = (type, code) => {
    window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));
  };

  const pressJump = (e) => {
    e.preventDefault();
    jump.classList.add('pressed');
    key('keydown', 'Space');
    if (navigator.vibrate) navigator.vibrate(8);
  };
  const releaseJump = (e) => {
    if (e) e.preventDefault();
    jump.classList.remove('pressed');
    key('keyup', 'Space');
  };

  const pressDuck = (e) => {
    e.preventDefault();
    duck.classList.add('pressed');
    key('keydown', 'ArrowDown');
    if (navigator.vibrate) navigator.vibrate(6);
  };
  const releaseDuck = (e) => {
    if (e) e.preventDefault();
    duck.classList.remove('pressed');
    key('keyup', 'ArrowDown');
  };

  jump.addEventListener('pointerdown', pressJump);
  jump.addEventListener('pointerup', releaseJump);
  jump.addEventListener('pointercancel', releaseJump);
  jump.addEventListener('pointerleave', releaseJump);

  duck.addEventListener('pointerdown', pressDuck);
  duck.addEventListener('pointerup', releaseDuck);
  duck.addEventListener('pointercancel', releaseDuck);
  duck.addEventListener('pointerleave', releaseDuck);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      releaseJump();
      releaseDuck();
    }
  });
})();