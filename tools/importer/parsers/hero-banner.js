/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://wknd.site/ca/en/adventures.html (.teaser.cmp-teaser--hero)
 * Generated: 2026-09-09
 *
 * Light hero banner over intro text rendered as a 1-column hero block:
 *   Row 1: block name.
 *   Row 2: single cell with the full-bleed background image.
 *   Row 3: single cell with title (heading) + description body.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2');
  const description = element.querySelector('.cmp-teaser__description');

  // Empty-block guard: need at least a title or image.
  if (!image && !title) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional).
  if (image) cells.push([image]);

  // Row 3: title + description content.
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
