const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the ad page
app.get('/ad', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ad.html'));
});

// API route to get video info
app.post('/api/video-info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Use yt-dlp to get video information
        const ytdlp = spawn('yt-dlp', [
            '--dump-json',
            '--no-download',
            url
        ]);

        let data = '';
        let error = '';

        ytdlp.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        ytdlp.stderr.on('data', (chunk) => {
            error += chunk.toString();
        });

        ytdlp.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp error:', error);
                return res.status(500).json({ error: 'Failed to fetch video information' });
            }

            try {
                const videoInfo = JSON.parse(data);
                res.json({
                    title: videoInfo.title,
                    thumbnail: videoInfo.thumbnail,
                    duration: videoInfo.duration,
                    uploader: videoInfo.uploader,
                    view_count: videoInfo.view_count
                });
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                res.status(500).json({ error: 'Failed to parse video information' });
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API route to download video
app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Use yt-dlp with optimized settings for fastest possible download
        const ytdlp = spawn('yt-dlp', [
            '--format', 'b[filesize<100M]/bv*[height<=720][filesize<50M]+ba[filesize<20M]/b[height<=720]/best[height<=720]',
            '--throttled-rate', '100K', // Prevent throttling
            '--buffer-size', '16K',
            '--concurrent-fragments', '8', // Download multiple fragments at once
            '--downloader', 'aria2c', // Use aria2c for faster downloads
            '--external-downloader-args', 'aria2c:"-x 8 -s 8 -k 1M"', // aria2c settings for parallel downloads
            '--no-check-certificates', // Skip HTTPS verification for speed
            '--no-warnings',
            '--progress',
            '--newline',
            '--output', '-',
            url
        ]);

        // Set headers for file download with compression
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        res.setHeader('Content-Encoding', 'gzip');

        // Create a gzip stream for compression
        const gzip = require('zlib').createGzip();
        
        // Pipe the video stream through compression to the response
        ytdlp.stdout.pipe(gzip).pipe(res);

        // Log progress for debugging
        ytdlp.stderr.on('data', (chunk) => {
            const progress = chunk.toString();
            console.log('Download progress:', progress);
            if (!progress.includes('[download]')) {
                console.error('yt-dlp stderr:', progress);
            }
        });

        ytdlp.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp process exited with code:', code);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download video' });
                }
            }
        });

        ytdlp.on('error', (error) => {
            console.error('yt-dlp spawn error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to start download process' });
            }
        });

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});

