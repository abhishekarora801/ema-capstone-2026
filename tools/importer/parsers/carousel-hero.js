/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/ca/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-09-08
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * Row 1: block name. Each subsequent row = one slide:
 *   cell 1 = image (mandatory), cell 2 = text content (title, description, CTA).
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide.
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const cells = [];

  slides.forEach((slide) => {
    // Image for this slide
    const img = slide.querySelector('.cmp-teaser__image img, img');

    // Text content: title, description, CTA links
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description, p');
    const ctaLinks = Array.from(
      slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'),
    );

    const textCell = [];
    if (title) textCell.push(title);
    if (description) textCell.push(description);
    ctaLinks.forEach((a) => textCell.push(a));

    // Skip slides with no meaningful content
    if (!img && textCell.length === 0) return;

    cells.push([img || '', textCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
