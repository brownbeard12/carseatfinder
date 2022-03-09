const fetch = require("node-fetch");

const url = "https://example.com";

const getData = async url => {
  try {
    const response = await fetch(url);
    const json = await response.text();
    console.log(json);
  } catch (error) {
    console.log(error);
  }
};

getData(url);