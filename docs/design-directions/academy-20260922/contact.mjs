import { translator } from './copy.mjs';
import { MAIN_PAGES } from './model.mjs';

function render() {
  const language = document.querySelector('#language').value;
  const t = translator(language);
  document.documentElement.lang = language;
  document.querySelector('#sheet').innerHTML = MAIN_PAGES.map(page => `<section class="sheet-row"><h2>${t(page)}</h2><div class="comparisons">${['a', 'b'].map(direction => `<article class="direction"><h3>${t(direction)}</h3><div class="shots">${['desktop', 'mobile'].map(size => {
    const file = `./evidence/${direction}-${page}-${language}-${size}.png`;
    return `<figure><a href="./index.html?direction=${direction}&lang=${language}#${page}"><img src="${file}" alt="${t(direction)} · ${t(page)} · ${t(size)}"></a><figcaption>${t(size)} · ${size === 'desktop' ? '1440 × 1000' : '390 × 844'}</figcaption></figure>`;
  }).join('')}</div></article>`).join('')}</div></section>`).join('');
}
document.querySelector('#language').addEventListener('change', render);
render();
