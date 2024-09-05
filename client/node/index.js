const mysql = require('mysql');
//const exec = require('child_process').exec;//シェルコマンドの実行
const util = require('util');//execをawaitさせる
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const { spawn } = require('child_process'); //20240625_baba

const serverAdress = 'localhost';


var clientData = {
  name : null,
  detail : null,
};

var dbparam = {
  host: '127.0.0.1',
  user: 'baba',
  password: '0507',
  database: 'dbclient',
}

var cors = {
  cors: true,
  origins: ["http://10.249.80.69", "http://localhost"],
  methods: [ "GET", "POST"]
}

const { AsyncQueue, Worker, Latch} = require('./original_modules/asyc-queue.js');
var task = new AsyncQueue();
var w = new Worker(task);


var srv = require('socket.io')(8002, cors);
var io = require('socket.io-client');
var con = mysql.createConnection(dbparam);

//var client = io.connect('http://localhost:8010');
var serverURL = 'http://' + serverAdress + ':8010';
var client = io.connect(serverURL);

var soushin = [];

const spaceArg = ' ';
const pythonArg = 'python3 ./script/'

//定常待ちについての情報 //上4つはmainから送られてくる
let tempErr = 0.25 //どれくらいの誤差を許容するか ℃
let maxNumber = 30 //何回取得したら定常とみなすのか
let interval = 10 //取得のインターバル second
let maxTime = 3600 //最大何秒定常待ちするか
let tempStep = 0.7 //一度この差だけ低い温度で温度到達を待つ　
let sstateProcedure = {}; //手順情報を一時保存しておく
let startTimeA = null; //温度昇温を初めた時間(achievement)
let startTimeS = null; //定常状態待ちを初めた時間(Steadystate)
let sstateProcedureOrder = null;
let sstateDeviceId = 0;

let emargencyStopScript = [];
let monitorScript = [];
let monitorTempScript = [];
let monitorConcScript = []; //2024_baba_added
let monitorInterval = 5;//status監視の時間間隔[s]
let isExit = false;
let isWaitTempSteadystate = false;
let isOffTemp = false;
let tempSetting = null;


function createKetaochi(x,beki){
  let y = Math.floor(x * (10 ** beki))/(10 ** beki)
  return y
}

//直接やり取り(使ってない/過去の遺物)
srv.on('connection', function(socket){

  console.log(" got connection");

  /*テスト用のデバイスリスト
  con.query("select * from devices", (err, res, fields) => {
    console.log(res);
    socket.emit("deviceList", res);
  });
  */

  con.query("select * from param", (err, res, fields) => {
    console.log(res);
    socket.emit("paramList", res); 
  });


  socket.on('mycommand', function () {
    console.log(" get command");
    socket.emit('mycommandres' , { text: "yes"});
  });

  socket.on('destroyParam', function (p) {
    console.log(" get destroyParam");
    console.log(p);

    con.query("delete from param where param = ? ", [p], (err, res, fields) => {

      con.query("select * from param ", [p], (err, res, fields) => {
        socket.emit("paramList", res);
      });
    });
  });

  socket.on('createParam', function (p) {
    con.query("insert into param (param, value) values (?, ?)", [p.param, p.text], (err, res, fields) => {
      con.query("select * from param ", [p], (err, res, fields) => {
        socket.emit("paramList", res);
      });
    });
  });

  socket.on('measure', function (p) {
    console.log(p);
    exec("python3 a.py", (err, stdout, stderr)=>{
      console.log(stdout);
    });
  });
/*
    con.query("insert into param (param, value) values (?, ?)", [p.param, p.text], (err, res, fields) => {
*/

});

