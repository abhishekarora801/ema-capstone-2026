import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

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

/**
 * Opt-in filtering: authors add a list (ol/ul) of category labels in the
 * default-content block immediately before this one (e.g. the Adventures
 * "All / Climbing / Cycling / ..." list). When present, the block renders a
 * tab bar and filters cards by their `tags`. Pages without such a list
 * (Index, Magazine) render an unfiltered grid, unchanged.
 */
function readFilterLabels(block) {
  const wrapper = block.closest('.cards-teaser-wrapper') || block.parentElement;
  const prev = wrapper && wrapper.previousElementSibling;
  const list = prev && prev.querySelector('ol, ul');
  if (!list) return null;
  const labels = [...list.querySelectorAll('li')]
    .map((li) => li.textContent.trim())
    .filter(Boolean);
  if (labels.length < 2) return null;
  return { list, labels };
}

function renderMessage(block, message) {
  const p = document.createElement('p');
  p.className = 'cards-teaser-empty';
  p.textContent = message;
  block.append(p);
}

/**
 * Normalize an entry's tags into a set of category slugs. The `tags` field may
 * arrive as a JSON array (multi-value index column), a comma-separated string,
 * or a JSON-encoded string like '["Cycling","Travel"]'.
 */
function entryCategories(entry) {
  let { tags } = entry;
  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (trimmed.startsWith('[')) {
      try { tags = JSON.parse(trimmed); } catch (e) { tags = trimmed; }
    }
    if (typeof tags === 'string') tags = tags.split(',');
  }
  if (!Array.isArray(tags)) tags = tags ? [tags] : [];
  return tags.map((t) => toClassName(String(t).trim())).filter(Boolean);
}

function createCard(entry) {
  const li = document.createElement('li');
  li.dataset.categories = entryCategories(entry).join(' ');

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

/**
 * Build the filter tab bar and wire it to show/hide cards. The first label
 * (or any label named "all") is treated as the "show everything" tab.
 */
function decorateFilters(block, ul, labels) {
  const tablist = document.createElement('div');
  tablist.className = 'cards-teaser-filters';
  tablist.setAttribute('role', 'tablist');

  const applyFilter = (category) => {
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const cats = li.dataset.categories.split(' ').filter(Boolean);
      const show = !category || cats.includes(category);
      li.hidden = !show;
    });
  };

  labels.forEach((label, i) => {
    const slug = toClassName(label);
    const isAll = i === 0 || slug === 'all';
    const button = document.createElement('button');
    button.className = 'cards-teaser-filter';
    button.type = 'button';
    button.textContent = label;
    button.dataset.category = isAll ? '' : slug;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    button.addEventListener('click', () => {
      tablist.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      button.setAttribute('aria-selected', 'true');
      applyFilter(button.dataset.category);
    });
    tablist.append(button);
  });

  block.prepend(tablist);
}

export default async function decorate(block) {
  const config = readConfig(block);
  const source = config.source || DEFAULT_SOURCE;
  const { template } = config;
  const limit = Number.parseInt(config.limit, 10) > 0
    ? Number.parseInt(config.limit, 10)
    : DEFAULT_LIMIT;

  // Detect an authored filter list before clearing the block's surroundings.
  const filters = readFilterLabels(block);

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

  if (filters) {
    // Hide the raw authored list; the tab bar replaces it.
    filters.list.hidden = true;
    decorateFilters(block, ul, filters.labels);
  }
}
