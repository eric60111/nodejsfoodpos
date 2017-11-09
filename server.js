process.env.TZ = 'Asia/Taipei';
var http = require('http');
var express = require('express');
var Firebase = require('firebase');

var server_port = process.env.PORT ||config.port|| process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var Ref = new Firebase("https://foodpos.firebaseio.com/");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/** Test API **/
app.post('/test', function(req, resp) {
    console.log('test');
    resp.send('test');
});


/* 新增Product
 * /api/product/create?type=炒飯類&name=王子麵炒飯&price=90
 */
app.post('/api/product/create',function(req, resp) {
    
    if(req.body.type != null && req.body.name != null)  {
        Ref.child('product').child(req.body.type).child(req.body.name).once("value", function(snapshot) {
            
            if(snapshot.val()==null) {
                
                
                //獲取分店名稱
                Ref.child('store').once("value", function(store_snapshot){
                    var store ;
                    var store_t = Array();
                    for (store in store_snapshot.val()) {
                        store_t[store] = "上架";
                    }
                    
                    var data_t = Array();
                
                    if(req.body.price != null) data_t['價格'] = req.body.price.toString();
                    if(req.body.bigprice != null) data_t['加大價格'] = req.body.bigprice.toString();
                    
                    /** Default Value **/
                    data_t['onsale'] = store_t;
                    data_t['狀態'] = '存在';
                    
                    Ref.child('product').child(req.body.type).child(req.body.name).set(data_t);
                    
                    resp.send(req.body.name+' write into firebase sucessful.');
                    
                });
                
            }else{
                resp.send('The name is already in the database or not found the type');
            }
        });
    }
    updateDataEvent('product');
});

/* 查找 Product
/* /api/product/retrieve?type=炒飯類&name=肉絲炒飯
 * /api/product/retrieve?type=炒飯類
 * /api/product/retrieve
 */
app.post('/api/product/retrieve',function(req, resp){
    
    if( req.body.type != null ) {
        
        if ( req.body.name != null ) {
            /** 透過 分類和名稱 找 product**/
            Ref.child('product').child(req.body.type).child(req.body.name).once("value", function(snapshot) {
                resp.send(snapshot.val() != null ? snapshot.val() : 'The name of the product is not exist.' );
            });
            
        }else{
            
            /** 透過 分類 找 product**/
            Ref.child('product').child(req.body.type).once("value", function(snapshot) {
                resp.send(snapshot.val() != null ? snapshot.val() : 'The type of the product is not found.');
            });
            
        }
    }else{
        Ref.child('product').once("value", function(snapshot) {
            resp.send(snapshot.val() != null ? snapshot.val() : 'The product is empty.');
        });
    }
    
});

//找 Product_Type
app.post('/api/product_type/retrieve', function(req, resp) {
    
    Ref.child('product').once("value", function(snapshot) {
        
        var type ;
        var types = Array();
        for (type in snapshot.val()) {
            types.push(type);
        }
        
        resp.send(types);
    });
    
});


//找 Prdocut_Price_Type
//type=炒飯類
app.post('/api/product_price_type/retrieve', function(req, resp) {
    
    
    if(req.body.type != null){
        
    
        Ref.child('product').child(req.body.type).once("value", function(snapshot) {
            
            var product ; 
            var price_types = Array();    
            
            
            for(product in snapshot.val()) {
                
                var price = snapshot.child(product).child("價格").val();
                
                if(price_types == null) {
                    price_types.push( price );
                }else{
                    if(price_types.indexOf( price )< 0 ) 
                        price_types.push( price );
                }
            }
            
            resp.send(price_types.sort(function(a, b){return a-b}));
        });
        
        
    }else{
        resp.send("Please send a type value.");
    }
    
});


/* 修改 Product 
 * /api/product/update?type=炒飯類&name=肉絲炒飯&price=100&state=存在&onsale={"大連店":"上架","自強店":"下架"}
 * /api/product/update?type=炒飯類&type_modify=熱炒類
 */
