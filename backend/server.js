require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// WhatsApp is optional — server still runs if Chrome is unavailable
let sendWhatsAppMessage = async () => {};
try {
    const wa = require('./whatsappClient');
    sendWhatsAppMessage = wa.sendWhatsAppMessage;
    console.log('✅ WhatsApp client loaded.');
} catch (e) {
    console.warn('⚠️ WhatsApp disabled:', e.message);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the parent 'justcook' directory
app.use(express.static(path.join(__dirname, '../')));

// Initialize Supabase Client (Service Role for admin privileges)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn('⚠️ Supabase URL and Key are not configured in .env file!');
}

const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'dummy');

// ── API ENDPOINTS ──────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'JustCook Backend is running!' });
});

// Place a new Order
app.post('/api/orders', async (req, res) => {
    try {
        const { customer, items, total, paymentMethod, paymentId, userId, userEmail } = req.body;

        const orderId = 'JC' + Math.floor(1000 + Math.random() * 9000);

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                order_id: orderId,
                user_id: userId || 'guest',
                user_email: userEmail || 'guest',
                customer_info: customer,
                items: items,
                total: total,
                payment_method: paymentMethod,
                payment_id: paymentId,
                status: 'Pending'
            }])
            .select()
            .single();

        if (error) throw error;

        // Send WhatsApp Message to Admin
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
        if (adminPhone) {
            const msg = `🚨 *NEW ORDER RECEIVED!* 🚨
*Order ID:* ${orderId}
*Amount:* ₹${total}
*Customer:* ${customer.name}
*Phone:* ${customer.phone}
*Address:* ${customer.address}, ${customer.city} - ${customer.pincode}
*Status:* Paid (${paymentMethod})`;
            
            sendWhatsAppMessage(adminPhone, msg);
        }

        res.status(201).json({ success: true, orderId: orderId, docId: data.id });
    } catch (err) {
        console.error('Error placing order:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get All Orders (Admin)
app.get('/api/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            userId: order.user_id,
            userEmail: order.user_email,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentId: order.payment_id,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching all orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get User's Orders
app.get('/api/orders/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map data to match old Firebase structure
        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            userId: order.user_id,
            userEmail: order.user_email,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentId: order.payment_id,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching user orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Order by ID
app.get('/api/orders/id/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', id.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        if (!data) return res.json(null);

        const mappedData = {
            docId: data.id,
            id: data.order_id,
            userId: data.user_id,
            userEmail: data.user_email,
            customer: data.customer_info,
            items: data.items,
            total: data.total,
            paymentMethod: data.payment_method,
            paymentId: data.payment_id,
            status: data.status,
            createdAt: data.created_at
        };

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching order by ID:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Orders by Phone (Guest tracking)
app.get('/api/orders/phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_info->>phone', phone)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching phone orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update Order Status
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating status:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
