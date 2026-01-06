let collectedBookmarks = {};
let isScrolling = false;

const statusEl = document.getElementById('status');
const scanBtn = document.getElementById('scanBtn');
const autoScrollBtn = document.getElementById('autoScrollBtn');
const stopBtn = document.getElementById('stopBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const formatSelect = document.getElementById('format');

function updateStatus(msg, count = null) {
  if (count !== null) {
    statusEl.innerHTML = `${msg}<br><span class="count">${count} bookmarks collected</span>`;
  } else {
    statusEl.textContent = msg;
  }
}

function updateButtonStates() {
  const count = Object.keys(collectedBookmarks).length;
  exportBtn.disabled = count === 0;
  autoScrollBtn.disabled = isScrolling;
  scanBtn.disabled = isScrolling;
  stopBtn.disabled = !isScrolling;
}

async function executeInTab(func, args = []) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('x.com/i/bookmarks') && !tab.url.includes('twitter.com/i/bookmarks')) {
    updateStatus('Please navigate to x.com/i/bookmarks first!');
    return null;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: func,
    args: args
  });

  return results[0]?.result;
}

function scrapeBookmarks() {
  const bookmarks = [];
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach(tweet => {
    try {
      // Get author info
      const userLinks = tweet.querySelectorAll('a[href^="/"]');
      let author = '';
      let handle = '';

      for (const link of userLinks) {
        const href = link.getAttribute('href');
        if (href && href.match(/^\/[^/]+$/) && !href.includes('/status/')) {
          handle = href.substring(1);
          const nameSpan = link.querySelector('span');
          if (nameSpan) {
            author = nameSpan.textContent;
          }
          break;
        }
      }

      // Get tweet URL and ID
      let tweetUrl = '';
      let tweetId = '';
      const timeLink = tweet.querySelector('a[href*="/status/"]');
      if (timeLink) {
        tweetUrl = 'https://x.com' + timeLink.getAttribute('href');
        const match = tweetUrl.match(/\/status\/(\d+)/);
        if (match) tweetId = match[1];
      }

      // Get timestamp
      const timeEl = tweet.querySelector('time');
      const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';

      // Get tweet text
      const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
      const tweetText = tweetTextEl ? tweetTextEl.textContent : '';

      // Get media URLs
      const mediaUrls = [];

      // Images
      const images = tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]');
      images.forEach(img => {
        let src = img.src;
        // Get higher quality version
        src = src.replace(/\?.*$/, '') + '?format=jpg&name=large';
        mediaUrls.push({ type: 'image', url: src });
      });

      // Videos (get poster/thumbnail)
      const videos = tweet.querySelectorAll('video');
      videos.forEach(video => {
        if (video.poster) {
          mediaUrls.push({ type: 'video_thumbnail', url: video.poster });
        }
      });

      // Get quote tweet if present
      let quoteTweet = null;
      const quoteContainer = tweet.querySelector('[data-testid="quoteTweet"]');
      if (quoteContainer) {
        const quoteTextEl = quoteContainer.querySelector('[data-testid="tweetText"]');
        const quoteText = quoteTextEl ? quoteTextEl.textContent : '';
        const quoteLink = quoteContainer.querySelector('a[href*="/status/"]');
        const quoteUrl = quoteLink ? 'https://x.com' + quoteLink.getAttribute('href') : '';
        quoteTweet = { text: quoteText, url: quoteUrl };
      }

      if (tweetId) {
        bookmarks.push({
          id: tweetId,
          author,
          handle,
          text: tweetText,
          url: tweetUrl,
          timestamp,
          media: mediaUrls,
          quoteTweet
        });
      }
    } catch (e) {
      console.error('Error parsing tweet:', e);
    }
  });

  return bookmarks;
}

async function doScan() {
  updateStatus('Scanning...');
  const bookmarks = await executeInTab(scrapeBookmarks);

  if (bookmarks) {
    bookmarks.forEach(b => {
      collectedBookmarks[b.id] = b;
    });
    updateStatus('Scan complete!', Object.keys(collectedBookmarks).length);
  }
  updateButtonStates();
}

