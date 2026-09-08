/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base: cards.
 * Source: https://wknd.site/ca/en.html (.image-list.list)
 * Generated: 2026-09-08
 *
 * Teaser card grid rendered as a 2-column cards block:
 *   Row 1: block name.
 *   Each subsequent row = one card:
 *     cell 1 = image (mandatory), cell 2 = text (title link + description).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, img');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const title = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    const textCell = [];
    // Prefer the linked title (preserves the card's target URL); fall back to plain title text.
    if (titleLink) textCell.push(titleLink);
    else if (title) textCell.push(title);
    if (description) textCell.push(description);

    if (!image && textCell.length === 0) return;

    cells.push([image || '', textCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
