const TYPE_ARRAY = '[object Array]'
const TYPE_OBJECT = '[object Object]'
const TYPE_FUNCTION = '[object Function]'
const _Page = Page
const _Component = Component
let appStore = null
let appGlobalStore = null
const __stores = new Set();

export default {
  setStore,
  setGlobalStore,
  Page: createPage,
  Component: createComponent
}

function initStores(option) {
  const store = option.store = option.store || getAppStore()
  const $store = option.globalStore = option.$store = getAppGlobalStore()
  option.data = option.data || {}
  store.data = store.data || {}
  $store.data = $store.data || {}
  store._instances = store._instances || {}
  store.update = $store.update = updateState
  if (!store._isReadyComputed) {
    setComputed(store.data, store.data)
    store._isReadyComputed = true
  }
  if (!$store._isReadyComputed) {
    setComputed($store.data, $store.data)
    $store._isReadyComputed = true
  }
  __stores.add(store)
}

export function createPage(option) {
  initStores(option)
  const store = option.store
  const $store = option.$store

  const onLoad = option.onLoad
  option.onLoad = function (query) {
    this.update = updateState
    this.store = store
    this.$store = this.globalStore = $store
    store._instances[this.route] = store._instances[this.route] || []
    store._instances[this.route].unshift(this)
    getInitState(store.data, option.data, option.useAll)
    this.setData(deepCopy(option.data))
    onLoad && onLoad.call(this, query)
  }

  const onShow = option.onShow
  option.onShow = function () {
    this.update(this.route)
    onShow && onShow.call(this)
  }

  const onUnload = option.onUnload
  option.onUnload = function () {
    onUnload && onUnload.call(this)
    store._instances[this.route] = store._instances[this.route].filter(vm => vm !== this)
  }

  _Page(option)
}

export function createComponent(option) {
  const notStore = !option.store
  initStores(option)
  let store = option.store
  const $store = option.$store

  const didMount = option.didMount
  option.didMount = function () {
    this.update = updateState
    const _page = this.$page || getPage()
    if (notStore && _page.store) { // 不设置store则继承页面store
      store = _page.store
    }
    this.store = store;
    this.$store = this.globalStore = $store;
    store._instances[_page.route] = store._instances[_page.route] || []
    store._instances[_page.route].unshift(this)
    getInitState(store.data, option.data, option.useAll)
    this.setData(deepCopy(option.data))
    didMount && didMount.call(this)
  }

  const didUnmount = option.didUnmount
  option.didUnmount = function () {
    const _page = this.$page || getPage()
    didUnmount && didUnmount.call(this)
    store._instances[_page.route] = store._instances[_page.route].filter(vm => vm !== this)
  }

  _Component(option)
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
  return pages[pages.length - 1] || {}
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
  const $store = getAppGlobalStore()
  if ($store && $store.data) {
    return Object.assign({ globalData: $store.data, $data: $store.data }, storeData)
  }
  return storeData
}

function updateState(route) {
  const promiseArr = []
  const _route = route || getPage().route
  __stores.forEach(store => {
    const vms = store._instances[_route] || []
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