/**
 * Categorize URLs into different types
 */
export function categorizeLinks(urls) {
  const categories = {
    pdfs: [],
    docs: [],
    socials: [],
    media: [],
    external: [],
    internal: [],
    unwanted: []
  };

  const socialDomains = ['twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com'];
  const mediaExtensions = ['.mp4', '.webm', '.jpg', '.png', '.gif'];
  const unwantedPatterns = ['adservice', 'doubleclick', 'tracking'];

  const baseHost = window.location.hostname;

  for (const url of urls) {
    if (!url) continue;

    try {
      if (unwantedPatterns.some(p => url.includes(p))) {
        categories.unwanted.push(url);
      } else if (url.endsWith('.pdf')) {
        categories.pdfs.push(url);
      } else if (url.endsWith('.doc') || url.endsWith('.docx') || url.endsWith('.xls') || url.endsWith('.ppt')) {
        categories.docs.push(url);
      } else if (socialDomains.some(domain => url.includes(domain))) {
        categories.socials.push(url);
      } else if (mediaExtensions.some(ext => url.toLowerCase().includes(ext))) {
        categories.media.push(url);
      } else if (url.includes(baseHost)) {
        categories.internal.push(url);
      } else {
        categories.external.push(url);
      }
    } catch (err) {
      console.error('Error processing URL:', url, err);
    }
  }
  return categories;
}

/**
 * Create basic link list HTML
 */
export function createLinkList(title, list) {
  if (list.length === 0) return '';
  return `
    <div class="link-group">
      <h4>${title} (${list.length})</h4>
      <ul>${list.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
    </div>
  `;
}

/**
 * Create enhanced link list with info buttons
 */
export function createEnhancedLinkList(title, list) {
  if (list.length === 0) return '';
  
  return `
    <div class="link-group">
      <h4>${title} (${list.length})</h4>
      <ul class="enhanced-link-list">
        ${list.map(url => `
          <li class="enhanced-link-item">
            <div class="link-main">
              <a href="${url}" target="_blank" class="link-url">${url}</a>
              <button class="link-info-toggle" data-url="${url}">ℹ️</button>
            </div>
            <div class="link-details" id="details-${btoa(url).replace(/=/g, '')}" style="display: none;">
              <div class="link-loading">Loading details...</div>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Set up link info toggle buttons
 */
export function setupLinkInfoToggles() {
  // First, remove any existing listeners by replacing all buttons
  const buttons = document.querySelectorAll('.link-info-toggle');
  buttons.forEach(oldBtn => {
    const newBtn = document.createElement('button');
    newBtn.className = 'link-info-toggle';
    newBtn.dataset.url = oldBtn.dataset.url;
    newBtn.innerHTML = 'ℹ️';
    if (oldBtn.parentNode) {
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    }
  });
  
  // Now add new event listeners using direct event binding
  document.querySelectorAll('.link-info-toggle').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const url = this.dataset.url;
      if (!url) {
        console.error('No URL found for this button:', this);
        return;
      }
      
      try {
        const containerId = `details-${btoa(url).replace(/=/g, '')}`;
        const detailsContainer = document.getElementById(containerId);
        
        if (!detailsContainer) {
          console.error('Details container not found for:', url, containerId);
          return;
        }
        
        const isHidden = detailsContainer.style.display === 'none';
        
        if (isHidden) {
          detailsContainer.style.display = 'block';
          loadUrlDetails(url, containerId);
        } else {
          detailsContainer.style.display = 'none';
        }
      } catch (err) {
        console.error('Error toggling link details:', err);
      }
    });
  });
  
  console.log('Link info toggles setup complete, attached to', document.querySelectorAll('.link-info-toggle').length, 'buttons');
}

// Function to load URL details
function loadUrlDetails(url, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '<div class="link-loading">Loading details...</div>';
  
  // Fix the dynamic import issue by using the full path
  import('./url.js').then((urlModule) => {
    const { analyzeUrl } = urlModule;
    
    analyzeUrl(url).then(info => {
      if (document.getElementById(containerId)) {
        container.innerHTML = `
          <div class="url-details">
            <div class="url-detail-item"><span>Status:</span> <span class="status-indicator ${info.status}">${info.status}</span></div>
            <div class="url-detail-item"><span>Domain:</span> ${info.domain || 'Unknown'}</div>
            <div class="url-detail-item"><span>Path:</span> ${info.path || 'Unknown'}</div>
            <div class="url-detail-item"><span>Protocol:</span> ${info.protocol || 'Unknown'}</div>
            ${info.isRedirecting ? `
              <div class="url-detail-item"><span>Redirects To:</span> <span class="redirect-url">${info.finalUrl}</span></div>
            ` : ''}
            ${Object.keys(info.queryParams).length > 0 ? `
              <div class="url-detail-item">
                <span>Query Parameters:</span>
                <ul class="query-params">
                  ${Object.entries(info.queryParams).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value || ''}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      }
    }).catch(err => {
      if (document.getElementById(containerId)) {
        container.innerHTML = `<div class="url-error">Error: ${err.message || 'Could not load details'}</div>`;
      }
    });
  }).catch(err => {
    container.innerHTML = `<div class="url-error">Module Error: Could not load URL analysis module</div>`;
  });
}