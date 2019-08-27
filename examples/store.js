
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