(function () {
  'use strict';
  const { getLinkResult, MAX_MESSAGE_LENGTH } = window.TelegramLinks;
  const byId = id => document.getElementById(id);
  const username = byId('username');
  const message = byId('message');
  const finalLink = byId('final-link');
  const copyButton = byId('copy-link');
  const openLink = byId('open-link');
  const copyStatus = byId('copy-status');
  let usernameTouched = false;
  let currentUrl = '';
  let copying = false;

  function showError(input, errorElement, error) {
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    errorElement.textContent = error;
    errorElement.hidden = !error;
  }

  function render() {
    const result = getLinkResult(username.value, message.value);
    currentUrl = result.url;
    const usernameError = usernameTouched && result.errorField === 'username' ? result.error : '';
    const tooLong = result.length > MAX_MESSAGE_LENGTH;
    const messageError = tooLong ? 'Сообщение слишком длинное. Уберите ' + (result.length - MAX_MESSAGE_LENGTH) + ' симв.' : '';
    showError(username, byId('username-error'), usernameError);
    showError(message, byId('message-error'), messageError);
    const count = byId('message-count');
    count.textContent = result.length + ' / ' + MAX_MESSAGE_LENGTH;
    count.classList.toggle('is-error', tooLong);
    finalLink.value = currentUrl;
    copyButton.disabled = !currentUrl || copying;
    if (currentUrl) {
      openLink.href = currentUrl;
      openLink.removeAttribute('aria-disabled');
      openLink.removeAttribute('tabindex');
    } else {
      openLink.removeAttribute('href');
      openLink.setAttribute('aria-disabled', 'true');
      openLink.setAttribute('tabindex', '-1');
    }
    byId('result-hint').textContent = !result.username
      ? 'Сначала укажите ваш Telegram для связи.'
      : tooLong ? 'Сократите сообщение, чтобы создать ссылку.'
      : message.value ? 'Готово. Скопируйте ссылку и вставьте её в кнопку на сайте.'
      : 'Ссылка откроет чат без подготовленного сообщения.';
    byId('preview-recipient').textContent = result.username ? '@' + result.username : 'Ваш аккаунт';
    const avatar = byId('preview-avatar');
    avatar.textContent = result.username ? result.username[0].toUpperCase() : 'Т';
    const preview = byId('preview-message');
    preview.textContent = message.value || 'Ваш текст появится здесь.\nДобавьте сообщение в поле слева.';
    preview.classList.toggle('is-placeholder', !message.value);
  }

  function resetCopyStatus() {
    copyStatus.textContent = '';
    copyStatus.className = 'copy-status';
    byId('copy-label').textContent = 'Копировать ссылку';
    byId('copy-icon').setAttribute('href', '#i-copy');
  }

  username.addEventListener('input', () => { usernameTouched = true; resetCopyStatus(); render(); });
  username.addEventListener('blur', () => { usernameTouched = true; render(); });
  message.addEventListener('input', () => { resetCopyStatus(); render(); });
  byId('link-form').addEventListener('submit', event => event.preventDefault());
  openLink.addEventListener('click', event => { if (!currentUrl) event.preventDefault(); });

  copyButton.addEventListener('click', async () => {
    if (!currentUrl || copying) return;
    const urlToCopy = currentUrl;
    copying = true;
    copyButton.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(urlToCopy);
      // Editing during a pending clipboard request must not claim the new URL was copied.
      if (currentUrl !== urlToCopy) return;
      copyStatus.className = 'copy-status is-success';
      copyStatus.textContent = 'Ссылка скопирована. Можно вставлять!';
      byId('copy-label').textContent = 'Скопировано';
      byId('copy-icon').setAttribute('href', '#i-check');
    } catch {
      if (currentUrl !== urlToCopy) return;
      finalLink.focus();
      finalLink.select();
      copyStatus.className = 'copy-status is-fallback';
      copyStatus.textContent = 'Браузер не разрешил копирование. Ссылка выделена — скопируйте её вручную через Ctrl+C, ⌘C или меню выделения.';
    } finally {
      copying = false;
      copyButton.disabled = !currentUrl;
    }
  });

  // Browsers can restore form values on refresh/back navigation.
  window.addEventListener('pageshow', render);
  render();
})();
