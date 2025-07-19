const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Performance monitoring
const startTime = new Date();
console.log(`Server started at: ${startTime}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Keep yt-dlp warm (run every 5 minutes)
function warmupYtdlp() {
    const dummyUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // First YouTube video ever
    const ytdlp = spawn('yt-dlp', ['--quiet', '--dump-json', '--no-warnings', dummyUrl]);
    ytdlp.on('error', (error) => console.error('Warmup error:', error));
}
setInterval(warmupYtdlp, 5 * 60 * 1000); // Every 5 minutes
warmupYtdlp(); // Initial warmup

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
    console.time('video-info');
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Use yt-dlp with optimized settings for faster info fetching
        const ytdlp = spawn('yt-dlp', [
            '--quiet',
            '--dump-json',
            '--no-warnings',
            '--no-check-certificates',
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
            console.timeEnd('video-info');
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
                    view_count: videoInfo.view_count,
                    formats: videoInfo.formats?.map(f => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        filesize: f.filesize,
                        resolution: f.resolution
                    }))
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
    console.time('video-download');
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Optimized yt-dlp settings for faster downloads
        const ytdlpArgs = [
            '--quiet',
            '--no-warnings',
            '--no-check-certificates',
            '--no-part', // Stream directly without temporary file
            '--concurrent-fragments', '10', // Download multiple fragments at once
            '--downloader', 'aria2c', // Use aria2c for faster downloads
            '--external-downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"' // aria2c settings
        ];

        // Add format selection
        if (format) {
            ytdlpArgs.push('-f', format);
        } else {
            // Default to fast 720p download if no format specified
            ytdlpArgs.push('-f', 'bv*[height<=720][filesize<100M]+ba[filesize<20M]/b[height<=720]/best[height<=720]');
        }

        // Add output template
        ytdlpArgs.push('-o', '-');
        ytdlpArgs.push(url);

        const ytdlp = spawn('yt-dlp', ytdlpArgs);

        // Set headers for file download with compression
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Stream the video directly to response
        ytdlp.stdout.pipe(res);

        // Handle progress and errors
        ytdlp.stderr.on('data', (chunk) => {
            const progress = chunk.toString();
            if (!progress.includes('[download]')) {
                console.error('yt-dlp stderr:', progress);
            }
        });

        ytdlp.on('close', (code) => {
            console.timeEnd('video-download');
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

        // Clean up on client disconnect
        req.on('close', () => {
            ytdlp.kill();
        });

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const uptime = (new Date() - startTime) / 1000;
    res.json({
        status: 'healthy',
        uptime: `${uptime.toFixed(2)} seconds`,
        startTime: startTime.toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});

