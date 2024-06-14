// import dependencies
const exp = require('constants');
const express = require('express');
const upload = require('express-fileupload');
const path = require('path');
var myApp = express();


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/Orders');
const Schema = mongoose.Schema;

// Setup Model for Collection

const Order = mongoose.model("Order", {
    name : String,
    email : String,
    phone : Number,
    city : String,
    address : String,
    shippingcharges:Number,
    products: Array,
    street : String,
    province : String,
    deliverytime : String,
    postcode : String,
    totalcost : Number,
    tax : Number,
    totalTax : Number,
    totalBill : Number
});

// Express File Upload
//myApp.use(upload());
// setting path to public and views folder
myApp.set('views',path.join(__dirname,'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

// Create Object Destructuring For Express Validator
const {check, validationResult} = require('express-validator');

// Express Body-Parser
myApp.use(express.urlencoded({extended:true}));

var phoneReg = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/;


function checkRegex(userInput, regex) 
{
    if(regex.test(userInput)) { return true; }
    else {return false; }
}

function customPhoneValidation(value)
{
    if(!checkRegex(value, phoneReg)) {
        throw new Error('Please enter correct phone format!');
    }
    return true;
}

function checkItemQuantity(req) {
    const productNames = ['Flowers Bouquet', 'Tulips', 'Crafter Bouquet', 'Pink Tulip'];
    for (let i = 1; i <= 4; i++) {
        const quantity = parseInt(req.body[`itemQuantity${i}`]) || 0;
        if (quantity > 0) {
            return true; // At least one item has a non-zero quantity
        }
    }
    return false; // No item has a non-zero quantity
}

function customItemQuantityValidation(value, { req }) {
    if (!checkItemQuantity(req)) {
        throw new Error('Please add at least one quantity of an item!');
    }
    return true;
}

function checkMinimumPurchaseAmount(req) {
    const productNames = ['Flowers Bouquet', 'Tulips', 'Crafter Bouquet', 'Pink Tulip'];
    let itemprice = [60, 8, 90, 25];
    let totalcost = 0;
    for (let i = 1; i <= 4; i++) {
        const quantity = parseInt(req.body[`itemQuantity${i}`]) || 0;
        totalcost += quantity * itemprice[i - 1];
    }
    return totalcost > 10;
}


// Custom validation function for total cost
function customTotalCostValidation(value, { req }) {
    if (!checkMinimumPurchaseAmount(req)) {
        throw new Error('Minimum purchase amount should be $10!');
    }
    return true;
}



myApp.get('/',function(req,res) {
    res.render('product');     // No need to add .ejs extension
});


myApp.post('/',[
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Please enter valid email address!').isEmail(),
    check('phone','').custom(customPhoneValidation),
    check('itemQuantity', 'Please add at least one quantity of an item!').custom(customItemQuantityValidation),
    check('totalcost', 'Minimum purchase amount should be $10!').custom(customTotalCostValidation)
], function(req,res){
    const errors = validationResult(req);
    console.log(errors);

    if(!errors.isEmpty()) {
        // Display Error Messages
        res.render('product', {errors : errors.array()});
    }
    else{
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var street = req.body.street;
        var province = req.body.province;
        var postcode = req.body.postcode;
        var deliverytime = req.body.deliveryTime;
        var tax = 0;
        var shippingcharges = 20;

        const productNames = ['Flowers Bouquet', 'Tulips', 'Crafter Bouquet', 'Pink Tulip'];
        let itemprice=[60,8,90,25];
        const products=[];

        var totalcost=0;
        for(i=1;i<=4;i++){
            var quantity = parseInt(req.body[`itemQuantity${i}`]) || 0;
            
            if(quantity>0){
            totalcost +=quantity*itemprice[i-1];
            products.push({name: productNames[i-1], Quantity: quantity, itemprice :itemprice[i-1]});  
            }
        }

        if(province=="P.E.I"||province=="NS"||province=="NL"||province=="NB"){
            tax = 15; 
        }
        else if(province=="BC"||province=="MB"){
            tax = 12; 
        }
        else if(province=="ON"){
            tax = 13; 
        }
        else if(province=="SK"){
            tax = 11; 
        }
        else if(province=="QC"){
            tax = 14.975; 
        }

        var totalTax = totalcost * (tax/100);
        var totalBill = totalcost + totalTax;


        var pageData = {
            name : name,
            email : email,
            phone : phone,
            city : city,
            products:products,
            address : address,
            street : street,
            tax : tax,
            province : province,
            totalcost : totalcost,
            shippingcharges:shippingcharges,
            deliverytime: deliverytime,
            postcode : postcode,
            totalTax : totalTax,
            totalBill : totalBill
        };

                    // Save Data Into Database
                    var myProduct = new Order(pageData);
                    myProduct.save().then(function(){
                        console.log("File Data Saved in Database!");
                    });

                    //res.send(myProduct);
                    

        res.render('receipt', pageData);
        

    }





    });


    myApp.get('/allorders', (req,res) => {
        Order.find({}).then((x) => {
            res.render('allorders', {x})
            console.log(`Object X Output: ${x}`);
        });
    });

//Execute website using port number for local host
myApp.listen(8080);
console.log('Website Executed successfully.... Open using http://localhost:8080/')
