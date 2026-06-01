const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const puppeteerOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
};

if (process.platform === 'win32') {
    puppeteerOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOptions
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP APP 📱');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is READY!\n');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('WhatsApp Client Authenticated successfully.');
});

client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure:', msg);
});

// ✅ KEY FIX: Wrap initialize in try/catch so server doesn't crash if Chrome is missing
(async () => {
    try {
        await client.initialize();
    } catch (e) {
        console.warn('⚠️ WhatsApp initialization failed (Chrome not found). Notifications disabled.', e.message);
    }
})();

async function sendWhatsAppMessage(toPhone, message) {
    if (!isReady) {
        console.log('WhatsApp not ready. Skipping notification.');
        return;
    }
    try {
        const chatId = `${toPhone}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`✅ WhatsApp message sent to ${toPhone}`);
    } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
    }
}

module.exports = { sendWhatsAppMessage };
