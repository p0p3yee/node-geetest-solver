const selectors = require("./selectors")
const fs = require("mz/fs");
const { exec } = require("mz/child_process");

const wait = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const SolveResult = {
    MAXIMUM_ATTEPMTS_EXCEEDED = 0,
    NO_GEETEST_FOUND = -1,
    GEETEST_SOLVED = 1,
    ERROR_SAVING_IMAGE = 2
}

class Solver{

    constructor(webDriver, maximumAttempts){
        this.driver = webDriver;
        this.maximumAttempts = maximumAttempts;
        this.eachOffset = 2;
        this.attemptWaitTime = 3;
        this.bgImagePath = "bg.png";
        this.fbgImagePath = "fbg.png";
    }

    solve(){
        return new Promise(async(resolve, reject) => {

            var solveTime = 0, oldOffset = 0;

            while (await this.haveGeetest()){

                if(solveTime > 0){
                    if(solveTime > this.maximumAttempts){
                        return resolve(SolveResult.MAXIMUM_ATTEPMTS_EXCEEDED)
                    }
                    oldOffset = oldOffset - (solveTime * this.eachOffset);
                }
                //==
                try{
                    //Get Geetest Canvas BG
                    var rawBase64 = await this.driver.executeScript(`return document.getElementsByClassName("geetest_canvas_bg geetest_absolute")[0].toDataURL("image/png");`)
                    var base64Out = rawBase64.replace(/^data:image\/png;base64,/, "");
                    await fs.writeFile(this.bgImagePath, base64Out, 'base64');
                    
                    //Get Geetest Canvas Full BG
                    rawBase64 = await this.driver.executeScript(`return document.getElementsByClassName("geetest_canvas_fullbg geetest_fade geetest_absolute")[0].toDataURL("image/png");`)
                    base64Out = rawBase64.replace(/^data:image\/png;base64,/, "");
                    await fs.writeFile(fbgImagePath, base64Out, 'base64');
                }catch(e){ 
                    return reject(e) 
                }
                //==
                var result;

                try{
                    result = await exec("python3 getTrack.py fbg.png bg.png");
                }catch(e){
                    try{
                        result = await exec("python getTrack.py fbg.png bg.png");
                    }catch(e){
                        return reject(e);
                    }
                }
                //==
                var offset;

                try{
                    result = JSON.parse(result[0].replace(/'/g, `\"`));
                    offset = result.offset;
                    if (solveTime > 0 && offset == oldOffset + (solveTime * this.eachOffset)){
                        offset = oldOffset;
                    }
                }catch(e){
                    return reject(e);
                }
                //==
                const slider = await this.driver.findElement(selectors.captchaSlider);

                await this.driver.actions({
                    async: false, 
                    bridge: true
                }).dragAndDrop(slider, {
                    x: offset,
                    y: 0
                }).perform();

                await wait(this.attemptWaitTime);

                solveTime ++;
                oldOffset = offset;
            }

            //
            try{
                await fs.unlink(this.fbgImagePath);
                await fs.unlink(this.bgImagePath);
            }catch(e){}

            return solveTime == 0 ? resolve(SolveResult.NO_GEETEST_FOUND) : resolve(SolveResult.GEETEST_SOLVED)
        })  
    }

    haveGeetest(){
        return new Promise(async resolve => {
            try{
                await this.driver.findElement(selectors.geetestDiv)
                return resolve(true);
            }catch(e){
                return resolve(false);
            }
        })
    }
}

module.exports = {
    Solver, SolveResult
}