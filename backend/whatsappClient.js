const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const puppeteerOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

if (process.platform === 'win32') {
    puppeteerOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
} else {
    // On Linux (Render): use the Chrome downloaded by puppeteer during npm install
    try {
        const puppeteer = require('puppeteer');
        puppeteerOptions.executablePath = puppeteer.executablePath();
    } catch (e) {
        console.warn('puppeteer package not found, will try default');
    }
}

const client = new Client({
    authStrategy: new LocalAuth(),
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
