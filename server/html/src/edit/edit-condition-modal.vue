<template>
<div id="conditionEditModal" uk-modal bg-close="false">
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h4>Revise the experiment condition</h4>
        </div>
        <div class='uk-modal-body'>
            <div>
                <table class="uk-table uk-table-divider uk-text-left">
                    <thead>
                        <tr>
                        <th>Experiment Condition title</th>
                        <th>Original value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td><input v-model.trim='reviseCondition.conditionTitle' type='text' class='uk-input'></td>
                        <td class="uk-text-center">{{editedCondition.value}}</td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <table class="uk-table uk-table-divider uk-text-left">
                        <thead>
                            <tr>
                            <th>New Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                            <td>
                                <div v-if="(action.detail_number == 1)">
                                    <input v-show="!reviseCondition.isValueChoice && (action.action !== 'alert') " v-model.trim='reviseCondition.value' type='number' min="0" placeholder='value' class='uk-input uk-width-1-3'>
                                    <input v-show="!reviseCondition.isValueChoice && (action.action == 'alert') " v-model.trim='reviseCondition.value' type="text" placeholder='sampling!!' class='uk-input uk-width-1-3'>
                                    <select v-show="reviseCondition.isValueChoice" v-model.trim='reviseCondition.value' class='uk-select uk-width-1-3'>
                                        <option disabled :value='null' selected>--Value select--</option>
                                        <option v-for='d in choices' :value='d.value' :key="d.id">{{d.value}}</option>
                                    </select> 
                                    <span v-if="(action.action == 'waiting')">seconds</span>
                                </div>
                                <div v-if="(action.detail_number == 2)">
                                    <input v-model.trim='reviseCondition.value' type='number' placeholder='value' min='0' class='uk-input uk-width-1-3'>
                                    <input v-show="!reviseCondition.isUnitChoice" v-model.trim='reviseCondition.unit' type='text' placeholder='unit' class='uk-input uk-width-1-3'>
                                    <select v-show="reviseCondition.isUnitChoice" v-model.trim='reviseCondition.unit' class='uk-select uk-width-1-3'>
                                        <option disabled :value='null' selected>--Unit select--</option>
                                        <option v-for='d in choices' :value='d.unit' :key="d.id">{{d.unit}}</option>
                                    </select>
                                </div>
                            </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
            <div>
                <button class="uk-button uk-button-danger uk-modal-close" type="button" @click="resetCondition()">Cancel</button>
                <button class="uk-button uk-button-default uk-margin-small-right uk-modal-close" type="button" 
                @click="submitReviseCondition()" v-show="isFullCondition">OK</button>
                <button class="uk-button uk-button-default uk-margin-small-right" type="button" v-show="!isFullCondition" disabled>OK</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>

export default {
    props:["editedCondition","actionLinkList","valueChoiceList"],

    components:{

    },

    data(){
        return{
            reviseCondition:{
                value:null,
                unit:null,
                conditionTitle:"",
                isValueChoice:false,
                isUnitChoice:false,
            },
        }
    },

    methods:{
        resetCondition(){
            Object.keys(this.reviseCondition).forEach(key => {
                this.$delete(this.reviseCondition, key)
            });
        },

        submitReviseCondition(){
            this.$set(this.reviseCondition,'detailNumber',this.action.detail_number);
            this.$set(this.reviseCondition,'conditionId',this.editedCondition.id);
            this.$emit("submitReviseCondition",this.reviseCondition);
            this.resetCondition();
        },
    },

    watch:{
    },

    computed:{
        action: function(){
            const deviceLinkId = this.editedCondition.device_link_id;
            const action = this.actionLinkList.find(elem => elem.id == deviceLinkId);
            if(action == void(0)){
                return {}
            }

            this.$set(this.reviseCondition,'conditionTitle',this.editedCondition.condition_title);

            return action
        },
        choices: function(){
            const deviceLinkId = this.editedCondition.device_link_id;
            const choice = this.valueChoiceList.filter(elem => elem.device_link_id == deviceLinkId);

            this.$set(this.reviseCondition,'isValueChoice',false);
            this.$set(this.reviseCondition,'isUnitChoice',false);

            if(choice.length !== 0){
              choice.forEach(function(x){
                  if(x.value !== null){
                      this.$set(this.reviseCondition,'isValueChoice',true);
                  };
                  if(x.unit !== null){
                      this.$set(this.reviseCondition,'isUnitChoice',true);
                  };
              },this);
          }
            
            return choice
        },

        isFullCondition:function(){
            if(this.action.detail_number > 0){
                if(this.reviseCondition.value == null){
                    return false
                }
            };
            if(this.action.detail_number == 2){
                if(this.reviseCondition.unit == null){
                    return false
                }
            };
            if(this.reviseCondition.conditionTitle.length == 0){
                return false
            }
            return true
        }

    },
}
</script>