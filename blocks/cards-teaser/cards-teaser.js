import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-teaser-card-image';
      } else {
        div.className = 'cards-teaser-card-body';
        // The card body renders as `<p><a>Title</a>description text</p>` — the
        // title link and its trailing description share one paragraph. Split the
        // loose description text node into its own element so CSS can style and
        // truncate it independently of the title (which stays on its own line).
        div.querySelectorAll('p').forEach((para) => {
          [...para.childNodes].forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              const desc = document.createElement('p');
              desc.className = 'cards-teaser-card-description';
              desc.textContent = node.textContent.trim();
              para.after(desc);
              node.remove();
            }
          });
        });
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
