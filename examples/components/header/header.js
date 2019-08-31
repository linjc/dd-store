import create from 'dd-store'

create.Component({
  useAll: true, // 自动注入根页面store.data的所有状态和全局globalStore
  mixins: [],
  data: {
    // globalData: null,
    // title: null
  },
  props: {},
  didMount() {},
  didUpdate() {},
  didUnmount() {},
  methods: {
    handleChangeLang() {
      this.globalStore.onChangeLang()
    },
  },
});
