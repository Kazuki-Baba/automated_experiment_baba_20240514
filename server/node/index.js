const mysql = require("mysql");
console.log("Hello!! This is server.");
////////////////////////////////////////////////////////////////////////////

var dbsrv = {
  host: "127.0.0.1",
  user: "baba",
  password: "0507",
  database: "dbserver",
  timezone: "utc",
  dateStrings: "date",
};

var cors = {
  cors: true,
  origins: ["http://10.249.80.69", "http://localhost"],
  methods: ["GET", "POST"],
};

var srvUser = require("socket.io")(8000, cors); //htmlに表示させるほう
var client = require("socket.io")(8010, cors); //ラズパイからデータをもらうほう

let intervalTime = 5 * 60 * 1000; //定常判定のタイマーを何分おきに動かすか[ms]
let timeInfo = {
  tempErr: 0.45, //どれくらいの誤差を許容するか ℃
  maxNumber: 100, //何回取得したら定常とみなすのか
  interval: 3, //取得のインターバル second
  maxTime: 2400, //最大何秒定常待ちするか
  tempStep: 0.5, //一度この差だけ低い温度で温度到達を待つ
  monitorInterval: 5, //ステータス監視の間隔[s]
};

const noDeviceId = 6; //device_typesのなかの、noDeviceのidを指定(新規タイトル追加の際に
//noDeviceを自動的に追加する必要がある)

////////////////////////////////////////////////////////////////////////////

var con = mysql.createConnection(dbsrv);

var clientList = [];

//実験進行中用
var experimentRecipe = [];
var experimentDevice = {};
var experimentTitle = {};
var experimentCondition = [];
var experimentOutline = [];
var isExperimentQuit = false;
var isBreak = false;
var breakProcedure = {};
var waitingTimer;
var runInfo = {};
var keyToResultId = {};
var samplingTime = 0;
let timeLogs = {};

