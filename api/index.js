// api/index.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
// CORS ini biarkan ada, karena fungsinya agar Frontend Anda bisa mengakses API Node.js Anda sendiri
app.use(cors());

// KITA HAPUS CORS_PROXY KARENA NODE.JS TIDAK MEMBUTUHKANNYA
// Fetch langsung ke website target

async function fetchPage(targetUrl) {
    const { data } = await axios.get(targetUrl, {
        headers: {
            // Menambahkan User-Agent PC asli agar web target tidak mengira ini bot
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    });
    return cheerio.load(data);
}

// HOME
app.get('/api/home', async (req, res) => {
    try {
        const $ = await fetchPage('https://bokepnoz.in/');
        const latest = [], trending = [];

        $('.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim() || $(el).find('a').attr('title');
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            
            if (title && url) {
                if ($(el).parents('main').length > 0) latest.push({ title, duration, thumbnail, url });
                if ($(el).parents('aside').length > 0) trending.push({ title, duration, thumbnail, url });
            }
        });

        res.json({ latest, trending });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// SEARCH
app.get('/api/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });

        const pageNum = parseInt(page);
        
        // MENGGUNAKAN FORMAT URL ORIGINAL (?s=keyword)
        const targetUrl = pageNum > 1 
            ? `https://bokepnoz.in/page/${pageNum}/?s=${encodeURIComponent(q)}` 
            : `https://bokepnoz.in/?s=${encodeURIComponent(q)}`;

        const $ = await fetchPage(targetUrl);
        const results = [];

        $('.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim() || $(el).find('a').attr('title');
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            
            if (title && url) results.push({ title, duration, thumbnail, url });
        });

        res.json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CATEGORY
app.get('/api/category', async (req, res) => {
    try {
        const { slug, page = 1 } = req.query;
        if (!slug) return res.status(400).json({ error: 'Slug required' });

        const pageNum = parseInt(page);
        const targetUrl = pageNum > 1 
            ? `https://bokepnoz.in/category/${slug}/page/${pageNum}/` 
            : `https://bokepnoz.in/category/${slug}/`;

        const $ = await fetchPage(targetUrl);
        const results = [];

        $('.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim() || $(el).find('a').attr('title');
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            
            if (title && url) results.push({ title, duration, thumbnail, url });
        });

        res.json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DETAIL
app.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });

        const $ = await fetchPage(url);
        
        const title = $('h1.entry-title').text().trim();
        const embed = $('.video-player iframe').attr('src') || $('.responsive-player iframe').attr('src');
        
        const related = [];
        $('.related-videos article, .videos-list article').slice(0, 10).each((_, el) => {
            const rTitle = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim() || $(el).find('a').attr('title');
            const rThumb = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const rUrl = $(el).find('a').attr('href');
            
            if (rTitle && rUrl && rUrl !== url) related.push({ title: rTitle, thumbnail: rThumb, url: rUrl });
        });

        res.json({ title, embed, related });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Catch all route
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
