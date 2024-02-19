const fs = require("fs");
const { v4: uuidv4 } = require('uuid');

// Function to read products from the JSON file
function readProducts() {
  const productdata = fs.readFileSync('./db_files/products.json', 'utf8');
  return JSON.parse(productdata);
}

// Function to write products to the JSON file
function writeProducts(products) {
  fs.writeFileSync('./db_files/products.json', JSON.stringify(products, null, 2), 'utf8');
}



function createProduct(newProduct, callback) {
  try {
    let products = readProducts();
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

// Function to read orders from the JSON file
function readOrders() {
  const orderData = fs.readFileSync('./db_files/order.json', 'utf-8');
  return JSON.parse(orderData);
}

// Function to write orders to the JSON file
function writeOrders(orders) {
  fs.writeFileSync('./db_files/order.json', JSON.stringify(orders, null, 2), 'utf8');
}

// Function to search products based on a search term
function searchProducts(searchTerm) {
  const products = readProducts();
  if (!searchTerm) {
    throw new Error('Search term is required');
  }
  return products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// Function to update stock and create order
function checkoutAndUpdateStock(checkoutid, stocksize) {
  const products = readProducts();
  const orderData = readOrders();

  const productIndex = products.findIndex((p) => p.id === parseInt(checkoutid, 10));

  if (productIndex !== -1) {
    products[productIndex].stock -= parseInt(stocksize, 10);
    writeProducts(products);

    let newOrder = {
      "orderid": uuidv4(),
      "address": "",
      "O_status": "",
      "order_pid": parseInt(checkoutid),
      "quantity": parseInt(stocksize),
      "cost": products[productIndex].price,
      "_totalcost": stocksize * products[productIndex].price
    };
    orderData.push(newOrder);
    writeOrders(orderData);

    return { updatedProduct: products[productIndex], newOrder };
  } else {
    throw new Error('Product not found');
  }
}

function deleteProduct(productId, callback) {
  fs.readFile('./db_files/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return callback(err);
    }
    let products = JSON.parse(data);
    const index = products.findIndex(product => product.id === parseInt(productId));

    if (index === -1) {
      return callback(null, { message: 'Product not found' });
    }

    products.splice(index, 1);

    fs.writeFile('./db_files/products.json', JSON.stringify(products, null, 2), 'utf8', (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return callback(err);
      }
      callback(null, { message: 'Product deleted successfully' });
    });
  });
}

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

// Function to update an order by its ID
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

// Export all functions
module.exports = {
  readProducts,
  writeProducts,
  readOrders,
  writeOrders,
  searchProducts,
  checkoutAndUpdateStock,
  createProduct,
  deleteProduct,
  subtractProductQuantity,
  findOrderById,
  updateOrder,
  deleteOrder 
};