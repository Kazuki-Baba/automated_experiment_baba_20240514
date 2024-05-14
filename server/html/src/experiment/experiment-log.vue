<template>
<div>
    <div>
        <ul class="uk-subnav uk-subnav-pill" uk-switcher='connect:#experiment-log-contents' id='subnav-experiment-log'>
            <li v-for="(val, key) in timeLogs" :key="key">
                <a href="#">
                    {{ val.device.name }}
                </a>
            </li>
        </ul>
        <ul class="uk-switcher uk-margin" id="experiment-log-contents">
            <li v-for="(val, key) in timeLogs" :key="key">
                <div>
                    Device : {{ val.device.device }}
                </div>
                <div class="uk-grid-divider" uk-grid>
                    <div class="uk-width-3-4@m">
                        <div>
                            <experiment-chart :chartData="chartData(val)" :options="chartOptions"></experiment-chart>
                        </div>
                    </div>
                    <div class="uk-width-1-4@m">
                        <table class='uk-table uk-table-divider'>
                            <thead>
                            <tr>
                                <th>time</th>
                                <th>data</th>

                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for='(elem, index) in val.time' :key="elem">
                                <td>{{timeExtracted(elem)}}</td>
                                <td>{{val.data[index]}}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </li>
        </ul>
    </div>

</div>
</template>

<script>
import experimentChart from './experiment-chart.vue'

export default {
    props:['timeLogs'],

    components:{
        experimentChart,
    },

    data(){
        return{
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

        chartData(val){
            let data =  {
                labels: val.time,
                datasets: [
                {
                    label: 'Temperature',
                    data: val.data,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: false,
                    type: 'line',
                    lineTension: 0,
                }
                ]
             }
             return data
        }
    },

    watch:{

    },

    computed:{
        
    },
}
</script>