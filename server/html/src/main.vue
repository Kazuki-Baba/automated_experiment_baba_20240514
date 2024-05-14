<template>
<div class="uk-card uk-card-body uk-card-default">
<h3 v-if="isConnect">Server working</h3>
<h3 v-if="!isConnect"><font color='#4d47ff'>Server not working</font></h3>

<!-- <test-cha2></test-cha2> -->
<!-- <test-cha></test-cha> -->

<!--
<input @click="changeIsEdit()" class= 'uk-button uk-button-default' type='button'  value="テスト">
-->

<div v-show="!isEdit && !isResult">
  <ul class="uk-subnav uk-subnav-pill" uk-switcher='connect:#subnav-main-contents' id='subnav-main'>
    <li> <a href="#"> Recipe List </a> </li>
    <li> <a href="#"> Client List </a> </li>
    <li> <a href='#'> Experiment </a></li>
    <li><a href='#'>RESULT</a></li>
    <li><a href='#'>SETTING</a></li>
    <!--
    <li> <a href="#"> Receipe List </a> </li>
    <li> <a href='#'> NEW </a></li>
    -->
  </ul>

  <ul class="uk-switcher uk-margin" id="subnav-main-contents">
    <li>
      <flexible-recipe-list :recipeData="recipeList" @createRecipe="createRecipe" 
      :procedureData="recipeProcedure" :blockData="recipeBlock" :deviceData="deviceList" 
      :conditionData="conditionList"
      @experimentStart='experimentStart' @recipeEdit='recipeEdit' @recipeTrash="recipeTrash"
      :experimentTitle='experimentTitle' @actionEmit='actionEmit' @editProcedure='editProcedure'
      @selectEditTitle="selectEditTitle"
      ref="flRecipeList"></flexible-recipe-list>
    </li>
    <li>
      <client-list :deviceData='clientDeviceList' @clientAction="clientAction" :clientActionResultValue="clientActionResultValue"></client-list>
    </li>
    <li>
      <experiment ref='experimentChild' :experimentTitle='experimentTitle' :experimentRecipe='experimentRecipe'
      :sstateNow="sstateNow" :timeLogs="timeLogs"
      @procedureBreak='procedureBreak' :runInfo='runInfo' @commentSubmit='commentSubmit'
      @experimentDone='experimentDone'></experiment>
    </li>
    <li>
      <result :resultList="resultList" :resultOutlineList="resultOutlineList"
      @getResultInfo="getResultInfo"></result>
    </li>
    <li><setting :settingList="settingList" :settingDefaultList="settingDefaultList" @editSetting="editSetting"></setting></li>
  </ul>
</div>

<div v-show='isEdit'>
  <div>
    <h3>{{editTitle.experiment_title}}</h3>
  </div>

  <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-edit-contents' id='subnav-edit'>
    <li> <a href="#"> EDIT MODE</a> </li>
  </ul>
  
  <div>
    <button class="uk-button uk-button-primary uk-width-1-5" type="button" @click='completeEdit()'>Complete</button>
  </div>

  <ul class="uk-switcher uk-margin" id="subnav-edit-contents">
    <li><fl-edit :editOutline="editOutline" :editBlock="editBlock" :editTitle="editTitle"
        :editDevice="editDevice" :valueChoiceList="valueChoiceList" :actionLinkList="actionLinkList" :deviceTypeList="deviceTypeList"
        :conditionList="conditionList"
        @submitOutline="submitOutline" @trashOutline="trashOutline" @submitRenamedOutline="submitRenamedOutline"
        @reorderOutline="reorderOutline" @copyOutline="copyOutline" @reorderBlock="reorderBlock"
        @submitBlock="submitBlock" @trashBlock="trashBlock" @reviseBlockDetail="reviseBlockDetail"
        @submitReviseCondition="submitReviseCondition" @trashTitle="trashTitle" @submitDuplicateCondition="submitDuplicateCondition"
        ref="flEdit"></fl-edit></li>
  </ul>
</div>

<div v-show="isResult">
  <ul class="uk-subnav uk-subnav-pill" uk-switcher='connect:#result-check-contents' id='result-check'>
    <li> <a href="#"> RESULT </a> </li>
  </ul>
  <div>
    <button class="uk-button uk-button-primary uk-width-1-5" type="button" @click='completeResult()'>Complete</button>
  </div>
  <ul class="uk-switcher uk-margin" id="result-check-contents">
    <li><result-check :resultRun="resultRun" :resultData="resultData" :resultTimeLogData="resultTimeLogData" :resultDevice="resultDevice" 
    :resultProcedure="resultProcedure" :resultCondition="resultCondition" :resultBlock="resultBlock"
    ref="result"></result-check></li>
  </ul>
  
