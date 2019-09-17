const express = require('express');
const session=require('express-session');

const app = express();

const upload = require('express-fileupload');
app.use(upload());
const additem = require('./model/Add_Product');

const User = require('./model/User');

const cart = require('./model/cart');

const order = require('./model/order');

const Login = require('./model/Admin_Login');
const URL = "mongodb://localhost:27017/FoodOrder";    //For LocalHost
//const URL = "mongodb+srv://shubham:12345@cluster0-hsysq.mongodb.net/test?retryWrites=true&w=majority";
const mongoose = require('mongoose');
mongoose.connect(URL);

//Global Variable
count = 0;

//To remove deprecated warning
mongoose.set('useFindAndModify', false);

//Stripe Payment Gateway Code
const stripe = require('stripe')('sk_test_8aa4fApuBmtTLFXZDfMhkOza00wgcZqGN7')

/*----------------------------------------------------------------------------------------------------------------------------------------------------*/


const redirectAdminLogin= (request, response, next) => {
    if(!request.session.user)
    {
        additem.find((err, result)=>{
            if(err) throw err;
            else
            {    
                response.render('index', {data : result});
            }
        });
    }
    else{
        next();
    }
};


//caching disabled for every route
app.use(function(request, response, next) {
    response.set('Cache-Control', 'no-cache, private, no-store,must-revalidate,max-stale=0, post-check=0, pre-check=0');
    next();
});

app.listen(3000 , () => {
    console.log("Server Started....");
});


app.use(session({
    secret:"1234567",
    cookie: {maxAge:1000*60*8}
}))



//To serve Static Content
app.use(express.static('public'));

/* 
//Configure view engine : hbs
var path = require('path');
app.set('views' , path.join(__dirname , 'views')); // Give Location
//console.log(path.join(__dirname , 'views')); //To see path of file view
app.set('view engine', 'hbs'); // Give Extension 
*/

var hbs= require('express-handlebars');
app.engine('hbs' , hbs({
    extname: 'hbs',
    defaultLayout: 'CustomerNav',
    layoutsDir: __dirname + '/views/layouts/'
}));
app.set('view engine' , 'hbs');


//Configure body-parser
const bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended:true
}));


/*----------------------------------------------------Add Cart Item Count Function-----------------------------------------------------------------*/

function cartProductCount(request, response, callback) {
    cart.count({ userEmail: request.session.CustomerName }, (err, count1) => {
        //console.log(count1);
        if (err) throw err;
        else {
            callback(count1);
        }
    });
};

/*-------------------------------------------------------------------Admin GET Methods for Backend--------------------------------------------------------------------------------*/


app.get('/admin-login' , (request , response) => {
    response.render('Admin_login'); //Here Two doubts - (1)Extension, (2)location
});


app.get('/adminHome',redirectAdminLogin, (request, response) => {
    response.render('AdminHome',{user:request.session.user , layout: 'AdminNav.hbs'});
});


app.get('/AddProduct' ,redirectAdminLogin, (request, response) => {
    response.render('addproduct',{user:request.session.user, layout: 'AdminNav.hbs'});
});


app.get('/viewProduct',redirectAdminLogin, (request, response) => {
    additem.find((err, result)=>{
        if(err) throw err;
        else    
            response.render('viewproduct',{data : result, user:request.session.user, layout: 'AdminNav.hbs'});
    });
});


app.get('/DeleteProduct', redirectAdminLogin, (request,response) => {
    //var id=request.query.id;
    additem.deleteOne({_id:request.query.id}, (err) => {
        if(err) throw err;
        else{
            additem.find((err, result)=>{
                if(err) throw err;
                else    
                    response.render('viewproduct',{data : result , user:request.session.user, layout: 'AdminNav.hbs'});
            })
        }
    });
});


app.get('/UpdateProduct',redirectAdminLogin,(request,response) => {
    additem.findOne({_id:request.query.id}, (err, result) => {
        if(err) throw err;
        else
            response.render('getUpdateInfo',{data : result , user:request.session.user, layout: 'AdminNav.hbs'});
    });
});


