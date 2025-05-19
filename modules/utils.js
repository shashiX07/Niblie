/**
 * Debounce function to limit how often a function can run
 */
export function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Direct image download helper
 */
export function downloadImage(imgSrc, suggestedFilename) {
  try {
    // For data URLs and blob URLs, we need to fetch them first
    if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) {
      fetch(imgSrc)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = suggestedFilename || 'image';
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(url);
        });
    } else {
      // For standard URLs, create a temporary link and click it
      const downloadLink = document.createElement('a');
      downloadLink.href = imgSrc;
      downloadLink.download = suggestedFilename || 'image';
      downloadLink.target = '_blank'; // Ensure it opens in a new context if needed
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  } catch (err) {
    console.error('Download failed:', err);
    alert('Download failed. The image might be protected or inaccessible.');
  }
}

/**
 * Function to convert image to different formats
 */
export function convertImageFormat(imageUrl, targetFormat, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous"; // Enable cross-origin image loading
  
  img.onload = function() {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    let mimeType;
    switch(targetFormat.toLowerCase()) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/png';
    }
    
    try {
      const dataURL = canvas.toDataURL(mimeType, 0.9); // 0.9 quality for JPEG/WEBP
      callback(dataURL);
    } catch (e) {
      console.error('Format conversion failed:', e);
      alert(`Could not convert to ${targetFormat}. The image might be from a different origin.`);
      callback(null);
    }
  };
  
  img.onerror = function() {
    console.error('Failed to load image for conversion');
    alert('Could not load image for conversion.');
    callback(null);
  };
  
  img.src = imageUrl;
}

/**
 * Video download helper
 */
export function downloadVideo(videoSrc, suggestedFilename) {
  return new Promise((resolve, reject) => {
    try {
      // For data URLs and blob URLs, we need different handling
      if (videoSrc.startsWith('data:') || videoSrc.startsWith('blob:')) {
        fetch(videoSrc)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
            }
            return response.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            triggerDownload(url, suggestedFilename);
            resolve(true);
          })
          .catch(err => {
            console.error("Video download error:", err);
            // Fallback for failed fetch - try direct link
            triggerDirectDownload(videoSrc, suggestedFilename);
            resolve(false);
          });
      } 
      // For direct video downloads
      else if (videoSrc.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
        // Try to use fetch first to handle CORS issues
        fetch(videoSrc, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              // If HEAD request succeeds, try the full download
              return fetch(videoSrc);
            } else {
              throw new Error('HEAD request failed, using direct download');
            }
          })
          .then(response => response.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            triggerDownload(url, suggestedFilename);
            resolve(true);
          })
          .catch(err => {
            console.error('Error in fetch, using direct download:', err);
            triggerDirectDownload(videoSrc, suggestedFilename);
            resolve(false);
          });
      }
      // For YouTube and other platforms without direct MP4 URLs
      else if (videoSrc.includes('youtube.com') || 
               videoSrc.includes('youtu.be') ||
               videoSrc.includes('instagram.com') ||
               videoSrc.includes('twitter.com') ||
               videoSrc.includes('facebook.com') ||
               videoSrc.includes('vimeo.com')) {
        // We can't download directly, so open in a new tab
        window.open(videoSrc, '_blank');
        resolve(false);
      }
      // For other URLs
      else {
        triggerDirectDownload(videoSrc, suggestedFilename);
        resolve(false);
      }
    } catch (err) {
      console.error("Error in downloadVideo:", err);
      // Ultimate fallback - open in new tab
      window.open(videoSrc, '_blank');
      reject(err);
    }
  });
}

/**
 * Helper to trigger download via link
 */
function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Fallback download method for direct URLs
 */
function triggerDirectDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}