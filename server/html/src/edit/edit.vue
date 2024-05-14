<template>
<div>
    <div class="uk-card uk-card-body uk-card-default">
        <!--<button class='uk-button uk-button-danger' type='button'>ふぇふぇふぇ</button> -->
        <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#edit-procedure-contents' id='subnav-edit-procedure'>
            <li> <a href="#"> Add </a> </li>
            <li> <a href="#"> Reorder </a> </li>
            <li><a href="#"> Copy </a></li>
            <li><a href="#"> Duplicate </a></li>
            <li><a href="#"> Edit </a></li>
            <li><a href="#"> All delete </a></li>
        </ul>
        <ul class="uk-switcher uk-margin" id="edit-procedure-contents">
            <li><!-- 追加手順 -->
                <div class="uk-card uk-card-body uk-card-default">
                    <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-add-procedure-contents' id='subnav-add-procedure'>
                        <li><a href="#"> Outline </a></li>
                        <li><a href="#"> plocedure block </a></li>
                    </ul>

                    <ul class="uk-switcher uk-margin" id="subnav-add-procedure-contents">
                        <li>
                            <div>
                                <div v-if="!(editTitle.id == 0)">
                                    <input v-model.trim='newOutline' type='text' placeholder='New outline' class='uk-input' autofocus>
                                    <div>
                                        <button class='uk-button uk-button-default' type='button' @click="cancelOutline()">Cancel</button>
                                        <button v-if='isKaramoji' class="uk-button uk-button-primary" disabled>Create new outline</button> 
                                        <button v-if="!isKaramoji" class='uk-button uk-button-default' type='button' @click="submitOutline()">Create new outline</button>
                                    </div>
                                    <div class="uk-width-2-3">
                                        <outline-table :editOutline="editOutline"></outline-table>
                                    </div>
                                </div>
                                <h4 v-if="(editTitle.id == 0)">Please select the title for editing or check the console log</h4>                        
                            </div>
                        </li>

                        <li>
                            <div class="uk-grid-divider" uk-grid>

                                <div class="uk-width-1-2@m">
                                    <div>
                                        <h5>Recipe outline</h5>
                                        <table class="uk-table uk-table-hover">
                                            <thead>
                                            </thead>
                                            <tr v-for="(a,index) in addedOutline" :key="a.id" class="mouse-pointer">
                                                <td v-if="(a.isAddSelected == false)" @click="selectedAddOutline(index,a.id)">{{a.experiment_procedure_title}}</td>
                                                <td v-if="(a.isAddSelected == true)" class="highlight-td">{{a.experiment_procedure_title}}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div>
                                        <hr>
                                        <h5>Procedure</h5>
                                        <h5 v-if="addedBlock.length == 0">No procedure</h5>
                                        <table v-show="addedBlock.length !== 0" class="uk-table uk-table-divider">
                                        <thead>
                                            <tr>
                                            <th></th>
                                            <th>Device</th>
                                            <th>Action</th>
                                            <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(a,index) in addedBlock" :key="a.id" class="uk-text-left">
                                            <td>{{index+1}}</td>
                                            <td>{{a.device_name}}</td>
                                            <td>{{a.action}}</td>
                                            <td>{{a.detailView}}</td>
                                            </tr>
                                        </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div  class="uk-width-1-2@m">
                                    <h4 class="uk-card-title">Add new procedure</h4>
                                    <div v-show="(newAddedBlock.procedureId == -1)">Please select outline to add new procedure</div>
                                    <div v-show="(newAddedBlock.procedureId !== -1)">
                                    <div>
                                        <h5><b>Device</b></h5>
                                        <div>
                                            <input type='radio' v-model='addDeviceRadio' value='newDev' class='uk-radio'>
                                            <input v-model.trim='addNewDevice.name' type='text' placeholder='New device name' class='uk-input uk-width-1-3' @click='radioAutoCheck(0)'>
                                            <input type='radio' v-model='addDeviceRadio' value='oldDev' class='uk-radio'>
                                            <select v-model='addOldDevice' class='uk-select uk-width-1-3' @click='radioAutoCheck(1)'>
                                                <option disabled :value='{}' selected>--saved device--</option>
                                                <option v-for='d in oldDevice' :value='d' :key='d.id'>{{d.device_name}}</option>
                                            </select>
                                            <input type='radio' v-model="addDeviceRadio" value='noDev' class="uk-radio" id="noDev"><label for="noDev">No device</label>
                                        </div>
                                        <div v-if="deviceNameConflict" class="uk-text-danger">Dont't set the same name as the old device's</div>
                                        <br>
                                    </div>
                                    <div v-if="(addDeviceRadio == 'newDev')">
                                        <div>
                                        <h5><b>Device type</b></h5>
                                            <select v-model="addNewDevice.deviceType" class='uk-select uk-width-1-2'>
                                                <option disabled :value='{}' selected>--Device type--</option>
                                                <option v-for="d in deviceTypeListTemp" :value="d" :key="d.id">{{d.device_type_name}}</option>
                                            </select>
                                        </div>
                                        <br>
                                    </div>
                                    <div>
                                        <h5><b>Action</b></h5>
                                        <div>
                                            <select v-model='addSelectedAction' class='uk-select uk-width-1-2'>
                                                <option disabled :value='{}' selected>--Action select--</option>
                                                <option v-for='d in actionList' :value='d' :key="d.id">{{d.action}}</option>
                                            </select>  
                                        </div>
                                        <br>
                                    </div>
                                    <div  v-show="(addSelectedAction.detail_number > 0)">
                                        <h5><b>Detail</b></h5>
                                        <div>
                                            <input type='radio' v-model='conditionRadio' value='newCondition' class='uk-radio' id="newCondition"><label for="newCondition">create new detail</label>
                                            <input type='radio' v-model='conditionRadio' value='oldCondition' class='uk-radio' id="oldCondition"><label for="oldCondition">choose from the saved conditon</label>
                                        </div>
                                        <br>
                                        <div>
                                            <div v-show="conditionRadio == 'newCondition'">
                                                <div v-if="(addSelectedAction.detail_number == 1)">
                                                    <input v-show="!addDetail.isValueChoice && (addSelectedAction.action !== 'alert')" v-model.trim='addDetail.value' type='number' min="0" placeholder='value' class='uk-input uk-width-1-3'>
                                                    <input v-show="!addDetail.isValueChoice && (addSelectedAction.action == 'alert')" v-model.trim='addDetail.value' type='text' placeholder='sampling!!' class='uk-input uk-width-1-3'>
                                                    <select v-show="addDetail.isValueChoice" v-model='addDetail.value' class='uk-select uk-width-1-3'>
                                                        <option disabled :value='null' selected>--Value select--</option>
                                                        <option v-for='d in detailChoice' :value='d.value' :key="d.id">{{d.value}}</option>
                                                    </select> 
                                                    <span v-if="(addSelectedAction.action == 'waiting')">seconds</span>
                                                </div>
                                                <div v-if="(addSelectedAction.detail_number == 2)">
                                                    <input v-model.trim='addDetail.value' type='number' placeholder='value' min='0' class='uk-input uk-width-1-3'>
                                                    <input v-show="!addDetail.isUnitChoice" v-model.trim='addDetail.unit' type='text' placeholder='unit' class='uk-input uk-width-1-3'>
                                                    <select v-show="addDetail.isUnitChoice" v-model.trim='addDetail.unit' class='uk-select uk-width-1-3'>
                                                        <option disabled :value='null' selected>--Unit select--</option>
                                                        <option v-for='d in detailChoice' :value='d.unit' :key="d.id">{{d.unit}}</option>
                                                    </select>
                                                </div>
                                                <br>
                                                <div>
                                                    <input class="uk-checkbox" type="checkbox" :value="true" v-model="addDetail.isNewCondition" name="addDetailCheck" id="addDetailCheck">
                                                    <label for="addDetailCheck">this detail is saved as a experiment condition.</label>
                                                    <input v-show="addDetail.isNewCondition" v-model.trim='addDetail.conditionTitle' type='text' placeholder='condition title (ex. flow rate of regent A)' class='uk-input'>
                                                </div>
                                            </div>
                                            <div v-show="conditionRadio == 'oldCondition'">
                                                <select v-model="addDetail.fromCondition" class="uk-select uk-width-2-3">
                                                    <option disabled :value="null" selected>--Experiment condition--</option>
                                                    <option v-for="c in conditionChoice" :value="c.id" :key="c.id">[{{c.condition_title}}] {{c.value}}</option>
                                                </select>
                                            </div>
                                            <br>
                                        </div>
                                    </div>
                                    <div class="uk-text-right">
                                        <button class="uk-button uk-button-default" type="button" @click="resetAddBlock()">Cancel</button>
                                        <button v-show="isFullAddProcedure" class="uk-button uk-button-primary" type="button" @click='submitAddBlock()'>Add</button>
                                        <button v-show="!isFullAddProcedure" class="uk-button uk-button-primary" type="button" disabled>Add</button>
                                    </div>
                                        
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>

            <li><!-- 並べ替え -->
                <div class="uk-card uk-card-body uk-card-default">
                    <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-reorder-procedure-contents' id='subnav-reorder-procedure'>
                        <li><a href="#"> Outline </a></li>
                        <li><a href="#"> plocedure block </a></li>
                    </ul>

                    <ul class="uk-switcher uk-margin" id="subnav-reorder-procedure-contents">
                        <li>
                            <div class="box1">
                                <p>
                                    Sort outline by drag and drop 
                                </p>
                            </div>
                            <div>
                                    <h4 class="uk-card-title">Recipe outline</h4>
                                    <h4 v-if="editOutline.length == 0">No outline</h4>
                                    <div class="uk-child-width-expand@s" uk-grid>
                                        <div>
                                            <draggable v-model="reorderedOutline" tag="ul" class="uk-list uk-list-large uk-text-large">
                                                <li v-for="a in reorderedOutline" :key="a.id" class="mouse-pointer">
                                                    {{a.experiment_procedure_title}}
                                                </li> 
                                            </draggable>
                                        </div>
                                    </div>
                                    <div>
                                        <button class='uk-button uk-button-default' type='button' @click="resetReorderdOutline()">Cancel</button>
                                        <button class="uk-button uk-button-primary" type="button" @click='reorderOutline()'>Enter</button>
                                    </div>
                            </div>
                        </li>

                        <li>
                            <div class="box1">
                                <p>
                                    Sort procedure by drag and drop 
                                </p>
                            </div>
                            <div>
                                <div class="uk-grid-divider" uk-grid>
                                    <div class="uk-width-1-3@m">
                                        <h5>Recipe outline</h5>
                                        <table class="uk-table uk-table-hover">
                                            <thead>
                                            </thead>
                                            <tr v-for="(a,index) in reorderedOutline" :key="a.id" class="mouse-pointer">
                                                <td v-if="(a.isReorderSelected == false)" @click="selectedReorderOutline(index,a.id)">{{a.experiment_procedure_title}}</td>
                                                <td v-if="(a.isReorderSelected == true)" class="highlight-td">{{a.experiment_procedure_title}}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="uk-width-2-3@m">
                                        <h4 class="uk-card-title">Procedure</h4>
                                        <h4 v-if="reorderedBlock.length == 0">No procedure</h4>
                                        <div v-if="!(reorderedBlock.length == 0)">
                                            <button class='uk-button uk-button-default' type='button' @click="cancelReorderBlock()">Cancel</button>
                                            <button class="uk-button uk-button-primary" type="button" @click='reorderBlock()'>Enter</button>
                                        </div>
                                        <table v-show="reorderedBlock.length !== 0" class="uk-table uk-table-divider">
                                        <thead>
                                            <tr>
                                            <th></th>
                                            <th>Device</th>
                                            <th>Action</th>
                                            <th>Details</th>
                                            </tr>
                                        </thead>
                                        <draggable tag="tbody" v-model="reorderedBlock">
                                            <tr v-for="(a,index) in reorderedBlock" :key="a.id" class="uk-text-left mouse-pointer">
                                            <td>{{index+1}}</td>
                                            <td>{{a.device_name}}</td>
                                            <td>{{a.action}}</td>
                                            <td>{{a.detailView}}</td>
                                            </tr>
                                        </draggable>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>

            <li><!-- 複製 -->
                <div class="uk-card uk-card-body uk-card-default">
                    <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-copy-procedure-contents' id='subnav-copy-procedure'>
                        <li><a href="#"> Outline </a></li>
                    </ul>

                    <ul class="uk-switcher uk-margin" id="subnav-copy-procedure-contents">
                        <li>
                            <div>
                                    <h4 class="uk-card-title">Recipe outline</h4>
                                    <h4 v-if="editOutline.length == 0">No outline</h4>
                                    <div class="uk-child-width-expand@s" uk-grid>
                                        <div>
                                            <h4>New</h4>
                                        </div>
                                        <div>
                                            <h4>Original</h4>
                                        </div>
                                    </div>
                                    <div class="uk-child-width-expand@s" uk-grid>
                                        <div>
                                            <draggable :list="copiedOutline" group="cpOutline" @change="changeKey($event)" 
                                            tag="ul" class="uk-list uk-list-large uk-text-large">
                                                <li v-for="a in copiedOutline" :key="a.uniqueKey" class="mouse-pointer">
                                                    {{a.experiment_procedure_title}}
                                                </li>
                                            </draggable>
                                        </div>
                                        <div>
                                            <draggable :list="editOutline" :group="{name:'cpOutline', pull:'clone', put:false}" @change="changeKey($event)"
                                            tag="ul" class="uk-list uk-list-large uk-text-large">
                                                <li v-for="a in editOutline" :key="a.id" class="mouse-pointer">
                                                    {{a.experiment_procedure_title}}
                                                </li>
                                            </draggable>              
                                        </div>
                                    </div>
                                    <div>
                                        <button class='uk-button uk-button-default' type='button' @click="resetCopiedOutline()">Cancel</button>
                                        <button class="uk-button uk-button-primary uk-modal-close" type="button" @click='copyOutline()'>Enter</button>
                                    </div>

                            </div>
                        </li>
                    </ul>
                </div>
            </li>

            <li><!-- ループ機能-->
                <div class="uk-card uk-card-body uk-card-default">
                    <edit-duplicate-block ref="editDuplicateBlock" :editBlockParent="editBlock" :conditionList="conditionList"
                    :actionLinkList="actionLinkList" :valueChoiceList="valueChoiceList" @submitDuplicateCondition="submitDuplicateCondition"></edit-duplicate-block>
                </div>
            </li>

            <li><!-- 編集 -->
                <div class="uk-card uk-card-body uk-card-default">
                    <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#subnav-rename-procedure-contents' id='subnav-rename-procedure'>
                        <li><a href="#"> Outline </a></li>
                        <li><a href="#"> plocedure block </a></li>
                    </ul>

                    <ul class="uk-switcher uk-margin" id="subnav-rename-procedure-contents">
                        <li>
                            <div class="box1">
                                <p>
                                    select for delete<br>
                                    double click to edit the outline title.
                                </p>
                            </div>
                           <edit-outline ref="editOutline"
                           @trashOutline="trashOutline" @submitRenamedOutline="submitRenamedOutline"></edit-outline>
                        </li>
                        <li>
                            <edit-block-vue ref="editBlockVue" :editBlockParent="editBlock" :valueChoiceList="valueChoiceList" 
                            :conditionList="conditionList" :actionLinkList="actionLinkList"
                            @trashBlock="trashBlock" @reviseBlockDetail="reviseBlockDetail" @submitReviseCondition="submitReviseCondition"></edit-block-vue>
                        </li>
                    </ul>
                </div>
            </li>

            <li>
                <!-- タイトルを削除 -->
                <div class="uk-card uk-card-body uk-card-default">
                    <h4>Delete all about this experiment.</h4>
                    <button class="uk-button uk-button-danger uk-margin-small-right" type="button"
                        uk-toggle="target: #modal-delete">Delete</button>
                </div>
                <div id="modal-delete" uk-modal>
                    <div class="uk-modal-dialog uk-modal-body">
                        <h2 class="uk-modal-title">Really?</h2>
                        <h3>{{editTitle.experiment_title}}</h3>
                        <p>Are you sure to delete all about this experiment.</p>
                        <p class="uk-text-right">
                            <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                            <button class="uk-button uk-button-danger uk-modal-close" type="button" @click='trashTitle()'>Delete</button>
                        </p>
                    </div>
                </div>
            </li>
        </ul>
        
    </div>