app.get('/viewUsers' , redirectAdminLogin,(request,response) => {
    User.find((err,result)=>{
        if(err) throw err;
        else    
            response.render('ViewUsersDetail',{data : result, user:request.session.user, layout: 'AdminNav.hbs'});
    })
})


app.get('/checkExistance', (request,response) =>{
    additem.findOne({Pname: request.query.productName},(err, result)=>{
        if(err) throw err;
        else if(result != null)   
            response.send({msg : "<h3><b>Warning : Already Exist</b></h3>"});
        else
            response.send({msg : "Available"});
            //response.render('viewemp',{emps : result});
    });
});


app.get('/searchRecord', (request,response) =>{
    var regex = new RegExp(request.query.name , 'i');

    additem.find({
        $or: [
            {Pname: regex},
            {Pdesc: regex}
        ]
    }).exec(function(err , result){
        if(err) throw err;
        else{
            response.send({searchedData : result});
        }
    })
});

app.get('/currentOrders' , redirectAdminLogin,(request,response) => {
    order.find({Status: "pending"},(err,result)=>{
        if(err) throw err;
        else    
            response.render('currentOrders',{data : result, user:request.session.user, layout: 'AdminNav.hbs'});
    })
});

app.get('/updateStatus', (request,response) => {
    order.findOneAndUpdate({orderId : request.query.id} , {$set:{Status: request.query.value}}, {new:true} , (err,result)=>{
        if(err) throw err;
        else    
            console.log("status updated");
    })
});

app.get('/OrderHistory' , redirectAdminLogin,(request,response) => {
    order.find({Status: "Confirm"},(err,result)=>{
        if(err) throw err;
        else    
            response.render('OrderHistory',{data : result, user:request.session.user, layout: 'AdminNav.hbs'});
    })
});



/*-------------------------------------------------------------------Customer or User GET Methods for Backend--------------------------------------------------------------------------------*/

app.get('/' , (request , response) => {
    if(request.session.CustomerName)
    {
        additem.find((err, result)=>{
            if(err) throw err;
            else
            {
                cartProductCount(request, response, (cartdata) => { 
                    response.render('index', {data : result, Customer:request.session.CustomerName, cartcount:cartdata});
                });
            }
        });
    }
    else{
        additem.find((err, result)=>{
            if(err) throw err;
            else
            {
                response.render('index', {data : result, cartcount:count});
            }
        });
    }
});


app.get('/Customer-login' , (request , response) => {
    response.render('Customer_login');
});


app.get('/Customer-Register' , (request , response) => {
    response.render('Customer_Registration'); //Here Two doubts - (1)Extension, (2)location
});


app.get('/Contact' , (request , response) => {
    cartProductCount(request, response, (cartdata) => {
        response.render('ContactUs', {Customer:request.session.CustomerName, cartcount:cartdata});
    });
});


app.get('/About' , (request , response) => {
    cartProductCount(request, response, (cartdata) => {
        response.render('AboutUs', {Customer:request.session.CustomerName, cartcount:cartdata});    
    });
});

app.get('/detailInfo', (request, response) => {
    additem.findOne({_id:request.query.id}, (err, result) => {
        if(err) throw err;
        else
        {
            cartProductCount(request, response, (cartdata) => {
                response.render('viewDetail',{data : result , Customer:request.session.CustomerName, cartcount:cartdata});
            });
        }
    });
});


app.get('/cartItems', (request, response) => {
    cart.aggregate(
        [
            {
                $match:{
                    userEmail:request.session.CustomerName
                }
            },
            {
                $lookup:
                {
                    from:'additems',
                    localField: 'productId',
                    foreignField: 'Pid',
                    as : "items"
                }
            }
        ],(err, result) => {
            if(err) throw err;
            // console.log(result[0].items);
            // console.log(result);
            // response.json(result);
            else{
                cartProductCount(request, response, (cartdata) => {
                    response.render('cartItems',{data:result, Customer:request.session.CustomerName, cartcount:cartdata});
                });
            }
        }
    )
});


