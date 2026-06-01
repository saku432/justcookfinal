const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const puppeteerOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

if (process.platform === 'win32') {
    puppeteerOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}
// Render natively supports Puppeteer dependencies, so we do NOT need to override executablePath for Linux.
// It will automatically use the bundled Chromium that is downloaded during `npm install`.

const client = new Client({
    authStrategy: new LocalAuth(), // Saves the session so you don't have to scan every time
    puppeteer: puppeteerOptions
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n\n======================================================');
    console.log('📱 PLEASE SCAN THIS QR CODE WITH YOUR WHATSAPP APP 📱');
    console.log('   (Go to Settings > Linked Devices > Link a Device)');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is READY! Your backend can now send messages.\n');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('WhatsApp Client Authenticated successfully.');
});

client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure:', msg);
});

client.initialize();

async function sendWhatsAppMessage(toPhone, message) {
    if (!isReady) {
        console.log('WhatsApp client not ready yet. Skipping message.');
        return;
    }
    try {
        // Format phone to whatsapp id (e.g. 919840462831@c.us)
        const chatId = `${toPhone}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`WhatsApp message successfully sent to ${toPhone}`);
    } catch (err) {
        console.error('Failed to send WhatsApp message via whatsapp-web.js:', err);
    }
}

module.exports = {
    sendWhatsAppMessage
};
