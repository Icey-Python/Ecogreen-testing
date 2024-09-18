import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { Logger } from "borgen";
import Product from "../models/product.model.js";

//@desc Create product
//@route POST /api/v1/product/create
export const createProduct = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { name, description, image, price, } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      seller: userId,
    });

    await product.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Product created successfully",
      data: {
        name,
        description,
        price,
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
        let productId = req.params.id

        const product = await Product.findById(productId)
        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'Product fetched successfully',
          data: product,
        })
      } catch (error) {
        Logger.error({ message: error.message })
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'An error occurred while fetching product',
          data: null,
        })
      }
  };
  
//@desc Get all product
//@route GET /api/v1/product/all
export const getAllProducts = async (req, res) => {
    try {

        const products = await Product.find()
        return res.status(StatusCodes.OK).json({
          status: 'success',
          message: 'Product fetched successfully',
          data: products,
        })
      } catch (error) {
        Logger.error({ message: error.message })
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'An error occurred while fetching product',
          data: null,
        })
      }
  };
  

// @desc Update a product
// @route PUT /api/v1/product/:id
export const updateProduct = async (req, res) => {
    try {
        let productId = req.params.id
        const {name,description,price} = req.body

        if (!name || !description || !price) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              status: "error",
              message: "Please provide all required fields: name, description, and price.",
              data: null,
            });
          }
      

        const updatedProduct = await Product.findByIdAndUpdate(productId,
            {
                name,
                description,
                price,

            }
        )
      
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
  
      // Check if the product ID is provided
      if (!productId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Product ID is required",
          data: null,
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
  
  