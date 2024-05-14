<template>
<div class='uk-card uk-card-body uk-card-default'>
  <p>
   Create new recipe : <button class='uk-button uk-button-default uk-margin-small-right' type='button' uk-toggle='target: #new-recipe'>New</button>
  </p>
<div>
  
  <div class="uk-card uk-card-body uk-card-default uk-height-medium">
     <h4 class="uk-card-title">Recipe list</h4>
    <table class="uk-table uk-table-striped uk-table-hover uk-table-small mouse-pointer title-section">
      <tbody>
        <tr v-for="title in recipeData" :key="title.id">
          <td @click="selectTitle(title)">{{title.experiment_title}}</td>
        </tr>
      </tbody>
    </table>
  </div>


  <div class="uk-grid-collapse uk-text-center" uk-grid>
    <div class="uk-width-1-3">
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Recipe outline</h4>
        <h4 v-if="recipeOutline.length == 0">No outline</h4>
        <ul class="uk-list uk-list-large uk-text-large">
          <li v-for="a in recipeOutline" :key="a.id">
            {{a.experiment_procedure_title}}
          </li> 
        </ul>
      </div>
    </div>
    <div class="uk-width-2-3">
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Procedure</h4>
        <h4 v-if="recipeBlock.length == 0">No procedure</h4>
        <table v-show="recipeBlock.length !== 0" class="uk-table uk-table-divider">
          <thead>
            <tr>
              <th></th>
              <th>Device</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a,index) in recipeBlock" :key="a.id" class="uk-text-left">
              <td>{{index}}</td>
              <td>{{a.device_name}}</td>
              <td>{{a.action}}</td>
              <td>{{a.detail}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>


   <!--RUNショートカット --
   <div class='uk-card uk-card-body uk-card-default'>
     <h4>☆☆テスト用☆☆</h4>
       <ul uk-accordion>
    <li v-for='a in recipeData' :key='a.id'>
        <a class='uk-accordion-title' href='#'>{{a.experiment_title}}</a>
     <div class='uk-accordion-content'>
       <p class='uk-text-left uk-width-2-3'>
        <button class="uk-button uk-button-primary uk-width-1-4 min-button-size-2" type="button" uk-toggle='target: #recipe-action'
        @click='recipeActionFilterShortcut(a)' v-if='!experimentTitle.isDoing'>Run</button>
        <button class="uk-button uk-button-primary uk-width-1-4" v-if='experimentTitle.isDoing' disabled>Test</button>
       </p>
       <p>Procedure</p>
      <table class="uk-table uk-table-hover uk-width-2-3">
        <thead>
          <tr>
            <th></th>
            <th>Device</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b,index) in outlineFilter(a.ID)" class='procedure-order' :key='index'>
            <td>{{index+1}}</td>
            <td>{{b.Device}}</td>
            <td>{{b.Action}}</td>
            <td>{{b.Details}}</td>
          </tr>
        </tbody>
      </table>
      
     </div>    
     </li>
     </ul>
     </div>
  -- ここまで -->

   <!-- レシピ一覧表示 -->  
   
    <ul uk-accordion>
    <li v-for='a in recipeData' :key='a.id'>
        <a class='uk-accordion-title' href='#'>{{a.Title}}</a>
     <div class='uk-accordion-content'>
       <p class='uk-text-left uk-width-2-3'>
        <button class="uk-button uk-button-default uk-width-1-4 min-button-size-1" type="button" uk-toggle='target: #recipe-edit-new' @click='experimentIDis(a)'>Add</button>
        <button class="uk-button uk-button-default uk-width-1-4 min-button-size-2" type="button" uk-toggle='target: #recipe-edit' @click='recipeEditFilter(a)'>Edit</button>
        <button class="uk-button uk-button-primary uk-width-1-4 min-button-size-2" type="button" uk-toggle='target: #recipe-repeat'
        @click='recipeActionFilter(a)' v-if='!experimentTitle.isDoing'>Run</button>
        <button class="uk-button uk-button-primary uk-width-1-4" v-if='experimentTitle.isDoing' disabled>Run</button>
       </p>

       <p>Procedure</p>
       <!--
      <table class="uk-table uk-table-hover uk-width-2-3">
        <thead>
          <tr>
            <th></th>
            <th>Device</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b,index) in outlineFilter(a.ID)" class='procedure-order' :key='index'>
            <td>{{index+1}}</td>
            <td>{{b.Device}}</td>
            <td>{{b.Action}}</td>
            <td>{{b.Details}}</td>
          </tr>
        </tbody>
      </table>
      -->
     </div>    
     </li>
     </ul>
     

    <newrecipe @createRecipe='createRecipe'></newrecipe>
    <recipeaction :recipeAction='recipeAction' :recipeTitle='recipeTitle' :deviceData='deviceData' @experimentStart='experimentStart' ref='recipeAction'></recipeaction>
    <recipeedit :recipeEditer='recipeEditer' :recipeTitle='recipeTitle' @recipeEdit='recipeEdit' @recipeTrash="recipeTrash" ref="recipeEdit"></recipeedit>
    <recipeeditnew :actionData='actionData' :procedureData='procedureData' :experimentID='experimentID' @actionEmit='actionEmit' ref='recipeEditNew'></recipeeditnew>




