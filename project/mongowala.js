// This is the file for mongowala.js which is responsible for performing 
// operation with the atlas database using mongoose

//external requirement
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connection URI
const uri = 'mongodb+srv://root:root@decoupledcommerce.n3jfrhh.mongodb.net/?retryWrites=true&w=majority';

/**Connection to MongoDB
 * @param {uri} useNewUrlParser It takes the url 
 * */ 
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

/**This function is used to search the product object in  the database 
 * @param {object} searchTerm The roduct that needs to be searched
 * @returns {object} The search object or the error message 
 */
const searchProducts = async (searchTerm) => {
  try {
    //If object found in the database
    return await products.find({ "name": searchTerm });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**function to check stock and update the stock
 * @param {number} productId It is the id of product
 * @param {number} stocksize It is the size of the stock   
 * */ 
const checkoutAndUpdateStock = async (productId, stocksize) => {
  try {
    // Assuming products is a MongoDB collection
    const updatedProduct = await products.findOneAndUpdate(
      { id: productId },
      { $inc: { stock: -stocksize } },
      { new: true }
    );
    
    // if the updatedproduct is not found
    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    // Get the price from the updated product
    const cost = updatedProduct.price; 

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

/**This function is used to add new product in the database
 * @param {object} newProductData new product that needs to added 
 */
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

/**Deleting the product in database using the product id
 * @param {number} productId It take id of product 
 * @returns {message} It return the success or error message
 */
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
      //if product not found
      return 'product not found';
    }
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};


/**Finding the order by id
 * @param {number} orderId It takes the orderId as input 
 * @returns {object} o_id It returns the order details 
 */
const findOrderById = async (orderId) => {
  try {
    //if order id is founded
    const o_id = await order.findOne({ orderid: orderId });
    return o_id;
  } catch (e) {
    console.error("Error fetching order:", error);
    throw new Error('Error fetching order');
  }
};

/**Updating the address or the order status 
 * @param {number} orderId It takes the orderid 
 * @param {string} address It takes string as input  
 * @param {string} O_status It takes string as input 
 * @returns {object} The changed object 
 */
async function updateOrder(orderId, address, O_status) {
  try {
    //checking whether the order is present or not 
    const foundOrder = await order.findOne({ orderid: orderId }); 
    if (!foundOrder) {
      throw new Error('Order not found');
    }
    if (address) {
      foundOrder.address = address; 
    }
    if (O_status) {
      foundOrder.O_status = O_status; 
    }
    //save the changes
    await foundOrder.save(); 
    return foundOrder;
  } catch (error) {
    throw new Error(`Error updating order: ${error.message}`);
  }
}


/**It delete a order that is created
 * @param {number} orderId It takes input of orderid
 * @returns {boolean} return true or false
 */
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
    //changing the stock quantity 
    product.stock += quantity;
    //saving the changes in the product
    await product.save();

    // Delete the order
    await order.deleteOne({ orderid: orderId });

    return true;
  } catch (error) {
    throw new Error(`Error deleting order: ${error.message}`);
  }
}

/**It is used to update a product deatails
 * @param {number} pid It takes the product id   
 * @param {object} updateFields It take the changes in the products 
 * @returns {object} It returns the updated object of product
 */
async function updateProduct(pid, updateFields) {
  try {
    const updatedProduct = await products.findOneAndUpdate(
      { id: pid }, // Query criteria
      updateFields, // Fields to update
      { new: true } // Options: Return the modified document rather than the original
    );

    return updatedProduct;
  } catch (error) {
    // if any error occurs
    console.error('Error updating product:', error);
    throw new Error('Error updating product:', error);
  }
}



// To export nesscary modules
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