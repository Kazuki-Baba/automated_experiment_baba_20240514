<template>
<div class='uk-card uk-card-body uk-card-default'>
    <div>
        <table class="uk-table uk-table-hover" v-if="!isSetting">
            <thead>
            <tr>
                <th>Explanation</th>
                <th>Value</th>
                <th>Updated at</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="b in settingList" :key='b.id'>
                <td>{{b.explanation}}</td>
                <td>{{b.value}}</td>
                <td>{{b.updated_at}}</td>
            </tr>
            </tbody>
        </table>
        <table class="uk-table uk-table-hover" v-if="isSetting">
            <thead>
            <tr>
                <th class="uk-table-expand">Explanation</th>
                <th class="uk-width-small">Value</th>
                <th>Update</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="b in settingListCopy" :key='b.id'>
                <td>{{b.explanation}}</td>
                <td><input v-model.trim='b.value' type='number' min="0" :step="stepMake(b.argument)" placeholder='value'  class='uk-input'></td>
                <td>{{b.updated_at}}</td>
            </tr>
            </tbody>
        </table>
    </div>

    <div v-show="!isSetting">
        <button class="uk-button uk-button-default uk-width-1-4" type="button" @click='settingCopy'>EDIT</button>
    </div>
    <div v-show="isSetting">
        <div class="uk-text-right"><button class="uk-button uk-button-default uk-width-1-3" type="button" @click='defaultSettingRevert'>Reset to default value</button></div>
        <button class="uk-button uk-button-default uk-width-1-5" type="button" @click='cancelEditSetting'>CANCEL</button>
        <button class="uk-button uk-button-primary uk-width-1-5" type="button" @click='emitEditSetting'>EMIT</button>
    </div>

</div>
</template>

<script>



export default{

    props:["settingList","settingDefaultList"],
 
     data(){
        return{
            settingListCopy:[],
            isSetting:false,
        }
    },

    methods :{
        settingCopy(){
            this.settingListCopy = this.settingList.map(x => ({...x}));
            this.settingListCopy.forEach(function(x){
                x.value = parseFloat(x.value);
            })
            this.isSetting = true;
        },

        cancelEditSetting(){
            this.isSetting = false;
        },

        emitEditSetting(){
            this.$emit("editSetting",this.settingListCopy);
            this.isSetting = false;
        },

        defaultSettingRevert(){
            let value = this.settingDefaultList.map(x => parseFloat(x.value));
            for(let i = 0; i < value.length; i++){
                this.settingListCopy[i].value = value[i];
            };
        },

        stepMake(argument){
            switch(argument){
                case "tempError":
                    return 0.5
                case "tempStep":
                    return 0.05
                default:
                    return 1
            }
        }
    },

    computed:{

    },
}
</script>
<style>

</style>