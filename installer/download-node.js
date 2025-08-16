#!/usr/bin/env node

/**
 * Download Node.js Portable for Windows
 * 
 * Downloads the official Node.js portable ZIP for Windows x64
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const NODE_VERSION = 'v20.12.2';
const NODE_ARCHIVE = `node-${NODE_VERSION}-win-x64.zip`;
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_ARCHIVE}`;
const DOWNLOAD_PATH = path.join(__dirname, 'build', 'temp', NODE_ARCHIVE);

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        console.log(`📥 Downloading: ${url}`);
        console.log(`📁 Saving to: ${filepath}`);
        
        ensureDir(path.dirname(filepath));
        
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;
                
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
                    process.stdout.write(`\r📊 Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)} MB)`);
                });
                
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    console.log('\n✅ Download completed successfully!');
                    resolve();
                });
                
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                downloadFile(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (error) => {
            fs.unlink(filepath, () => {}); // Delete partial file
            reject(error);
        });
    });
}

async function main() {
    try {
        console.log('🚀 Node.js Portable Download Tool\n');
        
        // Check if file already exists
        if (fs.existsSync(DOWNLOAD_PATH)) {
            console.log('✅ Node.js archive already exists:', DOWNLOAD_PATH);
            console.log('Delete the file if you want to re-download.');
            return;
        }
        
        await downloadFile(NODE_URL, DOWNLOAD_PATH);
        
        // Verify file size
        const stats = fs.statSync(DOWNLOAD_PATH);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        console.log(`📊 File size: ${fileSizeMB} MB`);
        console.log('🎉 Ready for portable package building!');
        
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        process.exit(1);
    }
}

main();