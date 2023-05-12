let express = require('express');
let productsRouter = express.Router();

const Product = require('../class/Product');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, deleteProductFromCategorie ,AddCategorieToProduct} = require('../models/products.js')

productsRouter.get('/', function(req, res) {
    getAllProducts().then(products => {
      res.json({products:products})
    })
});

productsRouter.get('/details/:id', function(req, res) {
    getProductById(req.params.id).then(product => {
    res.json(product)
    })
});

productsRouter.post('/add', function(req, res) {
    const product = new Product(1, req.body.name, req.body.quantity, req.body.description, req.body.price, "/pipe.png");
    createProduct(product).then(message => {
        res.json(message)
    })
});

productsRouter.post('/update/:id', function(req, res) {
    const product = new Product(req.params.id, req.body.name, req.body.quantity, req.body.description, req.body.price, null);
    updateProduct(product).then(message => {
        res.json(message)
    })
});

productsRouter.post('/delete/:id', function(req, res) {
    deleteProductFromCategorie(req.params.id).then(message1 => {
        if (message1 = 'categorie Product deleted') {
            deleteProduct(req.params.id).then(message2 => {
                res.json(message2)
            })
        }     
    })  
});


productsRouter.get('/add/categorie/:id/:id_categorie', function(req, res) {
    AddCategorieToProduct(req.params.id, req.params.id_categorie).then(message => {
        res.json(message)
    })
});




module.exports = productsRouter;