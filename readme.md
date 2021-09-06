# dd-store - 钉钉支付宝等阿里系小程序状态管理

> [dd-stores【推荐】](https://github.com/linjc/dd-stores) - dd-store升级版，支持页面/组件同时多状态管理，功能更强大且更容易上手！

---

- [前言](#前言)
- [安装](#安装)
- [API](#api)
- [使用](#使用)
  - [使用默认方案](#使用默认方案)
  - [使用方案二](#使用方案二)
  - [使用方案三（推荐）](#使用方案三推荐)
- [使用建议](#使用建议)
- [快捷链接](#快捷链接)

## 前言
自钉钉主推小程序开发企业应用后，公司好几款产品也使用小程序开发，和其他小程序一样，钉钉小程序没有官方实现的状态管理库，一开始写了一个[Emitter](./src/emitter.js)类，用事件监听方式去实现全局共享状态管理，解决了各种跨页面组件通信，但这种方式相对繁琐且不够直观，当页面状态比较多时，光监听函数就得写一堆，特别影响代码整洁性。于是乎网上寻找有没有更好的解决方案，最终找到了[westore](https://github.com/Tencent/westore)库，这是由腾讯开源团队研发的微信小程序解决方案，其中针对状态管理的实现很不错，而且还使用专门为小程序开发的[JSON Diff 库](https://github.com/dntzhang/westore/blob/master/packages/westore/utils/diff.js)保证每次以最小的数据量更新状态，比原生setData的性能更好。但由于小程序框架API的差异，不能直接拿来使用。

所以要在阿里系小程序上使用，还需要改动一下，于是在看了源码之后，基于其原理重写了一版，并去除了一些其他功能，只保留状态管理部分，总代码量从500行精简到了200行，另外根据自身理解做了如下优化改进：

### 1、优化渲染效率
每次使用this.update()触发渲染的时候，只对当前页面进行渲染，其他后台态页面只在再次显示的时候进行更新。这样可以大大减少同时setData的频次，提高渲染效率。

### 2、提供多种store使用方案
#### 默认方案：采用单例store，即全局只使用一个store。
westore采用的就是这种方案，该方案好处是适用范围广，各种大小项目都能使用，对于大型项目，可以通过组合页面store的方式轻松管理。
不过在大项目实际使用中，会存在一些问题，如下：

1、性能问题。因为每次更新时都会使用diff库进行数据比对，如果全局只用一个store，那每次都会进行全量数据比对，也就是说项目状态越多，比对耗时就越长，虽然diff库性能非常好，但如果能做到极致，岂不美哉。

2、美观性。为了方便管理，越大的项目，可能会拆分更多的js文件，最后合并到store.data上，然后使用的时候你可能会经常看到如下代码：
``` js
<view a:for="{{pageA.someData.list}}"></view>
<view>{{pageA.someData.pageNo}} / {{pageA.someData.totalPage}}</view>
<view a:if="{{pageA.someData.isAdmin && pageA.someData.list.length > 0}}"></view>
...
```
你会发现，页面A所有状态绑定视图上时都要套一层pageA属性，如果属性名比较长或者数据层级较深，再加上if条件组合较多，整个页面单单变量名就占了很多空间，影响美观且不方便阅读，另外使用独立文件里的方法也会有同样的问题。其实相对于需要全局使用的状态，页面/领域状态是占绝大比例的。所以，如果能少一层嵌套，整体代码会优雅美观很多。

#### 方案二：支持多例store，即每个页面可以选择使用独立的store。
在默认方案的基础上，增加了每个页面可以根据需要引入独立的store，使用方式和默认方案一样，但相比默认方案，大大减少了每次diff比对的数据量，一定程度提升了些性能；视图数据绑定或方法调用少了一层嵌套，代码更加美观。不过虽然优化了上面的问题点，却存在一个比较大的问题，就是全局store和页面store二者只能选其一，不能同时使用，一般用在页面不需要使用任何全局状态的场景。如果页面需要使用到某个全局状态，就只能把整个页面状态合并到全局状态上使用，这样可能越往后，又变成使用默认方案了。为了解决这个问题，于是有了方案三。

#### 方案三（推荐）：支持多例store，并支持页面同时使用全局store和页面store。
在方案二的基础上，将全局store命名为$store，与页面store区分开来，让页面可以同时是使用页面store和全局$store，解决了上面两个方案存在的问题，并保留了它们的优势。

## 安装
``` js
npm i dd-store --save
```

## API

* create.Page(option) 创建页面
* create.Component(option) 创建组件
* setStore(store) 设置全局store // 方案一
* setGlobalStore(store) 设置全局store // 方案三
* this.update() 更新页面或组件，在页面、组件、store内使用
* store.update() 在非页面非组件非store的js文件中使用，需要引入相应的store

另外创建页面/组件时可选配置option.useAll，如果配置为true，则会自动注入全局globalStore.data和全部store.data内字段值到页面/组件，无需手动声明依赖

***注意：update已作为更新函数被占用，所以在store、页面、组件上不要重定义update字段，避免覆盖。***

## 使用

### 使用默认方案
#### 创建store

store其实是一个包含data属性的对象，可以使用任意方式来定义该对象，并支持函数计算属性。
注：函数属性中的this指向store.data对象。
``` js
class Store {

  data = {
    language: "zh_cn",
    userName: '李狗蛋',
    deptName: '化肥质检部门',
    corpName: '富土康化肥厂',
    // 函数属性 - 可直接绑定到视图上
    description() {
      return `我是${this.userName}，我在${this.corpName}工作`
    },
    a: {
      b: {
        // 深层嵌套也支持函数属性
        c() {
          return this.language + this.description
        }
      }
    }
  }

  onChangeLang() {
    if(this.data.language === 'zh_cn') {
      this.data.language = 'en_US'
    } else {
      this.data.language = 'zh_cn'
    }
    this.update()
  }
}

export default new Store()
``` 

#### 在app.js中注入全局store

在app.js使用setStore设置全局store，所有通过create.Page()/create.Component()创建的页面/组件都能通过this.store取到全局store的引用。


``` js
import { setStore } from 'dd-store'
import store from '/store'

setStore(store)

App({
  onLaunch(options) {},
});
``` 

#### 创建页面

使用create.Page创建页面。在data上按需声明需要共享的属性（store.data内的属性），注意这里data只是声明属性，设置的默认值无效，默认值请在store.data设置。如果页面配置了useAll=true，则会自动注入全部store.data内字段，无需手动声明。另外定义store.data没有的属性，则默认为页面私有状态，只能使用默认的this.setData(obj)方式更新。

``` js
import create from 'dd-store'

create.Page({

  // store, // 全局store的引用，在app.js通过setStore设置后，自动绑定进来
  
  useAll: true, // 是否开启自动注入store.data全部字段，默认false

  data: {
    // 按需声明状态属性，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态
    pageName: 'xxx'
  },
  
});
```

#### 创建组件

使用create.Component创建组件

``` js
import create from 'dd-store'

create.Component({

  useAll: true, // 是否开启自动注入store.data内全部字段，默认false

  data: {
    // 和页面一样，此处只按需声明状态属性，设置的默认值无效，如需设置请在store.data内设置
    userList: null,
    deptList: null,

    //定义store.data没有的属性，则默认为组件私有状态
    commName: 'xxx'
  },

});
```

#### 更新状态

直接更改store.data内的值，最后调用this.upadte()即可，非常人性化。

``` js
// 页面、组件内使用
this.store.data.language = 'zh_cn'
this.store.data.userName = '李狗蛋'
this.store.data.userList[0].name = '张三疯'
this.update()
```
``` js
// store内使用
this.data.language = 'zh_cn'
this.data.userName = '李狗蛋'
this.data.userList[0].name = '张三疯'
this.update()
```
``` js
// 其他js文件使用
import store from '/store'
store.data.language = 'zh_cn'
store.data.userName = '李狗蛋'
store.data.userList[0].name = '张三疯'
store.update()
```

### 使用方案二
方案二只是基于默认方案增加了页面独立store的引入，页面和页面内组件的this.store指向新的store，使用上完全没差别。
``` js
import create from 'dd-store'
import pageStore from '/stores/pageStore'

create.Page({
  
  store: pageStore, // 局部页面store，会覆盖方案一的全局store

  useAll: true, // 是否开启自动注入store.data全部状态，默认false

  data: {
    // 按需声明状态属性，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态
    pageName: '页面名称'
  },
  
});
```

### 使用方案三（推荐）
方案三基于方案二添加一个新的全局store，命名为$store，即在页面/组件上通过this.$store取到globalStore的引用，另外globalStore.data将绑定到页面/组件的data.$data上，通过$data.xxx渲染到视图层。

#### 在app.js中注入globalStore

在app.js使用setGlobalStore设置全局store，所有通过create.Page()/create.Component()创建的页面/组件都能通过this.$store取到globalStore的引用。

``` js
import { setGlobalStore } from 'dd-store'
import globalStore from '/stores/globalStore'

setGlobalStore(globalStore)

App({
  onLaunch(options) {},
});
``` 

#### 页面使用

只要在页面data上声明$data就可以使用，如果配置了useAll=true，则自动添加$data到data，无需手动声明。

``` js
import create from 'dd-store'
import pageStore from '/stores/pageStore'

create.Page({

  // $store, // 全局globalStore的引用，在app.js通过setGlobalStore设置绑定后会自动注入，无需手动添加

  store: pageStore, // 配置页面store，若不配置，则默认使用通过setStore配置的store（如果有的话）

  useAll: true, // 是否开启自动注入store.data内全部字段 和 $store.data，默认false

  data: {
    // 声明使用全局状态，为了避免和store.data内字段命名冲突，这里$data取自$store.data整体
    $data: null,

    // 按需声明状态属性，设置的默认值无效，如需设置请在store.data内设置
    userName: null,
    corpName: null,

    // 定义store.data没有的属性，则默认为页面私有状态
    pageName: 'xxx'
  },
  
});

```
#### 组件使用

同上create.Page。另外如不独立配置组件store，则默认注入所在根页面的store

``` js
import create from 'dd-store'

create.Component({

  // store: componentStore, // 配置组件store，如若不配置，则默认使用所在页面的store

  useAll: true, // 是否开启自动注入store.data内全部字段 和 $store.data，默认false

  data: {
    // 声明使用全局状态
    $data: null,

    // 此处只按需声明状态属性，设置的默认值无效，如需设置请在store.data内设置
    userList: null,
    deptList: null,

    //定义store.data没有的属性，则默认为组件私有状态
    commName: 'xxx'
  },

});
```

#### 更新全局状态

直接更改globalStore.data内的值，最后调用this.upadte()即可，和页面store使用一样。

``` js
// 页面、组件内使用
this.$store.data.language = 'zh_cn'
this.update()
```
``` js
// globalStore内使用
this.data.language = 'zh_cn'
this.update()
```
``` js
// 其他js文件使用
import globalStore from '/stores/globalStore'
globalStore.data.language = 'zh_cn'
globalStore.update()
```

#### 以上三个方案使用互不冲突，可以任意使用，一起使用也可以。

## 使用建议
1、对于小项目，可以考虑使用默认方案，当然也不一定非要使用状态管理，你可以先使用框架默认方式开发，至于什么时候需要使用，业务需求自会告诉你。

2、对于大项目，特别是超大型项目，状态多业务复杂，推荐使用方案三进行状态管理（或者使用[dd-stores](https://github.com/linjc/dd-stores)）。另外个人建议将页面状态和逻辑提取到store上，页面只负责处理用户事件的监听和回调，这样的好处是：
* 保持页面代码简洁，可以快速对每个页面的用户事件一目了然，更好把控业务。
* 页面、组件可以更轻松共享状态和复用逻辑（如：公共状态逻辑可以封装在抽象类上，使用继承方式实现复用）。
* 状态逻辑在独立的js上，更易于代码测试，对使用函数式编程非常友好

以上是个人建议，小伙伴可以根据业务需求自由选择，当然也可以看心情选择，毕竟敲代码，最重要的就是开心啦。

在使用过程中如果遇到问题或有什么建议可以随时在[Issues](https://github.com/linjc/dd-store/issues)进行反馈，或钉钉联系我：linjinchun。（ps：请保持使用最新npm包）

## 快捷链接

- [Example示例](https://github.com/linjc/dd-store/tree/master/examples)
- [Github仓库](https://github.com/linjc/dd-store)
- [Gitee仓库](https://gitee.com/l2j2c3/dd-store)
- [Issues反馈](https://github.com/linjc/dd-store/issues)
