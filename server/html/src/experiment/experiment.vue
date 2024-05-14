<template>
<div class="uk-card uk-card-body uk-card-default">
    <h4 v-show='!experimentTitle.isDoing'>Experiment is not running</h4>
    <div v-show='experimentTitle.isDoing'>
    <ul uk-accordion>
      <li class='uk-open'>
        <a class='uk-accordion-title' href='#'>{{experimentTitle.experiment_title}}</a>
        <div class='uk-accordion-content'>
          <p  class='uk-width-2-3'> 
            <span class='run-infomation'>RunNumber</span>: {{runInfo.id}}<br>
            <span class='run-infomation'> Date</span>: {{runInfo.created_at}}<br>
            <span class='run-infomation'> Comment</span>: {{runInfo.comment}}<br>
            <a href='#new-comment' uk-toggle @click='commentSet'>Add comment</a>
          </p>      
        </div>
      </li>
    </ul>
     <div v-show='experimentTitle.isDone'><span uk-icon="icon: check; ratio:1.2"></span>Done</div>
     <button class="uk-button uk-button-danger" uk-toggle='target: #experiment-quit'>Finish this experiment</button>
     <div v-show='!experimentTitle.isDone && !isBreak'><span uk-spinner='ratio:0.7'></span>Running</div>
     <div v-show='isBreak'><span uk-icon='icon: minus-circle'></span>Break</div>
     <div v-show='experimentTitle.statusMsg' class="uk-text-center box1">
        <h2><font color="red">!! Notice !!</font></h2>
        <p class="uk-text-large"><font color="red">
        {{experimentTitle.statusMsg}}
        </font></p>
      </div>
     <p></p>
    <div v-if='!isBreak && !experimentTitle.isDone'>
      <button class="uk-button uk-button-danger" type="button" @click='procedureBreak'>Break</button>
      <button class="uk-button uk-button-default" disabled>Resume</button>
    </div>
    <div v-if='isBreak && !experimentTitle.isDone'>
      <button class="uk-button uk-button-danger" disabled>Break</button>
      <button class="uk-button uk-button-default"  @click='procedureRestart'>Resume</button>
    </div>
    <div v-if='experimentTitle.isDone'>
      <button class="uk-button uk-button-danger" disabled>Break</button>
      <button class="uk-button uk-button-default"  disabled>Resume</button>
    </div>
    
    
      <!-- 実験終了ショートカットボタン --
     <button class="uk-button uk-button-danger uk-modal-close" @click='experimentDone' type="button">☆☆DONE☆☆</button> 
      -->
    <br>

     <div>
      Time elapsed (this procedure) : {{sstateNow.timeDiff}}<span v-if="sstateNow.timeDiff == null">- </span> second
      <div v-if="sstateNow.temp !== null">Temperature : {{sstateNow.temp}} ℃</div>
     </div>

      <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#experiment-process-contents' id='experiment-process'>
        <li> <a href="#"> Experiment </a> </li>
        <li> <a href="#"> Logs </a> </li>
      </ul>

      <ul class="uk-switcher uk-margin" id="experiment-process-contents">
        <li>
          <table class="uk-table uk-table-hover uk-width-2-3">
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th>Device</th>
                <th>Action</th>
                <th>Detail</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b,index) in experimentRecipe" :key='b.procedureOrder'>
                <td>{{index+1}}</td>
                <td><span v-show='b.isDone' uk-icon="icon: check"></span></td>
                <td>{{b.device_name}}</td>
                <td>{{b.action}}</td>
                <td>{{b.usedDetail}}</td>
                <td>
                  <div>{{b.result}}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </li>
        <li>
          <experiment-log :timeLogs="timeLogs"></experiment-log>
        </li>
      </ul>
    </div> 



    <!-- 以下モーダルウインドウ -->
    <div id='new-comment' uk-modal>
    <div class='uk-modal-dialog uk-modal-body'>
        <h2 class='uk-modal-title'>Add comment</h2>
        <textarea v-model.trim='runComment' type='text' style="width:400px; height:200px" class='uk-textarea'></textarea><br>
        <p class='uk-text-right'>
        <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
        <button class="uk-button uk-button-primary uk-modal-close" @click='commentSubmit' type="button">OK</button> 
      </p>
    </div>
    </div>

    <div id='experiment-quit' uk-modal>
      <div class='uk-modal-dialog uk-modal-body'>
        <h2 class='uk-modal-title'>Finish this experiment</h2>
        <p>Are you sure you want to finish?</p>
        <p class='uk-text-right'>
          <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
          <button class="uk-button uk-button-danger uk-modal-close" @click='experimentDone' type="button">OK</button> 
      </p>
      </div>
    </div>
</div>
</template>

<script>
import experimentLog from './experiment-log.vue'

export default {
  components:{
    experimentLog,
  },

  props:['experimentTitle','experimentRecipe','runInfo','sstateNow','timeLogs'],

  data(){
    return{
      isBreak:false,
      runComment:null,
      testArray:[],
    }
  },

  methods :{
    testex(){
      console.log('あ');
      isBreak = true;
    },

    procedureBreak(){
      this.isBreak = true;
      this.$emit('procedureBreak',this.isBreak);
    },

    procedureRestart(){
      this.isBreak = false;
      this.$emit('procedureBreak',this.isBreak);
    },

    isBreakGet(flag){
      this.isBreak = flag;
    },

    commentSubmit(){
      this.$emit('commentSubmit',this.runComment,this.runInfo.id);
    },

    commentSet(){
      this.runComment=this.runInfo.comment;
    },

    experimentDone(){
      this.$emit('experimentDone');
    }
  },

  watch:{
    /*
    sstateNow: function(newVal,oldVal){
      let index = this.experimentRecipe.findIndex((v) => v.procedureOrder == newVal.procedureOrder);
      if(index >= 0){
        if(newVal.Temp !== null){
          this.$set(this.experimentRecipe[index],'nowStateTemp',newVal.Temp);
        };
        console.log("index :" + index)
        this.$set(this.experimentRecipe[index],'nowStateTimeDiff',JSON.parse(JSON.stringify(newVal.timeDiff)));
        console.log(JSON.parse(JSON.stringify(newVal.timeDiff)));
        this.testArray.push(newVal.timeDiff);
      }
    },*/
  },
}
</script>
<style scoped lang='scss'>
  .run-infomation {
    display:inline-block;
    width: 6em;
  }
</style>