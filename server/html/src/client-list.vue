<template>
<div class="uk-card uk-card-body uk-card-default">

  <div v-if="clientActionResultValue.result" class="uk-card uk-card-body uk-card-default">
    <p><span>Response </span>: {{clientActionResultValue.result}}</p>
    <p>
      <span>Device </span>: {{clientActionResultValue.device.device}}  {{clientActionResultValue.device.HelpUsage}}<br>
     <span></span>&nbsp;&nbsp;{{clientActionResultValue.device.model}}, {{clientActionResultValue.device.company}}, {{clientActionResultValue.device.serialnumber}} ({{clientActionResultValue.device.script}})
    </p>
  </div>

  <ul class='uk-list uk-list-hyphen'>
  <li v-for="(item,index) in deviceData" :key='index'> 
    <span :uk-tooltip="item.clientData.detail">{{item.clientData.name}}</span>
    <ul uk-accordion>
      <li v-for="item2 in item.deviceList" :key='item2.id'> 
        <a class='uk-accordion-title' href='#'>
          {{item2.device}}({{item2.model}}, {{item2.company}})
        </a>
        <div class='uk-accordion-content'>
          <table class='uk-table uk-table-hover'>
            <thead>
              <tr>
                <th>option</th>
                <th>explanation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for='(value,index2) in item2.HelpUsage' :key='index2'>
                <td>{{value}}</td>
                <td>{{item2.HelpArgument[index2]}}</td>
                <td>
                  <div v-if="!isHaveDetail(value)">
                    <button class="uk-button uk-button-default uk-button-small" type="button" 
                    @click='clientAction(item2,value,item2.HelpArgument[index2])'>Emit</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </li>
    </ul>

  </li>
  </ul>

  
</div>
</template>

<script>
export default {
  props: ['deviceData','clientActionResultValue'],

  data(){
    return{
      clientActionObj:null,
      
    }
  },

  methods: {
    clientAction(deviceInfo,helpUsage,helpArgument){
      this.clientActionObj = JSON.parse(JSON.stringify(deviceInfo));
      this.clientActionObj.HelpUsage = helpUsage;
      this.clientActionObj.HelpArgument = helpArgument;
      this.$emit('clientAction',this.clientActionObj);
    },

    isHaveDetail(usage){
      return (usage.indexOf(" ") !== -1);
    }
  },

  watch:{
    clientActionResultValue:{
      handler: function(val,oldval){
      },
      immediate:true,
      deep:true,
    }
  }
}
</script>
<style scoped>
span {
display: inline-block;
width: 6em;
}
</style>