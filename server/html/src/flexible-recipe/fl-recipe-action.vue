<template>
<div>

<!-- 繰り返す手順の選択 -->
<div id='fl-recipe-repeat' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle.experiment_title}}</h2>
            <p>Select the outline you want to repeat</p>
            <div>
                <button class="uk-button uk-button-danger uk-modal-close" type="button" @click='resetSelect'>Cancel</button>
                <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #fl-recipe-condition" @click="makeCondition()">Next</button>
            </div>
        </div>
        <div class='uk-modal-body'>

            <div class="uk-grid-collapse uk-text-center" uk-grid>
                <div class="uk-width-1-2">
                <div class="uk-card uk-card-default uk-card-body">
                    <h4 class="uk-card-title">Recipe outline</h4>
                    <h4 v-if="recipeOutline.length == 0">No outline</h4>
                    <ul class="uk-list uk-list-large uk-text-large">
                        <draggable :list="usedOutline" group="outline" @change="changeKey($event)">
                            <li v-for="a in usedOutline" :key="a.uniqueKey" class="mouse-pointer">
                                {{a.experiment_procedure_title}}
                            </li> 
                        </draggable>
                    </ul>
                </div>

                </div>
                <div class="uk-width-1-2">
                    <div class="uk-card uk-card-default uk-card-body">
                        <h4 class="uk-card-title">Original recipe outline</h4>
                        <h4 v-if="recipeOutline.length == 0">No outline</h4>
                        <ul class="uk-list uk-list-large uk-text-large">
                            <draggable :list="recipeOutline" :group="{name:'outline', pull:'clone', put:false}" @change="changeKey($event)">
                                <li v-for="a in recipeOutline" :key="a.id" class="mouse-pointer">
                                    {{a.experiment_procedure_title}}
                                </li> 
                            </draggable>
                        </ul>
                    </div>

                    <div class="uk-card uk-card-default uk-card-body">
                        <h4 class="uk-card-title">Procedure</h4>
                        <h4 v-if="recipeBlock.length == 0">No procedure</h4>
                        <table v-show="recipeBlock.length !== 0" class="uk-table uk-table-divider">
                        <thead>
                            <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Detail</th>
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
        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li  class="uk-active"><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
        </div>
    </div>
</div>

<!-- conditonテーブル編集 -->
<div id='fl-recipe-condition' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle.experiment_title}}</h2>
            <p>Set the experiment condition</p>
            <button class="uk-button uk-button-danger uk-modal-close" type="button" @click='resetSelect'>Cancel</button>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #fl-recipe-device" @click="makeProcedureInfo()">Next</button>
        </div>

        <div class='uk-modal-body'>
            <div class="uk-grid-collapse uk-text-center" uk-grid>
                <div class="uk-card uk-card-default uk-card-body uk-width-1-2">
                    <div v-for="(condition,index) in usedCondition" :key="condition.uniqueKey">
                        <div v-if="condition.condition.length !==0" class="uk-card uk-card-default uk-card-body">
                            <h4 class="uk-card-title">{{usedOutline[index].experiment_procedure_title}}</h4>
                            <div>
                                <table class="uk-table uk-table-divider">
                                    <thead>
                                        <tr>
                                        <th>Experiment condition title</th>
                                        <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="cond in condition.condition" :key="cond.id" class="uk-text-left">
                                        <td>{{cond.condition_title}}</td>
                                        <td><input v-model.trim="cond.value" type="text" class='uk-input uk-form-width-small'></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="uk-width-1-2">
                    <div  class="uk-card uk-card-default uk-card-body">
                        <h4 class="uk-card-title">Recipe outline</h4>
                        <h4 v-if="recipeOutline.length == 0">No outline</h4>
                        <ul class="uk-list uk-list-large uk-text-large">
                            <li v-for="a in usedOutline" :key="a.uniqueKey" class="mouse-pointer">
                                {{a.experiment_procedure_title}}
                            </li> 
                        </ul>
                    </div>    
                </div>
            </div>

            
        </div>  

        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li><a href="#">Item 1</a></li>
                <li class="uk-active"><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
        </div>
    </div>
</div>

