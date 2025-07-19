// Video Downloader App JavaScript

class VideoDownloader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentVideoInfo = null;
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
        
        // Auto-hide error message when user starts typing
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
            const response = await fetch('/api/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch video information');
            }

            this.currentVideoInfo = data;
            this.displayVideoPreview(data);
            this.hideLoading();

        } catch (error) {
            console.error('Preview error:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to fetch video information. Please check the URL and try again.');
        }
    }

    async handleDownload() {
        if (!this.currentVideoInfo) {
            this.showError('Please preview the video first');
            return;
        }

        const url = this.videoUrl.value.trim();
        
        // Show loading state for download
        this.downloadBtn.disabled = true;
        this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting Download...';
        
        try {
            // Create a form to submit the download request
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/download';
            
            const urlInput = document.createElement('input');
            urlInput.type = 'hidden';
            urlInput.name = 'url';
            urlInput.value = url;
            
            form.appendChild(urlInput);
            document.body.appendChild(form);
            
            // Submit the form
            form.submit();
            document.body.removeChild(form);
            
            // Reset button after a delay
            setTimeout(() => {
                this.downloadBtn.disabled = false;
                this.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Video (HD)';
            }, 3000);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to start download. Please try again.');
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Video (HD)';
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

    formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatViews(views) {
        if (!views) return 'Unknown';
        
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K`;
        } else {
            return views.toString();
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    showLoading() {
        this.loadingState.classList.remove('hidden');
        this.previewBtn.disabled = true;
        this.previewBtn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>Loading...';
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
        this.previewBtn.disabled = false;
        this.previewBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Preview';
    }

    showPreview() {
        this.videoPreview.classList.remove('hidden');
    }

    hidePreview() {
        this.videoPreview.classList.add('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showSuccessMessage() {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.innerHTML = '<i class="fas fa-check mr-2"></i>Download started! Check your downloads folder.';
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
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

