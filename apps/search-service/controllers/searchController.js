const axios = require('axios');
const { getCache, setCache } = require('../../../packages/utils');

// @desc    Global Search across services
// @route   GET /api/search?q=query
// @access  Public
exports.globalSearch = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a search query (q)'
    });
  }

  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cachedResult = await getCache(cacheKey);
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }

  console.log(`Searching for: "${query}"`);

  // Service Endpoints
  const CONTACT_SERVICE = 'http://localhost:5002/api/contacts';
  const OPPORTUNITY_SERVICE = 'http://localhost:5003/api/opportunities';
  const TICKET_SERVICE = 'http://localhost:5010/api/tickets';
  const PRODUCT_SERVICE = 'http://localhost:5008/api/products';
  // Add other services if they support search

  try {
    // Parallel Fetch - Note: This assumes services return ALL data if no filter, 
    // OR we implement ?search= query in other services. 
    // For MVP, we fetch all and filter here (Not scalable for huge data, but fine for now).

    const encodedQuery = encodeURIComponent(query);
    const [contactsRes, opportunitiesRes, ticketsRes, productsRes] = await Promise.all([
      axios.get(`${CONTACT_SERVICE}?search=${encodedQuery}`).catch(e => ({ data: { data: [] } })),
      axios.get(`${OPPORTUNITY_SERVICE}?search=${encodedQuery}`).catch(e => ({ data: { data: [] } })),
      axios.get(`${TICKET_SERVICE}?search=${encodedQuery}`).catch(e => ({ data: { data: [] } })),
      axios.get(`${PRODUCT_SERVICE}?search=${encodedQuery}`).catch(e => ({ data: { data: [] } }))
    ]);

    const contacts = contactsRes.data.data || [];
    const opportunities = opportunitiesRes.data.data || [];
    const tickets = ticketsRes.data.data || [];
    const products = productsRes.data.data || [];

    const searchPayload = {
      success: true,
      query,
      results: {
        contacts: { count: contacts.length, data: contacts },
        opportunities: { count: opportunities.length, data: opportunities },
        tickets: { count: tickets.length, data: tickets },
        products: { count: products.length, data: products }
      }
    };

    await setCache(cacheKey, searchPayload, 120); // Cache for 2 minutes
    res.status(200).json(searchPayload);

  } catch (err) {
    console.error(' Search Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error during search'
    });
  }
};
