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

// Export all functions
module.exports = {
  readProducts,
  writeProducts,
  readOrders,
  writeOrders,
  searchProducts,
  checkoutAndUpdateStock
};
