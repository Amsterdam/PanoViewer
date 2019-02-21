// import {JSDOM} from 'jsdom';

// global.document = new JSDOM(documentHTML);
// global.window = document.parentWindow;

// console.log(documentHTML);


import jsdom from 'jsdom';
const {JSDOM} = jsdom;
const documentHTML = '<!doctype html><html><body><div id="panoId"></div></body></html>';
const {document} = (new JSDOM(documentHTML)).window;
global.document = document;
global.window = document.parentWindow;
