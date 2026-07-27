const Product = require('../models/Product');
const { getCache, setCache, delCachePattern } = require('../../../packages/utils');

const defaultITProducts = [
  {
    name: 'Velora CRM Enterprise Suite',
    description: 'Full-stack custom CRM with automated pipeline management, lead scoring, and omnichannel analytics.',
    price: 4500,
    category: 'CRM Services',
    sku: 'CRM-ENT-01'
  },
  {
    name: 'Contact Center & Sales Automation',
    description: 'AI-powered contact center suite with auto-dialer, IVR routing, and real-time deal stage sync.',
    price: 3200,
    category: 'CRM Services',
    sku: 'CRM-CC-02'
  },
  {
    name: 'Velora HRMS & Payroll Engine',
    description: 'Comprehensive enterprise HR platform featuring automated payroll, tax calculation, and employee self-service portal.',
    price: 3800,
    category: 'HRMS Services',
    sku: 'HRM-PAY-01'
  },
  {
    name: 'Biometric Attendance & Leave Portal',
    description: 'Smart attendance tracking system with GPS geolocation, leave approval workflows, and shift management.',
    price: 2400,
    category: 'HRMS Services',
    sku: 'HRM-ATT-02'
  },
  {
    name: '24/7 Enterprise Helpdesk & SLA Suite',
    description: 'High-throughput ticketing engine with custom SLA escalation rules, automated email dispatch, and resolution analytics.',
    price: 2900,
    category: 'Customer Support',
    sku: 'SUP-SLA-01'
  },
  {
    name: 'Omnichannel Live Chat Agent Engine',
    description: 'Real-time customer messaging widget with AI auto-replies, visitor tracking, and CRM contact auto-sync.',
    price: 1800,
    category: 'Customer Support',
    sku: 'SUP-CHAT-02'
  },
  {
    name: 'AWS Enterprise DevOps & Architecture',
    description: 'High-availability AWS cloud setup with automated CI/CD pipelines, TerraForm IaC, and 99.99% uptime SLA.',
    price: 6500,
    category: 'AWS & Cloud',
    sku: 'AWS-DEV-01'
  },
  {
    name: 'Cloud Migration & Kubernetes Cluster',
    description: 'Seamless legacy to cloud migration with containerized Kubernetes orchestration, auto-scaling, and security hardening.',
    price: 8200,
    category: 'AWS & Cloud',
    sku: 'AWS-K8S-02'
  },
  {
    name: 'Serverless Microservices Infrastructure',
    description: 'Event-driven Node.js/Go serverless API gateway setup with Redis caching, RabbitMQ queueing, and MongoDB cluster sharding.',
    price: 5400,
    category: 'AWS & Cloud',
    sku: 'AWS-SRV-03'
  }
];

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    // Purge any legacy hardware products
    await Product.deleteMany({ 
      $or: [
        { category: { $regex: /hardware/i } },
        { name: { $regex: /hardware/i } }
      ]
    });

    // Auto-seed if database has no products or reseed requested
    let count = await Product.countDocuments();
    if (count === 0 || reseed) {
      await Product.deleteMany({});
      await Product.insertMany(defaultITProducts);
      await delCachePattern('products:*');
      console.log('✅ Auto-seeded Enterprise IT & Cloud Services Portfolio.');
    }

    const cacheKey = `products:all:${searchTerm}`;
    
    if (!reseed) {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
    }

    let query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { name: regex },
        { sku: regex },
        { description: regex },
        { category: regex }
      ];
    }
    const products = await Product.find(query);
    const responseData = {
      success: true,
      count: products.length,
      data: products
    };

    await setCache(cacheKey, responseData, 3600); // Cache for 1 hour
    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error in getProducts:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
};

// @desc    Seed default IT enterprise products
// @route   POST /api/products/seed
// @access  Public
exports.seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    const products = await Product.insertMany(defaultITProducts);
    await delCachePattern('products:*');
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      message: 'Successfully seeded Full-Stack IT & Cloud Enterprise Services Portfolio!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await delCachePattern('products:*');
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists'
      });
    }
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await delCachePattern('products:*');

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.deleteOne();
    await delCachePattern('products:*');

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
