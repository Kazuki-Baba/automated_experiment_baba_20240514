<template>
<div class='uk-card uk-card-body uk-card-default'>
  <p>
   Create new recipe : <button class='uk-button uk-button-default uk-margin-small-right' type='button' uk-toggle='target: #new-recipe'>New</button>
  </p>
  <newrecipe @createRecipe='createRecipe'></newrecipe>
<div>
  <h4 class="uk-card-title">Recipe list</h4>
  <div class="uk-card uk-card-body uk-card-default uk-height-medium title-section">
      <h4 v-if="recipeData.length == 0">No recipe list</h4>
      <table class="uk-table uk-table-striped uk-table-hover uk-table-small mouse-pointer">
        <tbody>
          <tr v-for="(title) in recipeData" :key="title.id">
            <td @click="selectTitle(title)" v-bind:class="{'highlight-td': activeTitle === title.id}">{{title.experiment_title}}</td>
          </tr>
        </tbody>
      </table>
  </div>


  <div class="uk-grid-collapse uk-text-center" uk-grid>
    <div class="uk-width-1-3">
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Recipe outline</h4>
        <div v-show="selectedTitle.id !== 0">
          <div>
              <button v-show="selectedTitle.id !== 0" class="uk-button uk-button-default uk-width-1-4 min-button-size-2" type="button" 
               @click="editProcedure()">Edit</button>
               <!--
              <button class="uk-button uk-button-primary uk-width-1-4 min-button-size-2" type="button" uk-toggle='target: #fl-recipe-repeat'
              v-if='!experimentTitle.isDoing' @click="duplicateOutline()">Run</button><P></P>
              -->
              <button class="uk-button uk-button-primary min-button-size-2" type="button" uk-toggle='target: #fl-recipe-device'
              v-if='!experimentTitle.isDoing' @click="shortcutExperimentStart()">Run</button>
          </div>
          <h4 v-if="recipeOutline.length == 0">No outline</h4>
          <ul class="uk-list uk-list-large uk-text-large">
            <li v-for="a in recipeOutline" :key="a.id">
              {{a.experiment_procedure_title}}
            </li> 
          </ul>
        </div>
      </div>
    </div>
    <div class="uk-width-2-3">
      <div class="uk-card uk-card-default uk-card-body">
        <h4 class="uk-card-title">Procedure</h4>
        <div v-show="selectedTitle.id !== 0">
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
                <td>{{index+1}}</td>
                <td>{{a.device_name}}</td>
                <td>{{a.action}}</td>
                <td>{{a.detailView}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>


</div>

<flrecipeaction :recipeTitle='selectedTitle' :recipeOutline="recipeOutline" :recipeBlock="recipeBlock" :not-concat-recipe-block="notConcatRecipeBlock"
:recipeCondition="recipeCondition" :deviceData='deviceData' @experimentStart='experimentStart' ref='flRecipeAction'></flrecipeaction>

</div>
</template>

<script>

import flrecipeaction from './fl-recipe-action.vue'
import newrecipe from '../recipe/newrecipe.vue'

export default{
    props:['recipeData','procedureData','blockData','deviceData','experimentTitle','conditionData'],


    components:{
        flrecipeaction,
        newrecipe
    },  


     data(){
        return{
          recipeEditer:[],
          experimentID:'',
          trashtest:null,
          selectedTitle:{
            id: 0
          },
          recipeOutline:[],
          recipeBlock:[],
          recipeCondition:[],
          notConcatRecipeBlock:[],
          activeTitle:0,
        }
    },


    methods :{
        resetTitle(){
          Object.keys(this.selectedTitle).forEach(key => {
            this.$delete(this.selectedTitle, key)
          });
          this.$set(this.selectedTitle,'id',0);
        },

        createRecipe(a){
          this.$emit('createRecipe',a);
        },

        selectTitle(title){
          this.selectedTitle = Object.assign({},title);

          if(this.activeTitle !== title.id){
            this.activeTitle = title.id;
          }else{
            this.activeTitle = 0;
          }

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

          //blockListを整形
          if(this.blockData === null) return

          const procedureIdList = this.recipeOutline.map(x => x.id)
          const block = this.blockData.filter(function(x) {
            return procedureIdList.includes(x.experiment_procedure_id);
          });
   
          const blockList = procedureIdList.map(function(x){
            return block.filter(function(y){
              return y.experiment_procedure_id == x
            });
          });

          blockList.forEach(function(array){
            array.sort(function(first,second){
              if(first.experiment_block_order > second.experiment_block_order){
                return 1;
              }else if(first.experiment_block_order < second.experiment_block_order){
                return -1;
              }else{
                return 0;
              }
            });
          });
          //各手順outlineの手順を配列で保持したまま
          this.notConcatRecipeBlock =JSON.parse(JSON.stringify(blockList));
          //一元化
          this.recipeBlock = [].concat(...blockList);

          this.makeDetailView();
          

          this.recipeCondition = this.conditionData.filter(function(x) {
            return procedureIdList.includes(x.experiment_procedure_id);
          });

          this.$emit('selectEditTitle',this.selectedTitle);
        },

        makeDetailView(){
          //detailとcondition_idの正しい方を表示させるために(detailView追加)
          for(let i = 0; i < this.recipeBlock.length; i++){
              if(this.recipeBlock[i].condition_id){
                let index = this.conditionData.findIndex(({id}) => id == this.recipeBlock[i].condition_id);
                this.recipeBlock[i].detailView = this.conditionData[index].value;
              }else if(this.recipeBlock[i].detail){
                  this.recipeBlock[i].detailView = this.recipeBlock[i].detail;
              }else{
                 this.recipeBlock[i].detailView = null;
              };
          };
        },

        experimentStart(a){
           this.$emit('experimentStart', a);         
        },

        duplicateOutline(){
          this.$refs.flRecipeAction.duplicateOutline();
        },

        shortcutExperimentStart(){
          this.$refs.flRecipeAction.duplicateOutline();
          this.$refs.flRecipeAction.makeCondition();
          this.$refs.flRecipeAction.makeProcedureInfo();
        },
        
        editProcedure(){
          this.$emit('editProcedure');
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