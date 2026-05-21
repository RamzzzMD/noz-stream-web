// api/index.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const CORS_PROXY = 'https://cloudflare-cors-anywhere.supershadowcube.workers.dev/?url=';

// Helper function
async function fetchPage(url) {
    const { data } = await axios.get(CORS_PROXY + url);
    return cheerio.load(data);
}

// HOME
app.get('/api/home', async (req, res) => {
    try {
        const $ = await fetchPage('https://bokepnoz.in/');
        const latest = [], trending = [];

        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            if (title && url) latest.push({ title, duration, thumbnail, url });
        });

        $('aside div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            if (title && url) trending.push({ title, duration, thumbnail, url });
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

        const $ = await fetchPage(`https://bokepnoz.in/page/${page}/?s=${encodeURIComponent(q)}`);
        const results = [];

        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim();
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

        const $ = await fetchPage(`https://bokepnoz.in/category/${slug}/page/${page}/`);
        const results = [];

        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim();
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
        // Mengambil link embed iframe player
        const embed = $('.video-player iframe').attr('src') || $('.responsive-player iframe').attr('src');
        
        const related = [];
        $('.related-videos article, .videos-list article').slice(0, 10).each((_, el) => {
            const rTitle = $(el).find('header.entry-header span').text().trim() || $(el).find('.entry-title a').text().trim();
            const rThumb = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const rUrl = $(el).find('a').attr('href');
            if (rTitle && rUrl) related.push({ title: rTitle, thumbnail: rThumb, url: rUrl });
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
