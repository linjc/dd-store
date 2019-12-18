import create from 'dd-store'

create.Component({
  useAll: true, // 自动注入根页面store.data内的所有状态和$store.data
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
