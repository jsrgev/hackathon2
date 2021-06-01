//Gavin code for front end authorization starts here, checking for JWT
window.addEventListener("load", (event) => {
  if (sessionStorage.getItem("myapp_token") === null) {
    // alert(`it appears you're not logged in, routing you to login`);
    window.open("./login.html", "_self");
    console.log(`there ain't no token here`);
  }
  if (sessionStorage.getItem("myapp_token") !== null) {
    // alert(`welcome to the app!`);
    // console.log(`i found a token!`);
  }
});


let thisUser = sessionStorage.myapp_token;
localStorage.setItem("userID", thisUser);

let myLanguages = document.getElementById("myLanguages");
let newLanguages = document.getElementById("newLanguages");
let navAddVocab = document.getElementById("navAddVocab");
let navQuiz = document.getElementById("navQuiz");
let navMyVocab = document.getElementById("navMyVocab");
let root = document.getElementById("root");
let activeSection;

let topSec;
let cards;
let actions;
let answerInput;
let newVocabInputs;
let addWords;

let languages = [];
let userWordsArray;

let sessionWords;
let correctCards = 0;
let currentCard = {
  word_id: null
};
let inputCount = 0;
let quizCounter = 0;
let quizLength;

let userLanguagesIds;
let otherLanguagesIds;
let allLanguagesIds;
let currentLanguage;

// if currentLanguage is written RTL, this will be set to rtl and inserted as class, for proper text alignment
let rtl = "";
let rtlLanguages = ["ar", "fa", "he", "ur", "yi"];


const urlBase = "https://translate.yandex.net/api/v1.5/tr.json";
const key =
  "trnsl.1.1.20210528T084434Z.4d3133de06fa8f3a.5cfcaf3ee6f0eab20cf8b03db9e9d3851bf5abdd";


const getThisUserWords = () => {
  return userWords.filter(a => a.user_id == thisUser && a.language_id == currentLanguage);
};

const wordsInCurrentLanguage = () => {
  return userWords.filter(a => a.user_id == thisUser && a.language_id == currentLanguage);
}

const myVocabScreen = () => {
  // console.log(document.getElementById("answerInput"));

  activeSection = "myVocab";
  if (!navMyVocab.classList.contains("active")) {
    navMyVocab.classList.toggle("active");
  }
  navAddVocab.classList.remove("active");
  navQuiz.classList.remove("active");
  if (!currentLanguage) {
    root.innerHTML = "<div><p>Please select a language to start.</p></div>";
    return;
  }
  if (wordsInCurrentLanguage() == "") {
    root.innerHTML = "<div><p>You haven't yet added any words for this language. Add some to start!</p></div>";
    return;
  }
  root.innerHTML = "";
  let myVocab = document.createElement("div");
  myVocab.id = "myVocab";
  myVocab.insertAdjacentHTML("beforeend", `<h3>English</h3><h3>${getLanguageName(currentLanguage)}</h3>`);
  let thisUserWords = getThisUserWords();
  for (let item of thisUserWords) {
    let wordItem = languageWords.filter(a => a.word_id === item.word_id);
    let content = `<div class="sourceLanguage">${wordItem[0].translation}</div><div class="targetLanguage${rtl}">${wordItem[0].word}</div>`;
    myVocab.insertAdjacentHTML("beforeend", content);
  }
  root.appendChild(myVocab);
};


const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const setCurrentLanguage = (id) => {
  currentLanguage = id;
  if (rtlLanguages.includes(currentLanguage)) {
    rtl = " rtl";
  } else {
    rtl = "";
  }
};

const selectLanguage = (event) => {
  if (isNaN(event.target.value)) {
    setCurrentLanguage(event.target.value);
    // if user chooses language already learning, or new one
    root.classList.toggle("startScreen");
    if (event.target.id == "myLanguagesSelect") {
      document.getElementById("newLanguagesSelect").value = "0";
      quizScreen();
    } else {
      document.getElementById("myLanguagesSelect").value = "0";
      addVocabScreen();
    }
  }
};

