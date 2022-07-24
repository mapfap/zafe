import { until } from "selenium-webdriver"
import dayjs from "dayjs"
import fs from "fs"

const DriverAction = {
    click: 1,
    type: 2,
    scroll: 3,
    getValue: 4
}

export class Zafe {

    driver = null
    afterScrollPause = 250
    afterActionPause = 250
    waitForElement = 5000
    shouldCaptureOnSuccess = false
    shouldLogTraces = true

    constructor(driver, options = {}) {
        this.driver = driver;
        this.afterScrollPause = options.afterActionPause ?? this.afterScrollPause
        this.afterActionPause = options.afterActionPause ?? this.afterActionPause
        this.waitForElement = options.waitForElement ?? this.waitForElement
        this.shouldLogTraces = options.shouldLogTraces ?? this.shouldLogTraces
        this.shouldCaptureOnSuccess = options.shouldCaptureOnSuccess ?? this.shouldCaptureOnSuccess
    }

    // async find(element) {
    //     try {
    //         await this.driver.wait(until.elementLocated(element), this.waitForElement);
    //         this.logTraces(`[Found] ${element}`)
    //     } catch (err) {
    //         if (err.name === "TimeoutError") {
    //             this.logErrors(`[NotFound] ${element}`)
    //         }
    //         throw err
    //     }
    // }

    async retryStalable(element, driverAction, text) {
        const lastAttemptNo = 3
        let attemptNo = 1
        while (attemptNo <= lastAttemptNo) {
            try {
                const stalableElement = await this.driver.wait(until.elementLocated(element), this.waitForElement);
                switch (driverAction) {
                    case DriverAction.click:
                        stalableElement.click()
                        break;
                    case DriverAction.type:
                        await stalableElement.sendKeys(text)
                        break;
                    case DriverAction.scroll:
                        this.driver.executeScript("arguments[0].scrollIntoView()", stalableElement)
                        break;
                    case DriverAction.getValue:
                        return await stalableElement.getAttribute('value')
                    default:
                        throw new Error(`[Code] Unknown DriverAction ${driverAction}`)
                }
                return true
            } catch (err) {
                if (err.name === "StaleElementReferenceError") {
                    this.logErrors(`[Staled] ${element} on attempt#${attemptNo}`)
                    if (attemptNo >= lastAttemptNo) {
                        throw err
                    }
                    attemptNo += 1
                } else {
                    throw err
                }
            }
        }
    }

    async click(element) {
        try {
            this.logTraces(`[Preparing] ${element}`)
            await this.retryStalable(element, DriverAction.scroll)
            await this.driver.sleep(this.afterScrollPause)
            this.logTraces(`[ReadyToBeClicked] ${element}`)
            await this.retryStalable(element, DriverAction.click)
            this.logTraces(`[Clicked] ${element}`)
            await this.driver.sleep(this.afterActionPause)
            if (this.shouldCaptureOnSuccess) {
                await this.capture()
            }
        } catch (err) {
            if (err.name === "TimeoutError") {
                this.logErrors(`[NotFound] ${element}`)
                await this.capture()
            }
            throw err
        }
    }

    async type(element, text) {
        try {
            this.click(element)
            this.logTraces(`[ReadyToBeTyped] ${element}`)
            await this.retryStalable(element, DriverAction.type, text)
            await this.driver.sleep(this.afterActionPause)

            const typedText = await this.retryStalable(element, DriverAction.getValue)
            this.logTraces(`[Typed] ${element} with ${typedText}`)
            if (text != typedText) {
                throw new Error(`[WrongTyped] Expected ${text} but got ${typedText}`)
            }
            if (this.shouldCaptureOnSuccess) {
                await this.capture()
            }
        } catch (err) {
            if (err.name === "TimeoutError") {
                this.logErrors(`[NotFound] ${element}`)
                await this.capture()
            }
            throw err
        }
    }

    async capture() {
        const image = await this.driver.takeScreenshot()
        const fileName = dayjs().format('YYYYMMDD-HHmmss-SSS')
        const filePath = `./screenshots/${fileName}.png`
        await fs.writeFileSync(filePath, image, 'base64')
        this.logTraces(`[Captured] ${filePath}`)
    }

    logTraces(text) {
        if (this.shouldLogTraces) {
            console.log(text)
        }
    }

    logErrors(text) {
        console.log(text)
    }
}