</div>
</template>

<script>
import draggable from 'vuedraggable'
import outlineTable from "./outline-table.vue"
import editOutline from "./edit-outline.vue"
import editBlockVue from "./edit-block.vue"
import editDuplicateBlock from "./edit-duplicate-block.vue"

function getUniqueStr(myStrong){
            var strong = 100000000000000;
            if (myStrong) strong = myStrong;
            return Math.floor(strong*Math.random()).toString(16)
            };

function successAlert(){
    alert("success!!");
};

function initialState(){
    return{
      newOutline:"",
      newTitle:"",
      isKaramoji:true,
      addedOutline:[],
      reorderedOutline:[],
      copiedOutline:[],
      newAddedBlock:{
          'procedureId':-1,
      },
      reorderedBlock:[],
      addDeviceRadio:"newDev",
      conditionRadio:'newCondition',
      addNewDevice:{
          name:"",
          deviceType:{},
      },
      addOldDevice:{},
      addSelectedDevice:{},
      addSelectedAction:{
          detail_number:0
      },
      addDetail:{
          value:null,
          unit:null,
          conditionTitle:"",
          isNewCondition:false,
          isValueChoice:false,
          isUnitChoice:false,
          conditionRadio:null,
          fromCondition:null,
      },
      deviceNameList:[],
    }
}

