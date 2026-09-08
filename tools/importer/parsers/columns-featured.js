/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/ca/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-08
 *
 * Featured article teaser rendered as a two-column columns block:
 *   Row 1: block name.
 *   Row 2: two cells — [ image ] and [ eyebrow/pretitle, heading, body, CTA ].
 */
export default function parse(element, { document }) {
  const eyebrow = element.querySelector('.cmp-teaser__pretitle');
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'),
  );
  const image = element.querySelector('.cmp-teaser__image img, img');

  const textCell = [];
  if (eyebrow) textCell.push(eyebrow);
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  ctaLinks.forEach((a) => textCell.push(a));

  // Empty-block guard
  if (!image && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', textCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
