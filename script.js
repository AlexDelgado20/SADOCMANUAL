// SVG Icons
const svgCaret = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
const svgDocument = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
const svgTip = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  const menuContainer = document.getElementById('dynamic-menu');
  const contentArea = document.getElementById('content-area');
  const tocMenu = document.getElementById('toc-menu');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarLeft = document.querySelector('.sidebar-left');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebarLeft.classList.toggle('open');
    });
  }

  const logoBtn = document.getElementById('manual-logo') || document.querySelector('.logo');
  const contentMain = document.querySelector('.content-main');
  const initialWelcomeContent = contentArea.innerHTML;

  if (logoBtn) {
    logoBtn.addEventListener('click', () => {
      if (contentMain) contentMain.classList.add('welcome-mode');
      contentArea.innerHTML = initialWelcomeContent;
      searchInput.value = '';
      searchResults.classList.add('hidden');
      tocMenu.innerHTML = '';
      document.querySelectorAll('.tree-label').forEach(el => el.classList.remove('active'));

      if (window.innerWidth <= 768) {
        if (sidebarLeft) sidebarLeft.classList.remove('open');
      }
    });
  }

  // 1. Initial Render
  const navigationData = window.generatedNavigationData || [];
  renderMenu(navigationData, menuContainer);

  // 2. Prepare Search Data
  const flatData = flattenData(navigationData);

  // 3. Search Interactivity
  function searchContent(query) {
    if (!window.searchIndex) return [];

    let fullTextResults = [];
    for (const [title, data] of Object.entries(window.searchIndex)) {
      const textContent = data.text;
      const lowerText = textContent.toLowerCase();
      const idx = lowerText.indexOf(query);

      if (idx !== -1) {
        const flatItem = flatData.find(f => f.title === title);
        const path = flatItem ? flatItem.path : title;

        const start = Math.max(0, idx - 40);
        const snippet = "..." + textContent.substring(start, idx + query.length + 60) + "...";

        fullTextResults.push({ title, path, snippet: snippet.trim() });
      }
    }
    return fullTextResults;
  }

  function renderFullTextResultsPage(query, results) {
    const contentMain = document.querySelector('.content-main');
    if (contentMain) contentMain.classList.remove('welcome-mode');

    let html = `
        <div class="content-placeholder custom-doc-content" style="max-width: 800px; margin: 0 auto;">
            <div class="content-breadcrumb">Búsqueda Avanzada</div>
            <h1 class="content-title">Resultados de contenido</h1>
            <p class="content-desc">Se encontraron ${results.length} coincidencias exactas para "<strong>${query}</strong>" dentro de la documentación.</p>
            <div class="search-results-page" style="margin-top: 2rem;">
     `;

    results.forEach(res => {
      html += `
            <div class="search-page-item" style="margin-bottom: 1.5rem; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius); cursor: pointer; transition: all 0.2s ease; background: var(--color-card);" 
                 onclick="window.loadContentFromSearch('${res.title.replace(/'/g, "\\'")}', '${res.path.replace(/'/g, "\\'")}')" 
                 onmouseover="this.style.borderColor='var(--color-primary)'; this.style.transform='translateY(-2px)';" 
                 onmouseout="this.style.borderColor='var(--color-border)'; this.style.transform='translateY(0)';">
                <h3 style="color: var(--color-primary); font-size: 1.15rem; margin-bottom: 0.3rem;">${res.title}</h3>
                <div style="font-size: 0.8rem; color: var(--color-text-soft); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">${res.path}</div>
                <p style="font-size: 0.95rem; color: var(--color-text); line-height: 1.5;">${highlightText(res.snippet, query)}</p>
            </div>
        `;
    });

    html += `</div></div>`;
    contentArea.innerHTML = html;

    // Update Index to show simply "Resultados"
    tocMenu.innerHTML = '<li><span class="toc-link active">Resultados de búsqueda</span></li>';
  }

  window.loadContentFromSearch = function (title, path) {
    loadContent(title, path);
    expandToNode(title);
  };

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length === 0) {
      searchResults.classList.add('hidden');
      return;
    }

    const titleResults = flatData.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.path.toLowerCase().includes(query)
    );

    const fullResults = searchContent(query);
    renderSearchResults(titleResults, query, fullResults);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.toLowerCase().trim();
      if (query.length > 0) {
        // Option 1: If there are title results, we could load the first one? 
        // But for consistency with user request, Enter could also just open full results page
        const fullResults = searchContent(query);
        if (fullResults.length > 0) {
          searchResults.classList.add('hidden');
          searchInput.value = '';
          renderFullTextResultsPage(query, fullResults);
        }
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.add('hidden');
    }
  });

  // Core Logic Functions
  function renderMenu(data, parentElement, path = "") {
    const ul = document.createElement('ul');
    if (parentElement.id === 'dynamic-menu') {
      ul.style.display = 'block';
      ul.style.marginLeft = '0';
      ul.style.paddingLeft = '0';
      ul.style.borderLeft = 'none';
    }

    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'tree-item';

      const label = document.createElement('div');
      label.className = 'tree-label';

      const hasChildren = item.children && item.children.length > 0;
      const caret = document.createElement('span');
      caret.className = 'tree-caret';
      caret.innerHTML = hasChildren ? svgCaret : svgDocument;

      if (!hasChildren) {
        label.classList.add('no-children');
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = item.text;

      label.appendChild(caret);
      label.appendChild(textSpan);

      const currentPath = path ? `${path} > ${item.text}` : item.text;

      li.appendChild(label);

      if (hasChildren) {
        const childUl = renderMenu(item.children, li, currentPath);

        label.addEventListener('click', () => {
          label.classList.toggle('expanded');
          childUl.classList.toggle('open');
        });
      } else {
        label.addEventListener('click', () => {
          document.querySelectorAll('.tree-label').forEach(el => el.classList.remove('active'));
          label.classList.add('active');
          loadContent(item.text, currentPath);
          if (window.innerWidth <= 768) {
            const sidebarLayout = document.querySelector('.sidebar-left');
            if (sidebarLayout) sidebarLayout.classList.remove('open');
          }
        });
      }

      ul.appendChild(li);
    });

    parentElement.appendChild(ul);
    return ul;
  }

  function flattenData(data, path = "") {
    let result = [];
    data.forEach(item => {
      const currentPath = path ? `${path} > ${item.text}` : item.text;
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenData(item.children, currentPath));
      } else {
        result.push({
          title: item.text,
          path: currentPath,
          // Generic description for search mocking
          description: `Guía y documentación detallada sobre ${item.text}.`
        });
      }
    });
    return result;
  }

  function renderSearchResults(titleResults, query, fullTextResults = []) {
    searchResults.innerHTML = '';

    if (titleResults.length === 0 && fullTextResults.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><span class="search-result-title">No se encontraron resultados</span></div>';
    } else {
      // 1. Render Title Results (Max 6)
      titleResults.slice(0, 6).forEach(res => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
                    <div class="search-result-title">${highlightText(res.title, query)}</div>
                    <div class="search-result-path">${highlightText(res.path, query)}</div>
                `;
        div.addEventListener('click', () => {
          loadContent(res.title, res.path);
          searchResults.classList.add('hidden');
          searchInput.value = '';
          expandToNode(res.title);
          if (window.innerWidth <= 768) {
            const sidebarLayout = document.querySelector('.sidebar-left');
            if (sidebarLayout) sidebarLayout.classList.remove('open');
          }
        });
        searchResults.appendChild(div);
      });

      // 2. Always show full text search option if there are results
      if (fullTextResults.length > 0) {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.style.borderTop = '2px solid var(--color-border)';
        div.style.backgroundColor = 'var(--color-bg)';
        div.innerHTML = `
                <div class="search-result-title" style="color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Buscar en el texto completo
                </div>
                <div class="search-result-path">Se encontraron ${fullTextResults.length} resultados para "${query}"</div>
            `;
        div.addEventListener('click', () => {
          searchResults.classList.add('hidden');
          searchInput.value = '';
          renderFullTextResultsPage(query, fullTextResults);
          if (window.innerWidth <= 768) {
            const sidebarLayout = document.querySelector('.sidebar-left');
            if (sidebarLayout) sidebarLayout.classList.remove('open');
          }
        });
        searchResults.appendChild(div);
      }
    }
    searchResults.classList.remove('hidden');
  }

  function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  const contentCache = {};

  async function loadContent(title, path) {
    const contentMain = document.querySelector('.content-main');
    if (contentMain) contentMain.classList.remove('welcome-mode');

    const parentModule = path.split(' > ')[0] || 'SADOC';
    let moduleHtml = "";

    // Determine subfolder based on current page path
    let folder = 'administracion';
    if (window.location.pathname.includes('estandar')) {
      folder = 'estandar';
    } else if (window.location.pathname.includes('restaurante')) {
      folder = 'restaurante';
    }

    if (contentCache[title]) {
      moduleHtml = contentCache[title];
    } else if (window.searchIndex && window.searchIndex[title]) {
      try {
        const response = await fetch(`./docs_data/${folder}/sections/${window.searchIndex[title].file}`);
        if (response.ok) {
          moduleHtml = await response.text();
          contentCache[title] = moduleHtml;
        }
      } catch (e) {
        console.error("Error loading section:", e);
      }
    }

    if (!moduleHtml) {
      moduleHtml = `
            <div class="content-placeholder">
                <div class="content-breadcrumb">${path.replace(/ > /g, ' · ')}</div>
                <h1 class="content-title" id="sec-inicio">${title}</h1>
                <p class="content-desc">
                    La documentación detallada para el submódulo de <strong>${title}</strong> aún no está disponible en la carpeta importada o está en proceso de creación.
                </p>
                <div class="content-section">
                    <h2 id="sec-uso">Información Pendiente</h2>
                    <ul class="steps-list">
                        <li>Este módulo fue detectado en el esquema general pero no tiene una plantilla asociada.</li>
                    </ul>
                </div>
            </div>
        `;
    } else {
      // Wrap everything inside a unified style container and add breadcrumbs
      moduleHtml = `
            <div class="content-placeholder custom-doc-content">
                <div class="content-breadcrumb">${path.replace(/ > /g, ' · ')}</div>
                ${moduleHtml}
            </div>
        `;
    }

    contentArea.innerHTML = moduleHtml;
    updateToc();
  }

  function expandToNode(title) {
    document.querySelectorAll('.tree-label').forEach(label => {
      const span = label.querySelector('span:not(.tree-caret)');
      if (span && span.textContent === title) {
        label.classList.add('active');

        // Expand parent lists up to the root
        let parentUl = label.closest('ul');
        while (parentUl && parentUl.id !== 'dynamic-menu') {
          parentUl.classList.add('open');
          const parentLi = parentUl.parentElement;
          if (parentLi) {
            const parentLabel = parentLi.querySelector('.tree-label');
            if (parentLabel && !parentLabel.classList.contains('expanded')) {
              parentLabel.classList.add('expanded');
            }
          }
          parentUl = parentLi ? parentLi.closest('ul') : null;
        }
      } else {
        label.classList.remove('active');
      }
    });
  }

  function updateToc() {
    tocMenu.innerHTML = '';
    const headings = contentArea.querySelectorAll('h1, h2');
    if (headings.length === 0) {
      tocMenu.innerHTML = '<li><span class="toc-link">No hay estructura de página</span></li>';
      return;
    }

    headings.forEach(h => {
      if (!h.id) {
        // Ensure all headings have an id to anchor to
        h.id = 'sec-' + Math.random().toString(36).substr(2, 9);
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.className = 'toc-link';
      a.textContent = h.textContent;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        a.classList.add('active');

        // Smooth scroll calculation considering header height
        const headerOffset = 80;
        const elementPosition = h.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });

        // But we are in a flex layout with overflow auto on main container!!
        // The main container scrolls, not the window!
        const contentMain = document.querySelector('.content-main');
        const relativeTop = h.offsetTop - headerOffset;
        contentMain.scrollTo({
          top: relativeTop,
          behavior: 'smooth'
        });
      });

      li.appendChild(a);
      tocMenu.appendChild(li);
    });

    // Set first section active by default
    const firstLink = tocMenu.querySelector('.toc-link');
    if (firstLink) {
      firstLink.classList.add('active');
    }

    setupIntersectionObserver(headings);
  }

  function setupIntersectionObserver(headings) {
    const contentMain = document.querySelector('.content-main');

    const observer = new IntersectionObserver((entries) => {
      // Need to figure out which entry is most visible or crossing the threshold
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.toc-link').forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === `#${id}`) {
              l.classList.add('active');
            }
          });
        }
      });
    }, {
      root: contentMain,
      rootMargin: '0px 0px -60% 0px',
      threshold: 0
    });

    headings.forEach(h => observer.observe(h));
  }
});
