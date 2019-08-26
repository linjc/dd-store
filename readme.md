# dd-store - 钉钉E应用状态管理

## 前言
E应用是钉钉主推的开发企业应用的小程序框架，公司好几款产品也都是使用E应用开发，但E应用和其他小程序一样，都是没有官方实现的状态管理库，一开始我写了一个[Emitter](https://github.com/linjc/dd-store/blob/master/src/emitter.js)类，用事件监听方式去实现全局共享状态管理，解决各种跨页面组件通信，可控性和维护性都不错，但这种方式需要在页面/组件给每一个状态定义监听函数，当页面状态比较多，光监听函数就得写一堆，特别影响代码整洁性。于是乎网上寻找有没有更好的解决方案，最终找到了[westore](https://github.com/Tencent/westore)库，这是腾讯开源团队开发的微信小程序解决方案，其中针对状态管理的实现很不错，特别是使用专门为小程序开发的[JSON Diff 库](https://github.com/dntzhang/westore/blob/master/packages/westore/utils/diff.js)保证每次以最小的数据量更新状态，比原生setData的性能更好。但有个问题，直接在钉钉E应用上使用是有问题的，问题原因很明显，小程序框架api的差异，比如微信小程序的组件生命周期函数和E应用的组件生命周期函数属性名是完全不一样的。。。

所以想在E应用上使用，还得花点时间，看了源码之后，根据自身理解重新写了一版，并去除了其他用不到的功能，只保留状态管理部分，总代码量由500多行精简到了100多行，另外添加了一些个人优化，比如每次this.update的时候，只对当前页面进行渲染，其他隐藏的页面只在再次显示的时候更新渲染等。对于这些优化有没有起到“优化”效果还有待验证，小伙伴们如果有什么建议或者使用上有什么问题随时在[Issues](https://github.com/linjc/dd-store/issues)进行反馈。

## 安装

``` js
npm i dd-store --save
```

## 使用

详细请参考样例：[示例Example](https://github.com/linjc/dd-store/tree/master/examples)

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


在app.js中注入全局store

``` js
// app.js

import store from '/store'

App({
  // 将全局store挂载在app上，所有通过create.Page()创建的页面都能通过this.store取到全局store的引用。
  // 注意：如果页面引入的是其他store，则以页面引入为主，this.store不再是全局store
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

## 快捷链接

- [仓库地址](https://github.com/linjc/dd-store)
- [NPM主页](https://www.npmjs.com/package/dd-store)
- [Issues反馈](https://github.com/linjc/dd-store/issues)
