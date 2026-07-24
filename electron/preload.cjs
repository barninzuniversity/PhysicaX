window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`.${type}-version`, process.versions[type] || '');
  }
});
