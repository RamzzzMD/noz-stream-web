const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = require('express')();
app.use(cors());

const BASE_CORS = 'https://cloudflare-cors-anywhere.supershadowcube.workers.dev/?url=';

// ====================== HOMEPAGE ======================
app.get('/api/home', async (req, res) => {
    try {
        const { data } = await axios.get(BASE_CORS + 'https://bokepnoz.in/');
        const $ = cheerio.load(data);

        const latest = [], trending = [];

        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            if (title && url) latest.push({ title, duration, views, thumbnail, url });
        });

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

// ====================== SEARCH ======================
app.get('/api/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });

        const url = parseInt(page) > 1 
            ? `https://bokepnoz.in/page/${page}/?s=${encodeURIComponent(q)}`
            : `https://bokepnoz.in/?s=${encodeURIComponent(q)}`;

        const { data } = await axios.get(BASE_CORS + url);
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

        res.json({ results, page: parseInt(page) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ====================== CATEGORY ======================
app.get('/api/category', async (req, res) => {
    try {
        const { slug, page = 1 } = req.query;
        if (!slug) return res.status(400).json({ error: 'Slug required' });

        const url = `https://bokepnoz.in/category/${slug}/page/${page}/`;
        const { data } = await axios.get(BASE_CORS + url);
        const $ = cheerio.load(data);
        const results = [];

        $('main div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            const views = $(el).find('span.views').text().replace(/[^\d.KMB]/g, '').trim();
            if (title && url) results.push({ title, duration, views, thumbnail, url });
        });

        res.json({ category: slug, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ====================== DETAIL ======================
app.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL required' });

        const { data } = await axios.get(BASE_CORS + url);
        const $ = cheerio.load(data);

        const title = $('meta[itemprop="name"]').attr('content');
        const cover = $('meta[itemprop="thumbnailUrl"]').attr('content');
        const embed_url = $('meta[itemprop="embedURL"]').attr('content');

        const raw_duration = $('meta[itemprop="duration"]').attr('content') || '';
        const h = parseInt(raw_duration.match(/(\d+)H/)?.[1] || 0);
        const m = parseInt(raw_duration.match(/(\d+)M/)?.[1] || 0);
        const s = parseInt(raw_duration.match(/(\d+)S/)?.[1] || 0);
        const duration = `${String((h * 60) + m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        const upload_date = $('meta[itemprop="uploadDate"]').attr('content') || '';

        const tags = [];
        $('div.tags-list a.label[href*="/tag/"]').each((_, el) => tags.push($(el).text().trim()));

        const related = [];
        $('div.under-video-block article').each((_, el) => {
            const t = $(el).find('header.entry-header span').text().trim();
            const c = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const u = $(el).find('a').attr('href');
            const dur = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            if (t && u) related.push({ title: t, duration: dur, thumbnail: c, url: u });
        });

        res.json({
            title, cover, duration, upload_date, embed_url,
            download_url: embed_url?.replace('/e/', '/d/'),
            tags, related
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = app;
