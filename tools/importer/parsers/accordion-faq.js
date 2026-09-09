/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://wknd.site/ca/en/faqs.html (.accordion.panelcontainer)
 * Generated: 2026-09-09
 *
 * FAQ accordion rendered as a 2-column accordion block:
 *   Row 1: block name.
 *   Each subsequent row = one FAQ item: cell 1 = question, cell 2 = answer.
 * Questions come from .cmp-accordion__title; answers from the
 * .cmp-accordion__panel body content.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));

  const cells = [];

  items.forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title');
    const panel = item.querySelector('.cmp-accordion__panel');

    // Prefer the inner text/content wrapper; fall back to the panel itself.
    const content = panel
      ? (panel.querySelector('.cmp-text') || panel.querySelector('.cmp-container') || panel)
      : null;

    const questionText = title ? title.textContent.trim() : '';

    if (!questionText && (!content || !content.textContent.trim())) return;

    cells.push([questionText, content || '']);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