const addVocabScreen = () => {
  activeSection = "addVocab";
  root.classList.toggle("addVocabScreen");
  if (!navAddVocab.classList.contains("active")) {
    navAddVocab.classList.toggle("active");
  }
  navMyVocab.classList.remove("active");
  navQuiz.classList.remove("active");
  currentEnteredWords = [];
  if (!currentLanguage) {
    root.innerHTML = "<div><p>Please select a language to start.</p></div>";
    return;
  }

  root.innerHTML = `
  <div id="topSec"><p>Enter up to ten new words or phrases you want to study:</p></div`;
  let div = document.createElement("div");
  div.id = "newVocabInputs";
  newVocabInputs = div;
  newVocabInputs.insertAdjacentHTML("beforeend", `<h3>English</h3><h3>${getLanguageName(currentLanguage)}</h3><div><h3>Remove</h3></div>`);
  appendInput();
  root.appendChild(newVocabInputs);
  root.insertAdjacentHTML("beforeend", `
    <div id="actions">
      <button id="addWords" disabled>Add words</button>
    </div>`);
  addWords = document.getElementById("addWords");
  addWords.addEventListener("click", addWordsToDBs);
};

const submitWord = (event) => {
  if (event.key === "Enter" && event.target.value !== "") {
    if (currentEnteredWords.find(a => a.translation === event.target.value)) {
      alert("You've already entered this word.");
      return;
    }
    let wordInLanguageWords = languageWords.find(a => a.translation === event.target.value && a.language_id === currentLanguage);
    let word_id = wordInLanguageWords ? wordInLanguageWords.word_id : "";
    // if(word_id) {
    //   console.log("yes")
    // }
    // if(!word_id) {
    //   console.log("no")
    // }
    if (word_id) {
      let userHasWord = userWords.some(a => a.word_id === wordInLanguageWords.word_id && a.user_id === thisUser);
      if (userHasWord) {
        alert("This item is already in your vocabulary.");
        return;
      }
    }
    inputCount++;
    addWords.disabled = false;
    changeInputToString(event.target, true);
    getTranslation(event.target.value, word_id);
  }
};

const appendInput = () => {
  let div = document.createElement("div");
  div.classList.add("sourceLanguage");
  let input = document.createElement("input");
  input.addEventListener("keyup", submitWord);
  input.setAttribute("maxlength", "100");
  div.appendChild(input);
  setTimeout(() => input.focus(), 5);
  newVocabInputs.appendChild(div);
};


const fetchTranslation = async(string) => {
  let url = `${urlBase}/translate?key=${key}&lang=en-${currentLanguage}&text=${string}`;
  // Default options are marked with *
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    const data = await response; // parses JSON response into native JavaScript objects
    let dataJson = await data.json();
    return dataJson.text;
  } catch (e) {
    console.log(e);
  }
};

const deleteRow = (event) => {
  let node = event.target.parentNode.previousElementSibling.previousElementSibling;
  let enteredWord = node.childNodes[0].textContent;
  let index = currentEnteredWords.findIndex(a => a.translation === enteredWord);
  currentEnteredWords.splice(index,1);
  event.target.parentNode.previousElementSibling.previousElementSibling.remove();
  event.target.parentNode.previousElementSibling.remove();
  event.target.parentNode.remove();
  inputCount--;
  if (inputCount === 9) {
    appendInput();
  }
};


const afterGetTranslation = (word) => {
  newVocabInputs.insertAdjacentHTML('beforeend', `
    <div class="targetLanguage${rtl}"><span>${word}</span></div>
    `);
  let div = document.createElement("div");
  div.classList.add("delete");
  div.innerHTML = `<button>Remove</button>`;
  div.addEventListener("click", deleteRow);
  newVocabInputs.appendChild(div);
  if (inputCount < 10) {
    appendInput();
  }
}

let currentEnteredWords = [];