app.get('/cartAction', (request, response) => { 
    if(request.session.CustomerName){
        cart.findOne({productId: request.query.id}, (err, result)=>{
            if(result != null)
            {
                cart.findOneAndUpdate({productId: request.query.id}, {$inc: {pQuantity: request.query.count}}, {upsert:true}, (err,result) => {
                    if(err) throw err;
                    else{
                        cartProductCount(request, response, (cartdata) => {
                            response.render('index', {data : result,Customer:request.session.CustomerName, msg: 'Cart Updated Successfully', cartcount:cartdata});
                        });
                    }
                })
            }

            else{
                var newCart = new cart({
                    productId: request.query.id,
                    userEmail: request.session.CustomerName,
                    pQuantity: request.query.count
                });
                //save function return promises
                newCart.save().then(data => {
                    additem.find((err, result)=>{
                        if(err) throw err;
                        else{
                            cartProductCount(request, response, (cartdata) => {
                                response.render('index', {data : result,Customer:request.session.CustomerName, msg: 'Cart Updated Successfully', cartcount:cartdata});
                            });
                        }
                    });
                });
            }
        })
    }
    else{
        cartProductCount(request, response, (cartdata) => {
            response.render('Customer_login',{cartcount: cartdata});
        });
    }
});


app.get('/ViewProfile', (request, response) => {
    User.findOne({Email: request.session.CustomerName},(err,result)=>{
        if(err) throw err;
        else  
        {
            cartProductCount(request, response, (cartdata) => {
                response.render('viewprofile',{data : result, Customer:request.session.CustomerName, cartcount:cartdata});
            });     
        }  
    });
});


app.get('/DeleteCartItem', (request,response) => {
    //var id=request.query.id;
    cart.deleteOne({_id:request.query.id}, (err) => {
        if(err) throw err;
        else{
            cart.find((err, result)=>{
                if(err) throw err;
                else
                {
                    cart.aggregate(
                        [
                            {
                                $match:{
                                    userEmail:request.session.CustomerName
                                }
                            },
                            {
                                $lookup:
                                {
                                    from:'additems',
                                    localField: 'productId',
                                    foreignField: 'Pid',
                                    as : "items"
                                }
                            }
                        ],(err, result) => {
                            if(err) throw err;
                            // console.log(result[0].items);
                            // console.log(result);
                            // response.json(result);
                            else{
                                cartProductCount(request, response, (cartdata) => {
                                    response.render('cartItems',{data : result, Customer:request.session.CustomerName, cartcount:cartdata});
                                });
                            }
                        }
                    ) 
                }
            })
        }
    });
});


app.get('/checkout', (request, response) => {
    cart.aggregate(
        [
            {
                $match:{
                    userEmail:request.session.CustomerName
                }
            },
            {
                $lookup:
                {
                    from:'additems',
                    localField: 'productId',
                    foreignField: 'Pid',
                    as : "items"
                }
            }
        ],(err, result) => {
            if(err) throw err;
            // console.log(result[0].items);
            // console.log(result);
            // response.json(result);
            else{
                User.findOne({Email: request.session.CustomerName}, (err, result1) => {
                    if(result1!=null){
                        cartProductCount(request, response, (cartdata) => {
                            response.render('CheckOut',{data:result, UserInfo:result1, Customer:request.session.CustomerName, cartcount:cartdata});
                        });
                    }
                })
            }
        }
    )
});


app.get('/ViewOrderStatus', (request, response) => {
    order.find({CustomerEmail:request.session.CustomerName}, (err, result) => {
        if(err) throw err;
        else
        {
            cartProductCount(request, response, (cartdata) => {
                response.render('ViewOrderStatus',{data : result , Customer:request.session.CustomerName, cartcount:cartdata});
            });
        }
    });
});



/*-------------------------------------------------------------------Customer or User POST Methods for Backend--------------------------------------------------------------------------------*/

app.post('/RegisterUser' , (request,response) => {
    var newUser = new User({
            UserName: request.body.username,
            Password: request.body.userpassword,
            Email: request.body.useremail,
            Contact: request.body.usercontact,
            Address: request.body.userAddress
        });

        //save function return promises
        newUser.save().then(data => {
            response.render('Customer_Registration', {msg : 'Registered Successfuly Now Please Login!'});
    });
});


