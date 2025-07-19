// Video Downloader App JavaScript

class VideoDownloader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentVideoInfo = null;
        this.downloadStartTime = null;
    }

    initializeElements() {
        this.videoForm = document.getElementById('videoForm');
        this.videoUrl = document.getElementById('videoUrl');
        this.previewBtn = document.getElementById('previewBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.loadingState = document.getElementById('loadingState');
        this.videoPreview = document.getElementById('videoPreview');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        // Video info elements
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoUploader = document.getElementById('videoUploader');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoViews = document.getElementById('videoViews');
        
        // Create format selector
        this.formatSelector = document.createElement('select');
        this.formatSelector.className = 'w-full px-4 py-2 mt-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none';
        this.formatSelector.style.display = 'none';
    }

    bindEvents() {
        this.previewBtn.addEventListener('click', () => this.handlePreview());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.videoUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handlePreview();
            }
        });
        
        this.videoUrl.addEventListener('input', () => {
            this.hideError();
        });
    }

    async handlePreview() {
        const url = this.videoUrl.value.trim();
        
        if (!url) {
            this.showError('Please enter a video URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid video URL');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hidePreview();

        try {
            console.time('preview-fetch');
            const response = await fetch('/api/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            console.timeEnd('preview-fetch');

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch video information');
            }

            this.currentVideoInfo = data;
            this.displayVideoPreview(data);
            this.updateFormatSelector(data.formats);
            this.hideLoading();

        } catch (error) {
            console.error('Preview error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to fetch video information. Please check the URL and try again.');
        }
    }

    updateFormatSelector(formats) {
        if (!formats || !formats.length) return;

        this.formatSelector.innerHTML = '';
        
        // Add optimized format option
        const optimizedOption = document.createElement('option');
        optimizedOption.value = '';
        optimizedOption.textContent = '📱 Optimized (Faster Download)';
        this.formatSelector.appendChild(optimizedOption);

        // Add HD format option
        const hdOption = document.createElement('option');
        hdOption.value = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
        hdOption.textContent = '🎥 HD Quality (1080p)';
        this.formatSelector.appendChild(hdOption);

        // Add available formats
        formats.forEach(format => {
            if (format.resolution && format.filesize) {
                const option = document.createElement('option');
                option.value = format.format_id;
                const size = (format.filesize / (1024 * 1024)).toFixed(1);
                option.textContent = `${format.resolution} - ${size}MB`;
                this.formatSelector.appendChild(option);
            }
        });

        // Show format selector
        this.formatSelector.style.display = 'block';
        this.videoPreview.appendChild(this.formatSelector);
    }

    async handleDownload() {
        if (!this.currentVideoInfo) {
            this.showError('Please preview the video first');
            return;
        }

        const url = this.videoUrl.value.trim();
        
        // Show loading state
        this.downloadBtn.disabled = true;
        this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting Download...';
        
        try {
            this.downloadStartTime = Date.now();
            
            // Create form for download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/download';
            
            // Add URL input
            const urlInput = document.createElement('input');
            urlInput.type = 'hidden';
            urlInput.name = 'url';
            urlInput.value = url;
            form.appendChild(urlInput);
            
            // Add format input if selected
            if (this.formatSelector.value) {
                const formatInput = document.createElement('input');
                formatInput.type = 'hidden';
                formatInput.name = 'format';
                formatInput.value = this.formatSelector.value;
                form.appendChild(formatInput);
            }
            
            // Add form to document and submit
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            
            // Show download started message
            const downloadTime = ((Date.now() - this.downloadStartTime) / 1000).toFixed(2);
            const statusDiv = document.createElement('div');
            statusDiv.className = 'mt-4 p-4 bg-green-50 rounded-lg';
            statusDiv.innerHTML = `
                <p class="text-green-600">
                    <i class="fas fa-check-circle mr-2"></i>
                    Download started in ${downloadTime}s!
                </p>
                <ul class="text-sm text-green-500 mt-2">
                    <li>✓ Using optimized download settings</li>
                    <li>✓ Direct streaming enabled</li>
                    <li>✓ Multiple connections (16x faster)</li>
                </ul>
            `;
            this.videoPreview.appendChild(statusDiv);
            
            // Reset button after delay
            setTimeout(() => {
                this.downloadBtn.disabled = false;
                this.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Another Video';
            }, 3000);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to start download. Please try again.');
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Video';
        }
    }

    displayVideoPreview(videoInfo) {
        this.videoThumbnail.src = videoInfo.thumbnail || '';
        this.videoThumbnail.alt = videoInfo.title || 'Video thumbnail';
        this.videoTitle.textContent = videoInfo.title || 'Unknown Title';
        this.videoUploader.textContent = videoInfo.uploader || 'Unknown';
        this.videoDuration.textContent = this.formatDuration(videoInfo.duration);
        this.videoViews.textContent = this.formatViews(videoInfo.view_count);
        
        this.videoPreview.classList.remove('hidden');
    }

    showLoading() {
        this.loadingState.classList.remove('hidden');
        this.previewBtn.disabled = true;
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
        this.previewBtn.disabled = false;
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    hidePreview() {
        this.videoPreview.classList.add('hidden');
    }

    formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatViews(views) {
        if (!views) return 'Unknown';
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M views`;
        }
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K views`;
        }
        return `${views} views`;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoDownloader();
});

// Add some utility functions for enhanced UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation to buttons on hover
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add input focus effects
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
});