</div>


<div id="alert-window" class="uk-flex-top" uk-modal>
    <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
        <button class="uk-modal-close-default" type="button" uk-close @click="stopAlert()"></button>
        <h3>!! NOTIFICATION !!</h3>
        <p>
          {{alertWindowMsg}}
        </p>
    </div>
</div>


</div>
</template>


<script>
import setting from './setting.vue';
import io from 'socket.io-client';
import ui from 'uikit';
import clientList from './client-list.vue';
import experiment from './experiment/experiment.vue';
import result from './result/result.vue';
import flexibleRecipeList from './flexible-recipe/flexible-recipe-list.vue';
import flEdit from './edit/edit.vue'
import resultCheck from './result/result-check.vue';

import testCha from './experiment/experiment-chart.vue'
import testCha2 from './others/testchart2.vue'


var cors = {
  cors: true,
  origins: ["http://10.249.80.69", "http://localhost"],
  methods: [ "GET", "POST"]
} ;

const alertSound = new Audio("./src/se/clock.mp3");

ui.util.on(document,"hide","#alert-window", function(){
  alertSound.pause();
 });

function sortBy(elem,orderBy){
      elem.sort(function(first,second){
        if(first[orderBy]> second[orderBy]){
          return 1;
        }else if(first[orderBy] < second[orderBy]){
          return -1;
        }else{
          return 0;
        }
      });
};

