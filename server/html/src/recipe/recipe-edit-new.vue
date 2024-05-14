<template>
<div id='recipe-edit-new' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
           <h2 class="uk-modal-title">Add new procedure</h2>
        </div>
        <div class='uk-modal-body'>
            
                Device<br>
                    <input type='radio' v-model='deviceRadio' value='newDev' class='uk-radio'>
                    <input v-model.trim='newDeviceNew' type='text' placeholder='New' class='uk-input uk-width-1-3' @click='radioAutoCheck(0)'>
                    <input type='radio' v-model='deviceRadio' value='oldDev' class='uk-radio'>
                    <select v-model='newDeviceOld' class='uk-select uk-width-1-3' @click='radioAutoCheck(1)'>
                        <option disabled :value='""' selected>--existing device--</option>
                        <option v-for='(d,i) in newDeviceOldArray' :value='d' :key='i'>{{d}}</option>
                    </select>
                    <input type='radio' v-model="deviceRadio" value="waiting" class="uk-radio" @change="waitDetailSet" id="waitDev"><label for="waitDev">Waiting</label>
                <br>
                Action
                    <select v-model='selectedAction' class='uk-select'>
                        <option disabled :value='{}' selected>--Action select--</option>
                        <option v-for='(d, i) in actionData' :value='d' :key="i">{{d.Action}}</option>
                    </select>
                <div v-show='detailFilter(selectedAction)'>  
                    Detail
                    <detailcomponent :selectedAction='selectedAction' :newDetailTemp.sync='newDetailTemp'
                    :newDetailUnitTemp.sync='newDetailUnitTemp' ref='detailComponent'></detailcomponent>
                </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
            <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
            <button class="uk-button uk-button-primary uk-modal-close" type="button" @click='recipeEdit'>Add</button>
        </div>
    </div>

</div>
</template>

<script>

import detailcomponent from './recipe-edit-new-ditail.vue';

export default{
    props:['actionData','procedureData','experimentID'],

     components:{
       detailcomponent
    },

    data(){
        return{ 
            newDevice:'',
            newDetail:'',
            newDetailTemp:'',
            newDetailUnitTemp:'',
            newDeviceNew:'',
            newDeviceOld:'',
            deviceRadio:'',
            selectedAction:{},
        }
    },

    mounted(){
    },

    methods :{
        testetete(){
            console.log('テスト');
        },

        resetEdit(){
            this.newDevice = '';
            this.newDetail='';
            this.newDetailTemp='';
            this.newDetailUnitTemp='',
            this.newDeviceNew='',
            this.newDeviceOld='',
            this.deviceRadio='',
            this.selectedAction={};
        },

        recipeEdit(){
            this.newDetail= this.newDetailTemp + ' ' + this.newDetailUnitTemp;
            switch(this.deviceRadio){
                case 'newDev':
                    this.newDevice = this.newDeviceNew;
                    break;
                case 'oldDev':
                    this.newDevice = this.newDeviceOld;
                    break;
                case 'waiting':
                    this.newDevice = '-';
            }

            this.$emit('actionEmit',this.newDevice,this.selectedAction,this.newDetail);
            this.resetEdit();
        },

        detailFilter(action){
            switch(action.Argument){
                case 'wait' :
                    return true
                case '--irate' :
                    return true
                case '--wrate' :
                    return true
                case '--changePos' :
                    return true
                default :
                    return false
            }
        },

        radioAutoCheck(num){
            if(num == 0){
                this.deviceRadio = 'newDev';
            }else if(num == 1){
                this.deviceRadio = 'oldDev';
            }
        },

        resetDeviceInfo(){
            //モーダルを開いた時に動く関数
            this.resetEdit();

            this.deviceRadio = 'newDev';
            this.$refs.detailComponent.resetValueUnit();
        },
        
        waitDetailSet(){
            let waitActionIndex = this.actionData.findIndex((elem) => elem.Argument === 'wait');
            this.selectedAction = this.actionData[waitActionIndex];
        }
    },

    watch:{

    },

    computed:{
        newDeviceOldArray: function(){
            let experimentID = this.experimentID
            let aaaa = [...this.procedureData.filter(function(x){
                return x.ExperimentID == experimentID;
            })]
            let bbbb = [...aaaa].map(x => x.Device);
            let cccc = [...new Set(bbbb)];
            let delIndex = cccc.indexOf('-');
            if(delIndex >= 0){
                cccc.splice(delIndex,1);
            }

            return cccc
       },
    },
    
}

</script>
<style scoped lang='scss'>
  .recipe-infomation {
    display:inline-block;
    width: 5em;
  }

</style>