import { createOptimizedPicture } from '../../scripts/aem.js';

// Inline SVG icons — the WKND source used an icon font that did not carry over,
// so brand glyphs are provided here as inline SVG.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.8 8.44-4.94 8.44-9.94z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 5.8c-.7.32-1.5.53-2.3.63.83-.5 1.46-1.28 1.76-2.22-.78.46-1.63.8-2.54.97A4 4 0 0 0 12 8.9c0 .3.03.6.1.9A11.34 11.34 0 0 1 3.9 4.5a4 4 0 0 0 1.24 5.33c-.64-.02-1.24-.2-1.77-.49v.05a4 4 0 0 0 3.2 3.92c-.58.16-1.2.18-1.78.07a4 4 0 0 0 3.73 2.78A8.02 8.02 0 0 1 2 17.9a11.32 11.32 0 0 0 6.13 1.8c7.35 0 11.37-6.09 11.37-11.37v-.52A8.1 8.1 0 0 0 22 5.8z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.47.66.25 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.63.42 1.36.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43-.25.66-.6 1.22-1.15 1.77-.55.55-1.11.9-1.77 1.15-.63.25-1.36.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.63-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.25-.66.6-1.22 1.15-1.77.55-.55 1.11-.9 1.77-1.15.63-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.5.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.36-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.5.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.36.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.5-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.36.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.5-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.36-.14-.88-.31-1.86-.35-1.05-.05-1.37-.06-4.04-.06zm0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28zm0 8.48a3.34 3.34 0 1 0 0-6.68 3.34 3.34 0 0 0 0 6.68zm6.54-8.69a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>',
};

function iconFor(anchor) {
  const hint = `${anchor.getAttribute('href') || ''} ${anchor.textContent}`.toLowerCase();
  if (hint.includes('facebook')) return { key: 'facebook', label: 'Facebook' };
  if (hint.includes('twitter')) return { key: 'twitter', label: 'Twitter' };
  if (hint.includes('insta')) return { key: 'instagram', label: 'Instagram' };
  return null;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-profile-card-image';
      else div.className = 'cards-profile-card-body';
    });

    // Collapse the stacked social-link paragraphs into a single horizontal
    // row of icon buttons. Source rendered these via an icon font that did
    // not carry over, so swap the text label for an inline SVG glyph.
    const body = li.querySelector('.cards-profile-card-body');
    if (body) {
      const socialAnchors = [...body.querySelectorAll('a')]
        .map((a) => ({ a, meta: iconFor(a) }))
        .filter((x) => x.meta);
      if (socialAnchors.length) {
        const socialRow = document.createElement('p');
        socialRow.className = 'cards-profile-social';
        socialAnchors.forEach(({ a, meta }) => {
          a.innerHTML = SOCIAL_ICONS[meta.key];
          a.setAttribute('aria-label', meta.label);
          a.classList.add('cards-profile-social-link');
          socialRow.append(a);
        });
        // Remove the now-empty <p> wrappers that each held one social link.
        body.querySelectorAll('p').forEach((p) => {
          if (!p.textContent.trim() && !p.querySelector('a, svg')) p.remove();
        });
        body.append(socialRow);
      }
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