app.post('/api/product/update',function(req, resp) {
    
    if( req.body.type != null ){
        if ( req.body.name != null ) {
            /** 修改 product**/
            
            var data_t = Array();
            
            if(req.body.price != null) data_t['price'] = req.body.price;
            if(req.body.state != null) data_t['state'] = req.body.state;
            if(req.body.onsale != null) data_t['onsale'] = JSON.parse(req.body.onsale);
            
            resp.send('The product information is changed.');
        }else {
            /** 修改 type**/
            
            Ref.child('product').child(req.body.type).once("value", function(snapshot) {
                
                Ref.child('product').child(req.body.type_modify).set(snapshot.val());
                Ref.child('product').child(req.body.type).remove();
            });
            resp.send('The name of type is changed.');
        }
    }else{
        resp.send('The value of type is NULL');
    }
    updateDataEvent('product');
});



///////////////////////////////////////////////////////////////////////////////
/////////////// Addition API //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/** 新增 Addition **/
//name=咖哩
//price=10
app.post('/api/addition/create',function(req, resp) {
    
    
    if(req.body.name != null) {
        Ref.child('addition').child(req.body.name).once("value", function(snapshot) {
        
            if(snapshot.val() == null) {
                
                
                Ref.child('store').once("value", function(store_snapshot){
                    
                    
                    Ref.child('addition').once("value", function(addition_snapshot) {
                        
                        var data_t = Array();
                    
                        if(req.body.price !=null) data_t['價格'] = req.body.price;
                        
                        var store ;
                        var store_t = Array();
                        for (store in store_snapshot.val()) {
                            store_t[store] = "上架";
                        }
                        
                        data_t['onsale'] = store_t;
                        data_t['state'] = '存在';
                        data_t['順序'] = (addition_snapshot.numChildren() + 1);
                        
                        Ref.child('addition').child(req.body.name).set(data_t);
                        
                        resp.send(req.body.name+' write into firebase sucessful');
                        
                    });
                    
                    
                });
            }else{
                resp.send('The name of addition is already in the databse.');
            }
        });
            
    }else{
        resp.send('The name of value is null.');
    }
    updateDataEvent('addition');
   
   
});

/* 查找 Addition 
 * /api/addition/retrieve?name=肉絲
 * /api/addition/retrieve
 */
app.post('/api/addition/retrieve',function(req, resp){
    
    if( req.body.name != null ) {
        
        /** 找 Addition**/
        Ref.child('addition').child(req.body.name).once("value", function(snapshot) {
            resp.send(snapshot.val() != null ? snapshot.val() : 'The name of the addition is not exist.' );
        });
            
    }else{
        Ref.child('addition').once("value", function(snapshot) {
            resp.send(snapshot.val() != null ? snapshot.val() : 'The addition is empty.' );
        });
    }
    
});

/* 修改 Addition 
 * /api/addition/update?name=火腿&price=50
 * /api/addition/update?name=火腿&seq=2
 * /api/addition/update?name=火腿&onsale={"大連":"上架","自強":"下架"}
 * /api/addition/update?name=火腿&state=存在
 */ 
app.post('/api/addition/update',function(req, resp) {
    
    var name=req.body.name;
    
    if ( name != null ) {
        /** 修改 addition**/
        
        var data = [];
        
        
        if( req.body.price != null ) {
            data['價格'] = req.body.price;
        }else if ( req.body.seq != null ) {
            data['順序'] = req.body.seq;
        }else if ( req.body.onsale != null ) {
            data['onsale'] = JSON.parse(req.body.onsale);
        }else if ( req.body.state != null) {
            data['state'] = req.body.state;
        }
        
        Ref.child('addition').child(name).update(data);
        resp.send('The product information is changed.');
    }else{
        resp.send('The value of name is NULL.');
    }
    updateDataEvent('addition');
});



///////////////////////////////////////////////////////////////////////////////
/////////////// Remind API /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/* 查找 Remind 
 * /api/remind/retrieve?name=少鹽
 * /api/remind/retrieve
 */
app.post('/api/remind/retrieve',function(req, resp){
    
    if( req.body.name != null ) {
        
        /** 找 Addition**/
        Ref.child('remind').child(req.body.name).once("value", function(snapshot) {
            resp.send(snapshot.val() != null ? snapshot.val() : 'The name of the remind is not exist.' );
        });
            
    }else{
        Ref.child('remind').once("value", function(snapshot) {
            resp.send(snapshot.val() != null ? snapshot.val() : 'The remind is empty.' );
        });
    }
    
});



