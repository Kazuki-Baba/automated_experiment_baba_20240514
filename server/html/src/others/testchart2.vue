<script>
import { Bar } from 'vue-chartjs';

export default {
  extends: Bar,
  name: 'chart',
  data () {
    return {
      data: {
        labels: [
                  '2021-08-02T09:30:22.710731+09:00',
                  '2021-08-02T09:30:30.710731+09:00',
                  '2021-08-02T09:30:40.710731+09:00',
                  '2021-08-02T09:30:50.710731+09:00',
                  '2021-08-02T09:31:00.710731+09:00',
                  '2021-08-02T09:31:22.710731+09:00',
                ],
        datasets: [
          {
            label: 'ぬ',
            data: [24.6, 26.8, 22.1, 28.5, 32.8, 29.0],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            type: 'line',
          },
        ]
      },
      options: {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        distribution: 'linear',
                        time:{
                          displayFormats: {
                            second: 'h:mm'
                          }
                        },
                    }]
                }
            }
    }
  },
  mounted () {
    this.renderChart(this.data, this.options)
  }
}
</script>
