// import create from '../../../src/create'
import create from 'dd-store'
import store from '/store'

// 使用create.Page方法创建页面
create.Page({

  store,

  data: {
    // 按需注入共享状态（与store.data内字段同名即可），可以直接修改store值并通过this.update()方式更新
    // 此处只定义需要的状态，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的字段，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新
    pageName: 'Test页面'
  },

  handleChange() {
    this.store.onChange()
  }

});
