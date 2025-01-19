const express = require('express');
const path = require('path');
const app = express();

// Immediate console test
console.log('Server initializing...');
process.stdout.write('Direct stdout write test\n');

// Test different console methods
console.info('Info test');
console.warn('Warning test');
console.error('Error test');

app.use(express.static('public'));
app.use('/lib', express.static(path.join(__dirname, 'node_modules')));

// Add middleware to log all requests
app.use((req, res, next) => {
    process.stdout.write(`Incoming request: ${req.method} ${req.url}\n`);
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log('═══════════════════════════════════');
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('═══════════════════════════════════');
});

// Error handling to catch any issues
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});