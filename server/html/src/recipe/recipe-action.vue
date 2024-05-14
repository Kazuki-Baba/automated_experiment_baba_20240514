<template>
<div>

<!-- デバイス選択 -->
<div id='recipe-action' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle}}</h2>
            <p>Select the device you want to use</p>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <div class='uk-width-2-3 uk-text-center'>
                    Procedure
                </div>
                <div class='uk-width-1-3 uk-text-center'>
                    Device select
                </div>
            </div>
        </div>
        <div class='uk-modal-body'>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <!--モーダルウインドウ左側 -->
                <div class='uk-width-2-3' uk-overflow-auto>
                    <table class="uk-table uk-table-hover">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(b,index) in newProcedure" :key='index'>
                            <!-- <tr v-for="(b,index) in recipeAction[1]" > -->
                            <td>{{index+1}}</td>
                            <td>{{b.Device}}</td>
                            <td>{{b.Action}}</td>
                            <td>{{b.Details}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <!-- モーダルウインドウ右側-->
                <div class='uk-width-1-3' uk-overflow-auto>
                    <div v-for='(a,index) in recipeDeviceArray' class='uk-text-center' :key='index'>
                        {{a}}
                         <select v-model='selectedDeviceArray[index]' class='uk-select'>
                            <option disabled :value='null' selected>--Device Select--</option>
                            <option v-for='(d, indexd) in deviceDataArray' :value='d' :key='indexd'>{{d.Device}}({{d.Company}}/{{d.Model}})</option>
                         </select>
                    </div>
                </div>
            </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
             <p v-show='isKara'><font color='#e62323'>Select the device</font></p>
             <ul class="uk-dotnav">
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
                <li class="uk-active"><a href="#">Item 4</a></li>
            </ul>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-detail">Prev</button>
            <button class="uk-button uk-button-primary uk-modal-close" type="button" @click='experimentStart' v-if='!isKara'>Run</button>
            <button class="uk-button uk-button-default"  v-if='isKara' disabled>Enter</button>

        </div>
    </div>
</div>

<!-- 繰り返す手順の選択 -->
<div id='recipe-repeat' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle}}</h2>
            <p>Select the device you want to repeat</p>
        </div>
        <div class='uk-modal-body'>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <div class='uk-width-2-3' uk-overflow-auto>
                    <table class="uk-table">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(b,index) in recipeAction[1]" @click='clickTable($event)' :key='index'>
                            <td :class='{isactivetable:isActiveTable(index)}'>{{index+1}}</td>
                            <td :class='{isactivetable:isActiveTable(index)}'>{{b.Device}}</td>
                            <td :class='{isactivetable:isActiveTable(index)}'>{{b.Action}}</td>
                            <td :class='{isactivetable:isActiveTable(index)}'>{{b.Details}}</td>
                        </tr>   
                        </tbody>
                    </table>
                </div>
            </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li  class="uk-active"><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
            <button class="uk-button uk-button-danger uk-modal-close" type="button" @click='resetSelect'>Cancel</button>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-repeat-add" @click='duplicateProcedure'>Next</button>
        </div>
    </div>
</div>

