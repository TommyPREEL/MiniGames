let express = require('express');
let categoriesRouter = express.Router();

const Categorie = require('../class/Categorie');
const { getAllCategories, getCategorieById,  createCategorie,  updateCategorie,  deleteCategorie, getProductsByCategorie, deleteProductsInCategorie } = require('../models/categorie.js')

categoriesRouter.get('/', function(req, res) {
    getAllCategories().then(categories => {
      res.json({categories:categories})
    })
});

categoriesRouter.get('/details/:id', function(req, res) {
    getCategorieById(req.params.id).then(categorie => {
    res.json(categorie)
    })
});

categoriesRouter.get('/add', function(req, res) {
    const categorie1 = new Categorie(1, "Boisson");
    createCategorie(categorie1).then(message => {
        res.json(message)
    })
});

categoriesRouter.get('/update/:id', function(req, res) {
    const categorie1 = new Categorie(2, "Boissons");
    updateCategorie(req.params.id, categorie1).then(message => {
        res.json(message)
    })
});


categoriesRouter.get('/delete/:id', function(req, res) {
    deleteProductsInCategorie(req.params.id).then(message1 => {
        if (message1 = 'Products in this category have been deleted') {
            deleteCategorie(req.params.id).then(message2 => {
                res.json(message2)
            })
        }     
    })  
});

categoriesRouter.get('/details/:id/products', function(req, res) {
    getProductsByCategorie(req.params.id).then(products => {
        res.json(products)
    })
});


  
module.exports = categoriesRouter;