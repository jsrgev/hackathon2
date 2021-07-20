document.querySelector("#loginForm button").addEventListener("click", login);

function login(event) {
  event.preventDefault();
  let em = document.querySelector("#loginForm .email").value;
  let pass = document.querySelector("#loginForm .pass").value;
  if (em.length === 0 || pass.length === 0) {
    alert("Please fill in both fields.");
    return; 
  }
  console.log("Sent a login request");
  //TODO: Add form validation
  let user = { email: em, password: pass };
  let endpoint = "login";
  sendData(user, endpoint, loginSuccess);
}

function sendData(user, endpoint, callback) {
  let url = `./${endpoint}`;
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
        console.log(content);
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

function loginSuccess(data) {
  //we have a token so put it in localstorage
  console.log("token", data.token);
  sessionStorage.setItem("myapp_token", data.token);
  console.log(sessionStorage);
  //opening the new page from here some how
  window.open("./index.html", "_self");
  alert("You are logged in");
}

function failure(err) {
  alert(err.message);
  console.warn(err.code, err.message);
}

// const key =
//   "trnsl.1.1.20210528T084434Z.4d3133de06fa8f3a.5cfcaf3ee6f0eab20cf8b03db9e9d3851bf5abdd";
// const url = `https://translate.yandex.net/api/v1.5/tr.json/getLangs?key=${key}&ui=en`;
// const getLanguageList = async (data = {}) => {
//   try {
//     const response = await fetch(url, {
//       mode: "no-cors",
//       headers: { "Content-Type": "application/json" },
//     });
//     let data = await response.json();
//     console.log(data);
//   } catch (error) {
//     console.log(error);
//   }
// };
// getLanguageList();

//THIS WORKS, RETURNS AN ARRAY OF LANGUAGE OPTIONS A HUGE OBJECT WITH LANGUAGE PROPERTIES AND LANGUAGE SPELLED OUT IN KEY VALUES
// const postData = async (link) => {
//   // Default options are marked with *
//   try {
//     const response = await fetch(link, {
//       method: "GET",
//     });
//     const data = await response.json(); // parses JSON response into native JavaScript objects
//     return data;
//   } catch (e) {
//     console.log(e);
//   }
// };

// postData(url);
