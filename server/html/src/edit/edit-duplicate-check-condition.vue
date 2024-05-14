<template>
<div>
    <h4 class="uk-card-title">Total number of the experiment condition : {{condition.length}}</h4>
    <div class="uk-card uk-card-default uk-card-body uk-height-max-large can-overflow">
        <div>
            <table class="uk-table uk-table-divider">
                <tbody>
                    <tr>
                        <td>No.</td>
                        <td v-for="a in originalCondition" :key="a.id">{{a.condition_title}}</td>
                        <td>Trash button</td>
                    </tr>
                    <tr v-for="(a,idx) in condition" :key="a[0]" class="uk-text-left">
                        <td v-for="(b,i) in a" :key="b.id">
                            <span v-if="i == 0">{{b}}</span>
                            <span v-if="i > 0">{{b.value}}</span>

                        </td>
                        <td><span uk-icon="icon: trash" @click="trashCondition(idx)"></span></td>
                    </tr>
                </tbody>
            </table>
        </div>
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
            condition:[],
            originalCondition:[{id:0}],
        }
    },

    methods:{
        initializeCondition(a, originalCondition){
            this.condition.splice(0, this.condition.length);
            this.condition.push(...a);

            this.originalCondition.splice(0, this.originalCondition.length);
            this.originalCondition.push(...originalCondition);
        },

        trashCondition(idx){
            this.condition.splice(idx, 1) 
        },

        submitCondition(){
            let c = JSON.parse( JSON.stringify(this.condition))
            let cond  = c.map((elem)=>{
                elem.shift();
                return elem
            })
            return cond;
        }
    },

    watch:{

    },

    computed:{
        
    },
}
</script>
<style scoped>
    .can-overflow{
      overflow: scroll;
    }
</style>