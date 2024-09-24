import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { Logger } from "borgen";
import Product from "../models/product.model.js";

//@desc Create product
//@route POST /api/v1/product/create
export const createProduct = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const {
      name,
      description,
      image,
      price,
      quantity,
      category,
      flashSalePrice,
      flashSaleStart,
      flashSaleEnd,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      seller: userId,
      quantity,
      category,
      flashSalePrice,
      flashSaleStart,
      flashSaleEnd,
    });

    await product.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product created successfully",
      data: {
        name,
        description,
        price,
        quantity,
        category,
        flashSalePrice,
        flashSaleStart,
        flashSaleEnd,
      },
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while creating the product",
      data: null,
    });
  }
};

//@desc Get one product
//@route GET /api/v1/product/:id
export const getProduct = async (req, res) => {
  try {
    let productId = req.params.id;

    const product = await Product.findById(productId);
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching product",
      data: null,
    });
  }
};

//@desc Get all product
//@route GET /api/v1/product/all
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product fetched successfully",
      data: products,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching product",
      data: null,
    });
  }
};

// @desc Update a product
// @route PUT /api/v1/product/update/:id
export const updateProduct = async (req, res) => {
  try {
    const userId = res.locals.userId;
    let productId = req.params.id;

    const { name, description, price } = req.body;

    if (!name || !description || !price) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message:
          "Please provide all required fields: name, description, and price.",
        data: null,
      });
    }

    let product = await Product.findById(productId);

    if (!product) {
      {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Product not found.",
        });
      }
    }
    // Check if the authenticated user is the seller who created the product
    if (product.seller != userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not authorized to update this product.",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, {
      name,
      description,
      price,
    });

    if (!updatedProduct) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Product not found",
        data: null,
      });
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while updating the user",
      data: null,
    });
  }
};

// @desc Delete a product
// @route DELETE /api/v1/product/delete/:id
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = res.locals.userId;
    // Check if the product ID is provided
    if (!productId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Product ID is required",
        data: null,
      });
    }

    let product = await Product.findById(productId)

    
      // Check if the authenticated user is the seller who created the product
      if (product.seller != userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "You are not authorized to update this product.",
        });
      }
    // Find and delete the product by ID
    const deletedProduct = await Product.findByIdAndDelete(productId);

    // Check if the product was found and deleted
    if (!deletedProduct) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Product not found",
        data: null,
      });
    }

    // Send success response
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product deleted successfully",
      data: {
        id: deletedProduct._id,
        name: deletedProduct.name,
      },
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while deleting the product",
      data: null,
    });
  }
};

//@desc Purchase product
//@route POST  /api/v1/product/purchase

export const purchaseProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = res.locals.userId; // Assuming userId is passed via auth middleware
    const { name, quantityPurchased } = req.body; // Expecting productId and quantity in the request body

    // Validate the request
    if (!productId || !quantityPurchased) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide a valid product ID and quantity.",
      });
    }

    // Find the product
    const purchasedProduct = await Product.findById(productId);
    if (!productId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Product not found.",
      });
    }

    // Check if enough stock is available
    if (purchasedProduct.quantity < quantityPurchased) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Insufficient stock. Only ${purchasedProduct.quantity} items are available.`,
      });
    }

    // Deduct the purchased quantity from stock
    purchasedProduct.quantity -= quantityPurchased;
    await purchasedProduct.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product purchased successfully.",
      data: {
        id: purchasedProduct._id,
        name: purchasedProduct.name,
        quantityPurchased,
        remainingStock: purchasedProduct.quantity,
      },
    });
  } catch (error) {
    Logger.error({ message: error.message });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while purchasing the product.",
    });
  }
};

// @desc Fetch latest products
// @route GET /api/v1/product/latest
export const getLatestProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(10); // Fetch the 10 latest products
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Latest products fetched successfully.",
      data: products,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching the products.",
    });
  }
};

// @desc Fetch current flash sales
// @route GET /api/v1/product/flash-sales
export const getFlashSales = async (req, res) => {
  try {
    const currentDateTime = new Date();
    const products = await Product.find({
      flashSaleStart: { $lte: currentDateTime },
      flashSaleEnd: { $gte: currentDateTime },
    });

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Flash sale products fetched successfully.",
      data: products,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching the flash-sales  products.",
    });
  }
};

// @desc Get recommended products based on category
// @route GET /api/v1/products/recommended/:category
export const getRecommendedProducts = async (req, res) => {
  try {
    const { category } = req.params;

    // Find products in the same category that are active
    const recommendedProducts = await Product.find({ category, isActive: true })
      .sort({ createdAt: -1 }) // Sort by the latest products in the category
      .limit(10); // Return the top 10 recommended products

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Recommended products fetched successfully",
      data: recommendedProducts,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching recommended products",
      data: null,
    });
  }
};

// @desc Get mostly purchased products
// @route GET /api/v1/products/most-purchased
export const getMostlyPurchasedProducts = async (req, res) => {
  try {
    // Find active products and sort by purchaseCount in descending order
    const mostlyPurchasedProducts = await Product.find({ isActive: true })
      .sort({ purchaseCount: -1 }) // Sort by most purchased
      .limit(10); // Return the top 10 mostly purchased products

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Mostly purchased products fetched successfully",
      data: mostlyPurchasedProducts,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching mostly purchased products",
      data: null,
    });
  }
};
