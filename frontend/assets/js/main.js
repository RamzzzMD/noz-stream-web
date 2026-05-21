// ================== KONFIGURASI ==================
// Kosongkan karena kita pakai relative path di Vercel (/api/...)
const API_BASE = 'noz-stream-web.vercel.app/api/'; 

// State Global
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let currentQuery = '';
let currentType = 'home'; 
let currentSlug = '';

let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// ================== HELPER FUNCTIONS ==================
function saveToHistory(video) {
    const exists = history.findIndex(v => v.url === video.url);
    if (exists !== -1) history.splice(exists, 1);
    history.unshift(video);
    if (history.length > 50) history.pop();
    localStorage.setItem('watchHistory', JSON.stringify(history));
}

function toggleFavorite(video) {
    const index = favorites.findIndex(v => v.url === video.url);
    if (index === -1) {
        favorites.push(video);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function createVideoCard(video) {
    const isFav = favorites.some(v => v.url === video.url);
    const safeVideo = JSON.stringify(video).replace(/"/g, '&quot;');
    const thumbUrl = video.thumbnail || 'https://via.placeholder.com/300x169/000000/FFFFFF?text=No+Thumbnail';

    return `
        <div class="group relative cursor-pointer" onclick="playVideo('${video.url}', ${safeVideo})">
            <div class="relative overflow-hidden rounded-xl aspect-video bg-zinc-900 border border-zinc-800">
                <img src="${thumbUrl}" alt="${video.title}" loading="lazy"
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-80">
                <span class="absolute bottom-2 right-2 bg-black/90 text-xs px-2 py-1 rounded-md font-mono font-bold tracking-wider">
                    ${video.duration || '00:00'}
                </span>
                <button onclick="event.stopImmediatePropagation(); toggleFavorite(${safeVideo});" 
                        class="absolute top-2 right-2 text-2xl drop-shadow-md transition ${isFav ? 'text-red-500 scale-110' : 'text-white/40 hover:text-red-500'}">
                    ❤️
                </button>
            </div>
            <h3 class="mt-3 line-clamp-2 text-sm font-semibold leading-tight text-zinc-200 group-hover:text-red-500 transition-colors">
                ${video.title}
            </h3>
            <p class="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <i class="fas fa-eye"></i> ${video.views || 'N/A'}
            </p>
        </div>
    `;
}

function playVideo(url, videoData = null) {
    if (videoData) saveToHistory(videoData);
    localStorage.setItem('currentVideoUrl', url);
    window.location.href = 'video.html';
}

// ================== SEARCH & VIDEO ==================
function performSearch() {
    const input = document.getElementById('searchInput');
    if (!input || !input.value.trim()) return;

    currentQuery = input.value.trim();
    currentType = 'search';
    
    const titleEl = document.getElementById('searchResultTitle');
    if(titleEl) titleEl.textContent = `Pencarian: "${currentQuery}"`;
    
    resetInfinite();
    loadMore();
}

async function loadVideo() {
    const url = localStorage.getItem('currentVideoUrl');
    if (!url) return window.location.href = 'index.html';

    try {
        const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        if (data.embed) document.getElementById('player').src = data.embed;
        if (data.title) document.getElementById('title').textContent = data.title;

        const relatedContainer = document.getElementById('related');
        if (relatedContainer && data.related) {
            relatedContainer.innerHTML = data.related.map(v => createVideoCard(v)).join('');
        }
    } catch (err) {
        console.error('Error memuat video:', err);
    }
}

// ================== INFINITE SCROLL ==================
async function loadMore() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');

    try {
        let endpoint = '';
        if (currentType === 'search' && currentQuery) {
            endpoint = `/api/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
        } else if (currentType === 'category' && currentSlug) {
            endpoint = `/api/category?slug=${currentSlug}&page=${currentPage}`;
        } else {
            return;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        const container = document.getElementById('videoContainer');
        const results = data.results || [];

        if (results.length === 0) {
            hasMore = false;
            if (currentPage === 1 && container) {
                container.innerHTML = '<p class="text-zinc-500 col-span-full">Tidak ada video ditemukan.</p>';
            }
            return;
        }

        results.forEach(video => { container.innerHTML += createVideoCard(video); });
        currentPage++;

    } catch (err) {
        hasMore = false;
    } finally {
        isLoading = false;
        if (loader) loader.classList.add('hidden');
    }
}

function initInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
    }, { rootMargin: '300px' });

    const sentinel = document.getElementById('sentinel');
    if (sentinel) observer.observe(sentinel);
}

function resetInfinite() {
    currentPage = 1;
    hasMore = true;
    isLoading = false;
    const container = document.getElementById('videoContainer');
    if (container) container.innerHTML = '';
}

// ================== HOME PAGE ==================
async function loadHome() {
    try {
        const res = await fetch('/api/home');
        const data = await res.json();

        const latestContainer = document.getElementById('latest-section');
        if (latestContainer && data.latest) {
            latestContainer.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
                    <i class="fas fa-play-circle text-red-500"></i> Terbaru
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    ${data.latest.map(v => createVideoCard(v)).join('')}
                </div>
            `;
        }

        const trendingContainer = document.getElementById('trending-section');
        if (trendingContainer && data.trending) {
            trendingContainer.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
                    <i class="fas fa-fire text-red-500"></i> Sedang Trending
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    ${data.trending.map(v => createVideoCard(v)).join('')}
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
    }
}

// ================== THEME ==================
function toggleTheme() {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('themeToggle');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-sun text-xl"></i>`;
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-moon text-xl"></i>`;
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default Dark
    const toggleBtn = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-sun text-xl"></i>`;
    } else {
        document.documentElement.classList.add('dark');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-moon text-xl"></i>`;
    }
}

// Global Export
window.playVideo = playVideo;
window.toggleFavorite = toggleFavorite;
window.loadHome = loadHome;
window.loadMore = loadMore;
window.resetInfinite = resetInfinite;
window.initInfiniteScroll = initInfiniteScroll;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;
window.performSearch = performSearch;
window.loadVideo = loadVideo;
