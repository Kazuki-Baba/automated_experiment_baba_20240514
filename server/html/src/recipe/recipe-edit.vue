<template>
<div id='recipe-edit' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
           <h2 class="uk-modal-title">{{recipeTitle}}</h2>
           <p>sort by drag and drop</p>
           <p>click the trash icon, then delete the procedure</p>
        </div>
        <div class='uk-modal-body'>
            <div uk-overflow-auto>
                    <table class="uk-table uk-table-hover" v-if="showTrashProcedure">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th><span uk-icon='trash' @click='isTrashActive = !isTrashActive'></span></th>
                        </tr>
                        </thead>
                        <draggable v-model='recipeEditerTemp' tag='tbody'>
                        <tr v-for="(b,index) in recipeEditerTemp" :key='b.ID' class='mouse-pointer'>
                            <td>{{index+1}}</td>
                            <td>{{b.Device}}</td>
                            <td>{{b.Action}}</td>
                            <td>{{b.Details}}</td>
                            <td><span uk-icon='trash' @click="recipeTrash(b)" v-show="isTrashActive"></span></td>
                        </tr>
                        </draggable>                            
                    </table>
                </div>



        </div>    
        <div class="uk-modal-footer uk-text-right">
            <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
            <button class="uk-button uk-button-primary uk-modal-close" type="button" @click='recipeEdit'>Enter</button>
        </div>
    </div>

</div>
</template>

<script>
import draggable from 'vuedraggable'


export default{
    props:['recipeEditer','recipeTitle'],

    components:{
        draggable,      
    },

    data(){
        return{ 
            recipeEditerTemp :[],
            isTrashActive :false,
            showTrashProcedure: true,
        }
    },

    mounted(){
    },

    methods :{
        //変更したレシピの順番の配列を親に送る
        recipeEdit(){
            this.$emit('recipeEdit',this.recipeEditerTemp);
        },     

        recipeTrash(b){
            this.$emit('recipeTrash',b.ID);
        },

    },

    watch:{
        recipeEditer: function(){
            this.recipeEditerTemp = this.recipeEditer;
            console.log('かわってるのか')
        },
    },

    computed:{
       
    },
    
}

</script>
<style>
</style>