const getTranslation = async(string,word_id) => {
  let obj = {
      word_id:"",
      word: "",
      translation: string,
      alreadyInLanguageWords: false
  }
  if (word_id) {
    console.log("true");
    obj.word = languageWords.find(a => a.translation == string).word;
    obj.word_id = word_id;
    obj.alreadyInLanguageWords = true
    currentEnteredWords.push(obj)
    afterGetTranslation(obj.word);
  } else {
    let response = await fetchTranslation(string);
    obj.word = response[0];
    currentEnteredWords.push(obj)
    afterGetTranslation(obj.word);
  }

  // currentEnteredWords.push(obj)
  // newVocabInputs.insertAdjacentHTML('beforeend', `
  //   <div class="targetLanguage${rtl}"><span>${obj.word}</span></div>
  //   `);
  // let div = document.createElement("div");
  // div.classList.add("delete");
  // div.innerHTML = `<button>Remove</button>`;
  // div.addEventListener("click", deleteRow);
  // newVocabInputs.appendChild(div);
  // if (inputCount < 10) {
  //   appendInput();
  // }
};

const quizScreen = () => {
  activeSection = "quiz";
  if (!root.classList.contains("cardScreen")) {
    root.classList.toggle("cardScreen");
  }
  if (!navQuiz.classList.contains("active")) {
    navQuiz.classList.toggle("active");
  }
  navMyVocab.classList.remove("active");
  navAddVocab.classList.remove("active");
  if (!currentLanguage) {
    root.innerHTML = "<div><p>Please select a language to start</p></div>";
    return;
  }
  let numOfWords = userWords.filter(a => a.user_id == thisUser && a.language_id == currentLanguage).length;
  if (numOfWords < 5) {

    let quantity = (numOfWords == 0) ? "some" : `${5-numOfWords} more`;
    root.innerHTML = `<div><p>You need at least 5 words for a quiz. Please add ${quantity} to start!</p></div>`;
    return;
  }
  quizCounter = 0;
  getSessionWords();
  root.innerHTML = `<div id="topSec"></div><div id="cards"></div><div id="actions"></div>`;
  topSec = document.getElementById("topSec");
  cards = document.getElementById("cards");
  actions = document.getElementById("actions");
  showNumbers();
  setCurrentCard();
};

const navTo = (section, func) => {
  if (activeSection !== section) {
    func();
  }
};

navAddVocab.addEventListener("click", () => {
  navTo("addVocab", addVocabScreen);
})

navQuiz.addEventListener("click", () => {
  navTo("quiz", quizScreen);
})

navMyVocab.addEventListener("click", () => {
  navTo("myVocab", myVocabScreen);
})


const showLanguageList = (div, ids) => {
  let select = document.createElement("select");
  let id = (div.id == "myLanguages" ? "myLanguagesSelect" : "newLanguagesSelect");
  select.id = id;
  let subsetLanguages = languages.filter(a => ids.includes(a.language_id));
  let option = document.createElement("option");
  option.value = 0;
  option.textContent = "Select one";
  select.appendChild(option);
  for (let item of subsetLanguages) {
    let option = document.createElement("option");
    option.setAttribute("value", item.language_id);
    option.textContent = capitalize(item.language_name);
    select.appendChild(option);
  }
  select.addEventListener("change", selectLanguage);
  div.appendChild(select);
};




let getSessionWords = () => {
  let thisUserWords = getThisUserWords();
  quizLength = thisUserWords.length > 10 ? 40 : 15;
  let array = [];
  for (let word of thisUserWords) {
    let score = (word.times_right - word.times_wrong > -1) ? word.times_right - word.times_wrong : 0;
    let value = Math.ceil(20 / (score + 1));
    for (let i = 0; i < value; i++) {
      array.push(word);
    }
  }
  sessionWords = array;
};


const setCurrentCard = () => {
  let num;
  let word_id;
  do {
    num = generateRandom();
    word_id = sessionWords[num].word_id;
  } while (word_id == currentCard.word_id);

  let word = sessionWords[num];
  let matches = languageWords.filter(a => a.word_id === word.word_id);
  currentCard = matches[0];
  showCard();
};

const generateRandom = () => {
  return Math.floor(Math.random() * sessionWords.length);
};

