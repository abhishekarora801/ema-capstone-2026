/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + Section Metadata.
 * Driven by payload.template.sections from page-templates.json.
 *
 * Notes for WKND homepage:
 * - section.selector is an array (e.g. [".image-list.list"]); normalized here.
 * - Two sections share the selector ".image-list.list" (recent-articles &
 *   where-to-go). Resolution counts occurrences so each maps to its own element.
 * - Only "featured-article" carries a style ("highlight"); it is section index 1.
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before block parsers replace them). Section Metadata is inserted in
 * afterTransform, anchored to the marker <hr> that survives parsing.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

function normalizeSelector(selector) {
  return Array.isArray(selector) ? selector.join(', ') : selector;
}

// Resolve each section to its own DOM element, counting repeated selectors so
// duplicate selectors (.image-list.list) map to distinct occurrences in order.
function resolveSectionElements(element, sections) {
  const usage = {};
  return sections.map((section) => {
    const sel = normalizeSelector(section.selector);
    if (!sel) return null;
    const matches = element.querySelectorAll(sel);
    const idx = usage[sel] || 0;
    usage[sel] = idx + 1;
    return matches[idx] || null;
  });
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    const resolved = resolveSectionElements(element, sections);
    // Reverse iteration: inserting relative to a live element reference only
    // affects nodes after it, so later sections stay put while we work backward.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const sectionEl = resolved[i];
      if (!sectionEl) continue; // selector didn't match — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have replaced section elements; anchor styled sections' metadata to
    // the marker <hr> placed above (or, defensively, the original element).
    const resolved = resolveSectionElements(element, sections);
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || resolved[i];
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
