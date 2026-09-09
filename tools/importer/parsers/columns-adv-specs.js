/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-adv-specs. Base: columns.
 * Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html (.cmp-contentfragment)
 * Generated: 2026-09-09
 *
 * Adventure metadata spec sidebar rendered as a 2-column columns block:
 *   Row 1: block name.
 *   Each subsequent row = one spec: cell 1 = label, cell 2 = value.
 * Labels come from .cmp-contentfragment__element-title, values from
 * .cmp-contentfragment__element-value (Activity, Adventure Type, Trip Length,
 * Group Size, Difficulty, Price).
 */
export default function parse(element, { document }) {
  const specs = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));

  const cells = [];

  specs.forEach((spec) => {
    const label = spec.querySelector('.cmp-contentfragment__element-title, dt');
    const value = spec.querySelector('.cmp-contentfragment__element-value, dd');

    const labelText = label ? label.textContent.trim() : '';
    const valueText = value ? value.textContent.trim() : '';

    // Skip empty pairs
    if (!labelText && !valueText) return;

    cells.push([labelText, valueText]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-adv-specs', cells });
  element.replaceWith(block);
}
