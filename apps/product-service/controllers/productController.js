const Product = require('../models/Product');
const { getCache, setCache, delCachePattern } = require('../../../packages/utils');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const searchTerm = req.query.search || req.query.q || '';
    const cacheKey = `products:all:${searchTerm}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { name: regex },
        { sku: regex },
        { description: regex }
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
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
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
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
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
    res.status(500).json({
      success: false,
      error: 'Server Error'
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
