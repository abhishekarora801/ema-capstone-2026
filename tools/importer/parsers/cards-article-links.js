/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article-links. Base: cards (no images).
 * Source: https://wknd.site/ca/en/magazine/western-australia.html (.list.cmp-list--upnext)
 * Generated: 2026-09-09
 *
 * Related-articles "Up Next" list rendered as a 1-column cards (no images) block:
 *   Row 1: block name.
 *   Each subsequent row = one card in a single cell: linked title + date.
 * Items come from .cmp-list__item; each has a linked .cmp-list__item-title and
 * a .cmp-list__item-date. Text-only (no images).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-list__item'));

  const cells = [];

  items.forEach((item) => {
    const link = item.querySelector('.cmp-list__item-link, a');
    const title = item.querySelector('.cmp-list__item-title');
    const date = item.querySelector('.cmp-list__item-date');

    const contentCell = [];

    // Build a linked title that preserves the article URL.
    if (link && title) {
      const anchor = document.createElement('a');
      anchor.href = link.getAttribute('href');
      const strong = document.createElement('strong');
      strong.textContent = title.textContent.trim();
      anchor.appendChild(strong);
      contentCell.push(anchor);
    } else if (title) {
      contentCell.push(title);
    }

    if (date && date.textContent.trim()) {
      const dateEl = document.createElement('p');
      dateEl.textContent = date.textContent.trim();
      contentCell.push(dateEl);
    }

    if (contentCell.length === 0) return;

    cells.push([contentCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article-links', cells });
  element.replaceWith(block);
}
