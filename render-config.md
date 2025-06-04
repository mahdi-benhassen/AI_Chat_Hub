# AI Chat Hub - Production Deployment Configuration

## Render.com Configuration
- **Service Type**: Web Service
- **Environment**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - PORT=10000
  - NODE_ENV=production

## Files to Include
- server.js
- package.json
- Procfile
- public/ directory (or dist/ directory)
- .env (for local development only, not to be committed)

## Deployment Steps for Render.com
1. Create a new Web Service
2. Connect to GitHub repository or upload files directly
3. Configure the build and start commands as above
4. Set environment variables
5. Deploy the application

## Post-Deployment Verification
- Check that the application loads correctly
- Verify API endpoints are working
- Test with different AI models
- Ensure error handling works properly
