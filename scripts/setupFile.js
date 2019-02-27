import jsdom from 'jsdom';
const {JSDOM} = jsdom;
const documentHTML = '<!doctype html><html><body><div id="panoId"></div></body></html>';
const {document} = (new JSDOM(documentHTML)).window;
global.document = document;
global.window = document.parentWindow;
