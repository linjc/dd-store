
class Store {

  data = {
    title: '首页',
    a: {
      a: '-123',
      b() {
        return '嵌套节点也支持函数属性-' + this.title + this.a.a
      }
    }
  }

}

export default new Store();