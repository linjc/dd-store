import create from 'dd-store'

create.Component({
  // store: componentStore, // 如果不配置，则默认使用所在页面的store
  useAll: true, // 自动注入store.data内的所有状态和$store.data
  mixins: [],
  data: {
    // $data: null,
    // title: null
  },
  props: {},
  didMount() {},
  didUpdate() {},
  didUnmount() {},
  methods: {
    handleChangeLang() {
      this.$store.onChangeLang()
    },
  },
});