const displayResult = (value) => {
  if (actions.classList.contains("oneColumn")) {
    actions.classList.toggle("oneColumn");
  }
  let message = value ? "Correct!" : "Wrong answer";
  actions.innerHTML = `<p>${message}</p>`;
  let button = document.createElement("button");
  if (quizLength - quizCounter == 0) {
    actions.classList.toggle("oneColumn");
    actions.insertAdjacentHTML("beforeend", `<p>You got ${correctCards} out of ${quizLength} correct.</p>`);
    let playAgainButton = document.createElement("button");
    playAgainButton.addEventListener("click", quizScreen);
    playAgainButton.textContent = "New quiz";
    actions.appendChild(playAgainButton);
  } else if (!value) {
    if (quizLength - quizCounter == 1) {
      button.textContent = "Try again";
      button.addEventListener("click", showCard);
    } else {
      button.textContent = "Next";
      button.addEventListener("click", setCurrentCard);
    }
    setTimeout(() => button.focus(), 5);
    actions.appendChild(button);
  } else {
    button.textContent = "Next";
    button.addEventListener("click", setCurrentCard);
    setTimeout(() => button.focus(), 5);
    actions.appendChild(button);
  }
};

const changeInputToString = (input, isCorrect) => {
  let parent = input.parentElement;
  input.remove();
  let a = isCorrect ? "correct" : "incorrect";
  parent.insertAdjacentHTML('beforeend', `<span class="${a}">${input.value}</span>`);
};

const checkAnswer = (string) => {
  quizCounter++;
  let finished = document.getElementById("finished");
  finished.textContent = quizCounter;
  let isCorrect;
  let index = userWords.findIndex(a => a.word_id == currentCard.word_id);
  if (string.toLowerCase() == currentCard.translation.toLowerCase()) {
    isCorrect = true;
    userWords[index].times_right++;
    correctCards++;
  } else {
    userWords[index].times_wrong++;
    isCorrect = false;
  }
  writeToFile("writeuserwords", userWords);
  displayResult(isCorrect);
  changeInputToString(answerInput, isCorrect);
};

const submitAnswer = (event) => {
  if (event.key === "Enter" && event.target.value !== "") {
    checkAnswer(event.target.value);
  }
};

const getLanguageName = (id) => {
  let index = languages.findIndex(a => a.language_id == id);
  let language = languages[index].language_name;
  return capitalize(language);
};

const appendSkipButton = () => {
  let button = document.createElement("button");
  button.textContent = "Skip";
  button.addEventListener("click", setCurrentCard);
  actions.appendChild(button);
};

const showNumbers = () => {
  let topSec = document.getElementById("topSec");
  let div = document.createElement("div");
  div.innerHTML = `<span id="finished">${quizCounter}</span> / <span id="total">${quizLength}</span>`;
  topSec.appendChild(div);
};

const showCard = () => {
  cards.innerHTML = "";
  let card = document.createElement("div");
  card.classList.add("card");
  let languageName = getLanguageName(currentCard.language_id);
  card.innerHTML = `
  <div class="targetLanguage"><span>${languageName}</span><span>${currentCard.word}</span></div>
  <div class="sourceLanguage"><span>English</span><input id="answerInput" type="text"></div>
  `;
  cards.appendChild(card);
  actions.innerHTML = "";
  if (sessionWords.length > 1) {
    if (!actions.classList.contains("oneColumn")) {
      actions.classList.toggle("oneColumn");
    }
    appendSkipButton();
  }
  answerInput = document.getElementById("answerInput");
  setTimeout(() => answerInput.focus(), 5);
  answerInput.addEventListener("keyup", submitAnswer);
};



const setLanguagesDB = (yandexLanguages) => {
  let languageArray = [];
  for (let lang in yandexLanguages) {
    let language = {
      language_id: lang,
      language_name: yandexLanguages[lang],
    };
    languageArray.push(language);
    // languages arrive sorted by id, not name, so we sort by name
    languageArray = languages.sort((a, b) => (a.language_name > b.language_name) ? 1 : -1);
  }
  localStorage.setItem("languages", JSON.stringify(languageArray));
  return languageArray;
};


const fetchLanguages = async() => {
  console.log("fetching languages");
  let url = `${urlBase}/getLangs?key=${key}&ui=en`;
  // Default options are marked with *
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    const data = await response; // parses JSON response into native JavaScript objects
    let dataJson = await data.json();
    return setLanguagesDB(dataJson.langs);
  } catch (e) {
    console.log(e);
  }
};