<!-- デバイス選択 -->
<div id='fl-recipe-device' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle.experiment_title}}</h2>
            <p>Select the device you want to use</p>
            <div>
                <button class="uk-button uk-button-danger uk-modal-close" type="button" @click='resetSelect'>Cancel</button>
                <button class="uk-button uk-button-primary uk-margin-small-right uk-modal-close" type="button" @click="experimentStart" v-if="!isKara">Run</button>
                <button class="uk-button uk-button-default"  v-if='isKara' disabled>Run</button>
            </div>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <div class='uk-width-1-2 uk-text-center'>
                    <h4>Procedure</h4>
                </div>
                <div class='uk-width-1-2 uk-text-center'>
                    <h4>Device select</h4>
                </div>
            </div>
        </div>

        <div class='uk-modal-body'>
            <div uk-grid>
                <div class='uk-width-1-2' uk-overflow-auto>
                    <table class="uk-table uk-table-divider">
                        <thead>
                            <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(a,index) in actualProcedure" :key="a.procedureOrder" class="uk-text-left">
                            <td>{{index+1}}</td>
                            <td>{{a.device_name}}</td>
                            <td>{{a.action}}</td>
                            <td>{{a.usedDetail}}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class='uk-width-1-2'>
                    <div v-for="(elem, index) in procedureDevice" :key="elem.device_id" class="uk-text-center">
                    {{elem.device_name}}
                    <select v-model="raspiDevice[index]" class="uk-select">
                    <option disabled :value="null" :label="'--Device select--'" selected></option>
                    <!-- <option v-for="(e, index2) in computedDeviceData" :value="d"></option>　　-->
                    <optgroup v-for="socket in deviceData" :key="socket.socket" :label="socket.clientData.name">
                        <option v-for="device in socket.deviceList" :key="device.ID" :value="device">
                            {{device.device}}({{device.company}}/{{device.model}})
                        </option>
                    </optgroup>
                    </select>
                    </div>
                </div>
            </div>
        </div>  

        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li class="uk-active"><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
        </div>
    </div>
</div>

</div>
</template>

<script>
import draggable from 'vuedraggable'

function getUniqueStr(myStrong){
            var strong = 100000000000000;
            if (myStrong) strong = myStrong;
            return Math.floor(strong*Math.random()).toString(16)
            };

