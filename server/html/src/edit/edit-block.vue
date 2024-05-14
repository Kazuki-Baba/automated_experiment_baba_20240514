<template>
<div>
    <div>
        <div class="uk-grid-divider" uk-grid>
            <div class="uk-width-1-3@m">
                <h5>Recipe outline</h5>
                <table class="uk-table uk-table-hover">
                    <thead>
                    </thead>
                    <tr v-for="(a,index) in editedOutline" :key="a.id" class="mouse-pointer">
                        <td v-if="(a.isEditSelected == false)" @click="selectedEditOutline(index,a.id)">{{a.experiment_procedure_title}}</td>
                        <td v-if="(a.isEditSelected == true)" class="highlight-td">{{a.experiment_procedure_title}}</td>
                    </tr>
                </table>
            </div>
            <div class="uk-width-2-3@m">
                <div>
                    <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-edit-condition-contents' id='subnav-edit-condition-main'>
                        <li><a href="#"> Procedure </a></li>
                        <li><a href="#"> Experiment Condition </a></li>
                    </ul>

                    <ul class="uk-switcher uk-margin" id="subnav-edit-condition-contents">
                        <li>
                            <div>
                                <h4 class="uk-card-title">Procedure</h4>
                                <h4 v-if="editBlock.length == 0">No procedure</h4>
                                <div v-if="editBlock.length !== 0" class="uk-card uk-card-default uk-card-body">
                                    <table v-show="editBlock.length !== 0" class="uk-table uk-table-divider uk-text-left">
                                    <thead class="uk-text-center">
                                        <tr>
                                        <th><span uk-icon="icon: trash; ratio:1.5" v-show="(trashBlockId.length > 0)" @click="trashBlock()" class="mouse-pointer"></span></th>
                                        <th></th>
                                        <th>Device</th>
                                        <th>Action</th>
                                        <th>Detail</th>
                                        <th>Option</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(a,index) in editBlock" :key="a.id">
                                        <td><input class="uk-checkbox" type="checkbox" :value="a.id" v-model="trashBlockId"></td>
                                        <td>{{index+1}}</td>
                                        <td>{{a.device_name}}</td>
                                        <td>{{a.action}}</td>
                                        <td>{{a.detailView}}</td>
                                        <td>
                                            <span uk-icon="file-edit" @click="detailEdit(a)" v-show="a.detail !== null" class="mouse-pointer" uk-toggle="target: #detailEditModal"></span>
                                            <span v-show="a.condition_id !== null">{{conditionTitle(a.condition_id)}}</span>
                                        </td>
                                        </tr>
                                    </tbody>
                                    </table>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div>
                                <h4 class="uk-card-title">Experiment condition</h4>
                                <div v-if="editCondition.length !==0" class="uk-card uk-card-default uk-card-body">
                                    <div>
                                        <table class="uk-table uk-table-divider">
                                            <thead>
                                                <tr>
                                                    <th>Experiment Condition title</th>
                                                    <th>Value</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="cond in editCondition" :key="cond.id" class="uk-text-left">
                                                    <td>{{cond.condition_title}}</td>
                                                    <td>{{cond.value}}</td>
                                                    <td><span uk-icon="icon: file-edit" @click="conditionEdit(cond)" class="mouse-pointer" uk-toggle="target: #conditionEditModal"></span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <edit-detail-modal :editedDetail="editedDetail" :valueChoiceList="valueChoiceList" 
    @reviseBlockDetail="reviseBlockDetail" ref="editDetailModal"></edit-detail-modal>
    <edit-condition-modal :editedCondition="editedCondition" :actionLinkList="actionLinkList" :valueChoiceList="valueChoiceList" @submitReviseCondition="submitReviseCondition"></edit-condition-modal>
</div>
</template>

<script>
import editDetailModal from "./edit-detail-modal.vue"
import editConditionModal from "./edit-condition-modal.vue"

export default {
    props:["editBlockParent","valueChoiceList","conditionList","actionLinkList"],

    components:{
        editDetailModal,
        editConditionModal 
    },

    data(){
        return{
            editedOutline:[],
            editBlock:[],
            editCondition:[],
            trashBlockId:[],
            editedDetail:{},
            editedCondition:{},
            selectedOutlineId:0,
            selectedLinkId:0,
        }
    },

    methods:{
        resetAll(){
            this.resetOutlineFlag();
            this.selectedOutlineId = 0;
            this.resetEditedBlock();
            this.resetEditCondition();
            this.trashBlockId.splice(0, this.trashBlockId.length);
        },

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

        detailEdit(a){
            this.editedDetail = Object.assign({}, this.editedDetail, a);
            this.$refs.editDetailModal.addDetailAssignment(this.editedDetail);

            //detailの選択項目に表示するやつを絞る
            let deviceIdFiltered = this.actionLinkList.filter(function(elem){
                return elem.device_type_id == a.device_type_id
            });

            let actionIdFiltered = deviceIdFiltered.filter(function(elem){
                return elem.action_id == a.action_id
            });

            if(actionIdFiltered.length > 0){
                this.selectedLinkId = actionIdFiltered[0].id
            }else{
                this.selectedLinkId = -1 //無いですよの意味
            }

            this.$refs.editDetailModal.addDetailAssignment(this.editedDetail,this.selectedLinkId);
        },

        conditionEdit(a){
            this.editedCondition = a;
        },

        conditionTitle(conditionId){
            if(conditionId == null){
                return null
            }

            const title = this.conditionList.find(elem => elem.id == conditionId);
            if(title == -1){
                return null
            }
            return title.condition_title
        },
        
        reviseBlockDetail(blockId,addDetail){
            this.$emit("reviseBlockDetail",blockId,addDetail);
        },

        submitReviseCondition(condition){
            this.$emit("submitReviseCondition",condition);
        },

        trashBlock(){
            this.$emit("trashBlock",this.trashBlockId);
            this.trashBlockId.splice(0, this.trashBlockId.length);
        },
    },

    watch:{
        editBlockParent: function(){
            this.resetEditedBlock();
        },

        conditionList: function(){
            this.resetEditCondition();
        },
    },

    computed:{

    },
}
</script>