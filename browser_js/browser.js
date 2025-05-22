// Import Node.js modules for HTTP and HTTPS requests
const http = require('http');
const https = require('https');

// URL class to parse and handle URLs
class URL {
    // Constructor takes a URL string (e.g., "http://example.org/path")
    constructor(url) {
        // Split the URL into scheme (http/https) and the rest
        const [scheme, rest] = url.split('://');
        // Ensure the scheme is either http or https
        if (!['http', 'https'].includes(scheme)) {
            throw new Error('Unsupported scheme. Use http or https.');
        }
        this.scheme = scheme;

        // If no path is provided, default to "/"
        const urlWithPath = rest.includes('/') ? rest : `${rest}/`;
        // Split the remaining URL into host and path
        const [host, ...pathParts] = urlWithPath.split('/');
        this.path = `/${pathParts.join('/')}`; // Reconstruct path with leading slash
        this.host = host;

        // Set default port based on scheme (80 for http, 443 for https)
        this.port = scheme === 'http' ? 80 : 443;

        // Handle custom ports if specified (e.g., example.org:8080)
        if (this.host.includes(':')) {
            const [hostName, port] = this.host.split(':');
            this.host = hostName;
            this.port = parseInt(port, 10); // Convert port to integer
        }
    }

    // Method to make an HTTP/HTTPS request to the URL
    request() {
        return new Promise((resolve, reject) => {
            // Choose the appropriate module (http or https) based on scheme
            const client = this.scheme === 'http' ? http : https;

            // Configure the request options
            const options = {
                hostname: this.host,
                port: this.port,
                path: this.path,
                method: 'GET',
                headers: {
                    'Host': this.host // Include Host header as per HTTP/1.0
                }
            };

            // Make the request
            const req = client.request(options, (res) => {
                // Set encoding to UTF-8 for text response
                res.setEncoding('utf8');

                // Collect response headers
                const headers = {};
                for (const [key, value] of Object.entries(res.headers)) {
                    headers[key.toLowerCase()] = value;
                }

                // Ensure no unsupported encodings are present
                if (headers['transfer-encoding'] || headers['content-encoding']) {
                    reject(new Error('Transfer-Encoding or Content-Encoding not supported'));
                    return;
                }

                // Collect response body
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });

                // Resolve with the body when response is complete
                res.on('end', () => {
                    resolve(body);
                });
            });

            // Handle request errors (e.g., connection issues)
            req.on('error', (err) => {
                reject(err);
            });

            // Send the request
            req.end();
        });
    }
}

// Function to display text content, stripping HTML tags
function show(body) {
    let inTag = false; // Track whether we're inside an HTML tag
    for (const char of body) {
        if (char === '<') {
            inTag = true; // Start of a tag
        } else if (char === '>') {
            inTag = false; // End of a tag
        } else if (!inTag) {
            // Print character if not inside a tag
            process.stdout.write(char);
        }
    }
}

// Function to load and display a webpage
async function load(url) {
    try {
        // Create a URL instance and fetch the webpage content
        const urlObj = new URL(url);
        const body = await urlObj.request();
        // Display the text content
        show(body);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

// Run the browser with the URL provided as a command-line argument
if (require.main === module) {
    const url = process.argv[2]; // Get URL from command line (e.g., node browser.js http://example.org)
    if (!url) {
        console.error('Please provide a URL, e.g., node browser.js http://example.org');
        process.exit(1);
    }
    load(url);
}