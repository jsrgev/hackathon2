document.querySelector("#regForm button").addEventListener("click", doReg);

function doReg(ev) {
  ev.preventDefault();
  let em = document.querySelector("#regForm .email").value;
  let pass = document.querySelector("#regForm .pass").value;
  let pass2 = document.querySelector("#regForm .pass2").value;
  if (em.length === 0) {
    alert("Please enter your email.");
    return; 
  }
  if (pass.length <6) {
    alert("Please enter a password with at least 6 characters.");
    return; 
  }
  if (pass !== pass2) {
    alert("The passwords do not match.");
    return;
  }
  console.log("Send a Register request");
  //TODO: Add form validation
  let user = { email: em, password: pass };
  let endpoint = "register";
  sendData(user, endpoint, registerSuccess);
}

function sendData(user, endpoint, callback) {
  let url = `http://localhost:3333/${endpoint}`;
  let h = new Headers();
  h.append("Content-Type", "application/json");
  let req = new Request(url, {
    method: "POST",
    headers: h,
    body: JSON.stringify(user),
  });
  fetch(req)
    .then((res) => res.json())
    .then((content) => {
      //we have a response
      if ("error" in content) {
        //bad attempt
        failure(content.error);
      }
      if ("data" in content) {
        //it worked
        callback(content.data);
      }
    })
    .catch(failure);
}

function registerSuccess(data) {
  //user has been registered
  console.log("new user created", data);
  alert("You have been registered");
  window.open("./login.html", "_self");
  // alert("You are logged in");
}
console.log(sessionStorage.getItem("myapp_token"));
console.log(sessionStorage);

function failure(err) {
  alert(err.message);
  console.warn(err.code, err.message);
}
