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
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy-link]');
  if (!button) return;
  const status = button.parentElement.querySelector('.copy-status');
  const value = new URL(button.dataset.copyLink, location.origin).href;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
    else {
      const input = document.createElement('textarea');
      input.value = value; input.setAttribute('readonly', '');
      input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.append(input); input.select();
      const copied = document.execCommand('copy'); input.remove();
      if (!copied) throw new Error('Copy command unavailable');
    }
    status.textContent = 'Link copied';
  } catch { status.textContent = 'Could not copy the link'; }
});
