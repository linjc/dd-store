import store from '/store'

App({
  // 将全局store挂载在app上，可以免去手动一个个在页面中引入，当然也可以在页面注入。
  // 如果页面引入的是其他store，则以页面引入为主，表示使用了局部store
  store,
  
  onLaunch(options) {
    // 第一次打开
    // options.query == {number:1}
    console.info('App onLaunch');
  },
  onShow(options) {
    // 从后台被 scheme 重新打开
    // options.query == {number:1}
  },
});
