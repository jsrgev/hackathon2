const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.API_port || 3333;
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const axios = require("axios");
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt");
//how many times i want the password to be hashed
const saltRounds = 13;
//this is my array of users, it is currently stored in users.js for testing purposes
// const users = require("./users").users;
//28/05/2021, deleted


//handling json body requests
app.use(express.json());
app.use(cors());

// app.use(express.static('/', {index: 'index.html'}))
app.use(express.static('public'));
// app.get('/',function () {
    // res.sendFile('public/index.html');
// });

// app.get('/',function () {
    // res.sendFile('public/index.html');
// });

// app.get('/', function(req, res){
//   res.sendFile('index.html');
// }); 

// app.get('/', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'public/', 'index.html'));
// });

// app.use("/", express.static(__dirname + "/"));
// app.use("/", express.static(__dirname + "/public"));
// app.get('/', function(req,res){res.sendfile('index.html');});

app.post("/register", async (req, resp) => {
  let data = fs.readFileSync("./users.txt");
  let dataString = data.toString();
  let users = JSON.parse(dataString);
  let matchUser = users.find((user) => req.body.email === user.email);
  if (!matchUser) {
    //bcrypt has a hash method that creates an encrypted password
    //the method takes what you're encrypting and how many times
    let hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    let newUser = {
      _id: Date.now(),
      email: req.body.email,
      password: hashedPassword,
    };
    users.push(newUser);

    fs.writeFile("users.txt", JSON.stringify(users), (err) => {
      if (err) {
        console.log(err);
      }
    });
    console.log(`list of users ${users}`);
    resp.status(201).send({ data: newUser });
  } else {
    resp.status(400).send({
      error: { code: 400, message: `that email address is already in usage` },
    });
  }
});

let loggedIn = false;

let id;
app.post("/login", async (req, res) => {
  //to do - check against the file and not users array in users.js
  let loggedIn = false;
  let submittedPass;
  let savedPass;
  //get the email and password from req.body
  //find the match for the email
  await fs.readFile("users.txt", async (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`i read the file, here's the data! ${data}`);
      let usersArray = JSON.parse(data);
      let matchUser = usersArray.find((user) => req.body.email === user.email);
      if (matchUser) {
        //validate the password using bcrypt
        submittedPass = req.body.password; //plain text from browser
        savedPass = matchUser.password; //that has been hashed
        id = matchUser._id;
        const passwordDidMatch = await bcrypt.compare(submittedPass, savedPass);
        if (passwordDidMatch) {
          console.log(`here is the id ${id}`);
          console.log("success!");

          res.status(200, () => {}).send({ data: { token: id } });

          // res.status(200).send({ data: { token: "this is a fake token" } });
        } else {
          console.log("incorrect password");
          res.status(401).send({
            error: { code: 401, message: "invalid username and/or password." },
          });
        }
      } else {
        console.log("no user found");
        //cause a delay to hide the fact that there was no match
        let fakePass = `$je31m${saltRounds}leeisthebestttt`;
        await bcrypt.compare(submittedPass, fakePass);
        //to slow down the process, primarily against hackers
        res.status(401).send({
          error: { code: 401, message: "invalid username and/or password." },
        });
      }
    }
  });
});
console.log(loggedIn);



app.post("/writeuserwords", (req, resp) => {
  let data = req.body;
  //require the ./ when writing a file
  //MUST PASS IN CALLBACK WHEN DOING WRITE FILE
  fs.writeFile("./userWords.txt", JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
    }
  });
  //if don't send back resp, status remains 'pending' and multiple pending lead to problems
  resp.sendStatus(200);
});

app.post("/writelanguagewords", (req, resp) => {
  let data = req.body;
  //require the ./ when writing a file
  //MUST PASS IN CALLBACK WHEN DOING WRITE FILE
  fs.writeFile("./languageWords.txt", JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
    }
  });
  resp.sendStatus(200);
});


app.get("/readuserwords", async (req, res) => {
  let array = [];
  try {
    await fs.readFile("userWords.txt", (err, data) => {
      let fileString = data.toString();
      let fileJSON = JSON.parse(fileString);
      // console.log(`here is file JSON ${fileJSON}`);
      array = fileJSON;
      // array = JSON.parse(fileString);
      // console.log("array");
      res.send(array);
    });
  } catch (e) {
    console.log(e);
  }
});
app.get("/readlanguagewords", async (req, res) => {
  // console.log("a")
  let array = [];
  try {
    await fs.readFile("languageWords.txt", (err, data) => {
      let fileString = data.toString();
      let fileJSON = JSON.parse(fileString);
      // console.log(`here is file string ${fileJSON}`);
      array = fileJSON;
      res.send(array);
      // array = JSON.parse(fileString);
    });
    // console.log(`here's the array ${array}`);
  } catch (e) {
    // console.log(e);
  }
});


app.listen(port, (err) => {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