async function doAutoScroll() {
  isScrolling = true;
  updateButtonStates();
  updateStatus('Starting auto-scroll...');

  // Inject the auto-scroll function
  const scrollAndCollect = async () => {
    return new Promise(resolve => {
      let lastHeight = 0;
      let sameHeightCount = 0;
      let totalCollected = 0;
      const allBookmarks = {};

      const scrape = () => {
        const bookmarks = [];
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');

        tweets.forEach(tweet => {
          try {
            const userLinks = tweet.querySelectorAll('a[href^="/"]');
            let author = '';
            let handle = '';

            for (const link of userLinks) {
              const href = link.getAttribute('href');
              if (href && href.match(/^\/[^/]+$/) && !href.includes('/status/')) {
                handle = href.substring(1);
                const nameSpan = link.querySelector('span');
                if (nameSpan) author = nameSpan.textContent;
                break;
              }
            }

            let tweetUrl = '';
            let tweetId = '';
            const timeLink = tweet.querySelector('a[href*="/status/"]');
            if (timeLink) {
              tweetUrl = 'https://x.com' + timeLink.getAttribute('href');
              const match = tweetUrl.match(/\/status\/(\d+)/);
              if (match) tweetId = match[1];
            }

            const timeEl = tweet.querySelector('time');
            const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';

            const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
            const tweetText = tweetTextEl ? tweetTextEl.textContent : '';

            const mediaUrls = [];
            const images = tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]');
            images.forEach(img => {
              let src = img.src.replace(/\?.*$/, '') + '?format=jpg&name=large';
              mediaUrls.push({ type: 'image', url: src });
            });

            const videos = tweet.querySelectorAll('video');
            videos.forEach(video => {
              if (video.poster) {
                mediaUrls.push({ type: 'video_thumbnail', url: video.poster });
              }
            });

            let quoteTweet = null;
            const quoteContainer = tweet.querySelector('[data-testid="quoteTweet"]');
            if (quoteContainer) {
              const quoteTextEl = quoteContainer.querySelector('[data-testid="tweetText"]');
              const quoteText = quoteTextEl ? quoteTextEl.textContent : '';
              const quoteLink = quoteContainer.querySelector('a[href*="/status/"]');
              const quoteUrl = quoteLink ? 'https://x.com' + quoteLink.getAttribute('href') : '';
              quoteTweet = { text: quoteText, url: quoteUrl };
            }

            if (tweetId) {
              bookmarks.push({
                id: tweetId, author, handle, text: tweetText,
                url: tweetUrl, timestamp, media: mediaUrls, quoteTweet
              });
            }
          } catch (e) {}
        });
        return bookmarks;
      };

      const scroll = () => {
        // Check for stop flag
        if (window._stopScrolling) {
          window._stopScrolling = false;
          resolve(Object.values(allBookmarks));
          return;
        }

        // Scrape current view
        const current = scrape();
        current.forEach(b => { allBookmarks[b.id] = b; });
        totalCollected = Object.keys(allBookmarks).length;

        // Update status in DOM for feedback
        const statusDiv = document.createElement('div');
        statusDiv.id = '_bookmark_status';
        statusDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:#1da1f2;color:white;padding:10px 15px;border-radius:8px;z-index:99999;font-family:sans-serif;';
        statusDiv.textContent = `Collected: ${totalCollected} bookmarks`;
        const existing = document.getElementById('_bookmark_status');
        if (existing) existing.remove();
        document.body.appendChild(statusDiv);

        // Scroll down
        window.scrollBy(0, window.innerHeight * 0.8);

        const newHeight = document.documentElement.scrollHeight;
        if (newHeight === lastHeight) {
          sameHeightCount++;
          if (sameHeightCount >= 5) {
            // Reached end
            const statusDiv = document.getElementById('_bookmark_status');
            if (statusDiv) statusDiv.remove();
            resolve(Object.values(allBookmarks));
            return;
          }
        } else {
          sameHeightCount = 0;
        }
        lastHeight = newHeight;

        setTimeout(scroll, 1500);
      };

      scroll();
    });
  };

  const bookmarks = await executeInTab(scrollAndCollect);

  if (bookmarks) {
    bookmarks.forEach(b => {
      collectedBookmarks[b.id] = b;
    });
  }

  isScrolling = false;
  updateButtonStates();
  updateStatus('Auto-scroll complete!', Object.keys(collectedBookmarks).length);
}

async function doStop() {
  await executeInTab(() => { window._stopScrolling = true; });
  updateStatus('Stopping...');
}

function doExport() {
  const bookmarks = Object.values(collectedBookmarks);
  const format = formatSelect.value;

  let content, filename, type;

  if (format === 'json') {
    content = JSON.stringify(bookmarks, null, 2);
    filename = `x-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    type = 'application/json';
  } else {
    // CSV
    const headers = ['id', 'author', 'handle', 'text', 'url', 'timestamp', 'media_urls', 'quote_tweet_url'];
    const rows = bookmarks.map(b => [
      b.id,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      b.handle,
      `"${(b.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      b.url,
      b.timestamp,
      `"${(b.media || []).map(m => m.url).join('; ')}"`,
      b.quoteTweet ? b.quoteTweet.url : ''
    ]);
    content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    filename = `x-bookmarks-${new Date().toISOString().split('T')[0]}.csv`;
    type = 'text/csv';
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  updateStatus(`Exported ${bookmarks.length} bookmarks!`, bookmarks.length);
}

function doClear() {
  collectedBookmarks = {};
  updateStatus('Data cleared. Ready to scan.');
  updateButtonStates();
}

scanBtn.addEventListener('click', doScan);
autoScrollBtn.addEventListener('click', doAutoScroll);
stopBtn.addEventListener('click', doStop);
exportBtn.addEventListener('click', doExport);
clearBtn.addEventListener('click', doClear);

updateButtonStates();