///////////////////////////////////////////////////////////////////////////////
/////////////// Order API /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/* 新增 Order
 * /api/order/create?store=大連店&incomeprice=100&discountprice=60&price=60&way=內用&employee=老王&orderlist={"肉絲炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}},"鮪魚炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}}}
 */ 
//store=大連店
//orderlist={"肉絲炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}},"鮪魚炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}}}
//price=100
//realprice=100
//getprice=100
//way=內用
//employee=王福德
app.post('/api/order/create',function(req, resp) {
    
    /** Automatic create a Date time **/
    var today = new Date();
    var Year = today.getFullYear().toString();
    var Month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() +1 ).toString() : (today.getMonth()+1).toString();
    var Day = today.getDate() < 10 ? '0' + (today.getDate().toString()) : today.getDate().toString() ;
    var date = Year +"/"+ Month +"/" +  Day;
    //console.log(date);
    if(req.body.store == null) {
        resp.send("Can not find the value of store.");
    }else{
        Ref.child('order').child(req.body.store).child(date).once('value',function(snapshot) {
            
            
            //console.log(snapshot.val().length);
            
            if(req.body.sn != null ) {
                
                var data = Array(); 
        
                data['訂單狀態'] = "存在";
                data['訂單時間'] = today.getHours() +":"+ today.getMinutes() +":" +today.getSeconds(); 
                if(req.body.price !=null) data['實際金額'] = req.body.price;
                if(req.body.realprice != null) data['折後金額'] = req.body.realprice;
                if(req.body.getprice != null) data['實收金額'] = req.body.getprice;
                if(req.body.way != null) data['用餐方式'] = req.body.way;
                if(req.body.employee != null) data['值班人員'] = req.body.employee;
                if(req.body.orderlist != null) data['訂單明細'] = JSON.parse(req.body.orderlist);
                
                var t_sn = (snapshot.val()==null)?1:snapshot.val().length ;
                
                var serialnumber;
                if( (Number)(req.body.sn) < t_sn) {
                    serialnumber = req.body.sn;
                }else{
                    serialnumber = snapshot.numChildren()+1;
                }
                
                Ref.child('order').child(req.body.store).child(date).child(serialnumber).set(data);
                resp.send(req.body.store + ' SN ' + serialnumber + ' write into firebase sucessful');
            }
            
            
        });
    }
    updateDataEvent('order');
   
});


/* 修改 Order
 * /api/order/create?store=大連店&incomeprice=100&discountprice=60&price=60&way=內用&employee=老王&orderlist={"肉絲炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}},"鮪魚炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}}}
 */ 
//store=大連店
//sn=10
//orderlist={"肉絲炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}},"鮪魚炒飯":{"售價":"70","數量":"1","加料":{"加大":10,"咖哩":20}}}
//price=100
//realprice=100
//getprice=100
//way=內用
//employee=王福德
app.post('/api/order/update',function(req, resp) {
    
    /** Automatic create a Date time **/
    var today = new Date();
    var Year = today.getFullYear().toString();
    var Month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() +1 ).toString() : (today.getMonth()+1).toString();
    var Day = today.getDate() < 10 ? '0' + (today.getDate().toString()) : today.getDate().toString() ;
    var date = Year +"/"+ Month +"/" +  Day;
    //console.log(date);
    if(req.body.store == null || req.body.sn == null  ) {
        resp.send("Can not find the value of store.");
    }else{
        Ref.child('order').child(req.body.store).child(date).once('value',function(snapshot) {
            
            var serialnumber = req.body.sn;
            
            var data = Array(); 
            
            //console.log(JSON.parse(req.body.orderlist));
            
            data['訂單狀態'] = "存在";
            data['訂單時間'] = today.getHours() +":"+ today.getMinutes() +":" +today.getSeconds(); 
            if(req.body.price !=null) data['實際金額'] = req.body.price;
            if(req.body.realprice != null) data['折後金額'] = req.body.realprice;
            if(req.body.getprice != null) data['實收金額'] = req.body.getprice;
            if(req.body.way != null) data['用餐方式'] = req.body.way;
            if(req.body.employee != null) data['值班人員'] = req.body.employee;
            if(req.body.orderlist != null) data['訂單明細'] = JSON.parse(req.body.orderlist);
            
            Ref.child('order').child(req.body.store).child(date).child(serialnumber).set(data);
            
            resp.send(req.body.store + ' SN ' + serialnumber + ' update sucessful');
        });
    }
    updateDataEvent('order');
   
});