app.post('/loginCheckUser',(request,response)=>{
    var name = request.body.useremail;
    User.findOne({Email:request.body.useremail , Password:request.body.userpassword},  (err,result)=>{
      if(err) throw err;
      else if(result!=null) 
      {
        additem.find((err, result)=>{
            if(err) throw err;
            else  
            {
                request.session.CustomerName = name;
                cartProductCount(request, response, (cartdata) => {
                    response.render('index', {Customer:request.session.CustomerName ,data : result, cartcount:cartdata});
                });
            }
        });
      }
     else{
     	response.render('Customer_login',{msg:"Login Fail"});
      }
    });
});


app.post('/cartAction', (request, response) => { 
    if(request.session.CustomerName){
        cart.findOne({productId: request.query.id}, (err, result)=>{
            if(result != null)
            {
                cart.findOneAndUpdate({productId: request.query.id}, {$inc: {pQuantity: request.body.count}}, {upsert:true}, (err,result) => {
                    if(err) throw err;
                    else{
                        cartProductCount(request, response, (cartdata) => {
                            response.render('index', {data : result,Customer:request.session.CustomerName, msg: 'Cart Updated Successfully', cartcount:cartdata});
                        });
                    }
                })
            }

            else{
                var newCart = new cart({
                    productId: request.query.id,
                    userEmail: request.session.CustomerName,
                    pQuantity: request.body.count
                });
                //save function return promises
                newCart.save().then(data => {
                    additem.find((err, result)=>{
                        if(err) throw err;
                        else{
                            cartProductCount(request, response, (cartdata) => {
                                response.render('index', {data : result,Customer:request.session.CustomerName, msg: 'Cart Updated Successfully', cartcount:cartdata});
                            });
                        }
                    });
                });
            }
        })
    }
    else{
        cartProductCount(request, response, (cartdata) => {
            response.render('Customer_login',{cartcount: cartdata});
        });
    }
});


app.post('/CustomerOrder' , (request, response) =>{
    cart.aggregate(
        [
            {
                $match:{
                    userEmail:request.session.CustomerName
                }
            },
            {
                $lookup:
                {
                    from:'additems',
                    localField: 'productId',
                    foreignField: 'Pid',
                    as : "items"
                }
            }
        ],(err, result) => {
            if(err) throw err;
           
            // console.log(result[0].items);
            // console.log(result);
            // response.json(result);
            else{
                var total =0;
                result.map((data)=>{
                    total += data.items[0].Pprice*data.pQuantity;
                })

                //To find Cart Details
                var productDataset = [];
                result.map((data)=>{
                    productDataset.push(
                        {
                            ProductName:data.items[0].Pname,
                            ProductQuantity: data.pQuantity,
                            ProductPrice: data.items[0].Pprice
                        }
                    );
                })
                

                // console.log(dataset);
                var random =Math.random().toString(32).slice(-8)
                var newData =new order({
                    orderId:random,
                    CustomerEmail: request.body.email,
                    CustomerContact: request.body.contact,
                    CustomerAddress: request.body.Address,
                    Products:productDataset,
                    Total: total,
                    Status: "pending",
                })

                newData.save().then(data => {
                    cart.deleteMany({userEmail: request.session.CustomerName}, (err)=>{
                        if(err) throw err;
                        else{
                            var token = request.body.stripeToken;
                            var chargeamt = request.body.amount;
                            var charge = stripe.charges.create({
                                amount: chargeamt,
                                currency: "inr",
                                source: token
                            }, (err, result) => {
                                if(err & err.type === 'StripeCardError'){
                                    console.log("Card Decliend");
                                }
                                console.log("Payment Successfully Done");
                                cartProductCount(request, response, (cartdata) => {
                                    additem.find((err, result)=>{
                                    if(err) throw err;
                                        response.render('index', {data : result,Customer:request.session.CustomerName, msg: 'Order Place Successfully', cartcount:cartdata});
                                    })
                                });
                            });
                        }
                    });
                });
                // console.log(newdata)
            }
        }
    )
});

/*-------------------------------------------------------------------Admin POST Methods for Backend--------------------------------------------------------------------------------*/

