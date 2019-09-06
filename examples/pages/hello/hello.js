import create from 'dd-store'
import helloStore from '/stores/helloStore'

create.Page({

  useAll: true, // 自动注入全部store.data状态和全局globalStore
  
  store: helloStore,

  data: {},

  onLoad() { },
  
  handleChangeTitle() {
    this.store.onChangeTitle()
  },

  goBack() {
    dd.navigateBack()
  }
});
