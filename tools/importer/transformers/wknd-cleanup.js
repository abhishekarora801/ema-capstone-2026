/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome (header, footer, mobile nav, tracking iframe)
 * and leftover artifacts. All selectors verified against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking/ID-sync iframe (cleaned.html L566) and mobile nav chrome (L568, L574)
    // removed before parsing so they never interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_wkndsite_0', // Adobe ID syncing iframe
      'iframe',
      '#toggleNav',                                 // mobile nav hamburger toggle
      '#mobileNav',                                 // mobile navigation panel
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site shell — header experience fragment (cleaned.html L5)
    // and footer experience fragment (L471). These are global chrome an author
    // would not create when authoring a page.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'header',
      'footer',
    ]);

    // Empty <meta> tags emitted inside cmp-image wrappers (cleaned.html L183, L204, L227, L271, L334, L378).
    element.querySelectorAll('meta').forEach((el) => el.remove());
  }
}