/* 查找 Order 
 * /api/order/retrieve?store=大連店&datetime=2015/08/28&sn=1
 * /api/order/retrieve?store=大連店&datetime=2015/08/28
 * /api/order/retrieve?store=大連店
 */ 
app.post('/api/order/retrieve',function(req, resp){
    
    if(req.body.store != null ) {
        if( req.body.datetime != null ) {
            if( req.body.sn != null ){
                /** 找 Order**/
                Ref.child('order').child(req.body.store).child(req.body.datetime).child(req.body.sn).once("value", function(snapshot) {
                    resp.send( snapshot.val() != null ? snapshot.val() : 'The SN in this day is not found.');
                });
            }else{
                /** 找 Order of day**/
                Ref.child('order').child(req.body.store).child(req.body.datetime).once("value", function(snapshot) {
                    resp.send( snapshot.val() != null ? (snapshot.val()) : 'The date does not have any order.');
                });
            }
        }else{
            Ref.child('order').child(req.body.store).once("value", function(snapshot) {
                resp.send( snapshot.val() != null ? snapshot.val() : 'The order is empty.');
            });
        }
        
    }else{
        resp.send('Please send a value of the store .');
    }
    updateDataEvent('order');
});


/** 查找 訂單編號 **/
app.post('/api/order_sn/retrieve',function(req, resp){
    
    if(req.body.store != null ) {
        if( req.body.datetime != null ) {
            Ref.child('order').child(req.body.store).child(req.body.datetime).once("value", function(snapshot) {
                    //resp.send( snapshot.val().length);
                    
                    var j_response = {};
                    j_response['Length'] = (snapshot.val()==null)?1:snapshot.val().length ;
                    
                    resp.send( j_response );
            });
            
            
        }else{
            resp.send('Please send a value of the datetime .');
        }
        
    }else{
        resp.send('Please send a value of the store .');
    }
    updateDataEvent('order');
});


///////////////////////////////////////////////////////////////////////////////
/////////////// Store API /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/* 查找 Store 
 * /api/store/retrieve
 * /api/store/retrieve?name=大連店
 */ 
app.post('/api/store/retrieve',function(req, resp){
    
    if(req.body.name != null) {
        /** 找 Store**/
        Ref.child('store').child(req.body.name).once("value", function(snapshot) {
            resp.send(snapshot.val());
        });
        
    }else{
        
        Ref.child('store').once("value", function(snapshot) {
            resp.send(snapshot.val());
        });
    }
    
    
});

/** 新增 Store **/ 
app.post('/api/store/create',function(req, resp){
    if(req.body.name != null ) {
        var store_t = Array();
        if(req.body.address !=null) store_t['地址'] = req.body.address;
        if(req.body.phone !=null) store_t['電話'] = req.body.phone;
        
        if(store_t != null)
            Ref.child('store').child(req.body.name).set(store_t);
        
        
        
        Ref.child('product').once("value", function(snapshot) {
            snapshot.forEach(function(ChildSnapshot) {
                
                //console.log(ChildSnapshot.val());
                
                ChildSnapshot.forEach(function(ChildChildSnapshot) {
                    var onsale = ChildChildSnapshot.child("onsale").val();
                    
                    onsale[req.body.name] = "上架";
                    
                    Ref.child("product").child(ChildSnapshot.key()).child(ChildChildSnapshot.key()).child("onsale").set(onsale);
                });
            });
        });
        
        
        Ref.child('addition').once("value", function(snapshot) {
            snapshot.forEach(function(ChildSnapshot) {
                
                
                var onsale = ChildSnapshot.child("onsale").val();
                
                onsale[req.body.name] = "上架";
                
                Ref.child("addition").child(ChildSnapshot.key()).child("onsale").set(onsale);
                
            });
        });
        
        resp.send("The store "+req.body.name+" info is created.");
    }else{
        resp.send('The value of name, plz try again.');
    }
    updateDataEvent('store');
    
});

