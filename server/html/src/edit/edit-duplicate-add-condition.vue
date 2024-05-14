<template>
<div><!-- いらんかこの機能 -->
    {{condition}}
    action:{{action}}
</div>
</template>

<script>

export default {
    props:["actionLinkList","valueChoiceList"],

    components:{
        
    },

    data(){
        return{
            condition:{},
        }
    },

    methods:{
        initializeCondition(a){
            // プロパティを全削除 
            Object.keys(this.condition).forEach(key => {
                this.$delete(this.condition, key)
            });
            this.condition = {...a};
        },

        add(){
            this.condition.valueArray.push("ここおこ");
        }
    },

    watch:{

    },

    computed:{
        action: function(){
            const deviceLinkId = this.condition.device_link_id;
            const action = this.actionLinkList.find(elem => elem.id == deviceLinkId);
            if(action == void(0)){
                return {}
            }
            return action
        },

    },
}
</script>