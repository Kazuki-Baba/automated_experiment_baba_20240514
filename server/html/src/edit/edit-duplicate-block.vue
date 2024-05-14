<template>
<div>
     <div>
        <div class="box1">
            <p>
                Click the outline whitch you want to duplicate with different conditions.
            </p>
        </div>
        <div class="uk-grid-divider" uk-grid>
            <div class="uk-width-1-3@m">
                <h4 class="uk-card-title">Recipe outline</h4>
                <table class="uk-table uk-table-hover">
                    <thead>
                    </thead>
                    <tr v-for="(a,index) in editedOutline" :key="a.id" class="mouse-pointer">
                        <td v-if="(a.isEditSelected == false)" @click="selectedEditOutline(index,a.id)">{{a.experiment_procedure_title}}</td>
                        <td v-if="(a.isEditSelected == true)" class="highlight-td">{{a.experiment_procedure_title}}</td>
                    </tr>
                </table>
                <button class='uk-button uk-button-primary' type='button' disabled v-show="editCondition.length ==0">Enter</button>
                <button class='uk-button uk-button-primary' type='button' uk-toggle="target: #duplicate-process" v-show="editCondition.length !==0" @click="openDuplicateModal()">Enter</button>
            </div>

            <div class="uk-width-2-3@m">
                <div>
                    <div>
                        <h4 class="uk-card-title">Experiment condition</h4>
                        <h5 v-if="editBlock.length == 0">No experiment condition</h5>
                        <div v-if="editCondition.length !==0" class="uk-card uk-card-default uk-card-body">
                            <div>
                                <table class="uk-table uk-table-divider">
                                    <thead>
                                        <tr>
                                            <th>Experiment condition title</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="cond in editCondition" :key="cond.id" class="uk-text-left">
                                            <td>{{cond.condition_title}}</td>
                                            <td>{{cond.value}}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div></div>
                    <div>
                        <h4 class="uk-card-title">Procedure</h4>
                        <h5 v-if="editBlock.length == 0">No procedure</h5>
                        <div v-if="editBlock.length !== 0" class="uk-card uk-card-default uk-card-body">
                            <table v-show="editBlock.length !== 0" class="uk-table uk-table-divider uk-text-left">
                            <thead class="uk-text-center">
                                <tr>
                                <th></th>
                                <th>Device</th>
                                <th>Action</th>
                                <th>Detail</th>
                                <th>Experiment condition title</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(a,index) in editBlock" :key="a.id">
                                <td>{{index+1}}</td>
                                <td>{{a.device_name}}</td>
                                <td>{{a.action}}</td>
                                <td>{{a.detailView}}</td>
                                <td><span v-show="a.condition_id !== null">{{conditionTitle(a.condition_id)}}</span></td>
                                </tr>
                            </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    
    <duplicate-block-modal ref="duplicateBlockModal" :actionLinkList="actionLinkList" :valueChoiceList="valueChoiceList"
    @submitDuplicateCondition="submitDuplicateCondition"></duplicate-block-modal>

</div>
</template>
    
<script>
import duplicateBlockModal from "./duplicate-block-modal.vue";
import ui from "uikit";

export default {
    props:["editBlockParent","conditionList","actionLinkList","valueChoiceList"],

    components:{
        duplicateBlockModal,
    },

    data(){
        return{
            selectedOutlineId:0,
            editedOutline:[],
            editBlock:[],
            editCondition:[],
        }
    },

    methods:{
        blockFilter(outlineId){
            this.editBlock = this.editBlockParent.filter(function(elem){
                return elem.experiment_procedure_id == outlineId;
            });
        },

        conditionFilter(outlineId){
            this.editCondition = this.conditionList.filter(function(elem){
                return elem.experiment_procedure_id == outlineId;
            });
        },

        resetEditedOutline(editOutline){//親から発火
            this.selectedOutlineId = 0;
            this.editedOutline.splice(0, this.editedOutline.length);
            this.editedOutline = JSON.parse(JSON.stringify(editOutline));
            this.editedOutline.splice();//リアクティブにする
            this.resetOutlineFlag();
        },

        resetOutlineFlag(){
            this.editedOutline.forEach(function(elem){
                elem.isEditSelected = false;
            });
        },

        resetEditedBlock(){
            this.editBlock.splice(0, this.editBlock.length);

            if(this.selectedOutlineId !== 0){
                this.blockFilter(this.selectedOutlineId);
            }
        },
        
        resetEditCondition(){
            this.editCondition.splice(0, this.editCondition.length);

            if(this.selectedOutlineId !== 0){
                this.conditionFilter(this.selectedOutlineId);
            }
        },

        selectedEditOutline(index,selectedId){
            this.resetOutlineFlag();
            this.editedOutline[index].isEditSelected = true;
            this.editedOutline.splice(); //リアクティブにする

            this.selectedOutlineId = selectedId;

            this.blockFilter(selectedId);
            this.conditionFilter(selectedId);
        },

        conditionTitle(conditionId){
            if(conditionId == null || !(this.conditionList.length > 0)){
                return null
            }


            const title = this.conditionList.find(elem => elem.id == conditionId);
            if(title == -1){
                return null
            }
            return title.condition_title
        },

        openDuplicateModal(){//modalにコンディションの情報を共有する
            ui.switcher('#subnav-duplicate-main').show(0);//子要素のmodalの中身を最初の画面に
            this.$refs.duplicateBlockModal.insertCondition(this.editCondition);
        },

        submitDuplicateCondition(condition){
            let length = condition.length;
            let outline = JSON.parse(JSON.stringify(this.editedOutline));
            outline.forEach(function(e){
                e.isCopied = false
            })
            let idx = outline.findIndex(function(elem){
                return elem.isEditSelected
            });
            let originalOutline

            if(idx >= 0){
                originalOutline = outline.splice(idx,1)[0];
                originalOutline.isCopied = true;
                for(let i=0; i < length; i++){
                    let o =JSON.parse(JSON.stringify(originalOutline));
                    outline.splice(idx,0,o);
                }
            }else{
                console.log("ERROR : 複製に失敗しました")
                return
            }
            for(let i=0; i < outline.length; i++){
                    outline[i].experiment_procedure_order = i + 1;
                }


            this.$emit("submitDuplicateCondition",{condition:condition, outline:outline, originalOutline:originalOutline})
        }
    },

    watch:{
        editBlockParent: function(){
            this.resetEditedBlock();
            this.resetEditCondition();
        },

        conditionList: function(){
            this.resetEditCondition();
        },
    },

    computed:{
        
    },
}
</script>