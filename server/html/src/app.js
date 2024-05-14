import Vue from "vue";
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

// loads the Icon plugin
UIkit.use(Icons);



Vue.component('maincomponent', require('./main.vue').default );

const app = new Vue({
        el: '#app',
});
