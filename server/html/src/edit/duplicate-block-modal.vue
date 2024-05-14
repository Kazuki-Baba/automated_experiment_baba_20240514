<template>
<div>
    <div id='duplicate-process' uk-modal="bg-close: false" class='uk-modal-container'>
        <div class='uk-modal-dialog'>
            <div class="uk-modal-header">
                <div class="uk-child-width-expand@s" uk-grid>
                    <div>
                        <h4>Duplicate the  experiment condition.</h4>
                    </div>
                    <!-- ?マークのマークの操作説明実装はいらないか
                    <div class="uk-text-right">
                        <span uk-icon="question" class="inline-span" @click="openSubnav(4)"></span>
                    </div>
                    -->
                </div>
            </div>
            <div class='uk-modal-body'>
                <div>
                <ul class="uk-subnav" uk-switcher='connect:#subnav-duplicate-contents' id='subnav-duplicate-main'>
                    <li> <a href="#"></a></li>
                    <li> <a href="#"></a></li>
                    <li> <a href="#"></a></li>
                    <li> <a href="#"></a></li>
                    <li> <a href="#"></a></li>
                </ul>
                </div>
                <div>
                    <ul class="uk-switcher uk-margin" id="subnav-duplicate-contents">
                        <li>
                            <draggable tag="div" :list="originalCondition">
                                <div v-for="a in originalCondition" :key="a.id" class="uk-card uk-card-body uk-card-default">
                                    <div class="uk-child-width-expand@s" uk-grid>
                                        <div>
                                            <h4 class="uk-card-title">
                                                {{a.condition_title}}
                                            </h4>
                                        </div>
                                        <div class="uk-text-right">
                                            Sort by :
                                            <button class="uk-button uk-button-default" type="button" @click="sortValueArray(a.valueArray,true)">Asc</button> 
                                            <button class="uk-button uk-button-default" type="button" @click="sortValueArray(a.valueArray,false)">Desc</button> 
                                        </div>
                                    </div>

                                    <span v-for="(v, ind) in a.valueArray" :key="ind" class="uk-input uk-width-1-5 uk-text-center box">
                                        {{v}}
                                        <span uk-icon="icon: trash" @click="trashValue(a.valueArray, ind)" class="trash"></span>
                                    </span>


                                    <div class="uk-child-width-expand@s" uk-grid>
                                        <div class="uk-text-left">
                                            <span v-if="a.unit">Unit : {{a.unit}}</span>
                                            <span v-if="!a.unit">Unit : - </span>
                                        </div>
                                        <div>
                                            <div class="uk-text-right">
                                                <!-- <button class="uk-button uk-button-primary" type="button" @click="openAddSubnav(a)">Add</button> -->
                                                <button v-if="isNumber(a.value)" class="uk-button uk-button-primary" type="button" @click="openNewSubnav(a)">New</button> 
                                                <button v-if="!isNumber(a.value)" class="uk-button uk-button-primary" type="button" @click="openNewSubnav(a)" disabled>New</button> 
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </draggable>
                        </li>

                        <li><!-- ADD -->
                            <div>
                                <duplicate-add-condition ref="duplicateAddCondition" :actionLinkList="actionLinkList" :valueChoiceList="valueChoiceList"></duplicate-add-condition>
                            </div>
                        </li>

                        <li><!-- NEW-->
                            <div>
                                <duplicate-new-condition ref="duplicateNewCondition" @numValidation="numValidation"></duplicate-new-condition>
                            </div>
                        </li>

                        <li><!-- CHECK -->
                            <duplicate-check-condition ref="duplicateCheckCondition"></duplicate-check-condition>
                        </li>

                        <li>
                            <div>
                                説明を書くよ
                            </div>
                         </li>

                    </ul>
                </div>
            </div>
            
            <div class="uk-modal-footer uk-text-right">
                <ul class="uk-switcher uk-margin" id="subnav-duplicate-contents">
                    <li>
                        <div>
                            <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                            <button class="uk-button uk-button-primary" type="button" @click="duplicateCondition()">Next</button> 
                        </div>
                    </li>

                    <li><!-- ADD -->
                        <div>
                            <button class="uk-button uk-button-default" type="button" @click="openSubnav()">Cancel</button>
                            <button class="uk-button uk-button-primary" type="button" @click="addCondition()">OK</button> 
                        </div>
                    </li>

                    <li><!-- NEW-->
                        <div>
                            <button class="uk-button uk-button-default" type="button" @click="openSubnav()">Cancel</button>
                            <button class="uk-button uk-button-primary" type="button" v-if="isNewFullAdded" @click="makeValueByStep()">Next</button> 
                            <button class="uk-button uk-button-primary" type="button" v-if="!isNewFullAdded" disabled>Next</button> 
                        </div>
                    </li>

                    <li><!-- CHECK -->
                        <div>
                            <button class="uk-button uk-button-default" type="button" @click="openSubnav()">Cancel</button>
                            <button class="uk-button uk-button-primary uk-modal-close" type="button" @click="submitDuplicateCondition()">Submit</button> 
                        </div>
                    </li>

                    <li><!-- Introduction -->
                        <div>
                            <button class="uk-button uk-button-primary" type="button" @click="openSubnav()">OK</button> 
                        </div>
                    </li>

                </ul>
            </div>
        </div>
    </div>
</div>
</template>
    
