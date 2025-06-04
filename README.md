# AI Chat Hub - Production Deployment Package

This directory contains all the files needed for deploying the AI Chat Hub application to a production environment.

## Contents
- `server.js` - Main Express server with API proxy endpoints
- `package.json` - Node.js dependencies and scripts
- `Procfile` - For Heroku and similar platforms
- `public/` - Frontend static files
- `dist/` - Production-ready frontend files (copy of public)
- `deployment.md` - General deployment documentation
- `render-config.md` - Specific configuration for Render.com

## Deployment Instructions
1. Choose a Node.js-capable hosting platform (Render.com recommended)
2. Upload this entire directory to the platform
3. Configure the build and start commands as specified in render-config.md
4. Set any required environment variables
5. Deploy the application

## Important Notes
- The application requires both backend and frontend components
- The server is configured to serve static files from either dist/ or public/
- All API proxy endpoints must be accessible for the application to function correctly
- The application has been tested and fixed to handle JSON parsing errors properly

For detailed deployment instructions, see deployment.md and render-config.md.
