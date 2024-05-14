<template>
<div class="uk-card uk-card-default uk-card-body">
    <h4 class="uk-card-title">Recipe outline</h4>
    <h4 v-if="editOutline.length == 0">No outline</h4>
    <ul class="uk-list uk-list-large uk-text-large">
    <li v-for="a in editOutline" :key="a.id">
        {{a.experiment_procedure_title}}
    </li> 
    </ul>
</div>
</template>

<script>
export default {
  props: ["editOutline"],

  data(){
    return{

    }
  },

  methods: {

  },

  watch:{

  }
}
</script>
