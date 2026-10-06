document.querySelectorAll('[data-copy-target]').forEach((button) => {
  const source = document.getElementById(button.dataset.copyTarget);
  const status = document.getElementById(button.getAttribute('aria-describedby'));
  if (!source || !status) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(source.textContent);
      status.textContent = 'Copied to clipboard.';
    } catch {
      status.textContent = 'Could not copy. Select and copy this text manually.';
    } finally { button.disabled = false; }
  });
});
const toggle = document.querySelector('.menu-toggle');
if (toggle) {
  toggle.hidden = false;
  toggle.closest('.site-header').classList.add('has-menu');
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
  });
  toggle.closest('.site-header').addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
    }
  });
}
