/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-adventure. Base: tabs.
 * Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html (.tabs.panelcontainer)
 * Generated: 2026-09-09
 *
 * Tabbed adventure content rendered as a 2-column tabs block:
 *   Row 1: block name.
 *   Each subsequent row = one tab: cell 1 = tab label, cell 2 = panel content.
 * Tab labels come from .cmp-tabs__tab (in order); panels from
 * .cmp-tabs__tabpanel (in order). Panel body copy/images/lists live inside
 * the contentfragment elements.
 */
export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];

  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    const panel = panels[i];

    if (!panel) return;

    // Prefer the meaningful content wrapper inside the panel; fall back to the
    // panel itself. The contentfragment element holds the tab's body copy,
    // images and lists.
    const content = panel.querySelector('.cmp-contentfragment__elements')
      || panel.querySelector('.cmp-contentfragment')
      || panel;

    // Drop the repeated adventure title heading inside each panel if present.
    const heading = content.querySelector(':scope > .cmp-contentfragment__title, :scope .cmp-contentfragment__title');
    if (heading && content !== panel) heading.remove();

    if (!label && !content.textContent.trim()) return;

    cells.push([label, content]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-adventure', cells });
  element.replaceWith(block);
}