//サーバーとの通信
client.on('connect', ()=>{
   console.log("connected to server");

   con.query("select * from raspberrypi_informations ORDER BY id DESC",(err,res,fields) => {
     if(err){
      clientData.name = 'NoName';
      clientData.detail = null;
      return
     };
     if(res.length == 0){
      clientData.name = 'NoName';
      clientData.detail = null;
      return 
     }
     clientData.name = res[0].name;
     clientData.detail = res[0].detail;
   });

      ///Device取得　コマンドラインヘルプつなげる
      //0927 vueでsplitするのではなくこっちでスプリットしたやつを渡す
      con.query("select * from devices order by device asc", (err, res, fields) => {
        soushin = res;
        
        async function main(){
        for (let sss of soushin){
          if(sss.Script !== 'NoScript'){
            let resExec = await exec(pythonArg + sss.script + " " + "-h")
            sss.HelpUsage = resExec.stdout.split("options:")[0].match(/(?<=\[).*?(?=\])/g);
            sss.HelpArgument = resExec.stdout.split("options:")[1].match(/(?<= {2}.* {2,})\S.*?(?=\n)/g);
            sss.HelpUsage = sss.HelpUsage.splice(1);
            sss.HelpArgument = sss.HelpArgument.splice(1);
          }else{
            sss.HelpUsage = null;
            sss.HelpArgument = null;
          };
          
        };
      };  
      
      main().then(() => {
        client.emit("deviceList", {clientData: clientData, deviceList : soushin});
        //console.log({clientData: clientdata, deviceList : soushin});
        //console.log(soushin);
      });
    });

});

function experimentDoingExec(a) {
  console.log(a);
  task.enqueue(function(next){
    if (a.procedure.usedDetail == null) {
      if (a.procedure.argument == "--sample") {
        exec(pythonArg + a.usedDevice.script + " " + a.procedure.argument + " " + a.samplingTime, (err,stdout,stderr) => {
            client.emit('experimentRes',{res:stdout,procedure:a.procedure});
            setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
        });
      } else if (a.procedure.argument == "--baba") { //baba_modified_20240829
            let dataReceived = false;
            const pythonPath = 'python3';
            const scriptPath = './script/' + a.usedDevice.script;
            const pythonProcess = spawn(pythonPath, [scriptPath, a.procedure.argument]);

            pythonProcess.stdout.on('data', (data) => {
              if (!dataReceived) {
                client.emit('experimentRes', { res: data.toString(), procedure: a.procedure });
                setTimeout(() => {next()}, 100);
                dataReceived = true;
              } else {
                a.procedure.result = data.toString();
                client.emit('experimentResUpdate', { procedure: a.procedure });
                //console.log(a.procedure);
                console.log(data.toString());
              }
            });

            pythonProcess.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
              client.emit('experimentRes', { res: 'not connected', procedure: a.procedure });
            });

            pythonProcess.on('close', (code) => {
              console.log(`finished with code ${code}`);
            });
      //above all
      }	else {
        
        exec(pythonArg + a.usedDevice.script + " "+a.procedure.argument,(err,stdout,stderr)=>{
        if(stdout){
	  //console.log(stdout);
          client.emit('experimentRes',{res:stdout,procedure:a.procedure});
          }else{
            client.emit('experimentRes',{res:'not connected',procedure:a.procedure});
          }
          setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
        });
      }
    } else {
        if (a.procedure.argument == "--setrun") {
          tempSetting = Number(a.usedDevice.tempSetting);
          isWaitTempSteadystate = false;
          exec(pythonArg + a.usedDevice.script + " "+a.procedure.argument+' '+a.lowTemp,(err,stdout,stderr)=>{
            if(stdout){
              client.emit('experimentRes',{res:stdout,procedure:a.procedure});
              }else{
                client.emit('experimentRes',{res:'not connected',procedure:a.procedure});
              }
              setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
          }); 
        } else if (a.procedure.argument == "--setandsstate") { // 20240625_baba
            const pythonPath = 'python3';
            const scriptPath = './script/' + a.usedDevice.script;
            const pythonProcess = spawn(pythonPath, [scriptPath, a.procedure.argument, a.procedure.usedDetail]);

            pythonProcess.stdout.on('data', (data) => {
              client.emit('experimentRes', { res: 'temp set success', procedure: a.procedure });
            });

            pythonProcess.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
              client.emit('experimentRes', { res: 'not connected', procedure: a.procedure });
            });

            pythonProcess.on('close', (code) => {
              console.log(`finished with code ${code}`);
            });

            //pythonProcess.on('error', (err) => {
              //console.error(`failed to start subprocess: ${err.message}`);
              //console.error(`path: ${err.path}`);
              //console.error(`spawn args: ${err.spawnargs}`);
            //});

            setTimeout(() => {
              next();
            }, 100); //above all
        } else if (a.procedure.argument == "--runPI") { //baba_added_20240827
            let dataReceived = false
            const pythonPath = 'python3';
            const scriptPath = './script/' + a.usedDevice.script;
            const Details = a.procedure.usedDetail.split(' '); // baba_modified_20240828
            //console.log(Details);
            const pythonProcess = spawn(pythonPath, [scriptPath, a.procedure.argument, ...Details]); // baba_modified_20240828
            
            pythonProcess.stdout.on('data', (data) => {
              if (!dataReceived) {
                client.emit('experimentRes', { res: data.toString(), procedure: a.procedure });
                setTimeout(() => {next()}, 100);
                dataReceived = true;
              } else {
                a.procedure.result = data.toString();
                client.emit('experimentResUpdate', { procedure: a.procedure });
                //console.log(a.procedure);
                console.log(data.toString());
              }
            });

            pythonProcess.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
              client.emit('experimentRes', { res: 'not connected', procedure: a.procedure });
            });
            /*
            pythonProcess.on('close', (code) => {
              console.log(`finished with code ${code}`);
            }); //above all
            */
        } else {
        console.log(a.procedure.argument)
        exec(pythonArg + a.usedDevice.script + " "+a.procedure.argument+' '+a.procedure.usedDetail,(err,stdout,stderr)=>{
            if(stdout){
              client.emit('experimentRes',{res:stdout,procedure:a.procedure});
              }else{
                client.emit('experimentRes',{res:'not connected',procedure:a.procedure});
              }
            setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
         }); 
        }
    }
  })
}
//実験実行時の送信先
client.on('experimentDoing',(a) =>{//送られてくるデータの形式 : a{procedure,usedDevice, lowTemp,samplingTime}
  experimentDoingExec(a);
});

