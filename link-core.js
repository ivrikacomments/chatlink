(function (root) {
  'use strict';

  const MAX_MESSAGE_LENGTH = 4096;
  const reserved = new Set(('addemoji addlist addstickers addstyle addtheme auction auth boost call confirmphone contact giftcode invoice joinchat login m nft proxy setlanguage share socks web a k z').split(' '));

  function normalizeUsername(raw) {
    let value = String(raw ?? '').trim();
    if (/^(?:https?:\/\/|t\.me\/)/i.test(value)) {
      let parsed;
      try {
        parsed = new URL(/^t\.me\//i.test(value) ? 'https://' + value : value);
      } catch {
        return '';
      }
      if (parsed.hostname !== 't.me' || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash) return '';
      if (!/^\/[A-Za-z][A-Za-z0-9_]{0,31}\/?$/.test(parsed.pathname)) return '';
      value = parsed.pathname.replace(/^\/|\/$/g, '');
    } else if (value.startsWith('@')) {
      value = value.slice(1);
    }
    // Short collectible usernames exist. This checks syntax, not availability.
    if (!/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(value) || reserved.has(value.toLowerCase())) return '';
    return value;
  }

  function getLinkResult(rawUsername, message = '') {
    const text = String(message);
    const length = Array.from(text).length;
    const username = normalizeUsername(rawUsername);
    const output = { username, url: '', error: '', errorField: '', length };
    if (!username) {
      output.errorField = 'username';
      output.error = String(rawUsername ?? '').trim()
        ? 'Укажите имя пользователя: латинские буквы, цифры и _. Можно вставить ссылку t.me на профиль.'
        : 'Укажите имя пользователя получателя.';
      return output;
    }
    if (length > MAX_MESSAGE_LENGTH) {
      output.errorField = 'message';
      output.error = 'Сообщение слишком длинное. Уберите ' + (length - MAX_MESSAGE_LENGTH) + ' симв., чтобы осталось не больше 4096.';
      return output;
    }
    const link = new URL('https://t.me/' + username);
    if (text) link.searchParams.set('text', text);
    output.url = link.href;
    return output;
  }

  const api = Object.freeze({ MAX_MESSAGE_LENGTH, getLinkResult });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TelegramLinks = api;
})(globalThis);
