<template>
<div>
    <!-- 注意　recipe-edit-newのほうで、detailを表示するかどうかを判断しているので、もしAcyion.Argumentが増えたら、そっちも追加しないといけない -->
    <div v-show='selectedAction.Argument == "wait"'>
        <input type='number' placeholder='Time'  v-model='newDetailValueTemp' min='0' class='uk-input uk-width-1-4' @input="$emit('update:newDetailTemp', $event.target.value)"> seconds
    </div>
    <div v-show='selectedAction.Argument == "--irate" || selectedAction.Argument == "--wrate"'>
       <input v-model='newDetailValueTemp' type='number' min='0' placeholder='Rate' class='uk-input uk-width-1-4' @input="$emit('update:newDetailTemp', $event.target.value)">
       <select v-model='newDetailValueUnitTemp' class='uk-select uk-width-1-4' @input="$emit('update:newDetailUnitTemp', $event.target.value)">
           <option disabled :value='""' selected>--Unit--</option>
           <option :value='"mL/min"'>mL/min</option>
           <option :value='"mL/s"'>mL/s</option>
           <option :value='"μL/min"'>μL/min</option>
           <option :value='"μL/s"'>μL/s</option>
           <option :value='"nL/min"'>nL/min</option>
           <option :value='"nL/s"'>nL/s</option>
       </select>
    </div>
    <div v-show='selectedAction.Argument == "--changePos"'>
        <select v-model='newDetailValueTemp' class='uk-select uk-width-1-4' @input="$emit('update:newDetailTemp', $event.target.value)">
            <option disabled :value='""' selected>--Position--</option>
            <option :value='1'>1</option>
            <option :value='2'>2</option>
            <option :value='3'>3</option>
            <option :value='4'>4</option>
            <option :value='5'>5</option>
            <option :value='6'>6</option>
        </select>
    </div>

</div>
</template>

<script>

export default{
    props:['selectedAction','newDetailTemp','newDetailUnitTemp'],



    data(){
        return{ 
            newDetailValueTemp:null,
            newDetailValueUnitTemp:'',
        }
    },

    mounted(){
    },

    methods :{
        resetValueUnit(){
            this.newDetailValueTemp = null;
            this.newDetailValueUnitTemp = '';
        },
    },

    watch:{

    },

    computed:{
      
    },
    
}

</script>
<style scoped lang='scss'>

</style>