</div>
</div>
</template>

<script>
import newrecipe from './newrecipe.vue'
import recipeaction from './recipe-action.vue'
import recipeedit from './recipe-edit.vue'
import recipeeditnew from './recipe-edit-new.vue'


export default{
    props:['recipeData','procedureData','blockData','deviceData','actionData','experimentTitle'],

    components:{
        newrecipe,
        recipeaction,
        recipeedit, 
        recipeeditnew,
    },
    
 
     data(){
        return{
          recipeAction:["0","1"], //配列の2番目を定義しないとrecipe-action.vueの方で[1] is undefinedと出る
          recipeTitle:'',
          recipeEditer:[],
          experimentID:'',
          trashtest:null,
          selectedTitle:{
            id: 0
          },
          recipeOutline:[],
          recipeBlock:[],
        }
    },

    methods :{
        createRecipe(a){
            this.$emit('createRecipe',a);
        },

        experimentStart(procedure,device){
          this.$emit('experimentStart',procedure,device);
        },

        //送られてくるのはレシピの配列
        recipeEdit(a){
           this.$emit('recipeEdit',a);
        },

        recipeTrash(trashID){
          this.$emit('recipeTrash',trashID,this.trashtest.ID);
        },

        kakunin(){
          console.log(this.items);
          
        },

        recipeActionFilter(a){
          this.recipeAction.splice(0,1,a);
          this.recipeAction.splice(1,1, this.outlineFilter(a.ID));
          this.recipeTitle = a.Title;
        },

        recipeActionFilterShortcut(a){
          this.recipeAction.splice(0,1,a);
          this.recipeAction.splice(1,1, this.outlineFilter(a.ID));
          this.recipeTitle = a.Title;
          this.$refs.recipeAction.shortcutRun();
        },

        recipeEditFilter(a){
          this.trashtest = a;
          this.recipeEditer = [];
          this.recipeEditer.push(...this.outlineFilter(a.ID));
          this.recipeTitle = a.Title;
        },

        experimentIDis(a){
          this.experimentID = a.ID;
          this.$refs.recipeEditNew.resetDeviceInfo();
        },

        actionEmit(device,action,detail){
          this.$emit('actionEmit',device,action,detail,this.experimentID);
        },

        trashReloadProcedure(trProcedure){
          this.recipeEditer = [];
          this.recipeEditer.push(...trProcedure);
        },

        selectTitle(title){
          this.selectedTitle = title;

          const outline = this.procedureData.filter(x => x.experiment_title_id === this.selectedTitle.id)
          outline.sort(function(first,second){
            if(first.experiment_procedure_order > second.experiment_procedure_order){
              return 1;
            }else if(first.experiment_procedure_order < second.experiment_procedure_order){
              return -1;
            }else{
              return 0;
            }
          });
          this.recipeOutline = outline;

          const procedureIdList = this.recipeOutline.map(x => x.id)
          const block = this.blockData.filter(function(x) {
            return procedureIdList.includes(x.experiment_procedure_id);
          });
          this.recipeBlock = block;
        },

    },

    computed:{
        //computedに引数渡すのはmethodと同じようにはいかない
        outlineFilter2:function(){
            return function(a){
            const data = this.procedureData;
            const result = data.filter(x => x.ExperimentID === a);
            
            result.sort(function(first,second){
              if(first.ProcedureOrder > second.ProcedureOrder){
                return 1;
              }else if(first.ProcedureOrder < second.ProcedureOrder){
                return -1;
              }else{
                return 0;
              }
            });

            return result
            };
        },
    },
}
</script>
<style>
    .min-button-size-1{
        min-width: 120px;
    }
    .min-button-size-2{
        min-width: 90px;
    }

    .title-section{
      overflow: scroll;
    }
</style>