<!-- 選択した手順を追加 -->
<div id='recipe-repeat-add' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle}}</h2>
            <p>Decide number of times and order</p>
        </div>
        <div class='uk-modal-body'>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <!--モーダルウインドウ左側 -->
                <div class='uk-width-1-2' uk-overflow-auto>
                    <div>decide where to insert the repeating steps</div>
                    <table class="uk-table uk-table-hover">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(b,index) in recipeAction[1]" @click='clickRow($event)' :key='index'>
                            <td :class='{isactiverow:isActiveRow(index)}'>{{index+1}}</td>
                            <td :class='{isactiverow:isActiveRow(index)}'>{{b.Device}}</td>
                            <td :class='{isactiverow:isActiveRow(index)}'>{{b.Action}}</td>
                            <td :class='{isactiverow:isActiveRow(index)}'>{{b.Details}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <!-- モーダルウインドウ右側-->
                <div class='uk-width-1-2' uk-overflow-auto>
                    <p>the number of repeat : <input type='number' v-model='repeatNumber' min='1' max='100' placeholder='最大100まで' class='uk-input'></p>

                   <div>repeating steps</div> 
                   <table class="uk-table uk-table-hover">
                        <thead>
                        <tr>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(b,index) in duplicatedProcedure" :key='index'>
                            <td>{{b.Device}}</td>
                            <td>{{b.Action}}</td>
                            <td>{{b.Details}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li><a href="#">Item 1</a></li>
                <li  class="uk-active"><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-repeat">Prev</button>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-detail" @click='addProcedure'>Next</button>
        </div>
    </div>
</div>

<!-- Detail編集 -->
<div id='recipe-detail' uk-modal bg-close='false' class='uk-modal-container'>
    <div class='uk-modal-dialog'>
        <div class="uk-modal-header">
            <h2 class="uk-modal-title">{{recipeTitle}}</h2>
            <p>Edit details</p>
        </div>
        <div class='uk-modal-body'>
            <div class="uk-grid-collapse uk-child-width-expand@s" uk-grid>
                <!--モーダルウインドウ左側 -->
                <div class='uk-width-2-3' uk-overflow-auto>
                    <table class="uk-table uk-table-hover">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(b,index) in newProcedure" :key='index'>
                            <td class='uk-text-middle'>{{index+1}}</td>
                            <td class='uk-text-middle'>{{b.Device}}</td>
                            <td class='uk-text-middle'>{{b.Action}}</td>
                            <td><span v-show='!(b.Details === null)'><input v-model.trim='b.Details' type='text' class='uk-input uk-form-width-small'></span></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>    
        <div class="uk-modal-footer uk-text-right">
             <ul class="uk-dotnav">
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li class="uk-active"><a href="#">Item 3</a></li>
                <li><a href="#">Item 4</a></li>
            </ul>
            <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-repeat-add">Prev</button>
             <button class="uk-button uk-button-default uk-margin-small-right" type="button" uk-toggle="target: #recipe-action">Next</button>
    </div>
</div>

</div>

</div>
</template>

<script>


export default{
    props:['recipeAction','recipeTitle','deviceData'],


    data(){
        return{ 
            test:{},
            selectedDeviceArray:[],
            selectedDevice:{},
            isKara:true,
            isSelectedRow:[],
            clickedRow:0,
            //選択して複製したやつ
            duplicatedProcedure:[],
            //複製したやつを指定回数繰り返したやつ
            duplicatedProcedure2:[],
            newProcedure:[],
            repeatNumber:1,

        }
    },

    mounted(){
        document.addEventListener('keydown',event =>{
            if (event.key == 'Escape'){
                this.resetSelect();
            }
        });
    },

    beforeDestory(){
        document.addEventListener('keydown',event =>{
            if (event.key == 'Escape'){
                this.resetSelect();
            }
        });
    },

    methods :{
        kakunin(){

        },

        shortcutRun(){
            this.newProcedure = [...this.recipeAction[1]];
        },

        clickTable(event){
            var index = this.isSelectedRow.indexOf(event.target.parentNode.rowIndex - 1);
            if(index == -1){
                this.isSelectedRow.push(event.target.parentNode.rowIndex - 1);
            }else{
                this.isSelectedRow.splice(index,1);
            }


             this.isSelectedRow.sort(function(first,second){
              if(first > second){
                return 1;
              }else if(first< second){
                return -1;
              }else{
                return 0;
              }
            });
        },

        clickRow(event){
            this.clickedRow = event.target.parentNode.rowIndex -1;
        },

        isActiveTable(ind){
            return this.isSelectedRow.findIndex((elem)=>
            elem == ind) > -1
        },

        isActiveRow(ind){
            return this.clickedRow == ind;
        },

        duplicateProcedure(){
           let tempRecipe = [...this.recipeAction[1]];
           this.duplicatedProcedure = this.isSelectedRow.map(row => {
               return tempRecipe[row];
           });
       },

       addProcedure(){
           this.newProcedure = [...this.recipeAction[1]];

            //選択した手順を指定回数増やす
            for(let i=0; i <this.repeatNumber; i++){
                //ここの手順でdeepcopyしておかないとexperimentStart()のProcedureOrderの振り直しで詰む
                this.duplicatedProcedure2.push(...JSON.parse(JSON.stringify(this.duplicatedProcedure)));
            };
           
           //繰り返しを組み込んだ手順をnewProcedureとして作成
           Array.prototype.splice.apply(this.newProcedure,[this.clickedRow+1,0].concat(this.duplicatedProcedure2));
       },

        //実行ボタンクリックでレシピと使うデバイスを送信
        experimentStart(){
            //重複無く選ぶ　
            for(let i=0; i< this.recipeDeviceArray.length; i++){
              this.selectedDevice[this.recipeDeviceArray[i]] = this.selectedDeviceArray[i]; 
            };

            
            //ProcedureOrderのふりなおし
            this.newProcedure.forEach(function(elem,index,array){
                elem.ProcedureOrder = index + 1;
            });
            
            

            
            //this.recipeActionの[0]はレシピタイトルとかの情報、[1]は実験手順の送信をしている。
            this.$emit('experimentStart',[this.recipeAction[0],this.newProcedure],this.selectedDevice);
            this.selectedDevice ={};
            this.isSelectedRow = [];
            this.clickedRow = 0;
            this.duplicatedProcedure = [];
            this.duplicatedProcedure2 = [];
            this.repeatNumber = 1;            


        },

        resetSelect(){
            this.selectedDeviceArray = [];
            this.isSelectedRow = [];
            this.clickedRow = 0;
            this.duplicatedProcedure = [];
            this.duplicatedProcedure2 = [];
            this.newProcedure = [];
            this.repeatNumber = 1;
        },
    },

    watch:{
        selectedDeviceArray: function(){
            if(this.selectedDeviceArray.filter(v =>v).length == this.recipeDeviceArray.length){
                this.isKara = false;
            }else{
                this.isKara= true;
            };
        },

        
    },

    computed:{
        recipeDeviceArray: function(){
            var aaaa = [...this.recipeAction[1]].map(x => x.Device);
            aaaa = [...aaaa.filter(function(x){
                return x !=='-';
            })]
         return [...new Set(aaaa)]
       },

      deviceDataArray: function(){
          if(this.deviceData.length >0){
             var deviceListTemp = [];
            
            /*
            this.deviceData.forEach(function(value){
                deviceListTemp.push(...value.client.deviceList);
            })
            */
            return deviceListTemp
            }
       },




    },
    
}

</script>

<style>

    .isactivetable{
        background:#ffffc8;
    }
    
    .isactiverow{
        border-bottom:solid medium #E74C3C;
    }

/*
    #recipe-action{
        animation: none;
        transform: none;
        transition: unset;
    }
    */
    
</style>