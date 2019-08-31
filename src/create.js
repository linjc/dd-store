const TYPE_ARRAY = '[object Array]'
const TYPE_OBJECT = '[object Object]'

export default {
  Page: createPage,
  Component: createComponent
}

export function createPage(option) {
  const globalStore = getApp().globalStore || {}
  const store = option.store = (option.store || getApp().store || {})
  store.data = store.data || {}
  store._instances = store._instances || {}
  store.update = store.update || function() { return updateState(store) }

  const onLoad = option.onLoad
  option.onLoad = function(query) {
    store._instances[this.route] = []
    store._instances[this.route].unshift(this)
    globalStore.update = this.update = store.update
    this.globalStore = globalStore
    getInitState(store.data, option.data, option.useAll)
    this.setData(option.data)
    onLoad && onLoad.call(this, query)
  }

  const onShow = option.onShow
  option.onShow = function() {
    globalStore.update = store.update
    store.update()
    onShow && onShow.call(this)
  }

  const onUnload = option.onUnload
  option.onUnload = function() {
    onUnload && onUnload.call(this)
    store._instances[this.route] = []
  }

  Page(option)
}

export function createComponent(option) {
  const didMount = option.didMount
  option.didMount = function() {
    this.globalStore = getApp().globalStore || {}
    this.page = getPage()
    this.store = this.page.store
    this.store._instances[this.page.route].unshift(this)
    this.update = this.store.update
    getInitState(this.store.data, option.data, option.useAll)
    this.setData(option.data)
    didMount && didMount.call(this)
  }

  const didUnmount = option.didUnmount
  option.didUnmount = function() {
    didUnmount && didUnmount.call(this)
    this.store._instances[this.page.route] = this.store._instances[this.page.route].filter(vm => vm !== this)
  }

  Component(option)
}

function getPage() {
  return getCurrentPages()[getCurrentPages().length - 1]
}

function setState(vm, data) {
  vm._new_data = Object.assign({}, vm._new_data, data)
  return new Promise(resolve => {
    if (vm._new_data && Object.keys(vm._new_data).length > 0) {
      const diffState = getDiffState(JSON.parse(JSON.stringify(vm._new_data)), vm.data)
      vm._new_data = null
      if (Object.keys(diffState).length > 0) {
        vm.setData(diffState, resolve)
        return
      }
    }
    resolve()
  })
}

function getAllData(storeData) {
  const globalStore = getApp().globalStore
  if (globalStore && globalStore.data && Object.keys(globalStore.data).length > 0) {
    storeData = Object.assign({ globalData: globalStore.data }, storeData)
  }
  return JSON.parse(JSON.stringify(storeData))
}

function updateState(store) {
  const promiseArr = []
  const vms = store._instances[getPage().route] || []
  const storeData = getAllData(store.data)
  vms.forEach(vm => {
    let obj = {}
    if (vm.useAll) {
      obj = storeData
    } else {
      for (let key in vm.data) {
        storeData.hasOwnProperty(key) && (obj[key] = storeData[key])
      }
    }
    Object.keys(obj).length > 0 && promiseArr.push(setState(vm, obj))
  })
  return Promise.all(promiseArr)
}

function getInitState(from, to, useAll) {
  const fromObj = getAllData(from)
  if (useAll) {
    Object.keys(fromObj).forEach(key => {
      to[key] = fromObj[key]
    })
  } else {
    Object.keys(to).forEach(key => {
      fromObj.hasOwnProperty(key) && (to[key] = fromObj[key])
    })
  }
}

function getDiffState(state, preState) {
  const newState = {}
  stateDiff(state, preState, '', newState)
  return newState
}

function getType(obj) {
  return Object.prototype.toString.call(obj)
}

function addDiffState(newState, key, val) {
  key !== '' && (newState[key] = val)
}

function stateDiff(state, preState, path, newState) {
  if (state === preState) return
  const stateType = getType(state)
  const preStateType = getType(preState)
  if (stateType === TYPE_OBJECT) {
    const stateLen = Object.keys(state).length
    const preStateLen = Object.keys(preState).length
    if (path !== '') {
      if (preStateType !== TYPE_OBJECT || stateLen < preStateLen || stateLen === 0 || preStateLen === 0) {
        addDiffState(newState, path, state)
        return
      }
      for (let key in preState) {
        state[key] === undefined && (state[key] = null) // 已删除的属性设置为null
      }
    }
    for (let key in state) {
      const subPath = path === '' ? key : path + '.' + key
      stateDiff(state[key], preState[key], subPath, newState)
    }
    return
  }
  if (stateType === TYPE_ARRAY) {
    if (preStateType != TYPE_ARRAY || state.length < preState.length || state.length === 0 || preState.length === 0) {
      addDiffState(newState, path, state)
      return
    }
    preState.forEach((item, index) => {
      state[index] === undefined && (state[index] = null) // 已删除的属性设置为null
    })
    state.forEach((item, index) => stateDiff(item, preState[index], path + '[' + index + ']', newState))
    return
  }
  addDiffState(newState, path, state)
}