export default{
    props:['recipeTitle','recipeOutline','recipeBlock','recipeCondition','notConcatRecipeBlock','deviceData'],

    components:{
        draggable,
    },


    data(){
        return{ 
            usedOutline:[],
            usedBlock:[],
            usedCondition:[],
            actualProcedure:[],
            procedureDevice: [],
            raspiDevice:[],
            actualDevice:{},
            isKara: true,

        }
    },

    mounted(){

    },

    beforeDestory(){

    },

    methods:{
        duplicateOutline(){
            this.usedOutline.splice(0,this.usedOutline.length);
            this.usedOutline = JSON.parse(JSON.stringify(this.recipeOutline));
            this.makeUniqueKey();
        },

        makeUniqueKey(){
            this.usedOutline.forEach(function(elem){
                elem.uniqueKey = getUniqueStr();
            });
            
            this.recipeOutline.forEach(function(elem){
                elem.uniqueKey = getUniqueStr();
            });
        },

        changeKey(event){
            if(event.added){
                this.usedOutline = JSON.parse(JSON.stringify(this.usedOutline));
                this.usedOutline[event.added.newIndex].uniqueKey = getUniqueStr();
            };
        },

        makeCondition(){
            this.usedCondition.splice(0, this.usedCondition.length);

            for(let i = 0; i < this.usedOutline.length; i++){
                let line = JSON.parse(JSON.stringify(this.usedOutline[i]));
                let elem = this.recipeCondition.filter(function(x){
                    return x.experiment_procedure_id == line.id
                });

                //array.length = 0なら、つまりblockが無いなら、エラーを吐くことに注意

                let block = this.notConcatRecipeBlock.filter(function(array){
                    if(array.length == 0){
                        return
                    }
                    return array[0].experiment_procedure_id == line.id
                });
                
                //中身のない(...block)は虚無になり、JSON.parseしたらエラーになってしまう
                if(block.length !== 0){
                    this.usedCondition.push({uniqueKey:line.uniqueKey, condition:JSON.parse(JSON.stringify(elem)), block:JSON.parse(JSON.stringify(...block))});
                }
            };
        },

        makeActualProcedure(){
            //usedDetailが実際に制御に使うdetail
            for(let i = 0; i < this.usedCondition.length; i++){
                for(let z = 0; z < this.usedCondition[i].block.length; z++){
                    if(this.usedCondition[i].block[z].condition_id){
                        //毎回検索するんじゃなくて、一回検索しておいて代入するほうが効率良さそう
                        let index = this.usedCondition[i].condition.findIndex(elem => elem.id == this.usedCondition[i].block[z].condition_id);
                        if(index !== -1){
                            this.usedCondition[i].block[z].usedDetail = this.usedCondition[i].condition[index].value;
                        }
                    }else if(this.usedCondition[i].block[z].detail){
                        this.usedCondition[i].block[z].usedDetail = this.usedCondition[i].block[z].detail;
                    }else{
                        this.usedCondition[i].block[z].usedDetail = null;
                    };
                };
            };

            //actualProcedureを作成
            this.actualProcedure.splice(0,this.actualProcedure.length);
            for(let i = 0; i < this.usedCondition.length; i++){
                //DB保存時のblocksとproceduresの対応のため、uniqueKeyをすべてのblocksにコピーしておく
                this.usedCondition[i].block.forEach(elem =>{
                    this.$set(elem, "uniqueKey", this.usedCondition[i].uniqueKey);
                });

                this.actualProcedure.push(...this.usedCondition[i].block);
            };

            for(let i = 0; i < this.actualProcedure.length; i++){
                this.actualProcedure[i].procedureOrder = i;
            }

        },

        extractProcedureDevice(){
            let device = this.actualProcedure.map(function(x){
                return {
                    device_name: x.device_name,
                    device_id: x.device_id,
                    device_type_name: x.device_type_name,
                }
            });

            device = [...device.filter(e => e.device_name !== '-')]    

            this.procedureDevice = device.filter((element, index, self) =>
                self.findIndex(e =>
                    e.device_name === element.device_name &&
                    e.device_id === element.device_id) === index
            );
            
        },

        makeProcedureInfo(){
            this.makeActualProcedure();
            this.extractProcedureDevice();
        },

        experimentStart(){
            //重複なく選ぶ
            for(let i=0; i < this.procedureDevice.length; i++){
                let  raspiObj = Object.assign({}, JSON.parse(JSON.stringify(this.raspiDevice[i])));
                this.$set(raspiObj, "name", this.procedureDevice[i].device_name);//このままだとdeiceDataが書き換わってしまう
                this.$set(raspiObj, "device_type_name", this.procedureDevice[i].device_type_name);
                this.$set(this.actualDevice, this.procedureDevice[i].device_id,raspiObj);
               // this.$set(this.actualDevice[this.procedureDevice[i].device_id], 'device_name', this.procedureDevice[i].device_name);
            };


            let noDeviceIndex = this.actualProcedure.findIndex(function(elem){
                return elem.device_name == "-"
            });
            if(noDeviceIndex >= 0){
                let noDeviceInfo = this.actualProcedure[noDeviceIndex];
                let noDeviceObj = {
                    device: noDeviceInfo.device_name,
                    name: "-",
                };
                this.$set(this.actualDevice, noDeviceInfo.device_id, noDeviceObj);
            };

            //ProcedureOrderのふりなおし
            this.actualProcedure.forEach(function(elem,index){
               elem.procedureOrder = index + 1; 
            });

            //outlineOrderのふりなおし
            this.usedOutline.forEach(function(elem,index){
               elem.outlineOrder = index + 1; 
            });

            this.$emit('experimentStart',{title:this.recipeTitle, procedure:this.actualProcedure, device:this.actualDevice, outline:this.usedOutline, condition:this.usedCondition});
            this.resetSelect();
            
        },

        resetSelect(){
            this.usedOutline = [];
            this.usedBlock = [];
            this.usedCondition = [];
            this.actualProcedure = [];
            this.procedureDevice = [];
            this.raspiDevice = [];
            this.actualDevice = {};
        },


    },

    watch:{
        raspiDevice: function(){
            if(this.raspiDevice.filter(v => v).length == this.procedureDevice.length){
                this.isKara = false;
            }else{
                this.isKara = true;
            }
        },
        
        procedureDevice: function(){
            if(this.raspiDevice.filter(v => v).length == this.procedureDevice.length){
                this.isKara = false;
            }else{
                this.isKara = true;
            }
        },
        
    },

    computed:{
        /*
        computedDeviceData: function(){
            if(this.deviceData.length > 0){
                let device = [];
                
                this.deviceData.for
            }
        },
        */
    },
    
}

</script>

<style>

    .isactivetable{
        background:#ffffc8;
    }
    
    .isactiverow{
        border-bottom:solid medium #E74C3C;
    }

/*
    #recipe-action{
        animation: none;
        transform: none;
        transition: unset;
    }
    */
    
</style>