/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base: cards.
 * Source: https://wknd.site/ca/en/about-us.html (.experiencefragment.cmp-experience-fragment--contributor)
 * Generated: 2026-09-09
 *
 * NOTE: each matched element is ONE profile card (multiple across the page);
 * the parser receives a single card element and emits a single-card block.
 *
 * Profile card rendered as a 2-column cards block:
 *   Row 1: block name.
 *   Row 2 = the card: cell 1 = avatar image, cell 2 = name (heading) + role +
 *     social icon links (Facebook / Twitter / Instagram).
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-image img, img');
  const titles = Array.from(element.querySelectorAll('.cmp-title__text'));
  const name = titles[0] || null;
  const role = titles[1] || null;
  const socialLinks = Array.from(element.querySelectorAll('.cmp-button, a[href]'))
    .filter((a) => a.tagName === 'A');

  const textCell = [];
  if (name) textCell.push(name);
  if (role) textCell.push(role);

  // Add social links (Facebook / Twitter / Instagram), preserving link text/href.
  socialLinks.forEach((link) => {
    if (link.getAttribute('href')) textCell.push(link);
  });

  // Empty-block guard: need at least an image or name.
  if (!image && !name) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', textCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
