const express = require("express");
const app = express();
const request = require("request");
const pool = require("./dbPool.js");
const querystring = require('querystring');

const session= require("express-session");


app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
    secret: "top secret!",
    resave: true,
    saveUninitialized: true
}));

app.use(express.urlencoded({extended: true}));

app.get("/", function (req, res) {
//res.render("index");
    //res.send("Login form will go here");
      let sql =  "SELECT * FROM questions";
      pool.query(sql, function (err, result, fields) {
        if (err) throw err;
         else {
              console.log("result");
              res.render("index", { result: result });
            }
      });

 });
 

 //welome page
app.get("/", function (req, res) {
    res.render("results");
 });
 
 app.post("/", function(req,res){


 });
 

 
 app.get("/myAccount",isAuthenticated, function(req,res){
    if (req.session.authenticated){
        res.render("account");
    }
    else{
        res.redirect("/");
    }
 });
 //login 
 app.get('/login', (req, res)=> {
     if (req.session.authenticated) {
         res.redirect('menu');
     } else {
        res.render('login');     
     }
});



// admin 
app.get('/admin', (req, res) => {
    if (req.session.authorization) {
        res.redirect('cpanel');
    } else {
        res.render('admin');    
    }
});
//menu
app.get('/menu', (req, res) => {
    if (req.session.authenticated) {
        res.render('menu');
    } else {
        res.redirect('login');   
    }
    //res.render('menu');
});
// control pannel
app.get('/cpanel', (req, res) => {
    res.render('cpanel');
});


app.get("/api/show_question", function(req, res){
   
     let sql = "SELECT question_id, question,answer FROM questions where question_id = ?";
     
      let sqlParams = [req.query.question_id];
     pool.query(sql, sqlParams,function(err, result) {
        if (err)
        {
            res.send("error");
        }
    result = JSON.stringify(result);
  
  res.send(result);
  return result;

     
 }); 
 });

// INSERT Questions 
app.get('/api/crudquestion', (req, res)=> {
 console.log("Insert: ", req.query.action, );
 let sql='';
 let sqlParams='';
 switch (req.query.action) {
     case 'insert':
         sql = "INSERT INTO questions (`Animals`, `category`, `question` , `answer_1` , `answer_2` , `answer_3` , `answer_4` , `answer`) values( ?, ?, ?, ?, ?, ?, ?, ? ) ";
         sqlParams = [req.query.animals, req.query.category,req.query.question,req.query.answer_1,req.query.answer_2, req.query.answer_3,req.query.answer_4,req.query.answer];
         pool.query(sql, sqlParams, (err, rows, fields) => {
             if(err)console.log(err);
             res.send("success");
         })
         break;
         
         case 'delete':
         sql = " delete from questions where question_id= ? ";
         sqlParams = [req.query.question_id];
         pool.query(sql, sqlParams, (err, rows, fields) => {
             if(err)console.log(err);
             res.send("success");
         })
         break;
         
 }
    
});

 // logout 
 app.get("/logout", function(req,res){
     req.session.destroy();
     res.redirect("/");
 });
 
 app.get("/quiz/:category", async function(req, res) {
     var category = req.params.category;
     
     let questions = await getQuestionsByCategory(category);
     
     res.render('quiz', {"quizRows": questions, "questionsJSON": JSON.stringify(questions)});
     
 });

 //login post for users
 app.post("/login", async function(req,res) {
     let username = req.body.uname;
     let password = req.body.pword;
      
    let user = await checkuser(username);
    let name = "";
    if (user.length>0){
        name = user[0].username;
    }
    
    if (name == password){
        req.session.authenticated = true;
        res.render("menu");
    }
    else{
        res.render("login", { "loginError":true});
    }
  });
  
   //login post for admins
 app.post("/admin", async function(req,res) {
     let username = req.body.uname;
     let password = req.body.pword;
      
    let user = await checkadmin(username);
    let name1 = "";
    if (user.length>0){
        name1 = user[0].username;
    }

    if (name1 == password){
        req.session.authorization = true;
        res.render("cpanel");
    }
    else{
        res.render("admin", { "loginError":true});
    }
  });


 app.post("/quiz", async function(req,res) {
     console.log("Body:");
     console.dir(req.body);
     //res.render("results");
     var score = 0;
     var total = 0;
     
     for (var key in req.body) {
         if (req.body.hasOwnProperty(key)) {
             item = req.body[key];
             var splitItem = item.split("_");
             var id = parseInt(splitItem[0]);
             let answerRows = await getAnswerByQuestionId(id);
             var answer = answerRows[0]["answer"];
             if (answer.toUpperCase() === splitItem[1].toUpperCase()) {
                 score++;
             }
             total++;
         }
     }
     var percentage = ((score/total) * 100).toFixed(2);
     console.log("Score: " + score);
     console.log("Total: " + total);
     console.log("Percentage: " + percentage);
     res.render("results", {"score": percentage});
 });
 
 function isAuthenticated(req,res,next){
     if (!req.session.authenticated){
         res.redirect('/');
     } else {
         next()
     }
 }
 
 function getAnswerByQuestionId(questionId) {
     let sql = "SELECT answer FROM questions WHERE question_id = ?";
     return new Promise(function(resolve, reject){
         pool.query(sql, [questionId], function(err, rows, fields){
             if (err) throw err;
             console.log("Rows found: " + rows.length);
             resolve(rows);
         })
     })
 }
 
 function getQuestionsByCategory(category) {
     let sql = "SELECT * FROM questions WHERE UPPER(category) = UPPER(?)";
     return new Promise(function(resolve, reject){
         pool.query(sql, [category], function(err, rows, fields){
             if (err) throw err;
             console.log("Rows found: " + rows.length);
             resolve(rows);
         })
     })
 }
 
 //check if user is in database
 function checkuser(username){
    let sql = "SELECT * FROM users WHERE username= ?";
    return new Promise(function(resolve, reject){

       pool.query(sql, [username], function(err,rows, fields){
            if (err) throw err;
            console.log("Rows found: " + rows.length);
            //resolve check for rows found with NAME
            resolve(rows);
        }); //query
    }); //promise
}

//check if admin is in database
 function checkadmin(username){
    let sql = "SELECT * FROM admin WHERE username= ?";
    return new Promise(function(resolve, reject){

       pool.query(sql, [username], function(err,rows, fields){
            if (err) throw err;
            console.log("Rows found: " + rows.length);
            //resolve check for rows found with NAME
            resolve(rows);
        }); //query
    }); //promise
}
 
//starting server 
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Express server is running....");
});