///////////////////////////////////////////////////////////////////////////////
/////////////// Employee API //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/* 新增 Employee  
 * /api/employee/create?id=99&name=王胖子&mobile=0989102830&type=員工
 */ 

app.post('/api/employee/create',function(req, resp) {
    
    
    /** Automatic create a Date time **/
    var today = new Date();
    var Year = today.getFullYear().toString();
    var Month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() +1 ).toString() : (today.getMonth()+1).toString();
    var Day = today.getDate() < 10 ? '0' + today.getDate().toString() : today.getDate().toString() ;
    var date = Year + "/" + Month + "/" + Day;
    
    if(req.body.name != null )
    Ref.child('employee').child(req.body.name).once("value", function(snapshot) {
        
        if(snapshot.val() == null) {
            

            var data_t = Array();

            data_t['編號'] = req.body.id;
            if(req.body.mobile != null )data_t['手機'] = req.body.mobile;
            data_t['狀態'] = '在職';
            if(req.body.type != null )data_t['種類'] = req.body.type;
            data_t['就職日'] = date;
            
            
            Ref.child('employee').child(req.body.name).set(data_t);
            
            resp.send(req.body.name+' write into firebase sucessful');
            
        }else{
            resp.send('The employee is already in the databse.');
        }
    });
    updateDataEvent('store');
   
});

/* 新增 工作紀錄
 * /api/employee_r/create?name=王福德&position=大連店&type=上班
 */ 

app.post('/api/employee_r/create',function(req, resp) {

    //var id = req.body.id;
    /** Automatic create a Date time **/
    var today = new Date();
    var Year = today.getFullYear().toString();
    var Month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() +1 ).toString() : (today.getMonth()+1).toString();
    var Day = today.getDate() < 10 ? '0' + today.getDate().toString() : today.getDate().toString() ;
    var date = Year +"/"+ Month +"/" +  Day;
    
    Ref.child('employee').child(req.body.name).once('value', function(snapshot) {
        if(snapshot.val() == null) {
            resp.send('Please add a Employee before you create a new work record.');
        }else{
            Ref.child('employee').child(req.body.name).child('工作紀錄').child(date).once('value', function(snapshot) {
                
                var data_t = (snapshot.val() !=null )? snapshot.val() : {};
                
                var data_tt = {};
                
                
                if(req.body.position !=null ) data_tt['地點'] = req.body.position;
                data_tt['時間'] = today.getHours() +":"+ today.getMinutes() ;
                
                data_t[req.body.type] = data_tt;
                
                Ref.child('employee').child(req.body.name).child('工作紀錄').child(date).set(data_t);
                
                resp.send('Create a new work record.');
            });
        }
        
        
    });
    
    updateDataEvent('employee');
});

/** Employee 狀態修改 **/
app.post('/api/employee_state/update',function(req, resp){

    if(req.body.name != null) {
        if(req.body.state != null) {
            Ref.child('employee').child(req.body.name).child('狀態').set(req.body.state);
            resp.send(req.body.name + ' 修改在職狀態為 ' + req.body.state);
        }
    }
});

/** 查找 Employee 或 工作紀錄**/ 
//name=王福德
//datetime=2015 | 2015/08 | 2015/08/01
app.post('/api/employee/retrieve',function(req, resp){
    
    if(req.body.name != null) 
        if(req.body.datetime != null) 
            //Ref.child('employee').child(req.body.name).child('工作紀錄').child(req.body.datetime).once("value", function(snapshot) {resp.send(snapshot.val());});
            
            Ref.child('employee').child(req.body.name).child('工作紀錄').child(req.body.datetime).once("value", function(snapshot) {resp.send(snapshot.val());});
        else
            Ref.child('employee').child(req.body.name).once("value", function(snapshot) { resp.send(snapshot.val());});
    else
        Ref.child('employee').once("value", function(snapshot) {resp.send(snapshot.val());});
    
});




