<template>
<div class="uk-card uk-card-body uk-card-default">
    <h3 class="uk-card-title">{{resultRun.result_title}}</h3>
    <div class="uk-card uk-card-body uk-card-default">
        <h4>Date</h4>
        <div>{{resultRun.created_at}}</div>
        <h4>Comment</h4>
        <div v-show="resultRun.comment !== null">
            {{resultRun.comment}}
        </div>
        <div v-show="resultRun.comment == null">
            No comment
        </div>
    </div>
    <div class="uk-card uk-card-body uk-card-default">
        <ul class="uk-subnav uk-subnav-divider" uk-switcher='connect:#result-experiment-contents' id='subnav-result-check'>
            <li> <a href="#"> Experiment </a> </li>
            <li> <a href="#"> Device </a> </li>
            <li><a href="#"> Data </a></li>
            <li><a href="#"> Log </a></li>
            <li><a href="#"> Chart </a></li>
        </ul>

        <ul class="uk-switcher uk-margin" id="result-experiment-contents">
            <li>
                <h4>Experiment</h4>
                    <div class="uk-grid-divider" uk-grid>

                        <div class="uk-width-1-2@m">
                            <div>
                                <h4>Result outline</h4>
                                <table class="uk-table uk-table-hover">
                                    <thead>
                                    </thead>
                                    <tr>
                                        <td v-if="(isAllOutlineSelected == false)" @click="selectedOutline(-1,-1)">all</td>
                                        <td v-if="(isAllOutlineSelected == true)" class="highlight-td">all</td>
                                    </tr>
                                    <tr v-for="(a,index) in displayProcedure" :key="a.id" class="mouse-pointer">
                                        <td v-if="(a.id !==tempOutline.id )" @click="selectedOutline(index)">{{a.result_procedure_title}}</td>
                                        <td v-if="(a.id ==tempOutline.id )" class="highlight-td">{{a.result_procedure_title}}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        <div class="uk-width-1-2@m">
                            <div>
                                <h4>Procedure</h4>
                                <h5 v-if="displayBlock.length == 0">No procedure</h5>
                                <table v-show="displayBlock.length !== 0" class="uk-table uk-table-divider">
                                <thead>
                                    <tr>
                                    <th></th>
                                    <th>Device</th>
                                    <th>Action</th>
                                    <th>Detail</th>
                                    <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(a,index) in displayBlock" :key="a.id" class="uk-text-left">
                                    <td>{{index+1}}</td>
                                    <td>{{displayDevice(a.result_device_id)}}</td>
                                    <td>{{a.action_name}}</td>
                                    <td>{{a.detail}}</td>
                                    <td>{{timeExtracted(a.created_at)}}</td>
                                    </tr>
                                </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
            </li>
            <li>
                <h4>Device</h4>
                <div>
                    <table class='uk-table uk-table-divider'>
                        <thead>
                        <tr>
                            <th></th>
                            <th>device</th>
                            <th>device name</th>
                            <th>model</th>
                            <th>company</th>
                            <th>serial number</th>

                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for='(elem,index) in resultDevice' :key="elem.id">
                            <td>{{index + 1}}</td>
                            <td>{{elem.device_name}}</td>
                            <td>{{elem.result_device_name}}</td>
                            <td>{{elem.result_device_model}}</td>
                            <td>{{elem.result_device_company}}</td>
                            <td>{{elem.result_device_serialnumber}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </li>
            <li>
                <h4>Data</h4>
                <div>
                    <table class='uk-table uk-table-divider'>
                        <thead>
                        <tr>
                            <th>time</th>
                            <th>data</th>

                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for='elem in resultData' :key="elem.id">
                            <td>{{elem.created_at}}</td>
                            <td>{{elem.data}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </li>
            <li>
                <h4>Log</h4>
                <div>
                    <table class='uk-table uk-table-divider'>
                        <thead>
                        <tr>
                            <th>device</th>
                            <th>time</th>
                            <th>data</th>

                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for='elem in resultTimeLogData' :key="elem.id">
                            <td>{{elem.device_name }}</td>
                            <td>{{elem.created_at}}</td>
                            <td>{{elem.value}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </li>
            <li>
                <h4>Chart</h4>
                <div v-for="elem in deviceIdExtractForLog()" :key="elem">
                    <h4>{{ deviceNameFind(elem) }}</h4> 
                    <experiment-chart :chartData="chartDataSelect(elem)" :options="chartOptions"></experiment-chart>
                </div>
                <div><!--スペース開ける --></div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import experimentChart from '../experiment/experiment-chart.vue'

export default {
    
    props:["resultRun","resultData","resultTimeLogData","resultDevice","resultProcedure","resultCondition","resultBlock"],

    components:{
        experimentChart,
    },

    data(){
        return{
            displayProcedure:[],
            isAllOutlineSelected: true,
            tempOutline: {},
            chartOptions: {
                animation: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        distribution: 'linear',
                        time:{
                            displayFormats: {
                            second: 'h:mm:ss'
                            }
                        },
                    }]
                }
            },
        }
    },

    methods:{
        resetAll(){
            this.resetOutline();
            this.isAllOutlineSelected = true;
            this.tempOutline = {};
        },

        resetOutline(){
            this.displayProcedure.splice(0, this.displayProcedure.length);
            this.displayProcedure = JSON.parse(JSON.stringify(this.resultProcedure));
        },

        selectedOutline(index){
            this.isAllOutlineSelected = false;
            this.tempOutline = {};

            if(index == -1){
                this.isAllOutlineSelected = true;
                return
            };

            this.tempOutline = Object.assign({}, this.tempOutline, this.resultProcedure[index]);
        },

        displayDevice(deviceId){
            const dev = this.resultDevice.find(elem => elem.id == deviceId);
            if (dev) { return dev.device_name }
        },

        timeExtracted(time){
            let a = new Date(time);
            let b = a.getHours();
            let c = a.getMinutes();
            let d = a.getSeconds();
            b = ( '00' + b ).slice( -2 );
            c = ( '00' + c ).slice( -2 );
            d = ( '00' + d ).slice( -2 );
            return (b + ":" + c + ":" + d)
        },

        deviceIdExtractForLog(){
            let array = this.resultTimeLogData.map(function(val){
                return val.result_device_id
            });
            return new Set(array)
        },

        chartDataSelect(deviceId){
            let val = this.resultTimeLogData.filter(a => a.result_device_id  == deviceId);
            let xData = val.map(function(a){
                return a.created_at
            });
            let yData = val.map(function(a){
                return Number(a.value)
            })

            let data =  {
                labels: xData,
                datasets: [
                {
                    label: 'Temperature',
                    data: yData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: false,
                    type: 'line',
                    lineTension: 0,
                }
                ]
             }
             return data
        },

        deviceNameFind(deviceId){
            let a = this.resultTimeLogData.find(elem => elem.result_device_id == deviceId)

            return a.device_name
        }
    },

    watch:{
        resultProcedure: function(){
            this.resetOutline();
        }
    },

    computed:{
        displayBlock: function(){
            if(this.isAllOutlineSelected){
                let b = this.resultBlock
                return b
            }

            let ii = this.tempOutline.id;
            let block = this.resultBlock.filter(function(elem){
                return elem.result_procedure_id == ii
            });
            return block
        }
    },
}
</script>