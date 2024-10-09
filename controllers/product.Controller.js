import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import User from "../models/user.model.js";
import { Logger } from "borgen";
import Product from "../models/product.model.js";
import Subscription from "../models/subscription.model.js";
import { uploadImage } from "../util/imageUpload.js";
import Order from "../models/order.model.js";
//@desc Create product
//@route POST /api/v1/product/create
export const createProduct = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const image = req.file;
    const {
      name,
      description,
      price,
      quantity,
      category,
      flashSalePrice,
      flashSaleStart,
      flashSaleEnd,
      subscriptionAvailable,
    } = req.body;
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Provide a name for your product",
        data: null,
      });
    }
    if (!price) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Provide a price for your product",
        data: null,
      });
    }
    if (!quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Provide a quantity for your product",
        data: null,
      });
    }

    if (!category) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Provide a category for your product",
        data: null,
      });
    }

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
      subscriptionAvailable,
    });
    if (image) {
      uploadImage({
        req,
        res,
        Model: Product,
        modelName: "product",
        imageField: "image",
        docId: product.id,
      });
    }
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
        subscriptionAvailable,
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
      message: "Products fetched successfully",
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
    const image = req.file;
    const { name, description, price } = req.body;

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
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (image) {
      uploadImage(
        req,
        res,
        (Model = Product),
        (modelName = "product"),
        (imageField = "image"),
        (docId = product.id)
      );
    }

    const updatedProduct = await product.save();

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

    let product = await Product.findById(productId);

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

//@desc Add product to cart
//@route POST  /api/v1/product/add-to-cart/:id

