import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Builds the search control in the tools area. The fragment carries only a
 * `:search:` token / placeholder; the interactive input + button are created
 * here (form controls never live in the plain fragment).
 * @param {Element} navTools The tools section element
 */
// Lazily fetch and cache the query-index once, so typing doesn't refetch.
let searchIndexPromise;
function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch('/query-index.json')
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => (Array.isArray(json.data) ? json.data : []))
      .catch(() => []);
  }
  return searchIndexPromise;
}

/** Rank matches: title hits first, then description/tags; cap the list. */
function findMatches(entries, query, limit = 5) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return entries
    .filter((e) => e.path && !/\/(nav|footer|search)$/.test(e.path))
    .filter((e) => {
      const hay = `${e.title || ''} ${e.description || ''} ${e.tags || ''}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .slice(0, limit);
}

/**
 * Builds the search control in the tools area. The fragment carries only a
 * `:search:` token / placeholder; the interactive input + button are created
 * here (form controls never live in the plain fragment). A live-results
 * dropdown (typeahead) is shown as the user types.
 * @param {Element} navTools The tools section element
 */
function decorateSearch(navTools) {
  if (!navTools) return;
  // Remove the placeholder text/icon the fragment used to mark the search slot.
  navTools.textContent = '';

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';

  const label = document.createElement('label');
  label.className = 'nav-search-label';
  label.setAttribute('for', 'nav-search-input');
  label.textContent = 'Search';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'nav-search-input';
  input.name = 'q';
  input.placeholder = 'SEARCH';
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('autocomplete', 'off');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Submit search');

  // Live-results dropdown (hidden until there are matches).
  const results = document.createElement('ul');
  results.className = 'nav-search-results';
  results.hidden = true;

  const renderResults = (matches) => {
    results.textContent = '';
    if (!matches.length) {
      results.hidden = true;
      return;
    }
    matches.forEach((entry) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = entry.path;
      link.textContent = entry.title || entry.path;
      li.append(link);
      results.append(li);
    });
    results.hidden = false;
  };

  const onInput = async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      renderResults([]);
      return;
    }
    const entries = await loadSearchIndex();
    // Ignore stale responses if the field changed while awaiting.
    if (input.value.trim() !== query) return;
    renderResults(findMatches(entries, query));
  };

  input.addEventListener('input', onInput);
  input.addEventListener('focus', onInput);
  // Warm the index on first interaction.
  input.addEventListener('focus', loadSearchIndex, { once: true });

  // Hide the dropdown when focus leaves the search control.
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) results.hidden = true;
  });

  form.append(label, input, submit, results);
  navTools.append(form);
}

/**
 * Marks up the locale selector in the utility bar. The fragment provides the
 * "Sign In" link and a locale list; this tags them for styling and turns the
 * locale list into a hoverable dropdown keyed off the current locale.
 * @param {Element} navUtility The utility section element
 */
function decorateUtility(navUtility) {
  if (!navUtility) return;
  const signIn = navUtility.querySelector('a[href*="sign-in"], a[href="#sign-in"]');
  if (signIn) {
    signIn.classList.add('nav-signin');
    // Source renders SIGN IN in caps (done via CSS text-transform in header.css).
  }

  const localeList = navUtility.querySelector('ul');
  if (localeList) {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-locale';

    // Tag each country row and its flag/locale-links for styling. EDS wraps
    // fragment images in <picture>, so tag whichever wrapper is present.
    localeList.classList.add('nav-locale-list');
    localeList.querySelectorAll(':scope > li').forEach((country) => {
      country.classList.add('nav-locale-country');
      // EDS wraps the flag in <p><picture> and keeps the options in a nested
      // <ul>. Lift the flag to be a direct child (grid cell) and unwrap its <p>.
      const flag = country.querySelector('picture') || country.querySelector('img');
      const options = country.querySelector('ul');
      options?.classList.add('nav-locale-options');
      if (flag) {
        flag.classList.add('nav-locale-flag');
        const wrap = flag.closest('p');
        if (wrap && wrap.parentElement === country) {
          country.insertBefore(flag, wrap);
          wrap.remove();
        } else {
          country.insertBefore(flag, country.firstChild);
        }
      }
      // Country name: prefer surviving text/elements, else derive from the flag
      // alt (the fragment's bare country-name text does not survive the DA→md
      // pipeline reliably, but the flag alt does). Render it as its own element.
      let name = country.querySelector('strong');
      if (!name) {
        const img = flag?.tagName === 'IMG' ? flag : flag?.querySelector('img');
        const label = (img?.getAttribute('alt') || '').trim();
        const looseText = [...country.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .join(' ')
          .trim();
        const text = looseText || label;
        if (text) {
          name = document.createElement('strong');
          name.textContent = text;
        }
      }
      if (name) {
        name.classList.add('nav-locale-name');
        // Place the name before the options list (top of grid column 2).
        if (options) country.insertBefore(name, options);
        else country.append(name);
      }
    });

    // Toggle shows the current flag + locale (US/EN by default).
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-locale-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    const currentFlag = localeList.querySelector('.nav-locale-country .nav-locale-flag');
    const currentLocale = localeList.querySelector('.nav-locale-options a');
    const flagMarkup = currentFlag ? `<span class="nav-locale-toggle-flag">${currentFlag.outerHTML}</span>` : '';
    toggle.innerHTML = `${flagMarkup}<span>${currentLocale ? currentLocale.textContent.trim() : 'EN-US'}</span>`;

    wrapper.append(toggle, localeList);
    navUtility.append(wrapper);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Four fragment sections: utility (Sign In + locale), brand, sections, tools.
  const classes = ['utility', 'brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      // Highlight the tab for the current page (source shows a yellow active tab).
      const link = navSection.querySelector('a');
      if (link) {
        const linkPath = new URL(link.href, window.location).pathname.replace(/\.html$/, '').replace(/\/$/, '');
        if (linkPath && (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`))) {
          navSection.classList.add('nav-active');
        }
      }
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  decorateUtility(nav.querySelector('.nav-utility'));
  decorateSearch(nav.querySelector('.nav-tools'));

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Shrink-on-scroll: toggle a class on the sticky header once the page is
  // scrolled past a small threshold. CSS handles the smooth size/spacing
  // transition to the compact state. Uses rAF so the scroll handler is cheap.
  const headerEl = block.closest('header') || block;
  const SHRINK_AT = 40;
  let ticking = false;
  const applyShrink = () => {
    headerEl.classList.toggle('header-scrolled', window.scrollY > SHRINK_AT);
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(applyShrink);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  applyShrink();
}
