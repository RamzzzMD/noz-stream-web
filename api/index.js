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
            const title = $(el).find('header.entry-header span').text().trim();
            const thumbnail = $(el).find('img.video-main-thumb').attr('src') || $(el).find('img.video-main-thumb').attr('data-src');
            const url = $(el).find('a').attr('href');
            const duration = $(el).find('span.duration').text().replace(/[^\d:]/g, '').trim();
            if (title && url) latest.push({ title, duration, thumbnail, url });
        });

        $('aside div.videos-list article').each((_, el) => {
            const title = $(el).find('header.entry-header span').text().trim();
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

// SEARCH, CATEGORY, DETAIL (sama seperti sebelumnya, tapi disingkat)

app.get('/api/search', async (req, res) => { /* isi sama seperti sebelumnya */ });
app.get('/api/category', async (req, res) => { /* isi sama */ });
app.get('/api/detail', async (req, res) => { /* isi sama */ });

// Catch all route
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
