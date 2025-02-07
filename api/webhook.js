const axios = require('axios');
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;

// Initialize MailerLite client
const mailerLite = new MailerLite({
  api_key: process.env.MAILERLITE_API_KEY
});

// Booqable API configuration
const BOOQABLE_API_KEY = process.env.BOOQABLE_API_KEY;
const BOOQABLE_COMPANY = process.env.BOOQABLE_COMPANY;

// Function to get customers from Booqable
async function getRecentCustomers(minutes = 5) {
  const timeAgo = new Date(Date.now() - minutes * 60000).toISOString();
  const url = `https://${BOOQABLE_COMPANY}.booqable.com/api/1/customers`;
  
  try {
    const response = await axios.get(url, {
      params: {
        api_key: BOOQABLE_API_KEY,
        q: {
          created_at_gt: timeAgo
        }
      }
    });
    
    return response.data.customers || [];
  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    throw error;
  }
}

// Function to add customer to MailerLite
async function addCustomerToMailerLite(customer) {
  if (!customer.email) {
    console.log('Customer has no email, skipping');
    return;
  }

  try {
    // Check if subscriber already exists
    try {
      await mailerLite.subscribers.find(customer.email);
      console.log(`Subscriber ${customer.email} already exists in MailerLite`);
      return;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
      // If 404, subscriber doesn't exist, so we'll create them
    }

    // Add subscriber to MailerLite
    const subscriber = {
      email: customer.email,
      fields: {
        name: customer.name || '',
        company: customer.company_name || '',
        phone: customer.phone || ''
      }
    };

    await mailerLite.subscribers.create(subscriber);
    console.log(`Added ${customer.email} to MailerLite`);
    return true;
  } catch (error) {
    console.error(`Error adding ${customer.email} to MailerLite:`, error.response?.data || error.message);
    throw error;
  }
}

// Export the API handler for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get customers from the last 5 minutes
    const customers = await getRecentCustomers(5);
    const results = [];
    
    // Process each customer
    for (const customer of customers) {
      try {
        const added = await addCustomerToMailerLite(customer);
        if (added) {
          results.push({
            email: customer.email,
            status: 'added'
          });
        }
      } catch (error) {
        results.push({
          email: customer.email,
          status: 'error',
          message: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      customersProcessed: customers.length,
      results
    });
  } catch (error) {
    console.error('Error in webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
