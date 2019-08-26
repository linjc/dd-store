# dd-store - 钉钉E应用状态管理

## 安装

``` js
npm i dd-store --save
```

## 使用

参考样例：[Example](https://github.com/linjc/dd-store/tree/master/examples)

创建store

``` js
// store其实就是个包含data属性的对象，可以自由使用任何对象，只要引用同一个对象，就能实现状态共享
class Store {

  data = {
    userName: '李狗蛋',
    corpName: '富土康',
    userList: [{ id: 1, name: '刘备' }, { id: 2, name: '关羽' }, { id: 3, name: '张飞' }],
    deptList: [{ id: 1, name: '产品经理' }, { id: 2, name: '前端攻城狮' }, { id: 3, name: '后端攻城狮' }]
  }

  onChange() {
    const ran = Math.floor(Math.random() * 10000)
    this.data.userName = '李狗蛋' + ran
    this.data.corpName = '富土康' + ran
    this.update()
  }
}

export default new Store();

``` 


在app.js中注入store

``` js
// app.js

import store from '/store'

App({
  // 将全局store挂载在app上，可以免去手动一个个在页面中引入，当然也可以在页面注入。
  // 如果页面引入的是其他store，则以页面引入为主，表示使用了局部store，一般适用于那些业务比较独立不需要使用全局store，但又需要多页面、组件通信的页面。开发者可以视业务场景自由选择
  store,
  
  onLaunch(options) {
    
  },
  onShow(options) {
    
  },
});


``` 

创建页面

``` js
import create from 'dd-store'
// import otherStore from '/otherStore'

// 使用create.Page方法创建页面
create.Page({
  // 此处注入的store会覆盖app注入的全局store，开发者可以视业务场景自由选择
  // 应用场景：页面业务比较独立，用不到全局store，但又存在多页面、组件状态共享
  // store: otherStore, 

  data: {
    // 按需注入共享状态（与store.data内属性同名即可），可以直接修改store.data值并通过this.update()方式更新
    // 此处只定义需要的状态，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新
    pageName: 'Index页面'
  },

  // 在store内实现状态变更
  handleChange() {
    this.store.onChange()
  },

  // 组件内实现状态变更
  handleChangeOther() {
    const ran = Math.floor(Math.random() * 10000)
    this.store.data.userList[1].name = '关羽' + ran
    this.store.data.deptList[1].name = '前端攻城狮' + ran
    this.update()
  }

  toTestPage() {
    dd.navigateTo({ url: '/pages/test/test' })
  }

});

```

创建组件
``` js
import create from 'dd-store'

// 使用create.Component方法创建组件，会自动从父级页面注入store，不需要手动注入
create.Component({
  data: {
    // 按需注入共享状态（与父级页面的store.data内属性同名即可），可以直接修改store.data值并通过this.update()方式更新
    // 此处只定义需要的状态，设置的默认值无效，如需设置请在store.data内设置
    userList: null,
    deptList: null,

    // 定义store.data没有的属性，则默认为组件私有状态，只能使用默认的this.setData(obj)方式更新
    commName: 'comm-a组件'
  },

  methods: {
    handleChange() {
      const ran = Math.floor(Math.random() * 10000)
      this.store.data.userList[0].name = '刘备' + ran
      this.store.data.deptList[0].name = '产品经理' + ran
      this.update()
    }
  },
});
```
