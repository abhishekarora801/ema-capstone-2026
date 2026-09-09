import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/query-index.json';
const DEFAULT_LIMIT = 24;

/**
 * Read optional config rows from the block's DA table. Each row is a
 * two-cell `key | value` pair. All keys are optional:
 *   - source:   JSON endpoint (default /query-index.json)
 *   - template: filter rows by their `template` value (e.g. "article")
 *   - limit:    max cards to render (default 24)
 */
function readConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

function renderMessage(block, message) {
  const p = document.createElement('p');
  p.className = 'cards-teaser-empty';
  p.textContent = message;
  block.append(p);
}

function createCard(entry) {
  const li = document.createElement('li');

  // The whole card is a single link to the entry's path.
  const link = document.createElement('a');
  link.href = entry.path;

  // Image
  if (entry.image) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'cards-teaser-card-image';
    imageWrap.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    link.append(imageWrap);
  }

  // Body: title + description
  const body = document.createElement('div');
  body.className = 'cards-teaser-card-body';

  if (entry.title) {
    const title = document.createElement('p');
    title.className = 'cards-teaser-card-title';
    title.textContent = entry.title;
    body.append(title);
  }

  if (entry.description) {
    const desc = document.createElement('p');
    desc.className = 'cards-teaser-card-description';
    desc.textContent = entry.description;
    body.append(desc);
  }

  link.append(body);
  li.append(link);
  return li;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const source = config.source || DEFAULT_SOURCE;
  const { template } = config;
  const limit = Number.parseInt(config.limit, 10) > 0
    ? Number.parseInt(config.limit, 10)
    : DEFAULT_LIMIT;

  block.textContent = '';

  let data;
  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    ({ data } = await resp.json());
  } catch (e) {
    renderMessage(block, 'Unable to load listings at this time.');
    return;
  }

  let items = Array.isArray(data) ? data : [];
  if (template) items = items.filter((entry) => entry.template === template);
  items = items.slice(0, limit);

  if (!items.length) {
    renderMessage(block, 'No items to display.');
    return;
  }

  const ul = document.createElement('ul');
  items.forEach((entry) => ul.append(createCard(entry)));
  block.append(ul);
}
