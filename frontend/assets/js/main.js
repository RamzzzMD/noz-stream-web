// ================== KONFIGURASI ==================
const API_BASE = 'https://noz-stream-web.vercel.app'; // Kosongkan karena kita pakai relative path di Vercel

// State Global
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let currentQuery = '';
let currentType = 'home';     // home | search | category
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
    return `
        <div class="group relative cursor-pointer" onclick="playVideo('${video.url}', ${JSON.stringify(video).replace(/"/g, '&quot;')})">
            <div class="relative overflow-hidden rounded-xl aspect-video bg-black">
                <img src="${video.thumbnail}" 
                     class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300">
                <span class="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-1 rounded font-mono">
                    ${video.duration}
                </span>
                <button onclick="event.stopImmediatePropagation(); toggleFavorite(${JSON.stringify(video).replace(/"/g, '&quot;')});" 
                        class="absolute top-2 right-2 text-2xl transition ${isFav ? 'text-red-500 scale-110' : 'text-white/60 hover:text-red-500'}">
                    ❤️
                </button>
            </div>
            <p class="mt-3 line-clamp-2 text-sm font-medium leading-tight group-hover:text-red-500">
                ${video.title}
            </p>
            <p class="text-xs text-gray-400 mt-1">${video.views || ''}</p>
        </div>
    `;
}

function playVideo(url, videoData = null) {
    if (videoData) saveToHistory(videoData);
    localStorage.setItem('currentVideoUrl', url);
    window.location.href = 'video.html';
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
        } 
        else if (currentType === 'category' && currentSlug) {
            endpoint = `/api/category?slug=${currentSlug}&page=${currentPage}`;
        } 
        else {
            return;
        }

        const res = await fetch(endpoint);
        const data = await res.json();

        const container = document.getElementById('videoContainer');
        const results = data.results || data.latest || [];

        if (results.length === 0) {
            hasMore = false;
            return;
        }

        results.forEach(video => {
            container.innerHTML += createVideoCard(video);
        });

        currentPage++;

    } catch (err) {
        console.error('Error loading more:', err);
        hasMore = false;
    } finally {
        isLoading = false;
        if (loader) loader.classList.add('hidden');
    }
}

function initInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            loadMore();
        }
    }, {
        rootMargin: '300px'
    });

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

        // Latest
        const latestContainer = document.getElementById('latest-section');
        if (latestContainer) {
            latestContainer.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span class="text-red-500">▶</span> Terbaru
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    ${data.latest.map(v => createVideoCard(v)).join('')}
                </div>
            `;
        }

        // Trending
        const trendingContainer = document.getElementById('trending-section');
        if (trendingContainer) {
            trendingContainer.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span class="text-red-500">🔥</span> Trending
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    ${data.trending.map(v => createVideoCard(v)).join('')}
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
    }
}

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
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-sun text-xl"></i>`;
    } else {
        document.documentElement.classList.add('dark');
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-moon text-xl"></i>`;
    }
}

function performSearch() {
    const input = document.getElementById('searchInput');
    if (!input || !input.value.trim()) return;

    currentQuery = input.value.trim();
    currentType = 'search';
    
    const titleEl = document.getElementById('searchResultTitle');
    if(titleEl) titleEl.textContent = `Hasil Pencarian: ${currentQuery}`;
    
    resetInfinite(); // Kosongkan kontainer dan reset page ke 1
    loadMore();      // Mulai fetch hasil pencarian
}

async function loadVideo() {
    const url = localStorage.getItem('currentVideoUrl');
    if (!url) {
        window.location.href = 'index.html'; // Kembalikan jika tidak ada URL yang valid
        return;
    }

    try {
        const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        // Tampilkan Video & Title
        if (data.embed) {
            document.getElementById('player').src = data.embed;
        } else {
            console.warn("Embed URL tidak ditemukan.");
        }
        
        if (data.title) {
            document.getElementById('title').textContent = data.title;
        }

        // Tampilkan Video Terkait
        const relatedContainer = document.getElementById('related');
        if (relatedContainer && data.related) {
            relatedContainer.innerHTML = data.related.map(v => createVideoCard(v)).join('');
        }
    } catch (err) {
        console.error('Error memuat detail video:', err);
    }
}

// Export ke window agar bisa dipakai di HTML lain
window.playVideo = playVideo;
window.toggleFavorite = toggleFavorite;
window.loadHome = loadHome;
window.loadMore = loadMore;
window.resetInfinite = resetInfinite;
window.initInfiniteScroll = initInfiniteScroll;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;
window.performSearch = performSearch; // DITAMBAHKAN
window.loadVideo = loadVideo;         // DITAMBAHKAN