<script>
import ui from 'uikit';
import draggable from 'vuedraggable'
import duplicateAddCondition from './edit-duplicate-add-condition.vue';
import duplicateNewCondition from './edit-duplicate-new-condition.vue';
import duplicateCheckCondition from './edit-duplicate-check-condition.vue';

export default {
    props:["actionLinkList","valueChoiceList"],

    components:{
        draggable,
        duplicateAddCondition,
        duplicateNewCondition,
        duplicateCheckCondition,
    },

    data(){
        return{
            originalCondition:[],
            isNewFullAdded: false,
        }
    },

    methods:{
        isNumber(elem){
            let separatorString = /\s+/;
            let array = elem.split(separatorString);
            return !isNaN(array[0])
        },

        numValidation(isError){
            this.isNewFullAdded = !isError
        },

        insertCondition(cond){
            this.originalCondition.splice(0, this.originalCondition.length);
            this.originalCondition.push(...cond);
            this.originalCondition.forEach(function(elem){
                elem.valueArray = [];
                let separatorString = /\s+/;
                let array = elem.value.split(separatorString);
                elem.valueArray.push(array[0]);

                elem.unit = null;
                if(array.length > 1){
                    elem.unit = array[1];
                }
            });
        },

        openAddSubnav(a){
            ui.switcher('#subnav-duplicate-main').show(1);
            this.$refs.duplicateAddCondition.initializeCondition(a);
        },

        openNewSubnav(a){
            ui.switcher('#subnav-duplicate-main').show(2);
            this.$refs.duplicateNewCondition.initializeCondition(a);
        },

        openSubnav(a = 0){
            ui.switcher('#subnav-duplicate-main').show(a);
        },

        addCondition(){
            this.$refs.duplicateAddCondition.add();
            this.originalCondition.splice();//配列の更新(reload)
            this.openSubnav();
        },

        makeValueByStep(){
            this.$refs.duplicateNewCondition.add();
            this.originalCondition.splice();//配列の更新(reload)
            this.openSubnav();
        },

        duplicateCondition(){//conditionを組み合わせて複製する
            for(let i = 0; i < this.originalCondition.length; i++){
                this.originalCondition[i].conditionArray = [];
                for(let j = 0; j < this.originalCondition[i].valueArray.length; j++){
                    let obj = {
                        condition_title: null,
                        device_link_id: null,
                        experiment_procedure_id:null,
                        id:null,
                        value:null,
                    };

                    obj.condition_title = this.originalCondition[i].condition_title;
                    obj.device_link_id = this.originalCondition[i].device_link_id;
                    obj.experiment_procedure_id = this.originalCondition[i].experiment_procedure_id;
                    obj.id = this.originalCondition[i].id;

                    if(this.originalCondition[i].unit !== null){
                        let elem = this.originalCondition[i].valueArray[j] + " " + this.originalCondition[i].unit;
                        obj.value = elem;
                    }else{
                        obj.value = this.originalCondition[i].valueArray[j];
                    }
                    this.originalCondition[i].conditionArray.push(obj);
                }
            };

            let data = JSON.parse(JSON.stringify(this.originalCondition));
            data.reverse();
            let total = 1;
            for (let z in data) {
            total *= data[z].conditionArray.length;
            }

            let q, // 商, ループ中の配列で表現できない数
                r, // 余り, ループ中の配列で表現する数
                result = []; // 組み合わせを格納する配列

            // 組み合わせの総数回ループして、n番目にどの組み合わせが来るかどうかを求める
            for (let n=0; n < total; n++) {
                result[n] = [];
                q = n;

                // dataのキー毎にループして、どの要素を使うか決定
                for (let z=0; z<data.length; z++) {
                    // ループ対象の配列の要素数で割った余り = その配列で表現できる数 
                    r = q % data[z].conditionArray.length;

                    // ループ対象の配列の要素数で割った商 = その配列で表現できない数
                    q = Math.floor(q / data[z].conditionArray.length);

                    result[n][z] = data[z].conditionArray[r];
                }
            }

            let j = 1;
            result.forEach(function(elem){
                elem.reverse();
                elem.unshift(j); //v-for識別用
                j++;
            })

            let lastCondition = [];
            lastCondition.push(...result);
            this.$refs.duplicateCheckCondition.initializeCondition(lastCondition,this.originalCondition);
            this.openSubnav(3);//checkを表示
        },

        sortValueArray(array,flag){
            if(flag){//Asc is true
                array.sort(function(first,second){
                    if(first > second){
                        return 1;
                    }else if(first < second){
                        return -1;
                    }else{
                        return 0;
                    }
                });
            }else{
                array.sort(function(first,second){
                    if(first > second){
                        return -1;
                    }else if(first < second){
                        return 1;
                    }else{
                        return 0;
                    }
                });   
            }
            this.originalCondition.splice();
        },

        trashValue(valueArray, idx){
            console.log(valueArray.length + " . " + idx)
            valueArray.splice(idx, 1)
            this.originalCondition.splice();
        },

        submitDuplicateCondition(){
            let condition = this.$refs.duplicateCheckCondition.submitCondition();
            this.$emit("submitDuplicateCondition",condition);
        },

    },

    watch:{

    },

    computed:{
        
    },
}
</script>
<style scoped>
.box {
   /* font-weight: bold; */
    border: solid 1px #000000;
    display: inline-block;
    position: relative;
}

.box .trash{
    position: absolute;
    right: 3%;
    top: 10%;
}

.inline-span{
    display: inline-block;
}


</style>