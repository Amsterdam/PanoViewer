module.exports = {
  "extends": [
    "airbnb",
    "plugin:jsx-a11y/strict"
  ],
  "env": {
    "browser": true,
    "jest": true,
    "node": true
  },
  "plugins": [
    "jsx-a11y"
  ],
  "globals": {
    "jsdom": true, // Used in Jest unit test, made available by jest-environment-jsdom-global
  },
  "root": true,
  "rules": {
    "arrow-parens": ["error", "always"],
    "comma-dangle": ["error", "never"],
    "no-nested-ternary": "off",
    "no-underscore-dangle": ["error", {
      "allow": [
        "__BROWSER__",
        "__HOST__",
        "__REDUX_DEVTOOLS_EXTENSION_COMPOSE__",
        "_bijzondere_rechts_toestand",
        "_display",
        "_embedded",
        "_links",
        "_northEast",
        "_paq",
        "_southWest"
      ]
    }],
    "jsx-a11y/anchor-is-valid": [ "error", {
      "components": [ "a" ],
      "specialLink": [ "hrefLeft", "hrefRight" ],
      "aspects": [ "noHref", "invalidHref", "preferButton" ]
    }],
    "linebreak-style": "off"
  },
  "parserOptions": {
    "ecmaVersion": 2017,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  }
}



// {
// "env": {
//         "commonjs": true,
//         "es6": true,
//         "node": true
//     },
//     "parserOptions": {
//         "ecmaFeatures": {
//             "jsx": true
//         },
//         "sourceType": "module"
//     },
//     "rules": {
//         "no-const-assign": "warn",
//         "no-this-before-super": "warn",
//         "no-undef": "warn",
//         "no-unreachable": "warn",
//         "no-unused-vars": "warn",
//         "constructor-super": "warn",
//         "valid-typeof": "warn"
//     }
// }
