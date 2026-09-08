/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo. Base: hero.
 * Source: https://wknd.site/ca/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-09-08
 *
 * Full-bleed promo rendered as a 1-column hero block (3 rows):
 *   Row 1: block name.
 *   Row 2: background image (single cell).
 *   Row 3: title, subheading/body, CTA (single cell).
 *
 * NOTE: source teaser wraps a nested image-list (a separate cards-teaser block).
 * Selectors are scoped to the teaser's own .cmp-teaser__content / .cmp-teaser__image
 * to avoid pulling content from the nested block.
 */
export default function parse(element, { document }) {
  const content = element.querySelector(':scope > .cmp-teaser > .cmp-teaser__content, .cmp-teaser__content');
  const imageWrap = element.querySelector(':scope > .cmp-teaser > .cmp-teaser__image, .cmp-teaser__image');

  const image = imageWrap ? imageWrap.querySelector('img') : null;
  const heading = content ? content.querySelector('.cmp-teaser__title, h1, h2, h3') : null;
  const description = content ? content.querySelector('.cmp-teaser__description, p') : null;
  const ctaLinks = content
    ? Array.from(content.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'))
    : [];

  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  ctaLinks.forEach((a) => contentCell.push(a));

  // Empty-block guard
  if (!image && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