app.post('/loginCheck',(request,response)=>{
    var name = request.body.uname;
    Login.findOne({uname:request.body.uname , password:request.body.password},  (err,result)=>{
      if(err) throw err;
      else if(result!=null) 
      {
            request.session.user=name;
            response.render('AdminHome', {user:request.session.user , layout: 'AdminNav.hbs'});
      }
     else{
     	response.render('Admin_Login',{msg:"Login Fail"});
      }
    });
});


app.post('/insertProduct' ,redirectAdminLogin, (request,response) => {
    if(request.files)
    {
        var random= Math.random().toString(36).slice(-8);
        var alldata = request.files.pfile;
        var filename = alldata.name;
        var altfname = random + filename;
        var newProduct = new additem({
            Pid: random,
            Pname:request.body.pname,
            Pprice:request.body.pprice,
            Pdesc:request.body.pdesc,
            Pcategory:request.body.pselect,
            Pimage: altfname
        });  

        alldata.mv('./public/upload/'+altfname, (err) =>{
            if(err) throw err;
            else
            {
                //save function return promises
                newProduct.save().then(data => {
                    response.render('addproduct', {msg : 'Product Added Successfuly', user:request.session.user, layout: 'AdminNav.hbs'})
                });
            }
        });
    }
});



var fs = require('fs');
var filePath = './public/upload/'; 

app.post('/updateAction',redirectAdminLogin, (request,response) => {
    //console.log(request.files);
    if(request.files)
    {
        fs.unlinkSync(filePath + request.body.oldimage)
        var random= Math.random().toString(36).slice(-8);
        var alldata = request.files.pfile;
        var filename = alldata.name;
        var altfname = random + filename;
        alldata.mv('./public/upload/'+altfname, (err) =>{
            if(err) throw err;
        });
        
        additem.findByIdAndUpdate(request.body.id, 
            {Pname:request.body.pname, Pprice:request.body.pprice, Pdesc:request.body.pdesc, Pcategory:request.body.pselect, Pimage:altfname},
            (err) => {
                if(err) throw err;
                else{
                    additem.find((err, result)=>{
                        if(err) throw err;
                        else    
                            response.render('getUpdateInfo',{data : result, user:request.session.user , msg:'Information Updated', layout: 'AdminNav.hbs'});
                    });
                }
            });
    }
    else
    {
        additem.findByIdAndUpdate(request.body.id, 
            {Pname:request.body.pname, Pprice:request.body.pprice, Pdesc:request.body.pdesc, Pcategory:request.body.pselect},
            (err) => {
                if(err) throw err;
                else{
                    additem.find((err, result)=>{
                        if(err) throw err;
                        else    
                            response.render('getUpdateInfo',{data : result, user:request.session.user , msg:'Information Updated', layout: 'AdminNav.hbs'});
                    });
                }
            });
    }
});



/*------------------------------------------------------Stripe Payment Gateway Code--------------------------------------------------------------------*/
/*

app.post('/pay', (request, response) => {
    var token = request.body.stripeToken;
    var chargeamt = request.body.amount;
    var charge = stripe.charges.create({
        amount: chargeamt,
        currency: "inr",
        source: token
    }, (err, result) => {
        if(err & err.type === 'StripeCardError'){
            console.log("Card Decliend");
        }
        console.log("Payment Successfully Done");
        response.redirect('/');
    });
});

*/



/*-------------------------------------------------------------------code to create database and collections mannually--------------------------------------------------------------------------------*/

/*
// code to create database and collections mannually
app.get('/test',(request,response)=>{
    var emp = new Login({
    	uname: "admin",
    	password: "12345"
    });
    emp.save().then(data => {
    	console.log("data inserted")
    })
});
*/


/*-------------------------------------------------------------------Logout Method and 404 Method--------------------------------------------------------------------------------*/

app.get('/logout',(request,response)=>{
    request.session.destroy();
    additem.find((err, result)=>{
        if(err) throw err;
        else
        {
            response.render('index', {data : result}); //Here Two doubts - (1)Extension, (2)location
        }    
    });
});


app.use(function(request , response){
    response.status(404);
    response.render('404',{title : '404: Requested Page Not Found'});
});