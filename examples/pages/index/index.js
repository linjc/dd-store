import create from 'dd-store'
// import otherStore from '/otherStore'

// 使用create.Page方法创建页面
create.Page({
  // 此处注入的store会覆盖app注入的全局store，开发者可以视业务场景自由选择
  // 应用场景：页面业务比较独立，用不到全局store，但又存在多页面、组件状态共享
  // store: otherStore, 

  data: {
    // 按需注入共享状态（与store.data内属性同名即可），可以直接修改store值并通过this.update()方式更新
    // 此处只定义需要的状态，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新
    pageName: 'Index页面'
  },

  handleChange() {
    this.store.onChangeName()
  },

  toTestPage() {
    dd.navigateTo({ url: '/pages/test/test' })
  }

});
