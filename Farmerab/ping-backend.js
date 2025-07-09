const https = require('https');
const http = require('http');
const { URL } = require('url');

function pingBackend() {
    const url = "https://farmera-eyu3.onrender.com";
    
    try {
        console.log(`${new Date().toISOString()}: Pinging ${url}`);
        
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            timeout: 30000 // 30 seconds timeout
        };
        
        const req = protocol.request(options, (res) => {
            console.log(`Response: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
                console.log("Backend is alive");
            } else {
                console.log(`⚠️ Unexpected status code: ${res.statusCode}`);
            }
        });
        
        req.on('timeout', () => {
            console.log('Error: Request timeout');
            req.destroy();
        });
        
        req.on('error', (error) => {
            console.log(`Error: ${error.message}`);
        });
        
        req.end();
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    pingBackend(); // Just ping once, then exit
}