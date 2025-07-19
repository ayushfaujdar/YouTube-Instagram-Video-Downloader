const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to find yt-dlp in PATH
function findYtDlp() {
    try {
        // Check Render's user-installed binaries first
        const renderPath = '/opt/render/.local/bin/yt-dlp';
        if (fs.existsSync(renderPath)) {
            return renderPath;
        }

        // Try to find yt-dlp in PATH
        const ytdlpPath = execSync('which yt-dlp').toString().trim();
        if (ytdlpPath) {
            return ytdlpPath;
        }
    } catch (error) {
        // If not found in PATH, try common locations
        const commonPaths = [
            '/usr/local/bin/yt-dlp',
            '/usr/bin/yt-dlp',
            '/opt/homebrew/bin/yt-dlp',
            process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
            path.join(process.env.HOME || '', '.local/bin/yt-dlp')
        ];

        for (const binPath of commonPaths) {
            try {
                if (fs.existsSync(binPath)) {
                    return binPath;
                }
            } catch (e) {
                continue;
            }
        }
    }

    // If yt-dlp is not found, try to install it
    try {
        console.log('yt-dlp not found, attempting to install...');
        if (process.env.NODE_ENV === 'production') {
            // In production (Render), install using pip
            execSync('pip3 install --user yt-dlp');
            // Update PATH to include user bin directory
            process.env.PATH = `/opt/render/.local/bin:${process.env.PATH}`;
        } else if (process.platform === 'darwin') {
            execSync('brew install yt-dlp');
        } else {
            execSync('pip3 install --user yt-dlp');
        }
        return findYtDlp(); // Try to find it again after installation
    } catch (error) {
        console.error('Failed to install yt-dlp:', error);
        throw new Error('Could not find or install yt-dlp');
    }
}

// Get yt-dlp path
let YT_DLP_PATH;
try {
    YT_DLP_PATH = findYtDlp();
    const ytdlpVersion = execSync(`${YT_DLP_PATH} --version`).toString().trim();
    console.log('Found yt-dlp version:', ytdlpVersion, 'at:', YT_DLP_PATH);
} catch (error) {
    console.error('Error: yt-dlp not found or not working properly');
    console.error('Installation error:', error);
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', ytdlp_path: YT_DLP_PATH });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to get video info
app.post('/api/video-info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Check if yt-dlp exists
        if (!fs.existsSync(YT_DLP_PATH)) {
            throw new Error('yt-dlp not found. Please install it first.');
        }

        // Use yt-dlp with optimized settings
        const ytdlp = spawn(YT_DLP_PATH, [
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
            if (code !== 0) {
                console.error('yt-dlp error:', error);
                return res.status(500).json({ error: 'Failed to fetch video information: ' + error });
            }

            try {
                const videoInfo = JSON.parse(data.trim());
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
                console.error('JSON parse error:', parseError, 'Data:', data);
                res.status(500).json({ error: 'Failed to parse video information' });
            }
        });

        ytdlp.on('error', (spawnError) => {
            console.error('Spawn error:', spawnError);
            res.status(500).json({ error: 'Failed to start yt-dlp process' });
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// API route to download video
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Check if yt-dlp exists
        if (!fs.existsSync(YT_DLP_PATH)) {
            throw new Error('yt-dlp not found. Please install it first.');
        }

        // Optimized yt-dlp settings
        const ytdlpArgs = [
            '--quiet',
            '--no-warnings',
            '--no-check-certificates',
            '--no-part',
            '--concurrent-fragments', '10'
        ];

        // Add format selection
        if (format) {
            ytdlpArgs.push('-f', format);
        } else {
            ytdlpArgs.push('-f', 'bv*[height<=720][filesize<100M]+ba[filesize<20M]/b[height<=720]/best[height<=720]');
        }

        ytdlpArgs.push('-o', '-');
        ytdlpArgs.push(url);

        const ytdlp = spawn(YT_DLP_PATH, ytdlpArgs);

        // Set headers for file download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Stream the video directly
        ytdlp.stdout.pipe(res);

        // Handle errors
        ytdlp.stderr.on('data', (chunk) => {
            const progress = chunk.toString();
            if (!progress.includes('[download]')) {
                console.error('yt-dlp stderr:', progress);
            }
        });

        ytdlp.on('close', (code) => {
            if (code !== 0 && !res.headersSent) {
                console.error('yt-dlp process exited with code:', code);
                res.status(500).json({ error: 'Failed to download video' });
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
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});

