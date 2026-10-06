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