export default {
  props: ["editOutline","editBlock","editTitle","editDevice","conditionList","valueChoiceList","actionLinkList","deviceTypeList"],

  components:{
    draggable,
    outlineTable,
    editOutline,
    editBlockVue,
    editDuplicateBlock,
  },

  data(){
       // 初期値として関数呼び出しの結果を返す
       return initialState()
  },

  methods: {
        reset(isAddblock = false){
            if(!isAddblock){
                this.resetAddOutline();               
            }
            this.resetReorderdOutline();
            this.resetCopiedOutline();
            this.$refs.editOutline.resetRevisedOutline(this.editOutline);
            this.$refs.editBlockVue.resetAll();
            this.makeUniqueKey(this.copiedOutline);
            this.makeUniqueKey(this.editOutline);
            this.resetReorderBlock();
            this.resetAddBlock();
        },

        cancelOutline(){
            this.newOutline = "";
        },

        cancelTitle(){
            this.newTitle = "";
        },

        resetAddOutlineFlag(){
            this.addedOutline.forEach(function(elem){
                elem.isAddSelected = false;
            });
        },

        resetAddOutline(){
            this.addedOutline.splice(0, this.addedOutline.length);
            this.addedOutline = JSON.parse(JSON.stringify(this.editOutline));
            this.resetAddOutlineFlag();

            //newAddedBlockの初期値設定
            Object.keys(this.newAddedBlock).forEach(key => {
                this.$delete(this.newAddedBlock, key)
            });
            this.$set(this.newAddedBlock,'procedureId',-1);
        },

        resetAddBlock(){
            this.addDeviceRadio = "newDev";
            this.addNewDevice = {
                name:"",
                deviceType:{},      
            };
            this.addOldDevice = {};
            this.addSelectedDevice = {};
            this.addSelectedAction = {
                'detail_number':0,
            };

            this.resetAddDetail();
        },

        resetAddDetail(){
            this.addDetail = {
                value:null,
                unit:null,
                conditionRadio:null,
                conditionTitle:"",
                isNewCondition:false,
                isValueChoice:false,
                isUnitChoice:false,
                fromCondition:null,
            };
        },

        resetReorderOutlineFlag(){
            this.reorderedOutline.forEach(function(elem){
                elem.isReorderSelected = false;
            });
        },

        resetReorderdOutline(){
            this.reorderedOutline.splice(0, this.reorderedOutline.length);
            this.reorderedOutline = JSON.parse(JSON.stringify(this.editOutline));
            this.resetReorderOutlineFlag();
        },

        resetCopiedOutline(){
            this.copiedOutline.splice(0, this.copiedOutline.length)
            this.copiedOutline = JSON.parse(JSON.stringify(this.editOutline));
            this.copiedOutline.forEach(function(elem){
                elem.isCopied = false;
            });
        },

        resetReorderBlock(){
            this.reorderedBlock.splice(0, this.reorderedBlock.length);
        },

        cancelReorderBlock(){
            this.resetReorderBlock();
            this.resetReorderOutlineFlag();
        },

        submitOutline(){
            //outline_orderとか実験番号とか色々持っていかないといけない
            let outlineQuery = new Array(4);
            outlineQuery[2] = this.newOutline;

            let order = 1;
            if(this.editOutline.length !== 0){
                const orderArray = this.editOutline.map(x => x.experiment_procedure_order);
                //outlineOrderの最大値を探す
                const aryMax = function (a, b) {return Math.max(a, b);}
                order = orderArray.reduce(aryMax) + 1;
            }
            outlineQuery[1] = order;

            this.$emit("submitOutline",outlineQuery);

            this.newOutline = "";
            //successAlert();
        },


        makeUniqueKey(array){
            array.forEach(function(elem){
                elem.uniqueKey = getUniqueStr();
            });
        },

        changeKey(event){
            if(event.added){
                this.copiedOutline = JSON.parse(JSON.stringify(this.copiedOutline));
                this.copiedOutline[event.added.newIndex].uniqueKey = getUniqueStr();
                this.copiedOutline[event.added.newIndex].isCopied = true;
            };
        },
        
        reorderOutline(){
            this.$emit('reorderOutline',this.reorderedOutline);
            successAlert();
        },

        reorderBlock(){
            this.$emit('reorderBlock',this.reorderedBlock);
            successAlert();
        },

        copyOutline(){
            for(let i = 0 ; i < this.copiedOutline.length; i++){
                this.copiedOutline[i].experiment_procedure_order = i + 1;
            };
            this.$emit('copyOutline',this.copiedOutline);
            //successAlert();
        },

        trashOutline(trashId){
            this.$emit("trashOutline",trashId);
        },
        
        trashBlock(trashId){
            this.$emit("trashBlock",trashId);
        },

        submitRenamedOutline(renamedOutline,renameId){
            this.$emit("submitRenamedOutline",renamedOutline,renameId);
        },

        selectedReorderOutline(index,selectedId){
            this.resetReorderOutlineFlag();
            this.reorderedOutline[index].isReorderSelected = true;
            this.reorderedOutline.splice();

            this.reorderedBlock = this.editBlock.filter(function(elem){
                return elem.experiment_procedure_id == selectedId;
            });
        },

        selectedAddOutline(index,selectedId){
            this.resetAddOutlineFlag();
            this.addedOutline[index].isAddSelected = true;
            this.addedOutline.splice();
            
            this.$set(this.newAddedBlock,'procedureId',selectedId);
        },

        radioAutoCheck(num){
            if(num == 0){
                this.addDeviceRadio = 'newDev';
            }else if(num == 1){
                this.addDeviceRadio = 'oldDev';
            }
        },

        submitAddBlock(){
            Object.keys(this.addSelectedDevice).forEach(key => {
                this.$delete(this.addSelectedDevice, key)
            });

            switch(this.addDeviceRadio){
                case 'newDev':
                    this.$set(this.addSelectedDevice,'experimentId',this.editTitle.id);
                    this.$set(this.addSelectedDevice,'deviceName',this.addNewDevice.name);
                     this.$set(this.addSelectedDevice,'device_type_id',this.addNewDevice.deviceType.id);
                     this.$set(this.addSelectedDevice,'device_type_name',this.addNewDevice.deviceType.device_type_name);
                    this.$set(this.addSelectedDevice,'isNewDevice',true);
                    break;
                case 'oldDev':
                    this.addSelectedDevice = Object.assign({}, this.addOldDevice);
                    this.$set(this.addSelectedDevice,'isNewDevice',false);
                    break;
                case 'noDev':
                    this.addSelectedDevice = Object.assign({}, this.noDevice);
                    this.$set(this.addSelectedDevice,'isNewDevice',false);
                    break;
            };

            if(this.addedBlock.length !== 0){
                const orderArray = this.addedBlock.map(x => x.experiment_block_order);
                //blockOrderの最大値を探す
                const aryMax = function (a, b) {return Math.max(a, b);}
                const order = orderArray.reduce(aryMax) + 1;
                this.$set(this.addDetail,'blockOrder',order);
            }else{
                //そもそもblockがなければ1を送信
                this.$set(this.addDetail,'blockOrder',1);
            }
            this.$set(this.addDetail,'procedureId',this.newAddedBlock.procedureId);
            this.$set(this.addDetail,'conditionRadio',this.conditionRadio);

            this.$emit('submitBlock',this.addSelectedDevice,this.addSelectedAction,this.addDetail);
            this.reset(true);
        },

        reviseBlockDetail(blockId,addDetail){
            this.$emit("reviseBlockDetail",blockId,addDetail);
        },

        submitReviseCondition(condition){
            this.$emit("submitReviseCondition",condition);
        },

        trashTitle() {
            this.$emit("trashTitle",this.editTitle.id)
        },

        submitDuplicateCondition(condition){
            this.$emit("submitDuplicateCondition",condition)
        }
  },

  watch:{
      newOutline: function(){
          if(!this.newOutline){
              this.isKaramoji = true;
          }else{
              this.isKaramoji = false;
          }
      },

      editOutline: function(){
          this.resetAddOutline();
          this.resetReorderdOutline();
          this.resetCopiedOutline();
          this.$refs.editOutline.resetRevisedOutline(this.editOutline);
          this.$refs.editBlockVue.resetEditedOutline(this.editOutline);
          this.$refs.editDuplicateBlock.resetEditedOutline(this.editOutline);
          this.makeUniqueKey(this.copiedOutline);
          this.makeUniqueKey(this.editOutline);
      },

      editBlock: function(){
          this.resetReorderBlock();
          let indexNext = this.reorderedOutline.findIndex((a)=>{return a.isReorderSelected=true});
          if(indexNext >= 0){
            let selectedIdNext = this.reorderedOutline[indexNext].id;
            this.selectedReorderOutline(indexNext,selectedIdNext);
          }
      },

      actionList: function(){//addのblockにおいて、deviceを選び直したときにdetailをリセット
        this.$set(this.addDetail,'value',null);
        this.$set(this.addDetail,'unit',null);
      },
  },

  computed:{
      oldDevice: function(){
        let device = this.editDevice.filter(x => x.device_name !== "-");
        this.deviceNameList = this.editDevice.map(x => x.device_name);
        return device
      },

      deviceNameConflict: function(){
        return this.deviceNameList.includes(this.addNewDevice.name)
      },

      noDevice: function(){
          let device = this.editDevice.filter(x => x.device_name == "-");
          if(device.length > 0){
              //本来このひとつなはず
              return device[0]
          }
          return {}
      },

      addedBlock:function(){
        let block = this.editBlock.filter(function(elem){
            return elem.experiment_procedure_id == this.newAddedBlock.procedureId;
        },this);
        return block
      },

      deviceTypeListTemp: function(){
        let device = this.deviceTypeList.filter(x => x.device_type_name !== 'No device' )
        return device
      },

      actionList: function(){
          this.addDetail.isValueChoice = false;
          this.addDetail.isUnitChoice = false;
          this.addSelectedAction = {};
          
          //deviceの選択を監視する
          if(this.addDeviceRadio == 'newDev'){
              let id =  this.addNewDevice.deviceType.id;
              let action = this.actionLinkList.filter(x => x.device_type_id == id);
              return action

          }else if(this.addDeviceRadio == 'oldDev'){
              let id =  this.addOldDevice.device_type_id;
              let action = this.actionLinkList.filter(x => x.device_type_id == id);
              return action
          }else if(this.addDeviceRadio == 'noDev'){
              let id =  this.noDevice.device_type_id;
              let action = this.actionLinkList.filter(x => x.device_type_id == id);
              return action
          }else{
              return []
          }
      },

      detailChoice:function(){
          let id = this.addSelectedAction.id;
          let valueChoice = this.valueChoiceList.filter(x => x.device_link_id == id);
          
          if(valueChoice.length !== 0){
              valueChoice.forEach(function(x){
                  if(x.value !== null){
                      this.$set(this.addDetail,'isValueChoice',true);
                  };
                  if(x.unit !== null){
                      this.$set(this.addDetail,'isUnitChoice',true);
                  };
              },this);
          }
          
          return valueChoice
      },

      conditionChoice: function(){
        let id = this.addSelectedAction.id;
        let conditionChoice = this.conditionList.filter(x => x.device_link_id == id);
        conditionChoice = conditionChoice.filter(x => x.experiment_procedure_id == this.newAddedBlock.procedureId);
        return conditionChoice
      },

      //add new procedureの送信できるか入力監視
      isFullAddProcedure:function(){
        //デバイス
          if(this.addDeviceRadio == 'newDev'){
            if(this.addNewDevice.name.length == 0 || Object.keys(this.addNewDevice.deviceType).length == 0){
                return false
            }
            if(this.deviceNameConflict){
                return false
            }
          }else if(this.addDeviceRadio == 'oldDev'){
            if(Object.keys(this.addOldDevice).length == 0){
                return false
            }
          }else if(this.addDeviceRadio == 'noDev'){

          };
        
        //Action
        if(Object.keys(this.addSelectedAction).length == 0){
            return false
        };

        //detail
        if(this.conditionRadio == "newCondition"){
            if(this.addSelectedAction.detail_number > 0){
                if(this.addDetail.value == null){
                    return false
                }
            };
            if(this.addSelectedAction.detail_number == 2){
                if(this.addDetail.unit == null){
                    return false
                }
            };

            //conditionTitle
            if(this.addDetail.isNewCondition){
                if(this.addDetail.conditionTitle.length == 0){
                    return false
                }
            }
        }else if(this.conditionRadio == "oldCondition"){
            if(this.addDetail.fromCondition == null){
                return false
            }
        }

        return true
      },
  }
}
</script>
<style>
.box1 {
    padding: 0.5em 1em;
    margin: 2em 0;
   /* font-weight: bold; */
    border: solid 2px #000000;
}
.box1 p {
    margin: 0; 
    padding: 0;
}

.highlight-td {
    background-color: #fff799;
}

</style>