import create from 'dd-store'
import indexStore from '/stores/indexStore'

create.Page({
  // 是否自动注入所有store.data状态和全局状态$data
  // useAll: true,

  // 注入页面store
  store: indexStore,

  data: {
    // 声明使用全局共享状态，如果设置useAll为true，则不声明就可以使用
    // 为了避免与页面store.data内属性命名冲突，globalStore.data整个赋给$data，即$data = globalStore.data
    $data: null,

    // 按需声明状态属性，如果设置useAll为true，则自动注入store.data全部属性，无需一个个添加
    // 设置的默认值无效，如需设置请在store.data内设置
    title: null,
    a: null,
    
    // 定义store.data没有的属性，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新
    privateData: '私有状态'
  },

  onLoad() { 
    console.log(this.store) // 页面store
    console.log(this.$store) // 全局store
  },

  handleChangeTitle() {
    this.store.data.title = '首页' + Math.floor(Math.random() * 1000)
    this.update()
  },

  goPage() {
    dd.navigateTo({ url: '/pages/hello/hello' })
  }

});
