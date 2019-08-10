const {
    By
} = require("selenium-webdriver");


module.exports = {
    geetestDiv: By.xpath(`//div[@class="geetest_holder geetest_mobile geetest_ant geetest_embed"]`),
    captchaSlider: By.className("geetest_slider_button"),
}