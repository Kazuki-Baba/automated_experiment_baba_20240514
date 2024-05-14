<template>
<div class='uk-card uk-card-body uk-card-default'>
    <h3>Run</h3>
    <div class="uk-card uk-card-body uk-card-default">
        <ul uk-accordion>
            <li v-for="elem in resultList" :key="elem.id">
                <a class="uk-accordion-title mouse-over" href="#">
                     <span class="run-num-span">{{elem.id}} 　　{{elem.created_at}}</span>{{elem.result_title}}
                </a>
                <div class="uk-accordion-content">
                    <div class="uk-card uk-card-default uk-card-body">
                        <button class="uk-button uk-button-primary uk-width-1-4 min-button-size-2" type="button" @click="checkResult(elem.id)">Check</button>
                        <h4 class="uk-card-title">Comment</h4>
                        <div v-show="elem.comment !== null">
                            {{elem.comment}}
                        </div>
                        <div v-show="elem.comment == null">
                            No comment
                        </div>
                    </div>
                    <div>
                        <outline-table :editOutline="resultOutline(elem.id)"></outline-table>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import outlineTable from "./result-outline-table.vue"

export default {

    props:["resultList","resultOutlineList"],

    components:{
        outlineTable,
    },

    data(){
        return{

        }
    },

    methods:{
        resultOutline(runId){
            let outline = this.resultOutlineList.filter(function(elem){
                return elem.run_id == runId
            });
            return outline
        },

        checkResult(runId){
            this.$emit('getResultInfo',runId)
        },
    },

    watch:{

    },

    computed:{
        
    },
}
</script>
<style scoped>
.run-num-span {
    width: 18em;
    display: inline-block;
}
.mouse-over:hover{
    background-color: #fff799;
}
</style>