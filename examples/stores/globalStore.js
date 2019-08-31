// 全局store

class Store {

  data = {
    language: "zh_cn",
    userName: '李狗蛋',
    deptName: '化肥质检部门',
    corpName: '富土康化肥厂'
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

export default new Store();