// This is the file for mongowala.js which is responsible for performing 
// operation with the atlas database using mongoose

//external requirement
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connection URI
const uri = 'mongodb+srv://root:root@decoupledcommerce.n3jfrhh.mongodb.net/?retryWrites=true&w=majority';

// Connection to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    // You can start defining your models and routes here
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// using the object id constructor
const { ObjectId } = mongoose.Types;


// product document schema 
const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    index: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

// order document schema
const orderSchema = new mongoose.Schema({
  orderid: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: false
  },
  O_status: {
    type: String,
    required: false
  },
  order_pid: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  _totalcost: {
    type: Number,
    required: true
  }
});

//setting up the schemas
const products = mongoose.model('products', productSchema);
const order = mongoose.model('order', orderSchema);

const searchProducts = async (searchTerm) => {
  try {
    return await products.find({ "name": searchTerm });
  } catch (error) {
    throw new Error(error.message);
  }
};

// function to check stock and update the stock
const checkoutAndUpdateStock = async (productId, stocksize) => {
  try {
    // Assuming products is a MongoDB collection
    const updatedProduct = await products.findOneAndUpdate(
      { id: productId },
      { $inc: { stock: -stocksize } },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    const cost = updatedProduct.price; // Get the price from the updated product

    // Create a new order
    const newOrder = new order({
      orderid: uuidv4(),
      order_pid: productId,
      quantity: stocksize,
      cost: cost,
      _totalcost: cost * stocksize // Calculate total cost
    });

    // Save the new order
    await newOrder.save();

    return {
      success: 'Stock and order updated successfully',
      updatedProduct: updatedProduct,
      newOrder: newOrder
    };
  } catch (error) {
    throw new Error(`Error updating stock: ${error.message}`);
  }
};


// To create a new product object 
const createProduct = async (newProductData) => {
  try {
    // Create a new product instance
    const newProduct = new products(newProductData);
    // Save the new product to the database
    await newProduct.save();
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

//function to delete a product from the product document 
const deleteProduct = async (productId) => {
  try {
    // Check if the product exists
    const existingProduct = await products.findOne({ id: productId });
    if (existingProduct) {
      // If the product exists, delete it
      await products.deleteOne({ id: productId });
      return 'Product deleted successfully';
    }
    else {
      return 'product not found';
    }
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};



const findOrderById = async (orderId) => {
  try {
    const o_id = await order.findOne({ orderid: orderId });
    return o_id;
  } catch (e) {
    console.error("Error fetching order:", error);
    throw new Error('Error fetching order');
  }
};


async function updateOrder(orderId, address, O_status) {
  try {
    const foundOrder = await order.findOne({ orderid: orderId }); // Renamed to 'foundOrder'
    if (!foundOrder) {
      throw new Error('Order not found');
    }
    if (address) {
      foundOrder.address = address; // Updated 'order' to 'foundOrder'
    }
    if (O_status) {
      foundOrder.O_status = O_status; // Updated 'order' to 'foundOrder'
    }
    await foundOrder.save(); // Saved 'foundOrder' instead of 'order'
    return foundOrder;
  } catch (error) {
    throw new Error(`Error updating order: ${error.message}`);
  }
}



// Function to delete an order by its ID
async function deleteOrder(orderId) {
  try {
    // Find the order by its ID
    const orderToDelete = await order.findOne({ orderid: orderId });
    if (!orderToDelete) {
      throw new Error('Order not found');
    }

    // Fetch product details from the order
    const { order_pid, quantity } = orderToDelete;

    // Update the product's quantity by adding back the quantity of the deleted order
    const product = await products.findOne({ id: order_pid });
    if (!product) {
      throw new Error('Product not found');
    }
    product.stock += quantity;
    await product.save();

    // Delete the order
    await order.deleteOne({ orderid: orderId });

    return true;
  } catch (error) {
    throw new Error(`Error deleting order: ${error.message}`);
  }
}

async function updateProduct(pid, updateFields) {
  try {
    const updatedProduct = await products.findOneAndUpdate(
      { id: pid }, // Query criteria
      updateFields, // Fields to update
      { new: true } // Options: Return the modified document rather than the original
    );

    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Error updating product:', error);
  }
}




module.exports = {
  searchProducts,
  checkoutAndUpdateStock,
  createProduct,
  deleteProduct,
  findOrderById,
  updateOrder,
  deleteOrder,
  updateProduct,
  products,
  order
};