export default {
  components: {
   clientList,
   experiment,
   flexibleRecipeList,
   result,
   setting,
   flEdit,
   resultCheck,
   testCha,
   testCha2,
  },
  data () {
    return {
      status: 0,
      deviceList: [],
      recipeList: [],
      recipeBlock: [],
      recipeProcedure:[],
      recipeDevice:[],
      actionList:[],
      actionLinkList:[],
      conditionList: [],
      deviceTypeList:[],
      valueChoiceList:[],
      clientDeviceList:[],
      experimentTitle:{},
      experimentRecipe:[],
      resultList:[],
      resultOutlineList:[],
      resultRun:{},
      resultData:[],
      resultTimeLogData:[],
      resultDevice:[],
      resultProcedure:[],
      resultCondition:[],
      resultBlock:[],
      runInfo:{},
      settingList:[],
      settingDefaultList:[],
      editTitle: {},
      timeLogs:{},
      socket: null,
      isConnect: false,
      isEdit:false,
      isResult:false,
      clientActionResultValue:{
        result:null,
        device:{
          model:"",
          company:"",
          serialnumber:"",
          sxript:"",
        },
      },
      sstateNow:{
        temp: null,
        timeDiff: null,
        procedureOrder: null,
      },
      alertWindowMsg:"",
    }
  },

  mounted(){
    this.socket=io.connect('http://' + window.location.host + ':8000');
    //this.socket=io.connect('http://localhost:8000');
    //console.log(window.location.host);
      
    this.socket.on('connect', () => {
      console.log("connected to server as user");
      this.isConnect = true;

    });

    this.socket.on('disconnect', () => {
      console.log("disconnected from server");
      //うざいから切ってる
      //window.alert("Oops! Server was disconnected.\nPlease check the server and console.log!")
      this.isConnect = false;
      this.deviceList = [];
    });

    this.socket.on("sqlErrLog",(a)=>{
      //a={title, err}
      console.log(a.err)
    });
    
    this.socket.on('deviceList', (d) => {
      this.deviceList = d; 
      this.clientDeviceList = d;     
    });

    this.socket.on('sokuteiResult2',(ondo) => {
      console.log(ondo);
    });

    this.socket.on('recipeList',(a) => {
      this.recipeList = a;
      ui.switcher('#subnav-main').show(0);
      this.completeEdit();
    });

    this.socket.on('recipeProcedure',(a) =>{
      this.recipeProcedure = a;
      if(this.recipeProcedure === null){
        this.recipeProcedure = ['エラー回避'];
      };
    });

    this.socket.on('recipeBlock',(a) =>{
      this.recipeBlock = a;
      if(this.recipeBlock === null){
        this.recipeBlock = ['エラー回避'];
      };
    });

    this.socket.on('recipeDevice',(a) =>{
      this.recipeDevice = a;
      if(this.recipeDevice === null){
        this.recipeDevice = ['エラー回避'];
      };
    });

    this.socket.on('experimentTitle',(title) =>{
      this.experimentTitle = title;
    });

    this.socket.on('experimentRecipe',(procedure) =>{
      this.experimentRecipe = procedure;
    });

    this.socket.on('actionList',(a)=>{
      this.actionList = a;
    });

    this.socket.on('actionLinkList',(a)=>{
      this.actionLinkList = a;
    });
            
    this.socket.on('deviceTypeList',(a)=>{
      this.deviceTypeList = a;
    });

    this.socket.on('valueChoiceList',(a)=>{
      this.valueChoiceList = a;
    });


    this.socket.on('condition',(a)=>{
      this.conditionList = a;
    });

    //再読込した際に中断か否かをExperiment.vueに送信する
    this.socket.on('isBreakFlag',(flag) =>{
      this.$refs.experimentChild.isBreakGet(flag);
    });

    this.socket.on('runInfo',(a)=>{
      this.runInfo = a;
    });

    this.socket.on('commentGet',(a)=>{
      this.runInfo = a;
    });

    this.socket.on('experimentDoneReturn',()=>{
      //実験が終わったので各々の情報をリセット
      Object.keys(this.experimentTitle).forEach(key => {
        this.$delete(this.experimentTitle,key);
      });
      Object.keys(this.runInfo).forEach(key => {
        this.$delete(this.runInfo,key);
      });
      this.experimentRecipe.splice(0,this.experimentRecipe.length);
    });

    this.socket.on('clientActionResult',(result,device)=>{
      this.$set(this.clientActionResultValue,'result',result);
      this.$set(this.clientActionResultValue,'device',device);
    });

    this.socket.on('trashReloadProcedure',(trProcedure)=>{
      this.$refs.recipeList.trashReloadProcedure(trProcedure);
    });

    this.socket.on('sstateNow',(a)=>{
      //a = {temp, timeDiff}
      this.sstateNow = a;
    });

    this.socket.on('resultList',(a)=>{
      this.resultList = a;
    });

    this.socket.on('resultProcedureList',(a)=>{
      this.resultOutlineList = a;
    });

    this.socket.on('resultRun',(a)=>{
      this.resultRun = a;
    });

    this.socket.on("resultData",(a)=>{
      this.resultData = a;
    });

    this.socket.on("resultTimeLogData",(a)=>{
      this.resultTimeLogData = a;
    });

    this.socket.on("resultDevice",(a)=>{
      this.resultDevice = a;
    });
    
    this.socket.on("resultProcedure",(a)=>{
      this.resultProcedure = a;
    });

    this.socket.on("resultCondition",(a)=>{
      this.resultCondition = a;
    });

    this.socket.on("resultBlock",(a)=>{
      this.resultBlock = a;
    });

    this.socket.on("alertWindow",(a)=>{
      this.alertWindowMsg = a; 
      ui.modal("#alert-window").show();
      alertSound.play();
    });

    this.socket.on("getSetting",(a,b)=>{
      this.settingList = a;
      this.settingDefaultList = b;
    });

    this.socket.on("tempTimeLog",(a)=>{
      this.timeLogs = a;
    });

    this.socket.on("concTimeLog", (a)=>{ // 20240323_baba_added
      this.timeLogs = a;
    })
  },

  methods :{
    test(){
      console.log('あ');
      ui.switcher('.uk-subnav').show(2);
    },

    createRecipe(a){
      if(this.isConnect === true){
      this.socket.emit('createRecipe',a);
      alert('success!!');
      }else{
        alert('作成に失敗しました\nサーバーとの接続を確認してください');
      };
    },

    experimentStart(a){
      if(this.isConnect === true){
      console.log('Experiment Starting');
      this.socket.emit('experimentStart',a);
      ui.switcher('#subnav-main').show(2);
      }else{
        alert('fail to connect to server\nplease check the conection');
      };
    },

    recipeEdit(a){
       if(this.isConnect === true){
      console.log('procedure Edited');
      this.socket.emit('recipeEdit',a);
      alert('正常に送信されました');
      }else{
        alert('実行に失敗しました\nサーバーとの接続を確認してください');
      };
    },

    recipeTrash(trashID,trashExperimentId){
      if(this.isConnect === true){
        this.socket.emit('recipeTrash',trashID,trashExperimentId);
        
      }else{

      };
    },

    procedureBreak(isBreak){
      this.socket.emit('procedureBreak',isBreak);
    },

    commentSubmit(comment,runNumber){
       if(this.isConnect === true){
        this.socket.emit('commentSubmit' ,comment,runNumber);
      }else{
        alert('実行に失敗しました\nサーバーとの接続を確認してください');
      };
    },

    experimentDone(){
      this.socket.emit('experimentDone');
    },

    actionEmit(device,action,detail,exID){
      this.socket.emit('recipeEditNew',device,action,detail,exID)
    },

    clientAction(action){
      this.socket.emit('clientAction',action);
    },

    changeIsEdit(){
      this.isEdit = !this.isEdit;
    },

    selectEditTitle(titleObj){
      this.editTitle = titleObj;
    },

    editProcedure(){
      this.isEdit = true;
      ui.switcher('#subnav-edit').show(0);
      ui.switcher('#subnav-edit-procedure').show(0);
      ui.switcher('#subnav-add-procedure').show(0);
      ui.switcher('#subnav-reorder-procedure').show(0);
      ui.switcher('#subnav-copy-procedure').show(0);
    },

    submitOutline(outlineQuery){
      outlineQuery[0] = this.editTitle.id;
      this.socket.emit('submitOutline',outlineQuery);
    },

    submitBlock(device,action,detail){
      this.socket.emit('submitBlock',device,action,detail);

    },

    reorderOutline(array){
      this.socket.emit('reorderOutline',array);
    },

    reorderBlock(array){
      this.socket.emit('reorderBlock',array);
    },

    copyOutline(newArray){
      this.socket.emit('copyOutline',newArray);
    },

    trashTitle(trashId) {
      this.socket.emit("trashTitle", trashId);
    },

    trashOutline(trashId){
      this.socket.emit("trashOutline",trashId);
    },

    trashBlock(trashId){
      this.socket.emit("trashBlock",trashId);
    },

    submitRenamedOutline(title,renameId){
      this.socket.emit("submitRenamedOutline",title,renameId);
    },

    completeEdit(){
      this.isEdit = false;
      this.$refs.flEdit.reset();
      this.$refs.flRecipeList.resetTitle();
    },
    
    completeResult(){
      this.isResult = false;
      this.$refs.result.resetAll();
    },

    reviseBlockDetail(blockId,addDetail){
      this.socket.emit("reviseBlockDetail",blockId,addDetail);
    },

    submitReviseCondition(condition){
      this.socket.emit("submitReviseCondition",condition);
    },

    getResultInfo(runId){
      this.socket.emit("getResultInfo",runId);
      this.isResult = true;
      ui.switcher('#result-check').show(0);
      ui.switcher('#subnav-result-check').show(0);
    },

    stopAlert(){
     alertSound.pause();
    },

    editSetting(array){
      this.socket.emit("editSetting",array);
    },

    submitDuplicateCondition(condition){
      this.socket.emit("submitDuplicateCondition",condition)
    }
  },

  computed:{
    editOutline:function(){
      const outline = this.recipeProcedure.filter(x => x.experiment_title_id == this.editTitle.id)
      sortBy(outline,"experiment_procedure_order");
      return outline
    },

    editBlock:function(){
      const outline = this.recipeProcedure.filter(x => x.experiment_title_id === this.editTitle.id)
      const procedureIdList = outline.map(x => x.id)
      const block = this.recipeBlock.filter(function(x){
        return procedureIdList.includes(x.experiment_procedure_id);
      });

      const blockList = procedureIdList.map(function(x){
        return block.filter(function(y){
          return y.experiment_procedure_id == x
        });
      });

      blockList.forEach(function(array){
        sortBy(array,"experiment_block_order");
      });

      let blockListTemp = [].concat(...blockList);
      let condition = JSON.parse(JSON.stringify(this.conditionList));

      //detailとcondition_idの正しい方を表示させるために(detailView追加)
      for(let i = 0; i < blockListTemp.length; i++){
          if(blockListTemp[i].condition_id){
            let index = this.conditionList.findIndex(({id}) => id == blockListTemp[i].condition_id);

            if(index !== -1){
              blockListTemp[i].detailView = condition[index].value;
            }else{
              blockListTemp[i].detailView = null;
            }
          }else if(blockListTemp[i].detail){
            blockListTemp[i].detailView = blockListTemp[i].detail;     
          }else{
            blockListTemp[i].detailView = null;
          };
      };
      return blockListTemp
    },

    editDevice:function(){
      let device = this.recipeDevice.filter(x => x.experiment_title_id == this.editTitle.id);
      return device
    },

  }

}
</script>
<style>
.mouse-pointer{
    cursor:pointer;
}
</style>
