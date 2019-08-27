# dd-store - 钉钉E应用状态管理

## 前言
E应用是钉钉主推的开发企业应用的小程序框架，公司好几款产品也都是使用E应用开发，但E应用和其他小程序一样，都是没有官方实现的状态管理库，一开始我写了一个[Emitter](https://github.com/linjc/dd-store/blob/master/src/emitter.js)类，用事件监听方式去实现全局共享状态管理，解决了各种跨页面组件通信，可控性和维护性都不错，但这种方式需要在页面/组件给每一个状态定义监听函数，当页面状态比较多时，光监听函数就得写一堆，特别影响代码整洁性。于是乎网上寻找有没有更好的解决方案，最终找到了[westore](https://github.com/Tencent/westore)库，这是由腾讯开源团队研发的微信小程序解决方案，其中针对状态管理的实现很不错，特别是使用专门为小程序开发的[JSON Diff 库](https://github.com/dntzhang/westore/blob/master/packages/westore/utils/diff.js)保证每次以最小的数据量更新状态，比原生setData的性能更好。但有个问题，直接在钉钉E应用上使用是有问题的，问题原因很明显，小程序框架api的差异，比如微信小程序的组件生命周期函数和E应用的组件生命周期函数属性名是完全不一样的。。。

所以想在E应用上使用，还得花点时间，看了源码之后，根据自身理解重新写了一版，去除了一些其他功能，只保留状态管理部分，总代码量从500多行精简到了100多行，另外添加了一些个人优化，比如每次this.update的时候，只对当前页面进行渲染，其他页面只在再次显示的时候更新渲染等。对于这些优化有没有起到“优化”效果还有待验证，小伙伴们如果有什么建议或者使用上有什么问题随时在[Issues](https://github.com/linjc/dd-store/issues)进行反馈。（ps：请保持使用最新npm包）

## 安装

``` js
npm i dd-store --save
```

## API

* create.Page(option) 创建页面
* create.Component(option) 创建组件
* this.update() 更新页面或组件，在页面、组件或store内使用
* store.update() 更新页面或组件，在任何非页面非组件的 js 文件中使用

## 使用

详细请参考示例：[示例Example](https://github.com/linjc/dd-store/tree/master/examples)

### 创建store

store其实是一个包含data属性的对象，可以使用任意方式来定义该对象，任何页面、组件只要引用同一个对象，就能实现状态共享。

``` js
class Store {

  data = {
    userName: '李狗蛋',
    corpName: '富土康',
    userList: [{ id: 1, name: '刘备' }, { id: 2, name: '关羽' }, { id: 3, name: '张飞' }],
    deptList: [{ id: 1, name: '产品经理' }, { id: 2, name: '前端攻城狮' }, { id: 3, name: '后端攻城狮' }]
  }

  onChangeName() {
    const ran = Math.floor(Math.random() * 10000)
    this.data.userName = '李狗蛋' + ran
    this.data.corpName = '富土康' + ran
    this.update()
  }
}

export default new Store();
``` 

### 在app.js中注入全局store

将全局store挂载在app上，所有create.Page()创建的页面都能通过this.store取到全局store的引用。当然也可以通过页面挂载上去，那样的话就需要每次手动引入添加。

``` js
import store from '/store'

App({

  store,
  
  onLaunch(options) {
    
  },
});
``` 

### 创建页面

使用create.Page创建页面。在data上按需定义需要共享的属性（store.data内的属性），注意这里data只是声明属性，设置的默认值无效，默认值请在store.data设置。如果定义store.data没有的属性，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新。

``` js
import create from 'dd-store'
// import otherStore from '/otherStore'

create.Page({
  // 使用局部store
  // store: otherStore, 

  data: {
    // 按需定义状态属性，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态
    pageName: 'Index页面'
  },
  
});
```
另外，如果页面注入了其他非全局store，则当前页面和页面内组件的this.store指向新的store，可以理解为局部store，一般页面业务比较独立，不要使用全局store，但又需要多页面、组件状态共享可以使用此方式，上面已经介绍过，store其实就是一个包含data属性的对象，任何页面、组件只要引用同一个对象，就能实现状态共享。所以小伙伴们可以根据业务场景自由选择。

### 创建组件

使用create.Component创建组件，会自动从根节点注入store

``` js
import create from 'dd-store'

create.Component({
  data: {
    // 和页面一样，此处只按需定义状态属性，设置的默认值无效，如需设置请在store.data内设置
    userList: null,
    deptList: null,

    // 定义store.data没有的属性，则默认为组件私有状态
    commName: 'comm-a组件'
  },

});
```

### 更新页面/组件

直接更改store.data内的值，最后调用this.upadte()即可，非常人性化。

``` js
this.store.data.userName = '李狗蛋'
this.store.data.corpName = '富土康化肥厂'
this.store.data.userList[0].name = '张三疯'
this.update()
```

## 快捷链接

- [仓库地址](https://github.com/linjc/dd-store)
- [NPM主页](https://www.npmjs.com/package/dd-store)
- [Issues反馈](https://github.com/linjc/dd-store/issues)
