import { createOptimizedPicture } from '../../scripts/aem.js';

const SOURCE = '/query-index.json';

/** Read the search term from the ?q= query parameter. */
function getQuery() {
  return new URLSearchParams(window.location.search).get('q')?.trim() || '';
}

/** Score/filter an entry against the lowercase search terms. */
function matches(entry, terms) {
  const haystack = `${entry.title || ''} ${entry.description || ''} ${entry.tags || ''}`.toLowerCase();
  return terms.every((t) => haystack.includes(t));
}

function createResult(entry) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = entry.path;

  if (entry.image) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'search-result-image';
    imageWrap.append(createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]));
    link.append(imageWrap);
  }

  const body = document.createElement('div');
  body.className = 'search-result-body';

  if (entry.title) {
    const title = document.createElement('p');
    title.className = 'search-result-title';
    title.textContent = entry.title;
    body.append(title);
  }

  if (entry.description) {
    const desc = document.createElement('p');
    desc.className = 'search-result-description';
    desc.textContent = entry.description;
    body.append(desc);
  }

  link.append(body);
  li.append(link);
  return li;
}

export default async function decorate(block) {
  // Any authored config (e.g. a source override) is ignored for now; clear it.
  const source = block.querySelector(':scope > div a')?.getAttribute('href') || SOURCE;
  block.textContent = '';

  const query = getQuery();

  // Search field so users can refine the query from the results page itself.
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.action = '/search';
  form.innerHTML = `
    <input type="search" name="q" aria-label="Search" placeholder="SEARCH" value="${query.replace(/"/g, '&quot;')}">
    <button type="submit" aria-label="Submit search"></button>
  `;
  block.append(form);

  const heading = document.createElement('p');
  heading.className = 'search-summary';
  block.append(heading);

  if (!query) {
    heading.textContent = 'Type a search term above to find adventures and articles.';
    return;
  }

  let data;
  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    ({ data } = await resp.json());
  } catch (e) {
    heading.textContent = 'Unable to search at this time.';
    return;
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  // Exclude helper/index pages (nav, footer, search itself) from results.
  const items = (Array.isArray(data) ? data : [])
    .filter((entry) => entry.path && !/\/(nav|footer|search)$/.test(entry.path))
    .filter((entry) => matches(entry, terms));

  if (!items.length) {
    heading.textContent = `No results found for “${query}”.`;
    return;
  }

  heading.textContent = `${items.length} result${items.length === 1 ? '' : 's'} for “${query}”`;

  const ul = document.createElement('ul');
  ul.className = 'search-results';
  items.forEach((entry) => ul.append(createResult(entry)));
  block.append(ul);
}
