import User from '../models/user.model.js';
import Product from '../models/product.model.js'; 
import { StatusCodes } from 'http-status-codes';
import { Logger } from 'borgen'

// @desc Add an item to cart
// @route POST /api/v1/user/cart/add
export const addItemToCart = async (req, res) => {
  try {
    const userId = res.locals.userId; // Assuming user ID is passed through authentication
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide a valid product ID and a positive quantity.',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    // Check if the product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Product not found.',
      });
    }

    // Check if the product already exists in the cart
    const existingProduct = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingProduct) {
      // If product is already in the cart, update the quantity
      existingProduct.quantity += quantity;
    } else {
      // If product is not in the cart, add it
      user.cart.push({
        product: productId,
        quantity,
      });
    }

    // Save the updated user document
    await user.save();

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Item added to cart successfully.',
      cart: user.cart,
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while adding the item to the cart.',
    });
  }
};

// @desc Update item in cart
// @route PUT /api/v1/user/cart/update
export const updateCartItem = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide a valid product ID and a positive quantity.',
      });
    }

    const user = await User.findById(userId);
    const item = user.cart.find((item) => item.product.toString() === productId);

    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Item not found in cart.',
      });
    }

    item.quantity = quantity; // Update the quantity
    await user.save();

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cart item updated successfully.',
      cart: user.cart,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the cart item.',
    });
  }
};


// @desc Fetch all items in cart
// @route GET /api/v1/user/cart
export const getCartItems = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const user = await User.findById(userId).populate('cart.product');

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cart items retrieved successfully.',
      cart: user.cart,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching the cart items.',
    });
  }
};


// @desc Delete item from cart
// @route DELETE /api/v1/user/cart/delete/:productId
export const deleteCartItem = async (req, res) => {
    try {
      const userId = res.locals.userId;
      const { productId } = req.params;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: 'error',
          message: 'User not found.',
        });
      }
  
      user.cart = user.cart.filter((item) => item.product.toString() !== productId);
      await user.save();
  
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Item removed from cart successfully.',
        cart: user.cart,
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'An error occurred while removing the item from the cart.',
      });
    }
  };
 
// @ desc Checkout -> purchase from cart 
// @ route POST /api/v1/user/cart/checkout
export const checkout = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const user = await User.findById(userId).populate('cart.product');
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found.',
      });
    }
    // Check if the cart is empty
    if (user.cart.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Your cart is empty.',
      });
    }

    // Calculate the total cost of items in the cart
    let totalCost = 0;
    user.cart.forEach(item => {
      const product = item.product; 
      const quantity = item.quantity;

      const productTotal = product.price * quantity;
      totalCost += productTotal;
    });

    // Check if the user has enough balance
    if (user.balance < totalCost) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: `Insufficient balance. You need ${totalCost - user.balance} more to complete the purchase.`,
      });
    }

    // Deduct the total cost from the user's balance
    user.balance -= totalCost;

    // Clear the cart
    user.cart = [];

    // Save the updated user data
    await user.save();

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Checkout successful! Total deducted: ${totalCost}`,
      balance: user.balance,
      cart: user.cart, // Cart should now be empty
    });  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred during checkout',
    });
  }
}