function waitTempAchievement(targetT, script, nowT = 20, lowTemp){ //温度の初期値は20度にしておく
  var nowTime = new Date();
  var timeDiff = nowTime - startTimeA;
  timeDiff = Math.round(timeDiff);
  console.log("現在の温度  " + nowT + "  lowTemp "+ lowTemp)

  if(isExit == false){
    if((lowTemp-0.05) <= nowT || timeDiff> 1000 * 4 * maxTime){
      startTimeS = new Date();
      waitTempFor(targetT, script);
    }else{
      task.enqueue(function(next){
        exec(pythonArg + script + " --get ",(e,r,f)=>{
          //例外処理もないと詰む errorを吐き出すだけではなくて、それをmainに知らせる処理など
          if(e){
              console.log("error, waitTempAchievement");
              console.log(e);
          };
          //温度を抽出
          let t = Number(r.match(/\d+(?:\.\d+)?/))
          client.emit('sstateNow',{temp:t, timeDiff:Math.round(timeDiff/1000), procedureOrder:sstateProcedureOrder});
          setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
          setTimeout(function(){waitTempAchievement(targetT,script,t, lowTemp)},1000 * interval);
        }); 
      });
    }
  }else{

  }
};

function waitTempFor(targetT, script) {
  var nowTime = new Date();
  var timeDiff = nowTime - startTimeS
  var timeDiffOld = Math.round((nowTime - startTimeA)/1000)
  task.enqueue(function(next){
    if (timeDiff < 1000 * 60 * 1) {
      exec(pythonArg + script + " --get ",(e,r,f)=>{
      if(e){
        console.log("error, waitTempFor1");
        console.log(e);
      };
      //温度を抽出
      let t = Number(r.match(/\d+(?:\.\d+)?/))
      console.log("現在の温度2  " + t)
      client.emit('sstateNow',{temp:t, timeDiff:timeDiffOld, procedureOrder:sstateProcedureOrder});
      if(isExit == false){
        setTimeout(function(){waitTempFor(targetT,script)},1000 * interval);
      }else{
        
      }
      setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
      });
  } else {
    exec(pythonArg + script + " --set " + targetT, (e, r, f) => {
      if (e) {
        console.log("error, waitTempFor2");
        console.log(e);
      }
      isWaitTempSteadystate = true;
      setTimeout(() => {next(); waitTempSteadystate(targetT, script, 0)}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
      });
  } 
  });
}

function waitTempSteadystate(targetT, script, count = 0){
  var nowTime = new Date();
  var timeDiff = nowTime - startTimeS
  var timeDiffOld = Math.round((nowTime - startTimeA)/1000)
  timeDiff = Math.round(timeDiff);
  if(count >= maxNumber || timeDiff > 1000 * maxTime){
      //emitする 時間経過が超過した場合も
    client.emit('finishSteadyState', { res: 'success', procedure: sstateProcedure, timeElapsed: timeDiffOld });
      startTimeA = null;
      startTimeS = null;
      sstateProcedure = {};
      return
  };
  task.enqueue(function(next){
    exec(pythonArg + script + " --get ",(e,r,f)=>{
      //例外処理もないと詰む
      if(e){
        console.log("error, waitTempSteadyState");
        console.log(e);
      };
  
      //温度を抽出
      let t = Number(r.match(/\d+(?:\.\d+)?/));
      console.log(count + " " + t + " ℃ " + timeDiffOld);
      
      client.emit('sstateNow', { temp: t, timeDiff: timeDiffOld, procedureOrder: sstateProcedureOrder });
      if(isExit == false){
        if(Math.abs(t - targetT) > tempErr){//誤差がでかいとき
          setTimeout(function(){waitTempSteadystate(targetT,script,0)},1000 * interval);
        }else{//誤差が許容内
          setTimeout(function(){waitTempSteadystate(targetT,script,(count + 1))},1000 * interval);
        }
      }else{
        
      };

      setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
    });
  });
};

client.on('judgeSteadyState',(a) =>{//a = {procedure:experimentRecipe[procedureNumber], usedDevice:usedDevice, time:timeInfo}
  sstateProcedureOrder = a.procedure.procedureOrder; //一時保管 !!!同じラズパイで恒温槽を複数つなげたら不具合が生じることに注意
  sstateProcedure = a.procedure;
  sstateDeviceId = a.usedDevice.resultId;

  isExit = false;
  isWaitTempSteadystate = false;
  
  tempErr = Number(a.time.tempErr); 
  maxNumber = Number(a.time.maxNumber);
  interval = Number(a.time.interval);
  maxTime = Number(a.time.maxTime);
  tempStep = Number(a.time.tempStep) + 0.2;//0.2℃差が開いた温度で到達を待つ
  console.log("onJudge");
  console.log("maxTime = " + maxTime);
  console.log("T = " + a.usedDevice.tempSetting)
  task.enqueue(function(next){
    exec(pythonArg + a.usedDevice.script + " --get ",(err,res,fie)=>{
      let t = Number(res.match(/\d+(?:\.\d+)?/));
      var lowTemp = Number(a.usedDevice.tempSetting) - tempStep;
      console.log(lowTemp)
      startTimeA = new Date();
      waitTempAchievement(a.usedDevice.tempSetting, a.usedDevice.script, t,lowTemp);
      setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
    });
  });
});

client.on('emargencyStopReset', () => {
  emargencyStopScript = [];
});

client.on('monitorReset', () => {
  monitorScript = [];
  monitorTempScript = [];
  monitorConcScript = []; //2024_baba_added
});

client.on('getEmargencyStopScript', (command) => {
  emargencyStopScript.push(command);
});

client.on('getMonitorScript', (command) => {
  monitorScript.push(command);
  console.log(monitorScript);
});

client.on("getMonitorTempScript",(command)=>{
  monitorTempScript.push(command);
  console.log(monitorTempScript);
});

client.on("getMonitorConcScript",(command)=>{
  monitorConcScript.push(command);
  console.log(monitorConcScript);
});

function emargencyStop() {
  isExit = true;
  emargencyStopScript.forEach(function (command) {
    task.enqueue(function(next){
      exec(pythonArg + command, (e, r, f) => {
        if (e) {
          console.log(e);
        }
        setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
      });
    })
  })
};

client.on('emargencyStop', () => {
  emargencyStop();
});

function monitorStatus(){
    monitorScript.forEach(function(command){
      task.enqueue(function(next){
        exec(pythonArg + command, (e, r, f) => {
          if (e) {
            console.log(e);
          }else{
            if(r.indexOf('ERROR') != -1){
              console.log(r);
              clearInterval(setMonitorInterval);
              client.emit("clientExitProcess")//他のclientのoffコマンドを実行する
              emargencyStop();
            }else{
              console.log(command + " OK");
            }
          }
          setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
        });
      });
    })
}

let setMonitorInterval;
client.on('startMonitorStatus',(time)=>{
  setMonitorInterval = setInterval(monitorStatus,time * 1000);
});

function monitorTemp(){
  monitorTempScript.forEach(function(elem){
    task.enqueue(function(next){
      exec(pythonArg + elem.scriptString, (e,r,f)=>{//温度をゲットする
        if(e){
          console.log(e);
        }else{
          let t = Number(r.match(/\d+(?:\.\d+)?/));
          console.log(t)
          console.log(elem)
          if(elem.deviceId == sstateDeviceId && isWaitTempSteadystate){//恒温槽で定常待ちするデバイスの場合
            tempTurnJudge(t,elem);
          }
          client.emit("tempTimeLog",t,elem.deviceId);
          }
          setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
      });
    })
  })
};

function tempTurnJudge(t,elem){//温度が所定より上昇傾向にある場合、切る
  if(t >= createKetaochi((tempSetting + tempErr),1)){
    task.enqueue(function(next){
      exec(pythonArg + elem.scriptOffString, (e,r,f)=>{
        if(e){
          console.log(e);
        }else{
          isOffTemp = true;
          setTimeout(()=>{next()},100);
        }
      })
    })
  }

  if(isOffTemp && t <= tempSetting){
    console.log("つけ直す")
    task.enqueue(function(next){
      exec(pythonArg + elem.scriptOnString, (e,r,f)=>{
        if(e){
          console.log(e);
        }else{
          isOffTemp = false;
          setTimeout(()=>{next(),100});
        }
      })
    })
  }
}

let setMonitorTempInterval;
client.on('startMonitorTemp',(time)=>{
  setMonitorTempInterval = setInterval(monitorTemp,time * 1000);
});

// 20240323_baba_added
function monitorConc(){
  monitorConcScript.forEach(function(elem){
    task.enqueue(function(next){
      exec(pythonArg + elem.scriptString, (e,r,f)=>{//温度をゲットする
        if(e){
          console.log(e);
        }else{
          let C = Number(r.match(/\d+(?:\.\d+)?/));
          console.log(C)
          console.log(elem)
          client.emit("concTimeLog",C,elem.deviceId);
          }
          setTimeout(() => {next()}, 100);//100 ms後に次にtask実行。これによりシリアル通信のコマンドバッティングを防ぐ
      });
    })
  })
};

client.on('startMonitorConc',(time)=>{
  setMonitorTempInterval = setInterval(monitorConc,time * 1000);
});

client.on('clearMonitorStatus',()=>{
  clearInterval(setMonitorInterval);
  clearInterval(setMonitorTempInterval);
  sstateDeviceId = 0;
  isWaitTempSteadystate = false;
  tempSetting = null;
  isOffTemp = false
});

client.on('clientAction', (a) => {
  exec(pythonArg + a.script + " " +  a.HelpUsage, (err, stdout, stderr) => {
    if (stdout) {
    client.emit('clientActionResult',stdout,a);
    // 20240313_baba_added
    srv.emit('clientActionResult', stdout, a);
    // above_all
    } else {
      console.log(err);
      client.emit('clientActionResult', 'error', a);
    }
  });
});

//異常終了時の処理
process.on("exit", (a) => {
  emargencyStop();
  client.emit("clientExitProcess")//他のclientのoffコマンドを実行する
});
