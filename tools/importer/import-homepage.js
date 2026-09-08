/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import heroPromoParser from './parsers/hero-promo.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-featured': columnsFeaturedParser,
  'cards-teaser': cardsTeaserParser,
  'hero-promo': heroPromoParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'WKND home/landing page: hero carousel, featured article teaser, and teaser card grids',
  urls: [
    'https://www.wknd.site/us/en.html',
  ],
  blocks: [
    { name: 'carousel-hero', instances: ['.carousel.cmp-carousel--hero'] },
    { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured'] },
    { name: 'cards-teaser', instances: ['.image-list.list'] },
    { name: 'hero-promo', instances: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'] },
  ],
  sections: [
    { id: 'hero-carousel', name: 'Hero carousel', selector: ['.carousel.cmp-carousel--hero'], style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 'featured-article', name: 'Featured article teaser', selector: ['.teaser.cmp-teaser--featured'], style: 'highlight', blocks: ['columns-featured'], defaultContent: [] },
    { id: 'recent-articles', name: 'Recent Articles card grid', selector: ['.image-list.list'], style: null, blocks: ['cards-teaser'], defaultContent: [] },
    { id: 'next-adventures', name: 'Next Adventures promo', selector: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'], style: null, blocks: ['hero-promo'], defaultContent: [] },
    { id: 'where-to-go', name: 'Where do you want to go? card grid', selector: ['.image-list.list'], style: null, blocks: ['cards-teaser'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY (cleanup first, then section breaks/metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page based on the embedded template.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Target path: this is the US/EN home page → DA /index.
    //    The source pathname (/us/en.html) is mapped explicitly to /index per
    //    the migration target. Guard against an empty path (root URL) which
    //    would crash the bundled importer's path polyfill.
    const path = WebImporter.FileUtils.sanitizePath('/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
