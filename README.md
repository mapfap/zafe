# zafe
![npm package](https://img.shields.io/badge/npm%20package-v1.1.1-brightgreen.svg)
![build succeeded](https://img.shields.io/badge/build-succeeded-brightgreen.svg)
![Test passing](https://img.shields.io/badge/Tests-passing-brightgreen.svg)

A helper library to safely operate Selenium automation 

## How to install
```sh
yarn add zafe
```

## How to use
```js
import { Builder } from "selenium-webdriver";

const driver = await new Builder()
    .forBrowser("chrome")
    .build();

const zafe = new Zafe(driver);

await driver.get(`https://www.example.com`);
await zafe.type(By.xpath(`//input[@name="id"]`), `user001`);
await zafe.click(By.xpath(`//*[contains(text(), "Login")]`));
```

### Initiate Zafe with options
```js
const options = {
    shouldLogTraces: true,
    shouldCaptureOnSuccess: false,
    screenCaptureFolder: "./output/screenshots",
    shouldLogTraces: true
}
const zafe = new Zafe(driver, options);
````