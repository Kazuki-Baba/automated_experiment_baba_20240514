<template>
    <div id="detailEditModal" uk-modal bg-close="false"><!-- detail編集モーダル -->
        <div class='uk-modal-dialog'>
            <div class="uk-modal-header">
                <h4>Revise the detail</h4>
            </div>
            <div class='uk-modal-body'>
                <div>
                    <table class="uk-table uk-table-divider uk-text-left">
                        <thead>
                            <tr>
                            <th>Device</th>
                            <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                            <td>{{editedDetail.device_name}}</td>
                            <td>{{editedDetail.action}}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div>
                        <table class="uk-table uk-table-divider uk-text-left">
                            <thead>
                                <tr>
                                <th>Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                <td>
                                    <div v-if="(editedDetail.detail_number == 1)">
                                        <input v-show="!addDetail.isValueChoice && (editedDetail.argument !== 'alert') " v-model.trim='addDetail.value' type='number' min="0" placeholder='value' class='uk-input uk-width-1-3'>
                                        <input v-show="!addDetail.isValueChoice && (editedDetail.argument == 'alert') " v-model.trim='addDetail.value' type="text" placeholder='value' class='uk-input uk-width-1-3'>
                                        <select v-show="addDetail.isValueChoice" v-model.trim='addDetail.value' class='uk-select uk-width-1-3'>
                                            <option disabled :value='null' selected>--Value select--</option>
                                            <option v-for='d in detailChoice' :value='d.value' :key="d.id">{{d.value}}</option>
                                        </select> 
                                        <span v-if="(editedDetail.action == 'waiting')">seconds</span>
                                    </div>
                                    <div v-if="(editedDetail.detail_number == 2)">
                                        <input v-model.trim='addDetail.value' type='number' placeholder='value' min='0' class='uk-input uk-width-1-3'>
                                        <input v-show="!addDetail.isUnitChoice" v-model.trim='addDetail.unit' type='text' placeholder='unit' class='uk-input uk-width-1-3'>
                                        <select v-show="addDetail.isUnitChoice" v-model.trim='addDetail.unit' class='uk-select uk-width-1-3'>
                                            <option disabled :value='null' selected>--Unit select--</option>
                                            <option v-for='d in detailChoice' :value='d.unit' :key="d.id">{{d.unit}}</option>
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
                    <button class="uk-button uk-button-danger uk-modal-close" type="button" @click="resetFlag()">Cancel</button>
                    <button class="uk-button uk-button-default uk-margin-small-right uk-modal-close" type="button" @click=reviseBlockDetail()>OK</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    props:["editedDetail","valueChoiceList"],

    components:{

    },

    data(){
        return{
            addDetail:{
                value:null,
                unit:null,
                isValueChoice:false,
                isUnitChoice:false,
                detailNumber:0,
                selectedLinkId:0,
            },

            detailChoice:[],
        }
    },

    methods:{
        resetFlag(){
            this.$set(this.addDetail,"isValueChoice",false);
            this.$set(this.addDetail,"isUnitChoice",false);
            this.$set(this.addDetail,"value",null);
            this.$set(this.addDetail,"unit",null);
            this.$set(this.addDetail,"selectedLinkId",0);
            this.detailChoice.splice(0,this.detailChoice.length);
        },

        addDetailAssignment(detailVal,linkId){
            //detailValのdetailをvalueとunitに分割しなくちゃ
            const array = detailVal.detail.split(" ");
            const length = array.length;

            if(length > 0){
                this.$set(this.addDetail,"value",array[0]);
            };
            if(length > 1){
                this.$set(this.addDetail,"unit",array[1]);
            }

            //detailの選択肢を抽出する
            let valueChoice = this.valueChoiceList.filter(x => x.device_link_id == linkId);  
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
            this.detailChoice = valueChoice
        },

        reviseBlockDetail(){
            const blockId = this.editedDetail.id;
            this.$set(this.addDetail,"detailNumber",this.editedDetail.detail_number);

            this.$emit("reviseBlockDetail",blockId,this.addDetail);
            this.resetFlag();
        },
    },

    watch:{

    },

    computed:{

    },
}
</script>