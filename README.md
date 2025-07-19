# Video Downloader Website

A modern, responsive video downloader website built with Node.js, Express, and TailwindCSS. Supports downloading videos from YouTube, Instagram, Facebook, and other platforms in high quality (1080p+) using yt-dlp.

## Features

### Core Functionality
- **Multi-platform Support**: Download videos from YouTube, Instagram, Facebook, and more
- **High Quality Downloads**: Automatically selects the best available quality (1080p or higher)
- **Video Preview**: Shows thumbnail, title, duration, and view count before downloading
- **Instant Download**: Downloads start immediately after clicking the download button
- **Mobile-First Design**: Fully responsive design that works on all devices

### Monetization Features
- **Google AdSense Integration**: Pre-configured ad spaces for easy AdSense integration
- **Affiliate Marketing Ready**: Dedicated ad page that opens during downloads
- **Interstitial Ads**: Monetization page with countdown timer and multiple ad spaces
- **SEO Optimized**: Includes About Us and FAQ sections for better search rankings

### Technical Features
- **Modern UI**: Clean design with TailwindCSS and gradient backgrounds
- **Loading States**: Smooth loading animations and user feedback
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Cross-Origin Support**: CORS enabled for frontend-backend communication
- **Streaming Downloads**: Videos are streamed directly to users without server storage

## Screenshots

The website features a modern, professional design with:
- Gradient header with clear branding
- Clean input form with preview functionality
- Feature highlights (HD Quality, Fast Download, Safe & Secure)
- Ad spaces for monetization
- Comprehensive About Us and FAQ sections

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 14.0.0 or higher)
- **npm** (comes with Node.js)
- **yt-dlp** (automatically installed via pip)
- **Python 3** (required for yt-dlp)

## Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd video-downloader
   
   # Or extract the downloaded files
   cd video-downloader
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install yt-dlp (if not already installed)**
   ```bash
   pip3 install yt-dlp
   ```

4. **Verify yt-dlp installation**
   ```bash
   yt-dlp --version
   ```

## Running Locally

1. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development:
   ```bash
   npm run dev
   ```

2. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. **Test the functionality**
   - Paste a YouTube, Instagram, or Facebook video URL
   - Click "Preview" to see video information
   - Click "Download Video (HD)" to start the download
   - The ad page will open in a new tab for monetization

## Project Structure

```
video-downloader/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies and scripts
├── README.md             # This file
├── public/               # Frontend files
│   ├── index.html        # Main landing page
│   ├── ad.html          # Monetization/ad page
│   └── js/
│       └── app.js       # Frontend JavaScript
└── node_modules/        # Dependencies (auto-generated)
```

## API Endpoints

### POST /api/video-info
Fetches video information for preview.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://...",
  "duration": 213,
  "uploader": "Rick Astley",
  "view_count": 1675600000
}
```

### POST /api/download
Initiates video download.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:** Binary video stream (MP4 format)

## Monetization Setup

### Google AdSense Integration

1. **Replace ad placeholders** in `public/index.html`:
   ```html
   <!-- Replace this div with your AdSense code -->
   <div class="bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
     <!-- Your AdSense ad unit goes here -->
   </div>
   ```

2. **Add AdSense script** to the `<head>` section:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>
   ```

### Affiliate Marketing

1. **Update the ad page** (`public/ad.html`) with your affiliate links
2. **Replace the example affiliate link** with real affiliate URLs
3. **Add tracking codes** for affiliate programs

### Additional Monetization Options

- **Premium Features**: Add paid tiers for faster downloads or higher quality
- **Subscription Model**: Implement user accounts with premium subscriptions
- **Sponsored Content**: Add sponsored video recommendations
- **VPN Affiliate Links**: Promote VPN services for privacy-conscious users

## Deployment

### Deploy to Render

1. **Create a new Web Service** on [Render](https://render.com)
2. **Connect your repository** or upload the code
3. **Set the build command**: `npm install`
4. **Set the start command**: `npm start`
5. **Add environment variables** if needed
6. **Deploy** and get your live URL

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy the application**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to configure your deployment

### Deploy to Railway

1. **Create a new project** on [Railway](https://railway.app)
2. **Connect your repository**
3. **Railway will automatically detect** the Node.js app
4. **Deploy** and get your live URL

### Deploy to Heroku

1. **Create a Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Add Python buildpack** (for yt-dlp):
   ```bash
   heroku buildpacks:add heroku/python
   heroku buildpacks:add heroku/nodejs
   ```

3. **Create requirements.txt**:
   ```
   yt-dlp
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

## Environment Variables

For production deployment, you may want to set:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to "production" for production builds

## Troubleshooting

### Common Issues

1. **yt-dlp not found**
   - Make sure Python 3 is installed
   - Install yt-dlp: `pip3 install yt-dlp`
   - Verify installation: `yt-dlp --version`

2. **Video download fails**
   - Check if the video URL is valid and accessible
   - Some videos may be geo-restricted or private
   - Try with a different video URL

3. **Port already in use**
   - Change the port in server.js or set PORT environment variable
   - Kill any existing processes using port 3000

4. **CORS errors**
   - The server includes CORS middleware
   - Make sure you're accessing the correct URL

### Performance Optimization

1. **Enable gzip compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add caching headers** for static files
3. **Use a CDN** for better global performance
4. **Implement rate limiting** to prevent abuse

## Legal Considerations

- **Respect copyright laws** and terms of service
- **Only download videos** you have permission to download
- **Add appropriate disclaimers** to your website
- **Consider implementing** user agreement and privacy policy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the code comments for implementation details
- Test with different video URLs to isolate issues

## Changelog

### Version 1.0.0
- Initial release
- Multi-platform video downloading
- Responsive design with TailwindCSS
- Monetization features
- SEO optimization
- Complete deployment documentation

