// SEARCH
app.get('/api/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });

        const pageNum = parseInt(page);
        
        // PERBAIKAN: Menggunakan format path (/search/keyword) 
        // Mengganti spasi dengan tanda '+' agar ramah URL
        const qFormatted = encodeURIComponent(q.trim().replace(/\s+/g, '+'));
        
        const targetUrl = pageNum > 1 
            ? `https://bokepnoz.in/search/${qFormatted}/page/${pageNum}/` 
            : `https://bokepnoz.in/search/${qFormatted}/`;

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
