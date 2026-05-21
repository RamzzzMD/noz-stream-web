// api/index.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Gunakan Proxy Bypass Anda
const PROXY_URL = 'https://cloudflare-cors-anywhere.supershadowcube.workers.dev/';

// HOME
app.get('/api/home', async (req, res) => {
    try {
        const { data } = await axios.get(`${PROXY_URL}?url=https://bokepnoz.in/`);
        const $ = cheerio.load(data);
        
        const latest = [];
        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            
            if (title && url) latest.push({ title, duration, views, thumbnail, url });
        });
        
        const trending = [];
        $('aside div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            
            if (title && url) trending.push({ title, duration, views, thumbnail, url });
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
        
        // Mempertahankan logika format URL proxy Anda untuk fitur Search
        const targetUrl = pageNum > 1 
            ? `${PROXY_URL}page/${pageNum}/?url=https://bokepnoz.in/?s=${encodeURIComponent(q)}` 
            : `${PROXY_URL}?url=https://bokepnoz.in/?s=${encodeURIComponent(q)}`;

        const { data } = await axios.get(targetUrl);
        const $ = cheerio.load(data);
        const results = [];
        
        $('main > div > article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            
            if (title && url) results.push({ title, duration, views, thumbnail, url });
        });
        
        let total_pages = 1;
        $('div.pagination ul li a').each((_, el) => {
            const href = $(el).attr('href') || '';
            if ($(el).text().trim().toLowerCase() === 'last') {
                const match = href.match(/\/page\/(\d+)/);
                if (match) total_pages = parseInt(match[1]);
            }
        });
        
        res.json({ page: pageNum, total_pages, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CATEGORY (Diadaptasi agar selaras dengan bypass proxy Anda)
app.get('/api/category', async (req, res) => {
    try {
        const { slug, page = 1 } = req.query;
        if (!slug) return res.status(400).json({ error: 'Slug required' });

        const pageNum = parseInt(page);
        const urlToFetch = pageNum > 1 
            ? `https://bokepnoz.in/category/${slug}/page/${pageNum}/` 
            : `https://bokepnoz.in/category/${slug}/`;

        const { data } = await axios.get(`${PROXY_URL}?url=${urlToFetch}`);
        const $ = cheerio.load(data);
        const results = [];

        $('main > div > article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            
            if (title && url) results.push({ title, duration, views, thumbnail, url });
        });

        res.json({ page: pageNum, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DETAIL
app.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });
        if (!url.includes('bokepnoz.in')) return res.status(400).json({ error: 'Invalid url.' });
        
        const { data } = await axios.get(`${PROXY_URL}?url=${url}`);
        const $ = cheerio.load(data);
        
        const title = $('meta[itemprop="name"]').attr('content');
        const cover = $('meta[itemprop="thumbnailUrl"]').attr('content');
        const embed_url = $('meta[itemprop="embedURL"]').attr('content');
        
        const raw_duration = $('meta[itemprop="duration"]').attr('content') || '';
        const h = parseInt(raw_duration.match(/(\d+)H/)?.[1] || 0);
        const m = parseInt(raw_duration.match(/(\d+)M/)?.[1] || 0);
        const s = parseInt(raw_duration.match(/(\d+)S/)?.[1] || 0);
        const duration = `${String((h * 60) + m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        const tags = [];
        $('div.tags-list a.label[href*="/tag/"]').each((_, el) => {
            tags.push($(el).text().trim());
        });
        
        const related = [];
        $('div.under-video-block article').each((_, el) => {
            const t = $(el).find('header.entry-header span').text().trim();
            const c = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const u = $(el).find('a').attr
