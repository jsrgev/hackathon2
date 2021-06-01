const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.API_port || 333;
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const axios = require("axios");
//downloaded some dependencies that aren't exactly necessary, was using axios for experimentation

//this is all bcrypt stuff
const bcrypt = require("bcrypt");
//how many times i want the password to be hashed
const saltRounds = 13;
//this is my array of users, it is currently stored in users.js for testing purposes
// const users = require("./users").users;

//handling json body requests
app.use(express.json());
app.use(cors());

app.use("/", express.static(__dirname + "/public"));

app.post("/register", async (req, resp) => {
  let data = fs.readFileSync("./usersText");
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

    fs.writeFile("usersText", JSON.stringify(users), (err) => {
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

app.post("/login", async (req, res) => {
  //to do - check against the file and not users array in users.js
  let loggedIn = false;
  let submittedPass;
  let savedPass;
  //get the email and password from req.body
  //find the match for the email
  await fs.readFile("usersText", async (err, data) => {
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
        const passwordDidMatch = await bcrypt.compare(submittedPass, savedPass);
        if (passwordDidMatch) {
          console.log("success!");

          res.status(200, () => {}).send({ data: { token: "login token" } });

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

//possibilities

// app.get("/", checkAuthenticated, (req, res) => {
//   res.send("hello");
// });

// function checkAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect("./public/login.html");
// }

app.listen(port, (err) => {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
