(() => {
  const jump = document.getElementById('mobileJump');
  const duck = document.getElementById('mobileDuck');
  if (!jump || !duck) return;

  const controls = () => window.DinoRunnerControls;

  const pressJump = (e) => {
    e.preventDefault();
    jump.classList.add('pressed');
    controls()?.jump();
  };
  const releaseJump = (e) => {
    if (e) e.preventDefault();
    jump.classList.remove('pressed');
    controls()?.jumpRelease();
  };
  const pressDuck = (e) => {
    e.preventDefault();
    duck.classList.add('pressed');
    controls()?.duckStart();
  };
  const releaseDuck = (e) => {
    if (e) e.preventDefault();
    duck.classList.remove('pressed');
    controls()?.duckEnd();
  };

  jump.addEventListener('pointerdown', pressJump, { passive: false });
  jump.addEventListener('pointerup', releaseJump, { passive: false });
  jump.addEventListener('pointercancel', releaseJump, { passive: false });

  duck.addEventListener('pointerdown', pressDuck, { passive: false });
  duck.addEventListener('pointerup', releaseDuck, { passive: false });
  duck.addEventListener('pointercancel', releaseDuck, { passive: false });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { releaseJump(); releaseDuck(); }
  });
})();