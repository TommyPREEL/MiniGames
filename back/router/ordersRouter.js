let express = require('express');
let ordersRouter = express.Router();

const Order = require('../class/order');
const {getProductsByOrder, updateOrder, getAllOrders, getOrderById,  createOrder, getOrderId , createOrderProducts, getOrdersByUserId} = require('../models/order.js')

ordersRouter.get('/', function(req, res) {
    getAllOrders().then(orders => {
      res.json({orders:orders})
    })
});

ordersRouter.get('/:id', function(req, res) {
    getOrdersByUserId(req.params.id).then((orders) => {
        let promises = [];
        for (let order of orders) {
            let promise = getProductsByOrder(order.id).then((products) => {
                order.products = products;
            });
            promises.push(promise);
        }
        Promise.all(promises).then(() => {
            console.log(orders);
            res.json(orders);
            
        });
    });
})     

ordersRouter.post('/add', function(req, res) {
    const order = new Order(1, req.body.idUser, 1, req.body.total, "VALIDATED")
    createOrder(order).then(message => {
        if ( message = "Order created") {
            getOrderId(order).then((order1) => {
                const promises = req.body.products.map(product => { createOrderProducts(product.id, order1.id, product.quantity) } )
                Promise.all(promises).then(message => {
                    console.log('All rows in orderProducts successfully created');
                    res.json(message)
                }).catch(err => { console.error(err) })
            })           
        }
    })
});

ordersRouter.post('/update/:id', function(req, res) {
    const order = new Order(req.params.id, 0, 1, 0, req.body.status)
    updateOrder(order).then(message => {
        res.json(message)
    })
});



ordersRouter.get('/details/:id/products', function(req, res) {
    getProductsByOrder(req.params.id).then(products => {
        res.json(products)
    })
});


  
module.exports = ordersRouter;