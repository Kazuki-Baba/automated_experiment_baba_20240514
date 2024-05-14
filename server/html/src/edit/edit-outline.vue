<template>
<div>
    <div>
        <h4 class="uk-card-title">
            <span uk-icon="icon: trash; ratio:2" v-if="(trashOutlineId.length > 0)" @click="trashOutline()" class="mouse-pointer"></span>
            Recipe outline
        </h4>
        <h4 v-if="revisedOutline.length == 0">No outline</h4>
        <ul class="uk-list uk-list-large uk-text-large">
            <li v-for="(a,index) in revisedOutline" :key="a.id">
                <input class="uk-checkbox" type="checkbox" :value="a.id" v-model="trashOutlineId">
                <span @dblclick="dblclickOutline(index,a.experiment_procedure_title)" v-show="!a.isRenamed">{{a.experiment_procedure_title}}</span>
                <span v-show="a.isRenamed">
                    <input v-model.trim="renamedOutline" type="text" class='uk-input uk-form-width-medium'>
                    <button class="uk-button uk-button-default" type="button" @click="cancelRenameOutline(index)">Cancel</button>
                    <button class="uk-button uk-button-primary" type="button" @click="submitRenamedOutline(a.id)">Rename</button>
                </span>
            </li> 
        </ul>
    </div>
</div>
</template>

<script>

export default {
    props:[],

    components:{

    },

    data(){
        return{
            trashOutlineId:[],
            renamedOutline:null,
            revisedOutline:[],
        }
    },

    methods:{
        resetRevisedOutline(editOutline){//親から発火
            this.revisedOutline.splice(0, this.revisedOutline.length);
            this.trashOutlineId.splice(0, this.trashOutlineId.length)
            this.revisedOutline = JSON.parse(JSON.stringify(editOutline));
            this.revisedOutline.forEach(function(elem){
                elem.isRenamed = false;
            });
        },

        trashOutline(){
            this.$emit("trashOutline",this.trashOutlineId);
            this.trashOutlineId.splice(0, this.trashOutlineId.length)
        },

        dblclickOutline(index,title){
            this.revisedOutline.forEach(function(elem){
                elem.isRenamed = false;
            });
            this.$set(this.revisedOutline[index], 'isRenamed', true);
            //このままではリアクティブではないので、更新する。
            this.revisedOutline.splice();

            this.renamedOutline = title;
        },

        cancelRenameOutline(index){
            this.$set(this.revisedOutline[index], 'isRenamed', false);
            //このままではリアクティブではないので、更新する。
            this.revisedOutline.splice();
            this.renamedOutline = null;
        },

        submitRenamedOutline(renameId){
            this.$emit("submitRenamedOutline",this.renamedOutline,renameId);
        },
    },

    watch:{
    },

    computed:{
        
    },
}
</script>