let languageWords = [];

const getLanguageWords = async() => {
  let response = await fetch("http://localhost:333/readlanguagewords");
  let data = await response.json();
  languageWords = data;
};

let userWords = [];

const getUserWords = async() => {
  let response = await fetch("http://localhost:333/readuserwords");
  let data = await response.json();
  userWords = data;
};




const getLanguages = (async() => {
  await getUserWords();
  await getLanguageWords();
  languages = localStorage.getItem("languages") ? await JSON.parse(localStorage.getItem("languages")) : await fetchLanguages();
  allLanguagesIds = languages.map(a => a.language_id);
  userWordsArray = userWords.map(a => a.language_id);
  userLanguagesIds = allLanguagesIds.filter(a => userWordsArray.includes(a));
  otherLanguagesIds = allLanguagesIds.filter(a => !userWordsArray.includes(a));
  showLanguageList(myLanguages, userLanguagesIds);
  showLanguageList(newLanguages, otherLanguagesIds);
})();

const cleanUpAfterAdd = () => {
  let removes = document.querySelectorAll(".delete");
  for (let node of removes) {
    node.innerHTML = "";
    node.removeEventListener("click", deleteRow)
  }
  let input = document.querySelector("input");
  if (input) {
    input.remove();
  }
}

const addToArrays = () => {
  let id = (languageWords == "") ? 0 : languageWords[languageWords.length - 1].word_id + 1;
  for (let item of currentEnteredWords) {
    let {language_id,word_id,word,translation,alreadyInLanguageWords} = item;
    let thisId = word_id ? word_id : id;
    if (!word_id) {
      id++;
    }
    if (!alreadyInLanguageWords) {
      languageWords.push(
        {
        word_id: thisId,
        language_id: currentLanguage,
        word,
        translation
        }
      );
    }
    userWords.push(
      {
        user_id: thisUser,
        language_id: currentLanguage,
        word_id: thisId,
        times_right: 0,
        times_wrong: 0
      }
    );
  }
  writeToFile("writeuserwords", userWords);
  writeToFile("writelanguagewords", languageWords);
  cleanUpAfterAdd();
};

// const addToUserWords = (lastId) => {
//   let sources = document.querySelectorAll("#newVocabInputs > .sourceLanguage > span");
//   for (let i = 0; i < sources.length; i++) {
//     userWords.push({
//       user_id: thisUser,
//       language_id: currentLanguage,
//       word_id: lastId + i + 1,
//       times_right: 0,
//       times_wrong: 0
//     });
//   }
//   writeToFile("writeuserwords", userWords);
// };

const addWordsToDBs = () => {
  addToArrays();
  // addToUserWords(lastId);
  inputCount = 0;
  actions = document.getElementById("actions");
  actions.innerHTML = "<p>Your words have been added.</p>";
  let button = document.createElement("button");
  button.textContent = "Add more words";
  button.addEventListener("click", addVocabScreen);
  actions.appendChild(button);
  document.getElementById("myLanguagesSelect").remove();
  document.getElementById("newLanguagesSelect").remove();
  userWordsArray = userWords.map(a => a.language_id);
  userLanguagesIds = allLanguagesIds.filter(a => userWordsArray.includes(a));
  otherLanguagesIds = allLanguagesIds.filter(a => !userWordsArray.includes(a));
  showLanguageList(myLanguages, userLanguagesIds);
  showLanguageList(newLanguages, otherLanguagesIds);
};

const writeToFile = (db, arr) => {
  // console.log(arr);
  try {
    fetch(`/${db}`, {
      headers: {
        "Content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.log(`error occured at write user words ${e}`);
  }
};


const writeUserWords = (arr) => {
  console.log(arr);
  try {
    fetch("/writeuserwords", {
      headers: {
        "Content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.log(`error occured at write user words ${e}`);
  }
};

const writeLanguageWords = (arr) => {
  console.log(arr);
  try {
    fetch("/writelanguagewords", {
      headers: {
        "Content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.log(`error occured at write user words ${e}`);
  }
};