function createDate() {
  date = new Date();
  date =
    date.getFullYear() +
    "-" +
    ("00" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("00" + date.getDate()).slice(-2) +
    " " +
    ("00" + date.getHours()).slice(-2) +
    ":" +
    ("00" + date.getMinutes()).slice(-2) +
    ":" +
    ("00" + date.getSeconds()).slice(-2);

  return date;
}

const red = "\u001b[31m";
const reset = "\u001b[0m";

function sqlErrLog(title, err) {
  srvUser.emit("sqlErrLog", { title: title, err: err });
  console.log("\n" + red + title + reset);
  console.log(err);
}

function joinDetailQuery(detailNumber, value, unit) {
  let detailQuery = "";
  if (detailNumber == 0) {
    return detailQuery;
  }

  if (detailNumber == 1) {
    detailQuery = value;
  } else if (detailNumber == 2) {
    detailQuery = value + " " + unit;
  }
  detailQuery = detailQuery.toString();
  return detailQuery;
}

let procedureNumber = 0;

function emitNowTime(start, order, timeLimit, timeCount = 0) {
  if (isBreak) {
    return;
  }
  let nowTime = new Date();
  let timeDiff = Math.round((nowTime - start) / 1000);
  timeDiff = Math.round(timeDiff);
  if (timeCount < timeLimit) {
    srvUser.emit("sstateNow", {
      temp: null,
      timeDiff: timeDiff,
      procedureOrder: order,
    });
    setTimeout(function () {
      emitNowTime(start, order, timeLimit, timeDiff * 1000);
    }, 1000);
  }
}

let zz = 0;
function judgeSteadyState(procNumber, z) {
  //zは重複数
  console.log("judgeSteadyState");
  zz = z; //恒温槽のカウントを保管
  for (let i = 0; i <= z; i++) {
    let procedure = experimentRecipe[procNumber];
    let usedDevice = experimentDevice[procedure.device_id];
    client.to(usedDevice.ClientNumber).emit("judgeSteadyState", {
      procedure: procedure,
      usedDevice: usedDevice,
      time: timeInfo,
    });
  }
}

let zzz = 0;
let tempControllerRes = {};
function judgeFinishSteadyState(clientRes) {
  //{res:'success',procedure:sstateProcedure, timeElapsed:timeDiff}
  con.query(
    "INSERT INTO result_procedure_blocks (result_procedure_id, result_block_order, result_device_id, action_name, action_argument, detail, created_at) VALUES (?)",
    [[
        clientRes.procedure.resultProcedureId,
        clientRes.procedure.experiment_block_order,
        experimentDevice[clientRes.procedure.device_id].resultId,
        clientRes.procedure.action,
        clientRes.procedure.argument,
        clientRes.timeElapsed,
        createDate(),
      ]],(e, r, f) => {
      if (e) {
        console.log(e);
      }
      experimentRecipe[procedureNumber - 1].isDone = true;
      experimentRecipe[procedureNumber - 1].result = clientRes.res.split("\n");
      experimentRecipe[procedureNumber - 1].usedDetail = clientRes.timeElapsed;
      srvUser.emit("experimentRecipe", experimentRecipe);

      if (Object.keys(tempControllerRes).length) {//恒温槽が2個連続で定常待ちしていた場合
        if (clientRes.procedure.procedureOrder > tempControllerRes.procedure.procedureOrder) {
          tempControllerRes = clientRes;
        }
      } else {
        tempControllerRes = clientRes;
      }
    
      if (zzz == zz) {
        zzz = 0;
        experimentDoing(tempControllerRes, true);
      } else {
        zzz++;
      }
    });
}

//実験進行中の共通のプログラム
function experimentDoing(clientRes, isAlreadyAdd = false) {
  //console.log("~~~~~~~~~~~");
  //console.log(clientRes);

  if (!isExperimentQuit) {
    //console.log(clientRes.res);

    procedureNumber = clientRes.procedure.procedureOrder;
    //終わった手順のisDoneフラグをtrueに&送信
    if (procedureNumber > 0 && !isAlreadyAdd) {
      //1個目は特殊なのでスルー
      experimentRecipe[procedureNumber - 1].isDone = true;
      experimentRecipe[procedureNumber - 1].result = clientRes.res;
      srvUser.emit("experimentRecipe", experimentRecipe);
      
      let expDate = createDate(); //20240319_baba
      
      con.query(
        "INSERT INTO result_procedure_blocks (result_procedure_id, result_block_order, result_device_id, action_name, action_argument, detail, created_at) VALUES (?)",
        [[
            clientRes.procedure.resultProcedureId,
            clientRes.procedure.experiment_block_order,
            experimentDevice[clientRes.procedure.device_id].resultId,
            clientRes.procedure.action,
            clientRes.procedure.argument,
            clientRes.procedure.usedDetail,
            expDate, //20240319_baba
          ],],
        (e, r, f) => {
          if (e) {
            console.log(e);
          }
        }
      );

      if( (clientRes.res.indexOf("ERROR") !== -1) || (clientRes.res.indexOf("not connected") !== -1) ){
       emitEmargencyStop(experimentDevice); 
      }
      
      // 20240319_baba
      if (clientRes.procedure.is_result_flag === 1) {
        con.query(
          "SELECT id FROM result_procedure_blocks WHERE created_at = ? AND action_argument = ?",
            [expDate, "--get"],
            (e, r, f) => {
              let runId = r[0].id;
              con.query(
                "INSERT INTO result_data (run_id, result_block_id, data, created_at) VALUES (?)",
                [[
                  runInfo.id,
                  runId,
                  clientRes.res,
                  expDate,
                
                ],],
                (er, re, fi) => {
                  if (e) {
                    console.log(e);
                  }
                }  
              );
            }  
        );
      }
      // above all
    }

    if (!isBreak) {
      if (procedureNumber < experimentRecipe.length) {
        let usedDevice =
          experimentDevice[experimentRecipe[procedureNumber].device_id];
        let nextProcedure = experimentRecipe[procedureNumber];
        switch (nextProcedure.argument) {
          case "wait":
            var time = 1000 * parseFloat(nextProcedure.usedDetail);
            waitingTimer = setTimeout(() => {
              experimentDoing({ res: "-", procedure: nextProcedure });
            }, time);

            var startTime = new Date();
            var procOrder = nextProcedure.procedureOrder;
            emitNowTime(startTime, procOrder, time);
            break;
          case "alert":
            srvUser.emit("alertWindow", nextProcedure.usedDetail);
            experimentDoing({ res: "-", procedure: nextProcedure });
            break;
          case "--judge": //定常判定
            let i = 0;
            let max_i = experimentRecipe.length - procedureNumber - 1;
            while (i < max_i) {
              //複数機で定常待ちが行われるか確認
              if (experimentRecipe[procedureNumber + i + 1].argument == "--judge") {
                i++;
              } else {
                break;
              }
            }
            judgeSteadyState(procedureNumber, i);
            break;
          case "--setrun":
            experimentDevice[nextProcedure.device_id].tempSetting =
              nextProcedure.usedDetail; //設定温度を保存
            //昇温にしか対応していないことに注意!!
            client.to(usedDevice.ClientNumber).emit("experimentDoing", {
              procedure: nextProcedure,
              usedDevice: experimentDevice[nextProcedure.device_id],
              lowTemp: nextProcedure.usedDetail - timeInfo.tempStep,
            });
            break;
          case "--ready":
            samplingTime = Number(nextProcedure.usedDetail); //サンプリング時間を保存
            client.to(usedDevice.ClientNumber).emit("experimentDoing", {
              procedure: nextProcedure,
              usedDevice: experimentDevice[nextProcedure.device_id],
            });
            break;
          case "--sample":
            client.to(usedDevice.ClientNumber).emit("experimentDoing", {
              procedure: nextProcedure,
              usedDevice: experimentDevice[nextProcedure.device_id],
              samplingTime: samplingTime,
            });
            var startTime = new Date();
            var procOrder = nextProcedure.procedureOrder;
            emitNowTime(startTime, procOrder, (samplingTime + 10) * 1000);
            break;
          default:
            client.to(usedDevice.ClientNumber).emit("experimentDoing", {
              procedure: nextProcedure,
              usedDevice: usedDevice,
            });
        }
      } else {
        //手順が全て終わり
        experimentTitle.isDone = true;
        console.log("done");
        srvUser.emit("experimentTitle", experimentTitle);
        emitEmargencyStop(experimentDevice, true); //一応停止を実行する。
        getRunAll();
      }
    }
    //中断されたときに備えて直近の手順(clientRes)を保存しておく
    breakProcedure = clientRes;
  } else {
  }
}

//ここからリザルトの情報を送信
function getRun() {
  con.query("SELECT * FROM runs ORDER BY created_at DESC", (e, r, f) => {
    srvUser.emit("resultList", r);
    if (e) {
      sqlErrLog("deviceTypeList", e);
    }
  });
}

function getResultProcedure() {
  con.query(
    "SELECT * FROM result_procedures ORDER BY result_procedure_order ASC",
    (e, r, f) => {
      srvUser.emit("resultProcedureList", r);
      if (e) {
        sqlErrLog("deviceTypeList", e);
      }
    }
  );
}

function getRunAll() {
  getRun();
  getResultProcedure();
}

//htmlに表示させる準備
srvUser.on("connection", (socket) => {
  function getOutline() {
    con.query(
      `SELECT id, experiment_title_id, experiment_procedure_order, experiment_procedure_title
    FROM experiment_procedures`,
      (err, res, fields) => {
        socket.emit("recipeProcedure", res);
        if (err) {
          sqlErrLog("getOutline", err);
        }
      }
    );
  }

  function getBlock() {
    con.query(
      `SELECT a.id, a.experiment_procedure_id, a.experiment_block_order, a.device_id, a.action_id, a.detail, a.condition_id,
    b.action, b.argument, b.is_result_flag, b.detail_number, c.device_name, c.device_type_id, d.device_type_name
    FROM experiment_procedure_blocks a
    INNER JOIN actions b ON a.action_id = b.id
    INNER JOIN devices c ON a.device_id = c.id
    INNER JOIN device_types d ON c.device_type_id = d.id;`,
      (err, res, fields) => {
        socket.emit("recipeBlock", res);
        if (err) {
          sqlErrLog("getBlock", err);
        }
      }
    );
  }

  function getDevice() {
    con.query(
      `SELECT a.id, a.experiment_title_id, a.device_name, a.device_type_id, b.device_type_name
    FROM devices a
    INNER JOIN device_types b ON a.device_type_id = b.id 
    ORDER BY a.device_name`,
      (e, r, f) => {
        socket.emit("recipeDevice", r);
        if (e) {
          sqlErrLog("getDevice", e);
        }
      }
    );
  }

  function getCondition() {
    con.query(
      "SELECT id, experiment_procedure_id, condition_title, value, device_link_id FROM experiment_conditions ORDER BY experiment_procedure_id",
      (err, res, fields) => {
        socket.emit("condition", res);
        if (err) {
          sqlErrLog("getCondtion", err);
        }
      }
    );
  }

  function getSetting() {
    con.query("SELECT * FROM settings ORDER BY id ASC LIMIT 6",(e,r,f)=>{
      if(e){
        sqlErrLog("getSetting",e);
      }else{
        timeInfo.tempErr = parseFloat(r[0].value);
        timeInfo.maxNumber = parseFloat(r[1].value);
        timeInfo.interval = parseFloat(r[2].value);
        timeInfo.maxTime = parseFloat(r[3].value);
        timeInfo.tempStep = parseFloat(r[4].value);
        timeInfo.monitorInterval = parseFloat(r[5].value);
      }
      con.query("SELECT * FROM settings  WHERE id > 6 ORDER BY id ASC LIMIT 6",(er,re,fi)=>{
        socket.emit("getSetting",r,re);//デフォルト値
      })
    });
  }

  //実験手順一覧を送信
  function getAllRecipeProcedure() {
    getOutline();
    getBlock();
  }

  console.log("connected from a user");

  socket.emit("deviceList", clientList);
  getAllRecipeProcedure();
  getDevice();
  getSetting();
  socket.emit("experimentTitle", experimentTitle);
  socket.emit("experimentRecipe", experimentRecipe);
  socket.emit("isBreakFlag", isBreak);
  socket.emit("runInfo", runInfo);

  //レシピタイトル
  function getTitle() {
    con.query(
      "SELECT * FROM experiment_titles ORDER BY experiment_title",
      (err, res, fields) => {
        socket.emit("recipeList", res);
        if (err) {
          sqlErrLog("title", err);
        }
      }
    );
  }

  getTitle();

  //Actionリスト
  /*
  con.query('SELECT * FROM actions ORDER BY action',(err,res,fields) =>{
    socket.emit('actionList',res);
  });
  */
  con.query(
    `SELECT a.id, a.device_type_id, a.action_id, b.action, b.detail_number 
  FROM device_type_action_links a
  INNER JOIN actions b ON a.action_id = b.id
  ORDER BY b.action`,
    (e, r, f) => {
      socket.emit("actionLinkList", r);
      if (e) {
        sqlErrLog("actionLinkList", e);
      }
    }
  );

  //conditions
  getCondition();

  con.query(
    "SELECT id, device_type_name FROM device_types ORDER BY device_type_name",
    (e, r, f) => {
      socket.emit("deviceTypeList", r);
      if (e) {
        sqlErrLog("deviceTypeList", e);
      }
    }
  );

  con.query(
    "SELECT id, device_link_id, value, unit FROM device_value_choices ORDER BY device_link_id, unit",
    (e, r, f) => {
      socket.emit("valueChoiceList", r);
      if (e) {
        sqlErrLog("valueChoiceList", e);
      }
    }
  );

  getRunAll();

  //新しいレシピタイトルの作成
  socket.on("createRecipe", function (p) {
    let query = [];
    query[3] = createDate();
    con.query(
      "INSERT INTO experiment_titles (experiment_title, created_at) VALUES (?)",
      [[p, query[3]]],
      (err, res, fields) => {
        con.query(
          "SELECT id FROM experiment_titles ORDER BY id DESC LIMIT 1",
          (e, r, f) => {
            query[0] = r[0].id;
            query[1] = "-";
            query[2] = noDeviceId; //!! DBに保存されているNodeviceのIDを選択する
            con.query(
              "INSERT INTO devices (experiment_title_id, device_name,device_type_id, created_at) VALUES (?)",
              [query],
              (er, re, fi) => {
                getDevice();
                con.query(
                  "SELECT * FROM experiment_titles",
                  (err, res, fields) => {
                    socket.emit("recipeList", res);
                    if (err) {
                      sqlErrLog("recipeList", err);
                    }
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  socket.on("submitOutline", function (outlineQuery) {
    outlineQuery[3] = createDate();
    con.query(
      "INSERT INTO experiment_procedures VALUES (default,?,?,?,?,default)",
      outlineQuery,
      (err, res, fields) => {
        getOutline();
      }
    );
  });

  //新しいblockの作成
  socket.on("submitBlock", function (device, action, detail) {
    //action.idは、device_type_action_linksのid
    /*
    console.log(device);
    console.log(action);
    console.log(detail);
    */
    const date = createDate();

    if (detail.conditionRadio == "newCondition") {
      detailQuery = joinDetailQuery(
        action.detail_number,
        detail.value,
        detail.unit
      );
    }

    //汚すぎ、isNewDevice, isNewConditionで分岐して、データ追加。
    //その後blocks更新。

    if (device.isNewDevice) {
      //新規デバイスの場合
      con.query(
        `INSERT INTO devices (experiment_title_id, device_name, device_type_id,created_at)
      VALUES (?,?,?,?)`,
        [device.experimentId, device.deviceName, device.device_type_id, date],
        (e, r, f) => {
          con.query(
            "SELECT id FROM devices ORDER BY id DESC LIMIT 1",
            (er, re, fi) => {
              let latestDeviceId = re[0].id;
              if (detail.conditionRadio == "newCondition") {
                if (detail.isNewCondition) {
                  //新規conditionを追加する場合
                  con.query(
                    `INSERT INTO experiment_conditions (experiment_procedure_id, condition_title, value, created_at, device_link_id)
              VALUES (?,?,?,?,?)`,
                    [
                      detail.procedureId,
                      detail.conditionTitle,
                      detailQuery,
                      date,
                      action.id,
                    ],
                    (err, res, fie) => {
                      con.query(
                        "SELECT id FROM experiment_conditions ORDER BY id DESC LIMIT 1",
                        (errr, ress, fiel) => {
                          let latestConditionId = ress[0].id;
                          con.query(
                            `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
                  device_id, action_id, condition_id, created_at) VALUES (?)`,
                            [
                              [
                                detail.procedureId,
                                detail.blockOrder,
                                latestDeviceId,
                                action.action_id,
                                latestConditionId,
                                date,
                              ],
                            ],
                            (errr, ress, fields) => {
                              getBlock();
                              getDevice();
                              getCondition();
                            }
                          );
                        }
                      );
                    }
                  );
                } else if (detailQuery.length > 0) {
                  //conditionではないが、detailはある
                  con.query(
                    `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
              device_id, action_id, detail, created_at) VALUES (?)`,
                    [
                      [
                        detail.procedureId,
                        detail.blockOrder,
                        latestDeviceId,
                        action.action_id,
                        detailQuery,
                        date,
                      ],
                    ],
                    (er, re, fi) => {
                      getBlock();
                      getDevice();
                    }
                  );
                } else {
                  //detailがない
                  con.query(
                    `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
              device_id, action_id, created_at) VALUES (?)`,
                    [
                      [
                        detail.procedureId,
                        detail.blockOrder,
                        latestDeviceId,
                        action.action_id,
                        date,
                      ],
                    ],
                    (er, re, fi) => {
                      getBlock();
                      getDevice();
                    }
                  );
                }
              } else if (detail.conditionRadio == "oldCondition") {
                //すでにあるconditionのなかから選ぶ
                con.query(
                  `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
              device_id, action_id, condition_id, created_at) VALUES (?)`,
                  [
                    [
                      detail.procedureId,
                      detail.blockOrder,
                      latestDeviceId,
                      action.action_id,
                      detail.fromCondition,
                      date,
                    ],
                  ],
                  (errr, ress, fields) => {
                    getBlock();
                    getDevice();
                    getCondition();
                  }
                );
              }
            }
          );
        }
      );
    } else {
      //新規デバイスがない
      if (detail.conditionRadio == "newCondition") {
        if (detail.isNewCondition) {
          //conditionを追加する場合
          con.query(
            `INSERT INTO experiment_conditions (experiment_procedure_id, condition_title, value, created_at, device_link_id)
          VALUES (?,?,?,?,?)`,
            [
              detail.procedureId,
              detail.conditionTitle,
              detailQuery,
              date,
              action.id,
            ],
            (err, res, fie) => {
              con.query(
                "SELECT id FROM experiment_conditions ORDER BY id DESC LIMIT 1",
                (errr, ress, fiel) => {
                  let latestConditionId = ress[0].id;
                  con.query(
                    `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
              device_id, action_id, condition_id, created_at) VALUES (?)`,
                    [
                      [
                        detail.procedureId,
                        detail.blockOrder,
                        device.id,
                        action.action_id,
                        latestConditionId,
                        date,
                      ],
                    ],
                    (errr, ress, fields) => {
                      getBlock();
                      getCondition();
                    }
                  );
                }
              );
            }
          );
        } else if (detailQuery.length > 0) {
          //conditionではないが、detailはある
          con.query(
            `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
          device_id, action_id, detail, created_at) VALUES (?)`,
            [
              [
                detail.procedureId,
                detail.blockOrder,
                device.id,
                action.action_id,
                detailQuery,
                date,
              ],
            ],
            (er, re, fi) => {
              getBlock();
            }
          );
        } else {
          //detailがない
          con.query(
            `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
          device_id, action_id, created_at) VALUES (?)`,
            [
              [
                detail.procedureId,
                detail.blockOrder,
                device.id,
                action.action_id,
                date,
              ],
            ],
            (er, re, fi) => {
              getBlock();
            }
          );
        }
      } else if (detail.conditionRadio == "oldCondition") {
        con.query(
          `INSERT INTO experiment_procedure_blocks (experiment_procedure_id, experiment_block_order,
          device_id, action_id, condition_id, created_at) VALUES (?)`,
          [
            [
              detail.procedureId,
              detail.blockOrder,
              device.id,
              action.action_id,
              detail.fromCondition,
              date,
            ],
          ],
          (errr, ress, fields) => {
            getBlock();
            getDevice();
            getCondition();
          }
        );
      }
    }
  });

  socket.on("reorderOutline", function (a) {
    let recipeString =
      "update experiment_procedures set\n experiment_procedure_order = case id";
    let recipeStringIn = "";

    for (let i = 0; i < a.length; i++) {
      let z = i + 1;
      recipeString += "\nwhen " + a[i].id + " then " + z;
      recipeStringIn += a[i].id + ",";
    }
    recipeStringIn = recipeStringIn.slice(0, -1);
    recipeString += "\nend";
    recipeString += "\nwhere id in(" + recipeStringIn + ");";
    //console.log(recipeString);

    con.query(recipeString, (err, res, fields) => {
      //更新したOutlineを送信
      getOutline();
    });
  });

  socket.on("reorderBlock", function (a) {
    let recipeString =
      "update experiment_procedure_blocks set\n experiment_block_order = case id";
    let recipeStringIn = "";

    for (let i = 0; i < a.length; i++) {
      let z = i + 1;
      recipeString += "\nwhen " + a[i].id + " then " + z;
      recipeStringIn += a[i].id + ",";
    }
    recipeStringIn = recipeStringIn.slice(0, -1);
    recipeString += "\nend";
    recipeString += "\nwhere id in(" + recipeStringIn + ");";
    //console.log(recipeString);

    con.query(recipeString, (err, res, fields) => {
      //更新したレシピリストを送信
      getBlock();
    });
  });

  socket.on("copyOutline", function(newArray){
    console.log(newArray);
    let date = createDate();
    let procedureId = 0;
    let originalCondition = [];

    var q = new Promise(function(resQ){//おまじない
      resQ();
    });

    for(let i=0; i < newArray.length;i++){
      // 変数は同じやつに代入する
      q = q.then(makePromiseFunc(i));
    }
    q.then(function(){
      getAllRecipeProcedure();
      getCondition();
    })

    function makePromiseFunc(idx){
      return function(){
        return new Promise(function(resQ,rejQ){

          let query = [];
          if(newArray[idx].isCopied){
            query[0] = newArray[idx].experiment_title_id;
            query[1] = newArray[idx].experiment_procedure_order;
            query[2] = newArray[idx].experiment_procedure_title;
            query[3] = date;
    
            let procedureOldId = newArray[idx].id;
    
            var p = new Promise(function(res){//おまじない
              res();
            });
    
            p = p.then(insertCopiedProcedure());
            p = p.then(insertCopiedCondition());
            p = p.then(insertCopiedBlock());
    
            p.then(function(){
              resQ();
            })
    
            function insertCopiedProcedure(){
              return function(){
                return new Promise(function(res,rej){
                  con.query("INSERT INTO experiment_procedures (experiment_title_id,experiment_procedure_order,experiment_procedure_title,created_at) VALUES (?)",
                  [query],(e,r,f)=>{
                    if(e){sqlErrLog("INSERT condition",e)}
          
                    procedureId = r.insertId;
                    res();
                  });
                })
              }
            };
    
            function insertCopiedCondition(){
              return function(){
                return new Promise(function(res,rej){
                  con.query("SELECT * FROM experiment_conditions WHERE experiment_procedure_id = ?",[procedureOldId],(e,r,f)=>{
                    if(e){sqlErrLog("SELECT condition",e)}
                    
                    originalCondition = r;
                    let conditionArray = r.map(function(elem){
                      let array = [];
                      array[0] = procedureId;
                      array[1] = elem.condition_title;
                      array[2] = elem.value;
                      array[3] = elem.device_link_id;
                      array[4] = date;
                      return array
                    });
                    
                    if(conditionArray.length > 0){
                      con.query("INSERT INTO experiment_conditions (experiment_procedure_id,condition_title,value,device_link_id,created_at) VALUES ?",
                      [conditionArray],(er,re,fi)=>{
                        if(er){sqlErrLog("INSERT condition",er)}
            
                        let newFirstId = re.insertId;
                        originalCondition.forEach(function(elem,index){
                          elem.newId = newFirstId + index;
                        })
                        res();
                      });
                    }else{
                      res();
                    }
    
                  });  
                })
              }
            };
    
            function insertCopiedBlock(){
              return function(){
                return new Promise(function(res,rej){
                  con.query("SELECT * FROM experiment_procedure_blocks WHERE experiment_procedure_id = ?",[procedureOldId],(e,r,f)=>{
                    if(e){sqlErrLog("SELECT block",e)}
                    
                    let blockArray = r.map(function(elem){
                      let array = [];
                      array[0] = procedureId;
                      array[1] = elem.experiment_block_order;
                      array[2] = elem.device_id;
                      array[3] = elem.action_id;
                      array[4] = elem.detail;
                      array[6] = date;
                      
                      if(elem.condition_id == null){
                        array[5] = null;
                      }else{
                        let newCondition = originalCondition.find((a)=> a.id === elem.condition_id);
                        array[5] = newCondition.newId;
                      }
    
                      return array
                    });

                    if(blockArray.length > 0){//blockArrayに何も入ってなかったらスキップ.あんまりないと思うけど
                      con.query(`INSERT INTO experiment_procedure_blocks (experiment_procedure_id,experiment_block_order,device_id,action_id,detail,
                        condition_id,created_at) VALUES ?`,[blockArray],(e,r,f)=>{
                          if(e){sqlErrLog("INSERT block",e)}
                          res();
                        });
                    }else{
                      res();
                    }
                    
                  })
                })
              }
            };
    
    
          }else{
            query[0] = newArray[idx].experiment_procedure_order;
            query[1] = date;
            query[2] = newArray[idx].id;
            con.query("UPDATE experiment_procedures set experiment_procedure_order = ?, updated_at = ? where id = ?",query,(e, r, f) => {
              resQ();
            });
          }
        })
      }
    }
  });

  socket.on("submitDuplicateCondition",function(a){
    //{condition:condition, outline:outline, originalOutline:originalOutline}
    let date = createDate();
    let procedureId = 0;
    let conditionInserted = [];

    let condition = a.condition;
    let outline = a.outline;
    let originalOutline = a.originalOutline;
    let conditionCount = 0;


    var q = new Promise(function(resQ){//おまじない
      resQ();
    });

    for(let i=0; i < outline.length;i++){
      // 変数は同じやつに代入する
      q = q.then(makePromiseFunc(i));
    }
    q.then(function(){//最後にダブってる手順(元の手順)を削除する
      trashOutline([a.originalOutline.id])
    })

    function makePromiseFunc(idx){
      return function(){
        return new Promise(function(resQ,rejQ){

          let query = [];
          if(outline[idx].isCopied){
            query[0] = outline[idx].experiment_title_id;
            query[1] = outline[idx].experiment_procedure_order;
            query[2] = outline[idx].experiment_procedure_title + " (" + (conditionCount + 1) + ")" ;
            query[3] = date;
    
            let procedureOldId = outline[idx].id;
    
            var p = new Promise(function(res){//おまじない
              res();
            });
    
            p = p.then(insertCopiedProcedure());
            p = p.then(insertDuplicatedCondition());
            p = p.then(insertCopiedBlock());
    
            p.then(function(){
              resQ();
            })
    
            function insertCopiedProcedure(){
              return function(){
                return new Promise(function(res,rej){
                  con.query("INSERT INTO experiment_procedures (experiment_title_id,experiment_procedure_order,experiment_procedure_title,created_at) VALUES (?)",
                  [query],(e,r,f)=>{
                    if(e){sqlErrLog("INSERT condition",e)}
          
                    procedureId = r.insertId;
                    res();
                  });
                })
              }
            };
    
            function insertDuplicatedCondition(){
              return function(){
                return new Promise(function(res,rej){
                  
                  conditionInserted = condition[conditionCount];
                  let conditionArray = conditionInserted.map(function(elem){
                    let array = [];
                    array[0] = procedureId;
                    array[1] = elem.condition_title;
                    array[2] = elem.value;
                    array[3] = elem.device_link_id;
                    array[4] = date;
                    return array
                  });
                  conditionCount++;
                  
                  if(conditionArray.length > 0){
                    con.query("INSERT INTO experiment_conditions (experiment_procedure_id,condition_title,value,device_link_id,created_at) VALUES ?",
                    [conditionArray],(er,re,fi)=>{
                      if(er){sqlErrLog("INSERT condition",er)}
          
                      let newFirstId = re.insertId;
                      conditionInserted.forEach(function(elem,index){
                        elem.newId = newFirstId + index;
                      })
                      res();
                    });
                  }else{
                    res();
                  }
  
                });  
              }
            };
    
            function insertCopiedBlock(){
              return function(){
                return new Promise(function(res,rej){
                  con.query("SELECT * FROM experiment_procedure_blocks WHERE experiment_procedure_id = ?",[procedureOldId],(e,r,f)=>{
                    if(e){sqlErrLog("SELECT block",e)}
                    
                    let blockArray = r.map(function(elem){
                      let array = [];
                      array[0] = procedureId;
                      array[1] = elem.experiment_block_order;
                      array[2] = elem.device_id;
                      array[3] = elem.action_id;
                      array[4] = elem.detail;
                      array[6] = date;
                      
                      if(elem.condition_id == null){
                        array[5] = null;
                      }else{
                        let newCondition = conditionInserted.find((a)=> a.id === elem.condition_id);
                        array[5] = newCondition.newId;
                      }
    
                      return array
                    });

                    if(blockArray.length > 0){//blockArrayに何も入ってなかったらスキップ.あんまりないと思うけど
                      con.query(`INSERT INTO experiment_procedure_blocks (experiment_procedure_id,experiment_block_order,device_id,action_id,detail,
                        condition_id,created_at) VALUES ?`,[blockArray],(e,r,f)=>{
                          if(e){sqlErrLog("INSERT block",e)}
                          res();
                        });
                    }else{
                      res();
                    }
                    
                  })
                })
              }
            };
    
    
          }else{
            query[0] = outline[idx].experiment_procedure_order;
            query[1] = date;
            query[2] = outline[idx].id;
            con.query("UPDATE experiment_procedures set experiment_procedure_order = ?, updated_at = ? where id = ?",query,(e, r, f) => {
              resQ();
            });
          }
        })
      }
    }
  });
    

  socket.on("trashTitle", function (trashId) {
    //ネストする必要は無いが、同期処理がだるいのでネストする
    con.query(
      "DELETE FROM experiment_titles WHERE id in (?)",
      [trashId],(e, r, f) => {
        con.query(
          "DELETE FROM devices WHERE experiment_title_id in (?)",
          [trashId],
          (er, re, fi) => {
            getAllRecipeProcedure();
            getTitle();
          }
        );
        con.query(
          "SELECT id FROM experiment_procedures WHERE experiment_title_id in (?)",
          [trashId],(er, re, fi) => {
            let trashOutlineId = [];
            re.forEach((obj) => {
              trashOutlineId.push(obj.id);
            });
           trashOutline(trashOutlineId)
          }
        );
      }
    );
  });


  function trashOutline(trashId){
    con.query(
      "DELETE FROM experiment_procedures WHERE id in (?)",
      [trashId],(e, r, f) => {
        con.query(
          "DELETE FROM experiment_procedure_blocks WHERE experiment_procedure_id in (?)",
          [trashId],(er, re, fi) => {
            con.query(
              "DELETE FROM experiment_conditions WHERE experiment_procedure_id in (?)",
              [trashId],(err, res, fie) => {
                getAllRecipeProcedure();
                getCondition();
              }
            );
          }
        );
      }
    );
  }

  socket.on("trashOutline", function (trashId) {
    trashOutline(trashId)
  });

  socket.on("trashBlock", function (trashId) {
    con.query(
      "DELETE FROM experiment_procedure_blocks WHERE id in (?)",
      [trashId],
      (e, r, f) => {
        getBlock();
      }
    );
  });

  socket.on("submitRenamedOutline", function (title, renameId) {
    //console.log(title);
    let query = [];
    query[0] = title;
    query[1] = createDate();
    query[2] = renameId;
    con.query(
      "UPDATE experiment_procedures SET experiment_procedure_title = ?, updated_at = ? where id = ?",
      query,
      (e, r, f) => {
        getOutline();
      }
    );
  });

  socket.on("reviseBlockDetail", function (blockId, addDetail) {
    let query = [];
    query[0] = joinDetailQuery(
      addDetail.detailNumber,
      addDetail.value,
      addDetail.unit
    );
    query[1] = createDate();
    query[2] = blockId;

    con.query(
      "UPDATE experiment_procedure_blocks SET detail = ?, updated_at = ? where id = ?",
      query,
      (e, r, f) => {
        getBlock();
      }
    );
  });

  socket.on("submitReviseCondition", function (condition) {
    let query = [];
    query[0] = condition.conditionTitle;
    query[1] = joinDetailQuery(
      condition.detailNumber,
      condition.value,
      condition.unit
    );
    query[2] = createDate();
    query[3] = condition.conditionId;
    con.query(
      "UPDATE experiment_conditions SET condition_title = ?, value = ?, updated_at = ? where id = ?",
      query,
      (e, r, f) => {
        getCondition();
      }
    );
  });

  socket.on("editSetting",function(x){
    //console.log(x.length);
    let day = createDate();
    let i = 0;
    x.forEach(function(elem){
      con.query("UPDATE settings SET value = ?, updated_at = ? WHERE id = ?",[elem.value,day,elem.id],(e,r,f)=>{
        i++;
        if(i >= 6){
          getSetting();
        }
      });
    })
  });

  socket.on("getResultInfo", function (runId) {
    con.query("SELECT * FROM runs WHERE id = ?", [runId], (e, r, f) => {
      socket.emit("resultRun", r[0]);
    });

    con.query(
      "SELECT * FROM result_data WHERE run_id = ?",
      [runId],
      (e, r, f) => {
        socket.emit("resultData", r);
      }
    );

    con.query(
      `SELECT a.id, a.run_id, a.value, a.result_device_id, a.created_at, b.device_name 
       FROM result_time_logs a
       INNER JOIN result_devices b ON a.result_device_id = b.id
       WHERE a.run_id = ? ORDER BY b.device_name, a.created_at;`,
      [runId],
      (e, r, f) => {
        socket.emit("resultTimeLogData", r);
        if(e){
          console.log(e)
        }
      });

    con.query(
      "SELECT * FROM result_devices WHERE run_id = ?",
      [runId],
      (e, r, f) => {
        socket.emit("resultDevice", r);
      }
    );

    con.query(
      "SELECT * FROM result_procedures WHERE run_id = ?",
      [runId],
      (e, r, f) => {
        socket.emit("resultProcedure", r);
        let procedureIdList = [];
        r.forEach((elem) => {
          procedureIdList.push(elem.id);
        });
        con.query(
          "SELECT * FROM result_conditions WHERE result_procedure_id IN (?)",
          [procedureIdList],
          (er, re, fi) => {
            socket.emit("resultCondition", re);
          }
        );
        con.query(
          "SELECT * FROM result_procedure_blocks WHERE result_procedure_id IN (?)",
          [procedureIdList],
          (er, re, fi) => {
            socket.emit("resultBlock", re);
          }
        );
      }
    );
  });

  //Runのコメントを追加
  socket.on("commentSubmit", function (comment, runNumber) {
    con.query(
      "UPDATE runs SET comment= ? WHERE id= ?",
      [comment, runNumber],
      (err, res, fields) => {
        con.query(
          "SELECT * FROM runs WHERE id = ?",
          runNumber,
          (err, res, fields) => {
            socket.emit("commentGet", res[0]);
            runInfo = res[0];
          }
        );
      }
    );
  });

  socket.on("experimentStart", function (a) {
    /////title:recipeTitle, procedure:actualProcedure, device:actualDevice, condition:usedCondition, outline
    function consa() {
      console.log(red + "title" + reset);
      console.log(a.title);
      console.log(red + "PROCEDURE" + reset);
      console.log(a.procedure);
      console.log(red + "DEVICE" + reset);
      console.log(a.device);
      console.log(red + "OUTLINE" + reset);
      console.log(a.outline);
      console.log(red + "CONDITION" + reset);
      console.log(a.condition);
    }
    //consa();

    experimentDevice = a.device;
    experimentRecipe = a.procedure;
    experimentTitle = a.title;
    experimentCondition = a.condition;
    experimentOutline = a.outline;
    
    

    experimentTitle.statusMsg = null;

    tempControllerRes = {};

    experimentRecipe.forEach(function (valueObj) {
      valueObj["result"] = null;
    });

    //実験が完了したかどうかのフラグ
    experimentTitle.isDone = false;
    //実験が進行中か否かのフラグ
    experimentTitle.isDoing = true;
    //前回の実験を途中でやめたかどうかをリセット
    isExperimentQuit = false;

    experimentRecipe.forEach((item) => {
      item.isDone = false;
    });
    socket.emit("experimentTitle", experimentTitle);
    socket.emit("experimentRecipe", experimentRecipe);



    function experimentStart() {
      //下記{}内がすべて実行されてからスタート
      procedureNumber = 0;
      let firstProcedure = {
        res: null,
        procedure: {
          procedureOrder: 0,
        },
      };

      experimentRecipe.forEach((elem) => {
        elem.resultProcedureId = keyToResultId[elem.uniqueKey];
      });

      experimentDoing(firstProcedure);

      emitScriptReset(experimentDevice, "emargencyStopReset");
      emitScript(experimentDevice,"--off","getEmargencyStopScript");
      timeLogs = {};
      startMonitorStatusAndTemp();
    }

    {
      keyToResultId = {};

      let j = 0;
      let devLength = Object.keys(experimentDevice).length;
      function deviceInsert(day) {
        Object.keys(experimentDevice).forEach(function (key) {
          con.query(
            "INSERT INTO result_devices (device_name, run_id, result_device_name, result_device_model, result_device_company, result_device_serialnumber, created_at) values (?)",
            [[
                experimentDevice[key].name,
                runInfo.id,
                experimentDevice[key].device,
                experimentDevice[key].model,
                experimentDevice[key].company,
                experimentDevice[key].serialnumber,
                day,
            ]],(e, r, f) => {
              con.query("SELECT id FROM result_devices WHERE created_at = ? AND device_name = ?",[day, experimentDevice[key].name],(er, re, fi) => {
                experimentDevice[key].resultId = re[0].id;
                j++;
                if (j == devLength) {
                  experimentStart();
                }
             });
            }
          );
        });
      }

      function conditionInsert(day) {
        if (experimentCondition.length > 0) {
          experimentCondition.forEach((elem) => {
            elem.resultId = keyToResultId[elem.uniqueKey];
            if (elem.condition.length > 0) {
              elem.condition.forEach((obj) => {
                con.query(
                  "INSERT INTO result_conditions (result_procedure_id, condition_title, value, created_at) VALUES (?)",
                  [[elem.resultId, obj.condition_title, obj.value, day]],
                  (e, r, f) => {}
                );
              });
            }
          });
        }
      }

      //Runを記録
      const date = createDate();
      con.query(
        "INSERT INTO runs (result_title,created_at) VALUES (?)",
        [[experimentTitle.experiment_title, date]],(err, res, fields) => {
          con.query("SELECT * FROM runs WHERE created_at = ? LIMIT 1",date,(err, res, fields) => {
              socket.emit("runInfo", res[0]);
              runInfo = res[0];

              let i = 0;
              let outLength = experimentOutline.length;
              experimentOutline.forEach((a) => {
                //outlineをとりあえず全部追加
                con.query(
                  "INSERT INTO result_procedures (run_id, result_procedure_order, result_procedure_title, created_at) VALUES (?)",
                  [
                    [runInfo.id,a.outlineOrder,a.experiment_procedure_title,date,],
                  ],
                  (e, r, f) => {
                    con.query(
                      "SELECT id FROM result_procedures WHERE created_at = ? AND result_procedure_order = ?",
                      [date, a.outlineOrder],
                      (er, re, fi) => {
			//console.log(re);
                        a.resultId = re[0].id;
                        keyToResultId[a.uniqueKey] = a.resultId;
                        i++;
                        if (i == outLength) {
                          //非同期処理なので全部完了した後の関数
                          conditionInsert(date); //result_conditionsを追加
                          deviceInsert(date); //result_devicesを追加
                        }
                      }
                    );
                  }
                );
              });
            }
          );
        }
      );
    }
  });

  //中断フラグを受け取る
  socket.on("procedureBreak", function (flag) {
    isBreak = flag;
    if (flag) {
      clearInterval(waitingTimer);
    } else {
      experimentDoing(breakProcedure);
    }
  });

  socket.on("experimentDone", function () {//完全終了。すべてをリセット
    emitEmargencyStop(experimentDevice);
    experimentDevice = {};
    experimentRecipe = [];
    experimentTitle = {};
    isBreak = false;
    samplingTime = 0;
    socket.emit("isBreakFlag", isBreak);
    breakProcedure = {};
    runInfo = {};
    clearInterval(waitingTimer);
    isExperimentQuit = true;
    socket.emit("experimentDoneReturn");
  });

  socket.on("clientAction", function (action) {
    client.to(action.ClientNumber).emit("clientAction", action);
  });
});

//ラズパイからデバイスリストのデータを受け取る
client.on("connection", (socket) => {
  console.log("connected from a client");
  console.log(socket.id);

  socket.on("disconnect", () => {
    clientList = clientList.filter((d) => {
      return d.socket != socket.id;
    });
    srvUser.emit("deviceList", clientList);
  });

  socket.on("deviceList", (d) => {
    clientList.push({
      socket: socket.id,
      clientData: d.clientData,
      deviceList: d.deviceList,
    });

    clientList[clientList.length - 1].deviceList.forEach((deviceInfo) => {
      deviceInfo.ClientNumber = socket.id;
    });
    srvUser.emit("deviceList", clientList);
  });

  //experimentResを受け取る
  socket.on("experimentRes", function (a) {
    //グローバル関数(どのclientでも共通)に投げる
    //中断のフラグが立っていたら次に進まない
    // console.log(a);
    experimentDoing(a);
  });

  socket.on("finishSteadyState", (res) => {
    //{res:'success',procedure:sstateProcedure, timeElapsed:timeDiff}
    judgeFinishSteadyState(res);
  });

  socket.on("sstateNow", (a) => {
    //a = {temp, timeDiff, procedureOrder}
    srvUser.emit("sstateNow", a);
  });

  
  socket.on("tempTimeLog",(t,deviceId)=>{
    let date  = createDate();
    timeLogs[deviceId].time.unshift(date);
    timeLogs[deviceId].data.unshift(t);
    srvUser.emit("tempTimeLog",timeLogs);
    if(Object.keys(runInfo).length){//実験は本当に進行中?
      con.query("INSERT INTO result_time_logs (run_id,result_device_id,value,created_at) VALUES (?)",[[runInfo.id,deviceId,t,date]],(e,r,f)=>{
        if(e){
          sqlErrLog("tempTimeLog",e);
        }
      });
    };
  });

  //2024_baba_added
  socket.on("concTimeLog",(C,deviceId)=>{
    let date  = createDate();
    timeLogs[deviceId].time.unshift(date);
    timeLogs[deviceId].data.unshift(C);
    srvUser.emit("concTimeLog",timeLogs);
    if(Object.keys(runInfo).length){//実験は本当に進行中?
      con.query("INSERT INTO result_time_logs (run_id,result_device_id,value,created_at) VALUES (?)",[[runInfo.id,deviceId,C,date]],(e,r,f)=>{
        if(e){
          sqlErrLog("concTimeLog",e);
        }
      });
    };
  });
  

  socket.on("clientActionResult", (result, device) => {
    srvUser.emit("clientActionResult", result, device);
    /* 20240313_baba_added
    con.query(
      "INSERT INTO result_data (run_id, result_block_id, data, created_at) VALUES (?)",
      [[1, 1, result, '2024-03-19 12:00:00']],
    );
    */ above_all
  });

  socket.on("clientExitProcess", (a) => {
    console.log("Terminating this ongoing experiment due to a ploblem");
    emitEmargencyStop(experimentDevice);
  });
});

function emitScriptReset(device, emitTarget) {
  //emargencyStopの項目を空にする
  Object.keys(device).forEach(function (key) {
    //初期化
    let deviceObj = device[key];
    if ("ClientNumber" in deviceObj) {
      client.to(deviceObj.ClientNumber).emit(emitTarget);
    }
  });
}

let statusEmitCNArray = [];
let statusEmitArray;
function emitScript(device, helpUsage, emitTarget) {
  statusEmitCNArray = [];
  statusEmitArray = [];
  Object.keys(device).forEach(function (key) {
    //追加
    let deviceObj = device[key];
    if ("HelpUsage" in deviceObj) {
      if (deviceObj["HelpUsage"].includes(helpUsage)) {
        let scriptString = deviceObj.script + " " + helpUsage;
        client.to(deviceObj.ClientNumber).emit(emitTarget, scriptString);
        
        if(helpUsage == "--status"){
          statusEmitCNArray.push(deviceObj.ClientNumber);
        }
      }
    }
  });
  if(statusEmitCNArray.length > 0){
    const set = new Set(statusEmitCNArray);
    statusEmitArray = [...set];//status監視だけは送信先を記録しておく
  };
};

let tempEmitArray;
let concEmitArray; // 20240323_baba_added
function emitScriptByDeviceType(device,emitTarget){
  //console.log(device);
  let tempEmitCNArray = [];
  tempEmitArray = [];

  // 20240323_baba_added
  let concEmitCNArray = [];
  concEmitArray = [];

  Object.keys(device).forEach(function (key){
    let deviceObj = device[key];
    console.log(deviceObj);
    if((deviceObj.device_type_name == "thermometer") || (deviceObj.device_type_name == "temperature controller") || (deviceObj.device_type_name == "Digital Temp Controller")){ //20240607_baba
      timeLogs[deviceObj.resultId] = {
        time: [],
        data: [],
        device: deviceObj,
      };//result_time_logsを実験中に表示する用

      let scriptString = deviceObj.script + " --get";
      let scriptOffString = deviceObj.script + " --off";
      let scriptOnString = deviceObj.script + " --on";
      client.to(deviceObj.ClientNumber).emit(emitTarget, {scriptString: scriptString, scriptOffString: scriptOffString, scriptOnString: scriptOnString, deviceId:deviceObj.resultId});
      tempEmitCNArray.push(deviceObj.ClientNumber);
    }

    // 20240323_baba_added
    if(deviceObj.device_type_name == "PDA"){
      timeLogs[deviceObj.resultId] = {
        time: [],
        data: [],
        device: deviceObj,
      };//result_time_logsを実験中に表示する用

      let scriptString = deviceObj.script + " --get";
      let scriptOffString = deviceObj.script + " --off";
      let scriptOnString = deviceObj.script + " --on";
      client.to(deviceObj.ClientNumber).emit(emitTarget, {scriptString: scriptString, scriptOffString: scriptOffString, scriptOnString: scriptOnString, deviceId:deviceObj.resultId});
      concEmitCNArray.push(deviceObj.ClientNumber);
    }

  });
  srvUser.emit("tempTimeLog",timeLogs);//初期値
  srvUser.emit("concTimeLog",timeLogs); //20240323_baba_added

  if(tempEmitCNArray.length > 0){
    const set = new Set(statusEmitCNArray);
    tempEmitArray = [...set];//送信先を重複なく記録
  };

  // 20240323_baba_added
  if(concEmitCNArray.length > 0){
    const set = new Set(concEmitCNArray);
    concEmitArray = [...set];//送信先を重複なく記録
  };

} 

function startMonitorStatusAndTemp(){
  emitScriptReset(experimentDevice, "monitorReset");
  emitScript(experimentDevice,"--status","getMonitorScript");//各clientにstatus監視のスクリプトを送信
  emitScriptByDeviceType(experimentDevice,"getMonitorTempScript");
  emitScriptByDeviceType(experimentDevice, "getMonitorConcScript"); //20240323_baba_added
  statusEmitArray.forEach(function(clientNo){//それぞれのクライアントに対して開始の合図
    client.to(clientNo).emit("startMonitorStatus",timeInfo.monitorInterval);
  });
  tempEmitArray.forEach(function(clientNo){//それぞれのクライアントに対して開始の合図
    client.to(clientNo).emit("startMonitorTemp",timeInfo.monitorInterval);
  });
  concEmitArray.forEach(function(clientNo) { //濃度モニタリングの開始合図
    client.to(clientNo).emit("startMonitorConc",timeInfo.monitorInterval);
  });
}

function emitEmargencyStop(device, isNormalDone = false) {
  experimentTitle.isDone = true;
  if(!isNormalDone){
    experimentTitle.statusMsg = "Because of the error, this experiment was aborted."
  }
  srvUser.emit("experimentTitle", experimentTitle);

  //実行する
  Object.keys(device).forEach(function (key) {
    let deviceObj = device[key];
    if ("ClientNumber" in deviceObj) {
      client.to(deviceObj.ClientNumber).emit("emargencyStop");
      client.to(deviceObj.ClientNumber).emit("clearMonitorStatus");
    }
  });
}

//異常終了時の処理
process.on("exit", (a) => {
  emitEmargencyStop(experimentDevice);
});
