// external dependencies for express
const express = require('express')
const app = express()
const bodyParser = require('body-parser');


// internal constants
const port = 3009

// Middleware to parse JSON bodies
app.use(bodyParser.json());
// Middleware to parse incoming requests with JSON payloads
app.use(express.json());
// Middleware to parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true }));


//Database from jsonwala.com
const database =require('./jsonwala.js')

//Database from mongowala.js
// const database =require('./mongowala.js');

app.get('/search', async(req, res) => {
  const searchTerm = req.query.name;  
  try {
    const data = await database.searchProducts(searchTerm)
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// PUT endpoint to update stock based on product id
app.put('/checkout', async(req, res) => {
  const checkoutid = req.query.id;
  const stocksize = req.query.stock;

  if (!checkoutid || !stocksize) {
    return res.status(400).json({ error: 'Missing id or stock in the request query parameters' });
  }
  try {
    const result = await database.checkoutAndUpdateStock(checkoutid, stocksize);
    res.json({ success: 'Stock and order updated successfully', ...result });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});


// This is the api for appending the new product in the product.json file 
app.post('/product', async (req, res) => {
  const newProduct = req.body;

  try {
    const createdProduct = await database.createProduct(newProduct);
    res.status(201).json({ message: 'Product created successfully', product: createdProduct });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


// deleting a product from the database
app.delete('/product', async(req, res) => {
  const productId = req.body.id;
  try{
    const deleteProduct= await database.deleteProduct(productId);
    res.status(201).json({deleteProduct});
  }
  catch(err){  
    res.status(500).json({message:'Internal Server Error'});
  }
});


/**This will give all the details related to that order ID specified */
app.get('/order', async (req, res) => {
  const orderId = req.query.orderid;
  try {
    const order = await database.findOrderById(orderId);
    if (order) {
      res.json({ success: true, order: order });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.put('/order', async (req, res) => {
  const orderId = req.body.orderId;
  const { address, O_status } = req.body;

  console.log(orderId)
  try {
    // Update the order with new data
    const updatedOrder = await database.updateOrder(orderId, address, O_status);
    res.json({ success: 'Order updated successfully', updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(404).json({ error: error.message });
  }
});



// app.delete('/order', (req, res) => {
//   const orderId = req.query.orderid;

//   // Read existing order data from order.json
//     let order=database.readOrders()

//     // Find the order with the specified order ID
//     const orderIndex = order.findIndex(order => order.orderid === orderId);

//     if (orderIndex === -1) {
//       // If order is not found, send error response
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     const { order_pid, quantity } = order[orderIndex];

//     try {
//       // Subtract the quantity from product stock
//       database.subtractProductQuantity(order_pid, quantity);
//     } 
//     catch (error) {
//       console.error("Error subtracting product quantity:", error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     // Remove the order from the order data array
//     order.splice(orderIndex, 1);

//     database.writeOrders(order)
//     res.json({ success: 'Order deleted successfully'} );
// });


app.delete('/order', async (req, res) => {
  const orderId = req.query.orderid;

  try {
    // Delete the order
    await database.deleteOrder(orderId);
    res.json({ success: 'Order deleted successfully' });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(404).json({ error: error.message });
  }
});

app.get('/status', (req, res) => {
  const orderId = req.query.orderId; // Change from req.body.orderid to req.query.orderid
  try {
    const order = database.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ status: order.O_status });
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Listening port 
app.listen(port, () => {
  console.log(`This app listening on port ${port}`)
})