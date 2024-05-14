<template>
<div>
    <div class="uk-card uk-card-default uk-card-body">
        <table  class="uk-table uk-table-divider uk-text-left">
        <tbody>
            <tr>
                <td>Minimum value</td>
                <td><input type='number' v-model="value.min" min="0" placeholder='min' class='uk-input uk-width-1-2' @blur="checkNum(value)" @focus="rejectEnter()"></td>
            </tr>
            <tr>
                <td>Max value</td>
                <td><input type='number' v-model="value.max" min="0" placeholder='max' class='uk-input uk-width-1-2' @blur="checkNum(value)" @focus="rejectEnter()"></td>
            </tr>
            <tr>
                <td>Step</td>
                <td><input type='number' v-model="value.step" min="0" placeholder='step' class='uk-input uk-width-1-2' @blur="checkNum(value)" @focus="rejectEnter()"></td>
            </tr>
            <tr>
                <td>Unit</td>
                <td>
                    <span v-if="condition.unit !== null">{{condition.unit}}</span>
                    <span v-if="condition.unit == null"> - </span>
                </td>
            </tr>
        </tbody>
        </table>
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
            condition:[],//これを直接書き換えると、親のconditionが変わる
            value:{
                min:0,
                max:0,
                step:1,
            }
        }
    },

    methods:{
        initializeCondition(a){
            // プロパティを全削除 
            Object.keys(this.condition).forEach(key => {
                this.$delete(this.condition, key)
            });
            this.condition = {...a};

            this.valueInitialize();
            this.$set(this.value, 'min', this.condition.valueArray[0])
            this.$set(this.value, 'max', this.condition.valueArray[0] * 2)
            this.checkNum(this.value);
        },

        valueInitialize(){
            // プロパティを全削除 
            Object.keys(this.value).forEach(key => {
                this.$delete(this.value, key)
            });
            this.$set(this.value, 'min', 0)
            this.$set(this.value, 'max', 0)
            this.$set(this.value, 'step', 1)
        },
        
        add(){
            let i = 0;
            let v = Number(this.value.min);
            let array = [];

            let digit = 3;

            if(Number(Number(this.value.step).toFixed(digit)) > 0){
                while(v <= this.value.max && i < 999){//一応1000件で止める
                    array.push(v);
                    v += Number(this.value.step);
                    v = Number(v.toFixed(digit));
                    i++
                }
            }else{
                array.push(v);
            }

            this.condition.valueArray.splice(0, this.condition.valueArray.length)
            this.condition.valueArray.push(...array)
        },

        checkNum(value){
            let isError = false;
            Object.keys(value).forEach(function (key) {
                let num = value[key]
                if(String(num).match(/^([1-9]\d*|0)(\.\d+)?$/)){

                }else{
                    isError = true;
                }
            });

            if(Number(value.min) > Number(value.max)){
                isError = true;
            }

            this.$emit("numValidation",isError)
        },

        rejectEnter(){
            let isError = true;
            this.$emit("numValidation",isError)
        }

    },

    watch:{

    },

    computed:{
        
    },
}
</script>