/** Create a System Log **/
//type:IOExpection
//msg:This message is the test.
app.post('/api/system/create', function(req, resp) {
    
    /** Automatic create a Date time **/
    var today = new Date();
    var Year = today.getFullYear().toString();
    var Month = today.getMonth() + 1 < 10 ? '0' + (today.getMonth() +1 ).toString() : (today.getMonth()+1).toString();
    var Day = today.getDate() < 10 ? '0' + today.getDate().toString() : today.getDate().toString() ;
    var Hour = today.getHours() < 10 ? '0' + today.getHours().toString() : today.getHours().toString() ;
    var Minutes = today.getMinutes() < 10 ? '0' + today.getMinutes().toString() : today.getMinutes().toString() ;
    var Seconds = today.getSeconds() < 10 ? '0' + today.getSeconds().toString() : today.getSeconds().toString() ;
    var date = Year + "/"+  Month + "/"+ Day + "/" + Hour +":"+ Minutes+":" + Seconds ;
    
    if(req.body.type != null & req.body.msg != null) { 
        Ref.child('system').child(req.body.type).child(date).set(req.body.msg);
        resp.send('Create a new Log. (' + req.body.type + ')');
    }else{
        resp.send('Type or Message is null.');
    }
    
});


/** System Version Check **/
app.post('/api/system/check', function(req, resp) {
    
    Ref.child('system').child('版本').once("value", function(snapshot) {
        
        if(snapshot.val() != null) {
            resp.send(snapshot.val());
        }else{
            resp.send('The System Version info is null. ');
        }
        
    });
    
});



/** System Version Update **/
//number:0.1
//url:www.google.com
app.post('/api/system/update',function(req, resp) {
    
    Ref.child('system').once("value",function(snapshot) {
        var data_t = ( (snapshot.val() ) == null) ? Array() : snapshot.val();
            
        var data_tt = Array();
        
        if(req.body.number != null) data_tt['編號'] = req.body.number;
        if(req.body.url != null) data_tt['連結'] = req.body.url;
        
        data_t['版本'] = data_tt;
        
        Ref.child('system').set(data_t);
        resp.send('The number v'+data_tt['編號']+' system version is update completed.');
    });
    
});


/** Account **/
//datetime=2015/10/10
//store=大連店
app.post('/api/account/retrieve',function(req, resp) {
    
    if(req.body.datetime != null && req.body.store != null) {
        
        Ref.child('order').child(req.body.store).child(req.body.datetime).once("value",function(snapshot) {
            //var response = Array();
            
            var json_resp = {};
            
            var orderlist = snapshot.val();
            
            var totalprice = 0; 
            
            /** Check the Datetime is Month or Date **/
            if(orderlist instanceof Array) {
                
                // is Day
                for(var i = 1 ; i < orderlist.length ; i++) {
                    
                    totalprice += (Number)(orderlist[i]['實際金額']);
                    
                    for(var index in orderlist[i]['訂單明細']) { 
                        
                        var type = orderlist[i]['訂單明細'][index]['分類'];
                        var num = orderlist[i]['訂單明細'][index]['數量'];
                        
                        if(json_resp[type] != null) {
                            json_resp[type] += num;
                        }else{
                            json_resp[type] = num;
                        } 
                        
                    }
                    
                }
            }else{
                // is Month
                
                for(var obj in orderlist) {
                    
                    for(var t = 1 ; t < orderlist[obj].length ; t++) {
                        totalprice += (Number)(orderlist[obj][t]['實際金額']);
                        
                        for(var obj_index in orderlist[obj][t]['訂單明細']) {
                            
                            var obj_type = orderlist[obj][t]['訂單明細'][obj_index]['分類'];
                            var obj_num = orderlist[obj][t]['訂單明細'][obj_index]['數量'];
                            
                            if(json_resp[obj_type] != null) {
                                json_resp[obj_type] += obj_num;
                            }else{
                                json_resp[obj_type] = obj_num;
                            } 
                        }
                        
                    }
                    
                }
            }
            
            
            json_resp['總額'] = totalprice;
            resp.send(json_resp);
            //console.log(json_resp);
            
        });
    }else{
        resp.send('datetime or store is null.');
    }
    
    
});

