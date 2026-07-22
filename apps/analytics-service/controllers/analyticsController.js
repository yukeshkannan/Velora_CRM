const axios = require('axios');
const { formatResponse, getCache, setCache } = require('../../../packages/utils');

// @desc    Get Dashboard Analytics
// @route   GET /api/analytics/dashboard
// @access  Public (Should be Protected in Prod)
exports.getDashboardData = async (req, res) => {
  try {
    const cacheKey = 'analytics:dashboard';
    const cachedDashboard = await getCache(cacheKey);
    if (cachedDashboard) {
      return res.status(200).json(cachedDashboard);
    }

    console.log('[Analytics-Service] Processing fresh dashboard metrics...');


    // 1. Define Service URLs (Use Environment Variables for Docker compatibility)
    const CONTACT_SERVICE = `${process.env.CONTACT_SERVICE_URL || 'http://localhost:5002'}/api/contacts`;
    const OPPORTUNITY_SERVICE = `${process.env.OPPORTUNITY_SERVICE_URL || 'http://localhost:5003'}/api/opportunities`;
    const TASK_SERVICE = `${process.env.TASK_SERVICE_URL || 'http://localhost:5004'}/api/tasks`;
    const INVOICE_SERVICE = `${process.env.INVOICE_SERVICE_URL || 'http://localhost:5009'}/api/invoices`;
    const TICKET_SERVICE = `${process.env.TICKET_SERVICE_URL || 'http://localhost:5010'}/api/tickets`;

    // 2. Parallel Fetch
    const [contactsRes, opportunitiesRes, tasksRes, invoicesRes, ticketsRes] = await Promise.all([
      axios.get(CONTACT_SERVICE).catch(e => ({ data: { data: [] } })),
      axios.get(OPPORTUNITY_SERVICE).catch(e => ({ data: { data: [] } })),
      axios.get(TASK_SERVICE).catch(e => ({ data: { data: [] } })),
      axios.get(INVOICE_SERVICE).catch(e => ({ data: { data: [] } })),
      axios.get(TICKET_SERVICE).catch(e => ({ data: { data: [] } }))
    ]);

    const contacts = contactsRes.data.data || [];
    const opportunities = opportunitiesRes.data.data || [];
    const tasks = tasksRes.data.data || [];
    const invoices = invoicesRes.data.data || [];
    const tickets = ticketsRes.data.data || [];

    // 3. Process Data
    const totalRevenuePotential = opportunities.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const dealsWon = opportunities.filter(d => d.stage === 'Won').length;
    const dealsLost = opportunities.filter(d => d.stage === 'Lost').length;
    const totalDeals = opportunities.length;
    const winRate = totalDeals > 0 ? ((dealsWon / totalDeals) * 100).toFixed(1) : 0;

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;

    const openTickets = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
    const criticalTickets = tickets.filter(t => (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Resolved' && t.status !== 'Closed').length;

    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    
    const totalContacts = contacts.length;
    const newContacts = contacts.filter(c => c.status === 'New').length;

    // --- CHART DATA GENERATION (REAL TIME) ---

    // 1. Sales Activity (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
    });

    const salesTrend = last7Days.map(day => {
        const count = opportunities.filter(op => {
             // Assuming op.createdAt exists (Common Mongoose timestamp)
             return op.createdAt && op.createdAt.startsWith(day.date);
        }).length;
        return { label: day.label, value: count };
    });

    // 2. Revenue Trend (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { 
           key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, // YYYY-MM
           label: d.toLocaleDateString('en-US', { month: 'short' }) 
        };
    });

    const revenueTrend = last6Months.map(month => {
        const total = invoices
        .filter(inv => inv.createdAt && inv.createdAt.startsWith(month.key))
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        return { label: month.label, value: total };
    });

    const dashboardData = {
      overview: {
        totalRevenuePotential,
        totalCollected,
        totalContacts,
        totalDeals,
        winRate: `${winRate}%`
      },
      actionItems: {
        pendingTasks,
        newLeads: newContacts,
        overdueInvoices,
        criticalTickets
      },
      charts: {
          salesTrend,   // [{ label: 'Mon', value: 2 }, ...]
          revenueTrend  // [{ label: 'Jan', value: 5000 }, ...]
      },
      breakdown: {
        sales: {
          won: dealsWon,
          lost: dealsLost,
          active: totalDeals - (dealsWon + dealsLost)
        },
        finance: {
          totalInvoiced,
          collected: totalCollected,
          pending: totalInvoiced - totalCollected
        },
        support: {
          openTickets,
          criticalAttention: criticalTickets
        }
      }
    };

    const responsePayload = {
      success: true,
      message: 'Dashboard data retrieved',
      data: dashboardData
    };

    await setCache(cacheKey, responsePayload, 300); // Cache for 5 minutes
    console.log('✅ Dashboard Data Aggregated & Cached Successfully');
    res.status(200).json(responsePayload);

  } catch (err) {
    console.error('❌ Analytics Error:', err.message);
    formatResponse(res, 500, 'Server Error', err.message);
  }
};
