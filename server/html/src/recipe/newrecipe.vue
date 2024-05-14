<template>
<div id='new-recipe' uk-modal>
    <div class='uk-modal-dialog uk-modal-body'>
        <h2 class='uk-modal-title'>Add new recipe</h2>
        <form>
        Title<input v-model.trim='recipe' type='text' placeholder='New title' class='uk-input' autofocus><br>
        <p v-show='!isKaramoji'><font color='#e62323'>Please input the title of new recipe</font></p>
        <p class='uk-text-right'>
      <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
      <input v-if='isKaramoji' type=submit @click=submit class="uk-button uk-button-primary uk-modal-close" value="submit">
      <button v-if='!isKaramoji' class="uk-button uk-button-default" disabled>OK</button> 
      </p>
      </form>
    </div>
    



  

</div>
</template>

<script>

export default{
    data(){
        return{
            recipe:'',
            isKaramoji: false,
        }
    },

    mounted(){
        
    },

    methods :{
        submit(){
            this.$emit('createRecipe',this.recipe);
        }
    },


    watch:{
        recipe: function(){
            if(!this.recipe){
                this.isKaramoji = false;
            }else{ 
                this.isKaramoji = true;
            }
        }
    }
    
}

</script>