app.post('/api/account_s/retrieve',function(req, resp) {
    
    if(req.body.datetime != null && req.body.store != null) {
        
        Ref.child('order').child(req.body.store).child(req.body.datetime).once("value",function(snapshot) {
            //var response = Array();
            
            var json_resp = {};
            
            var orderlist = snapshot.val();
            
            var totalprice = 0; 
            
            /** Check the Datetime is Month or Date **/
            if(orderlist instanceof Array) {
                
                // is Day
                for(var i = 1 ; i < orderlist.length ; i++) {
                    
                    totalprice += (Number)(orderlist[i]['實際金額']);
                    
                    for(var index in orderlist[i]['訂單明細']) { 
                        
                        var type = orderlist[i]['訂單明細'][index]['分類'];
                        var num = orderlist[i]['訂單明細'][index]['數量'] * 0.2;
                        
                        if(json_resp[type] != null) {
                            json_resp[type] += num;
                        }else{
                            json_resp[type] = num;
                        } 
                        
                    }
                    
                }
            }else{
                // is Month
                
                for(var obj in orderlist) {
                    
                    for(var t = 1 ; t < orderlist[obj].length ; t++) {
                        totalprice += (Number)(orderlist[obj][t]['實際金額']);
                        
                        for(var obj_index in orderlist[obj][t]['訂單明細']) {
                            
                            var obj_type = orderlist[obj][t]['訂單明細'][obj_index]['分類'];
                            var obj_num = orderlist[obj][t]['訂單明細'][obj_index]['數量'] * 0.2 ;
                            
                            if(json_resp[obj_type] != null) {
                                json_resp[obj_type] += obj_num;
                            }else{
                                json_resp[obj_type] = obj_num;
                            } 
                        }
                        
                    }
                    
                }
            }
            
            
            json_resp['總額'] = totalprice * 0.2;
            resp.send(json_resp);
            //console.log(json_resp);
            
        });
    }else{
        resp.send('datetime or store is null.');
    }
    
    
});



/** Data Version Check**/
app.post('/api/data/update',function(req, resp) {
    
    Ref.child('system').child('資料版本').once("value", function(snapshot) {
        
        if(snapshot.val() != null) {
            var json_resp = {};
            
            json_resp['result'] = 'successful';
            json_resp['version'] = snapshot.val();
            resp.send(json_resp);
        }else{
            resp.send('The Data Version info is null. ');
        }
        
    });
    
});



/** Write API **/
//route=order/大連店/2015
//jsondata={"10":{"08":{"1":{"值班人員":"王福德","實際金額":100,"應收金額":100}}}}
app.post('/api/write', function(req, resp) {
    
    if(req.body.route != null && req.body.jsondata != null) {
        Ref.child(req.body.route).set(JSON.parse(req.body.jsondata));
        resp.send("Write a data successful.");
    }else{
        resp.send("Please send a value of 'route' and 'jsondata'.");
    }
    
});

/** Read API **/
//route=order
app.post('/api/read', function(req, resp) {
    if(req.body.route != null) {
        Ref.child(req.body.route).once("value",function(snapshot) {
            resp.send(snapshot.val());
        });
    }else{
        //resp.send("Please send a value of 'route'.");
        Ref.on("value", function(snapshot) {
            resp.send(snapshot.val());
        });
    }
    
});



function updateDataEvent(type) {
    Ref.child('system').child(type).child('資料版本').once("value",function(snapshot) {
        
        var DataVersion ;
        if(snapshot.val() == null ) {
            DataVersion = 1;
        }else{
            DataVersion = snapshot.val() + 1;
        }
        
        Ref.child('system').child(type).child('資料版本').set(DataVersion);
        
        if(type == 'product' || type == 'addition' || type=='employee' || type=='store' ) {
            Ref.child('system').child(type).child('資料版本').once("value",function(childsnapshot) {
                var ChildDataVersion ;
                if(childsnapshot.val() == null ) {
                    ChildDataVersion = 1;
                }else{
                    ChildDataVersion = snapshot.val() + 1;
                }
                Ref.child('system').child('資料版本').set(ChildDataVersion);
            });
        }
    });
}


///////////////////////////////////////////////////////////////////////////////
/////////////// Server Start //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app);
//server.listen(server_port, server_ip_address,function() {
//   console.log( "Listening on " + server_ip_address + ", port " + server_port );
//});

server.listen(port, function(){
     console.log(`${pkg.name} listening on port ${port}`);
})