export const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = res.locals.userId;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login to perform this action",
        data: null,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login to perform this action",
        data: null,
      });
    }
    // Validate the request
    if (!productId || !quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide a valid product ID and quantity.",
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!productId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Product not found.",
      });
    }

    // Check if enough stock is available
    if (product.quantity < quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Insufficient stock. Only ${product.quantity} items are available.`,
      });
    }

    // Check if product already exists in the cart
    const productInCart = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (productInCart) {
      // If the product is already in the cart, update the quantity
      productInCart.quantity += quantity;
    } else {
      // Add new product to the cart
      user.cart.push({
        product: productId,
        quantity,
      });
    }

    // Save the user with updated cart
    await user.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product added to cart successfully.",
      data: user.cart, // Returning updated cart
    });
  } catch (error) {
    Logger.error({ message: error.message });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while adding the product to the cart.",
    });
  }
};

//@desc Purchase product
//@route POST  /api/v1/product/purchase/:id

export const purchaseProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = res.locals.userId;
    const { name, quantityPurchased } = req.body;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login to perform this action",
        data: null,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login to perform this action",
        data: null,
      });
    }
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
    // Check if user has enough balance
    const totalCost = quantityPurchased * purchasedProduct.price;
    if (user.balance < totalCost) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Insufficient balance. Please add money to your account.",
      });
    }

    // deduct the amount from the user balance
    user.balance -= totalCost;
    // Deduct the purchased quantity from stock
    purchasedProduct.quantity -= quantityPurchased;

    // Calculate 10% bonus credit
    const bonusCredit = totalCost * 0.1;

    // Add the bonus credit to the user's balance
    user.balance += bonusCredit;

    // Ensure the credits array is initialized
    if (!user.credits) {
      user.credits = []; // Initialize an empty array if it doesn't exist
    }

    // Track the credit in the user's credits array
    user.credits.push({
      amount: bonusCredit,
      date: new Date(),
      productId: purchasedProduct._id,
      description: `Bonus for purchasing ${purchasedProduct.name}`,
    });

    // Update total points spent by the user
    user.totalPointsSpent = (user.totalPointsSpent || 0) + totalCost;

    // Increment the purchase count
    user.purchases = (user.purchases || 0) + 1;

    // Define the maximum thresholds for each tier
    const tierThresholds = {
      Sprout: 6,
      Blossom: 2,
      Canopy: 1,
      Ecosystem: 1,
      Champion: 1,
    };

    // Determine the user's tier based on total points spent
    let currentTier;
    if (user.totalPointsSpent >= 800001) {
      currentTier = "Champion";
    } else if (user.totalPointsSpent >= 400001) {
      currentTier = "Ecosystem";
    } else if (user.totalPointsSpent >= 150001) {
      currentTier = "Canopy";
    } else if (user.totalPointsSpent >= 50001) {
      currentTier = "Blossom";
    } else if (user.totalPointsSpent >= 1000) {
      currentTier = "Sprout";
    }

    

    //  Increment the purchaseTierEntries 
    
      user.purchaseTierEntries[currentTier] += 1;
  

    // Increment the product's purchaseCount (initialize it if it doesn't exist)
    purchasedProduct.purchaseCount =
      (purchasedProduct.purchaseCount || 0) + quantityPurchased;

    // Check if the user has made 5 purchases to generate a promo code
    if (user.purchases % 5 === 0) {
      // Generate a 6-character promo code using crypto
      const promoCode = crypto.randomBytes(3).toString("hex").toUpperCase();

      user.promoCode = promoCode;
    }

    // create new order
    const order = new Order({
      sellerId: [purchasedProduct.seller],
      buyerId: userId,
      products: [purchasedProduct._id],
      amount: purchasedProduct.price,
    });

    await user.save();
    await purchasedProduct.save();
    await order.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product purchased successfully.",
      data: {
        id: purchasedProduct._id,
        name: purchasedProduct.name,
        quantityPurchased,
        remainingStock: purchasedProduct.quantity,
        bonusCredit,
        updatedBalance: user.balance,
        newTier: user.Tier,
        promoCode: user.promoCode || null,
        order,
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
 console.log(products)
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

// @desc Subscribe to a product
// @route POST /api/v1/product/subscribe/:id
export const subscribeToProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = res.locals.userId;
    const { frequency } = req.body;

    // Check if the frequency is valid
    const validFrequencies = ["daily", "weekly", "monthly"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid subscription frequency. Please select weekly, bi-weekly, or monthly.",
      });
    }

    // Validate request body
    if (!frequency) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide a valid subscription frequency.",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "User not found. Please log in.",
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product || !product.subscriptionAvailable) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Product not available for subscription.",
      });
    }

    // **Check if the user is already subscribed to the product**
    const existingSubscription = await Subscription.findOne({
      userId,
      productId,
      status: "active",
    });
    if (existingSubscription) {
      return res.status(400).json({
        status: "error",
        message: "You are already subscribed to this product.",
      });
    }

    // Calculate next delivery date based on the frequency
    let nextDeliveryDate;
    const currentDate = new Date();
    switch (frequency) {
      case "daily":
        nextDeliveryDate = new Date(
          currentDate.setDate(currentDate.getDate() + 1)
        );
        break;
      case "weekly":
        nextDeliveryDate = new Date(
          currentDate.setDate(currentDate.getDate() + 7)
        );
        break;
      case "monthly":
        nextDeliveryDate = new Date(
          currentDate.setMonth(currentDate.getMonth() + 1)
        );
        break;
      default:
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Invalid subscription frequency.",
        });
    }

    // Create a new subscription
    const subscription = new Subscription({
      userId,
      productId,
      frequency,
      nextDeliveryDate,
    });

    await subscription.save();

    // Add the subscription to the user's subscriptions array
    user.subscriptions.push(subscription._id);
    await user.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Subscribed to product successfully.",
      data: {
        subscription,
        nextDeliveryDate,
      },
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while subscribing to the product",
      data: null,
    });
  }
};

// @desc Cancel product subscription
// @route DELETE /api/v1/product/delete/subscription/:id
export const cancelSubscription = async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const userId = res.locals.userId;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.userId.toString() !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message:
          "Subscription not found or you do not have permission to cancel this subscription.",
      });
    }

    // Find the user and remove the subscription from their subscriptions array
    const user = await User.findById(userId);
    if (user) {
      user.subscriptions = user.subscriptions.filter(
        (sub) => sub.toString() !== subscriptionId
      );
      await user.save();
    }

    // Delete the subscription from the database
    await Subscription.findByIdAndDelete(subscriptionId);

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Subscription cancelled and deleted successfully.",
    });
  } catch (error) {
    console.error(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while canceling the subscription.",
    });
  }
};
