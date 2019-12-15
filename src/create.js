const TYPE_ARRAY = '[object Array]'
const TYPE_OBJECT = '[object Object]'
const TYPE_FUNCTION = '[object Function]'
let appStore = null
let appGlobalStore = null

export default {
  setStore,
  setGlobalStore,
  Page: createPage,
  Component: createComponent
}

export function createPage(option) {
  option.data = option.data || {}
  const globalStore = getAppGlobalStore()
  const store = option.store = option.store || getAppStore()
  store.data = store.data || {}
  store._instances = store._instances || {}
  store.update = store.update || function () { return updateState(store) }
  if (!store._isReadyComputed) {
    setComputed(store.data, store.data)
    store._isReadyComputed = true
  }
  if (!globalStore._isReadyComputed) {
    setComputed(globalStore.data, globalStore.data)
    globalStore._isReadyComputed = true
  }

  const onLoad = option.onLoad
  option.onLoad = function (query) {
    store._instances[this.route] = [this]
    globalStore.update = this.update = store.update
    getInitState(store.data, option.data, option.useAll)
    this.setData(option.data)
    onLoad && onLoad.call(this, query)
  }

  const onShow = option.onShow
  option.onShow = function () {
    globalStore.update = store.update
    store.update()
    onShow && onShow.call(this)
  }

  const onUnload = option.onUnload
  option.onUnload = function () {
    onUnload && onUnload.call(this)
    store._instances[this.route] = []
  }

  Page(option)
}

export function createComponent(option) {
  option.data = option.data || {}
  const didMount = option.didMount
  option.didMount = function () {
    this._page = getPage()
    if (this._page.store) { // 兼容组件被常规页面使用的情况
      this.globalStore = getAppGlobalStore()
      this.store = this._page.store
      this.update = this._page.update
      this.store._instances[this._page.route].unshift(this)
      getInitState(this.store.data, option.data, option.useAll)
      this.setData(option.data)
    }
    didMount && didMount.call(this)
  }

  const didUnmount = option.didUnmount
  option.didUnmount = function () {
    didUnmount && didUnmount.call(this)
    if (this.store) {
      this.store._instances[this._page.route] = this.store._instances[this._page.route].filter(vm => vm !== this)
    }
  }

  Component(option)
}

export function setStore(store) {
  appStore = store
}

export function setGlobalStore(store) {
  appGlobalStore = store
}

function getAppStore() {
  return appStore || getApp().store || {}
}

function getAppGlobalStore() {
  return appGlobalStore || getApp().globalStore || {}
}

function setComputed(storeData, value, obj, key) {
  const type = getType(value)
  if (type === TYPE_FUNCTION) {
    Object.defineProperty(obj, key, {
      enumerable: true,
      get: function () {
        return value.call(storeData)
      },
      set: function () {
        console.warn('计算属性不支持重新赋值')
      }
    })
  } else if (type === TYPE_OBJECT) {
    Object.keys(value).forEach(subKey => {
      setComputed(storeData, value[subKey], value, subKey)
    })
  } else if (type === TYPE_ARRAY) {
    value.forEach((item, index) => {
      setComputed(storeData, item, value, index)
    })
  }
}

function deepCopy(data) {
  const type = getType(data)
  if (type === TYPE_OBJECT) {
    const obj = {}
    Object.keys(data).forEach(key => obj[key] = deepCopy(data[key]))
    return obj
  }
  if (type === TYPE_ARRAY) {
    const arr = []
    data.forEach((item, index) => arr[index] = deepCopy(item))
    return arr
  }
  return data
}

function getPage() {
  const pages = getCurrentPages()
  return pages[pages.length - 1]
}

function setState(vm, data) {
  vm._new_data = vm._new_data || {}
  Object.assign(vm._new_data, data)
  return new Promise(resolve => {
    if (Object.keys(vm._new_data).length > 0) {
      const diffState = getDiffState(vm._new_data, vm.data)
      vm._new_data = {}
      vm.setData(diffState, resolve)
      return
    }
    resolve()
  })
}

function getAllData(storeData) {
  const globalStore = getAppGlobalStore()
  if (globalStore && globalStore.data) {
    return Object.assign({ globalData: globalStore.data, $data: globalStore.data }, storeData)
  }
  return storeData
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
      Object.keys(vm.data).forEach(key => storeData.hasOwnProperty(key) && (obj[key] = storeData[key]))
    }
    promiseArr.push(setState(vm, obj))
  })
  return Promise.all(promiseArr)
}

function getInitState(from, to, useAll) {
  const fromObj = getAllData(from)
  if (useAll) {
    Object.assign(to, deepCopy(fromObj))
  } else {
    Object.keys(to).forEach(key => fromObj.hasOwnProperty(key) && (to[key] = deepCopy(fromObj[key])))
  }
}

function getDiffState(state, preState) {
  const newState = {}
  stateDiff(deepCopy(state), preState, '', newState)
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
    const stateKeys = Object.keys(state)
    const preStateKeys = Object.keys(preState || {})
    const stateLen = stateKeys.length
    const preStateLen = preStateKeys.length
    if (path !== '') {
      if (preStateType !== TYPE_OBJECT || stateLen < preStateLen || stateLen === 0 || preStateLen === 0) {
        addDiffState(newState, path, state)
        return
      }
      preStateKeys.forEach(key => {
        state[key] === undefined && (state[key] = null) // 已删除的属性设置为null
      })
    }
    stateKeys.forEach(key => {
      const subPath = path === '' ? key : path + '.' + key
      stateDiff(state[key], preState[key], subPath, newState)
    })
    return
  }
  if (stateType === TYPE_ARRAY) {
    if (preStateType !== TYPE_ARRAY || state.length < preState.length || state.length === 0 || preState.length === 0) {
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