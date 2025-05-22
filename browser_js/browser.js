// Import Electron for GUI and Node.js modules for HTTP/HTTPS requests
const { app, BrowserWindow } = require('electron');
const http = require('http');
const https = require('https');

// Constants for layout (matching Python's WIDTH, HEIGHT, HSTEP, VSTEP)
const WIDTH = 800;
const HEIGHT = 600;
const HSTEP = 13; // Horizontal step for text layout
const VSTEP = 18; // Vertical step for text layout
const SCROLL_STEP = 100; // Scroll amount per key press

// URL class to parse and fetch webpage content
class URL {
    // Constructor takes a URL string (e.g., "http://example.org/path")
    constructor(url) {
        // Split URL into scheme (http/https) and the rest
        const [scheme, rest] = url.split('://');
        // Validate scheme
        if (!['http', 'https'].includes(scheme)) {
            throw new Error('Unsupported scheme. Use http or https.');
        }
        this.scheme = scheme;

        // Add trailing slash if no path is provided
        const urlWithPath = rest.includes('/') ? rest : `${rest}/`;
        // Split into host and path
        const [host, ...pathParts] = urlWithPath.split('/');
        this.path = `/${pathParts.join('/')}`; // Reconstruct path with leading slash
        this.host = host;

        // Set default port: 80 for http, 443 for https
        this.port = scheme === 'http' ? 80 : 443;

        // Handle custom ports (e.g., example.org:8080)
        if (this.host.includes(':')) {
            const [hostName, port] = this.host.split(':');
            this.host = hostName;
            this.port = parseInt(port, 10);
        }
    }

    // Method to fetch webpage content via HTTP/HTTPS
    request() {
        return new Promise((resolve, reject) => {
            // Choose http or https module based on scheme
            const client = this.scheme === 'http' ? http : https;

            // Configure request options
            const options = {
                hostname: this.host,
                port: this.port,
                path: this.path,
                method: 'GET',
                headers: {
                    'Host': this.host // Include Host header for HTTP/1.0
                }
            };

            // Make the request
            const req = client.request(options, (res) => {
                res.setEncoding('utf8');
                // Collect headers
                const headers = {};
                for (const [key, value] of Object.entries(res.headers)) {
                    headers[key.toLowerCase()] = value;
                }
                // Check for unsupported encodings
                if (headers['transfer-encoding'] || headers['content-encoding']) {
                    reject(new Error('Transfer-Encoding or Content-Encoding not supported'));
                    return;
                }
                // Collect response body
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve(body);
                });
            });

            // Handle request errors
            req.on('error', (err) => {
                reject(err);
            });

            // Send the request
            req.end();
        });
    }
}

// Function to strip HTML tags and extract text (equivalent to Python's lex)
function lex(body) {
    let text = '';
    let inTag = false;
    for (const char of body) {
        if (char === '<') {
            inTag = true; // Start of HTML tag
        } else if (char === '>') {
            inTag = false; // End of HTML tag
        } else if (!inTag) {
            text += char; // Add character if not in a tag
        }
    }
    return text;
}

// Function to layout text with coordinates (equivalent to Python's layout)
function layout(text) {
    const displayList = [];
    let cursorX = HSTEP;
    let cursorY = VSTEP;
    for (const char of text) {
        displayList.push([cursorX, cursorY, char]);
        cursorX += HSTEP;
        // Wrap to next line if exceeding width
        if (cursorX > WIDTH - HSTEP) {
            cursorY += VSTEP;
            cursorX = HSTEP;
        }
    }
    return displayList;
}

// Browser class to manage the GUI and rendering
class Browser {
    constructor() {
        this.scroll = 0; // Track scroll position
        this.displayList = []; // Store text layout coordinates
    }

    // Load and render a webpage
    async load(url) {
        try {
            // Fetch and process webpage content
            const urlObj = new URL(url);
            const body = await urlObj.request();
            const text = lex(body);
            this.displayList = layout(text);

            // Create the Electron window
            this.window = new BrowserWindow({
                width: WIDTH,
                height: HEIGHT,
                webPreferences: {
                    nodeIntegration: true, // Allow Node.js APIs in renderer
                    contextIsolation: false // Simplify for this example
                }
            });

            // Load an HTML file with a canvas for rendering
            await this.window.loadFile('index.html');

            // Send the display list and scroll position to the renderer
            this.window.webContents.send('render', {
                displayList: this.displayList,
                scroll: this.scroll
            });

            // Handle scroll events from the renderer
            const { ipcMain } = require('electron');
            ipcMain.on('scroll', (event, direction) => {
                if (direction === 'down') {
                    this.scroll += SCROLL_STEP;
                } else if (direction === 'up') {
                    this.scroll -= SCROLL_STEP;
                    if (this.scroll < 0) this.scroll = 0;
                }
                // Update renderer with new scroll position
                this.window.webContents.send('render', {
                    displayList: this.displayList,
                    scroll: this.scroll
                });
            });
        } catch (err) {
            // Show error in the window
            this.window = new BrowserWindow({
                width: 400,
                height: 200,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            await this.window.loadURL(`data:text/html,<h1>Error: ${err.message}</h1>`);
        }
    }
}

// Create an HTML file for the canvas rendering
const fs = require('fs');
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Browser</title>
</head>
<body>
    <canvas id="browserCanvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
    <script>
        const { ipcRenderer } = require('electron');
        const canvas = document.getElementById('browserCanvas');
        const ctx = canvas.getContext('2d');

        // Receive display list and scroll position from main process
        ipcRenderer.on('render', (event, { displayList, scroll }) => {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Set font for text rendering
            ctx.font = '16px Arial';
            ctx.fillStyle = 'black';
            // Draw each character at its position, adjusted for scroll
            for (const [x, y, char] of displayList) {
                if (y > scroll + ${HEIGHT}) continue;
                if (y + ${VSTEP} < scroll) continue;
                ctx.fillText(char, x, y - scroll);
            }
        });

        // Handle keyboard events for scrolling
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                ipcRenderer.send('scroll', 'down');
            } else if (event.key === 'ArrowUp') {
                ipcRenderer.send('scroll', 'up');
            }
        });
    </script>
</body>
</html>
`;
// Write the HTML file for the renderer
fs.writeFileSync('index.html', htmlContent);

// Run the browser when Electron is ready
app.whenReady().then(() => {
    const url = process.argv[2]; // Get URL from command line
    if (!url) {
        console.error('Please provide a URL, e.g., npm start http://example.org');
        app.quit();
        return;
    }
    new Browser().load(url);
});

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle window reactivation on macOS
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const url = process.argv[2] || 'http://example.org';
        new Browser().load(url);
    }
});