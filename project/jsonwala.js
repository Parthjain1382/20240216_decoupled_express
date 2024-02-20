const fs = require("fs");
const { v4: uuidv4 } = require('uuid');

// Function to read products from the JSON file
function readProducts() {
  const productdata = fs.readFileSync('./db_files/products.json', 'utf8');
  return JSON.parse(productdata);
}

/**It makes changes in the product 
 * @param {object} products 
 * @returns {object} It return the changes made to the product 
 */
function writeProducts(products) {
  fs.writeFileSync('./db_files/products.json', JSON.stringify(products, null, 2), 'utf8');
}

// Function to search products based on a search term
function searchProducts(searchTerm) {
  const products = readProducts();

  if (!searchTerm) {
    //if empty seacrh string 
    throw new Error('Search term is required');
  }
  return products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**This function is used to add new product in the database
 * @param {object} newProductData new product that needs to added 
 * @param {Function} callback To deal with any error
 */
function createProduct(newProduct, callback) {
  try {
    //reading the product file
    let products = readProducts();
    //writing the new product 
    products.push(newProduct);
    writeProducts(products);
    if (typeof callback === 'function') {
      callback(null); // Call the callback with null to indicate success
    }
  } catch (error) {
    if (typeof callback === 'function') {
      callback(error); // If an error occurs, call the callback with the error
    }
  }
}

/** Function to read orders from the JSON file
 * @returns {object} read order deatils 
*/
function readOrders() {
  const orderData = fs.readFileSync('./db_files/order.json', 'utf-8');
  // return the parse order detail 
  return JSON.parse(orderData);
}

/**Function to write orders to the JSON file
 * @param {object} orders It takes the order of the object 
 * */
function writeOrders(orders) {
  fs.writeFileSync('./db_files/order.json', JSON.stringify(orders, null, 2), 'utf8');
}


/**function to check stock and update the stock
 * @param {number} checkoutid It is the id of product
 * @param {number} stocksize It is the size of the stock   
 * */ 
function checkoutAndUpdateStock(checkoutid, stocksize) {
  const products = readProducts();
  const orderData = readOrders();

  const productIndex = products.findIndex((p) => p.id === parseInt(checkoutid, 10));

  if (productIndex !== -1) {
    products[productIndex].stock -= parseInt(stocksize, 10);
    writeProducts(products);

    //new order created 
    let newOrder = {
      "orderid": uuidv4(),
      "address": "",
      "O_status": "",
      "order_pid": parseInt(checkoutid),
      "quantity": parseInt(stocksize),
      "cost": products[productIndex].price,
      "_totalcost": stocksize * products[productIndex].price
    };

    //pushing the new order to database
    orderData.push(newOrder);
    writeOrders(orderData);

    return { updatedProduct: products[productIndex], newOrder };
  } else {
    throw new Error('Product not found');
  }
}

/**Deleting the product in database using the product id
 * @param {number} productId It take id of product 
 * @param {Function} callback It return the success or error message
 */
function deleteProduct(productId, callback) {
  fs.readFile('./db_files/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return callback(err);
    }
    let products = JSON.parse(data);
    //find the required index
    const index = products.findIndex(product => product.id === parseInt(productId));

    if (index === -1) {
      return callback(null, { message: 'Product not found' });
    }

    //If the index is found then remove the product
    products.splice(index, 1);

    // after the deletion write it back to database
    fs.writeFile('./db_files/products.json', JSON.stringify(products, null, 2), 'utf8', (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return callback(err);
      }
      callback(null, { message: 'Product deleted successfully' });
    });
  });
}

/**To make changes in the product quantity 
 * @param {number} productId It takes the productid as input 
 * @param {number} quantity It takes the quantity as input 
 */
function subtractProductQuantity(productId, quantity) {
  let products = readProducts(); // Read products from the database
  const productIndex = products.findIndex(product => product.id === productId);

  if (productIndex !== -1) {
    // If the product is found, subtract the quantity from its stock
    products[productIndex].stock -= quantity;
    writeProducts(products); // Write updated product data back to the database
  } else {
    // If the product is not found, throw an error
    throw new Error('Product not found');
  }
}


/**Finding the order by id
 * @param {number} orderId It takes the orderId as input 
 * @returns {object} o_id It returns the order details 
 */
function findOrderById(orderId) {
  try {
    const orders = readOrders();
    const order = orders.find(order => order.orderid === orderId);
    if (order) {
      return order;
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    throw new Error('Error fetching order');
  }
}

/**Updating the address or the order status 
 * @param {number} orderId It takes the orderid 
 * @param {string} address It takes string as input  
 * @param {string} O_status It takes string as input 
 * @returns {object} The changed object 
 */
function updateOrder(orderId, address, O_status) {
  const orders = readOrders();
  const orderIndex = orders.findIndex(order => order.orderid === orderId);

  if (orderIndex === -1) {
    throw new Error('Order not found');
  }

  // Update the order with new data
  if (address) {
    orders[orderIndex].address = address;
  }
  if (O_status) {
    orders[orderIndex].O_status = O_status;
  }
  // Write the updated array back to order.json
  writeOrders(orders);
  return orders[orderIndex];
}

/**It delete a order that is created
 * @param {number} orderId It takes input of orderid
 * @returns {boolean} return true or false
 */
function deleteOrder(orderId) {
  try {
    // Read existing order data from order.json
    let orderData = readOrders();

    // Find the order with the specified order ID
    const orderIndex = orderData.findIndex(order => order.orderid === orderId);

    if (orderIndex === -1) {
      // If order is not found, throw an error
      throw new Error('Order not found');
    }

    // Fetch product details from the order
    const { order_pid, quantity } = orderData[orderIndex];

    // Update the product's quantity by adding back the quantity of the deleted order
    subtractProductQuantity(order_pid, quantity);

    // Delete the order from the order data array
    orderData.splice(orderIndex, 1);

    // Write the updated order data back to order.json
    writeOrders(orderData);

    return true;
  } catch (error) {
    throw new Error(`Error deleting order: ${error.message}`);
  }
}

/**It is used to update a product deatails
 * @param {number} productId It takes the product id   
 * @param {object} updateFields It take the changes in the products 
 * @returns {object} It returns the updated object of product
 */
function updateProduct(productId, updatedFields) {
  try {
    let products = readProducts(); // Read products from the database
    const productIndex = products.findIndex(product => product.id === parseInt(productId));

    if (productIndex !== -1) {
      // If the product is found, update its fields with the provided updatedFields
      products[productIndex] = { ...products[productIndex], ...updatedFields };
      writeProducts(products); // Write updated product data back to the database
      return products[productIndex]; // Return the updated product
    } else {
      // If the product is not found, throw an error
      throw new Error('Product not found');
    }
  } catch (error) {
    // If an error occurs during the update process, throw an error
    throw new Error(`Error updating product: ${error.message}`);
  }
}


// Export all functions
module.exports = {
  readProducts,
  writeProducts,
  createProduct,
  deleteProduct,
  searchProducts,
  readOrders,
  writeOrders,
  updateOrder,
  deleteOrder,
  checkoutAndUpdateStock, 
  subtractProductQuantity,
  findOrderById,
  updateProduct
};